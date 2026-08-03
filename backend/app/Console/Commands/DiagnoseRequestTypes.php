<?php

namespace App\Console\Commands;

use App\Models\RequestType;
use Illuminate\Console\Command;

final class DiagnoseRequestTypes extends Command
{
    protected $signature = 'flowops:diagnose-request-types
        {--company_id= : Limit the report to a specific company id}';

    protected $description = 'Diagnose active request types and their workflow readiness.';

    public function handle(): int
    {
        $companyId = $this->option('company_id');

        $query = RequestType::query()
            ->withoutGlobalScopes()
            ->with([
                'workflowDefinition:id,company_id,name,code,version,is_active',
            ])
            ->orderBy('company_id')
            ->orderBy('name');

        if ($companyId !== null && $companyId !== '') {
            $query->where('company_id', (int) $companyId);
        }

        $requestTypes = $query->get();

        $readyRequestTypes = $requestTypes->filter(
            fn (RequestType $requestType): bool => $requestType->is_active
                && $requestType->workflowDefinition !== null
                && $requestType->workflowDefinition->is_active
        );

        $this->info('FlowOps AI request type readiness');
        $this->line('Total request types: '.$requestTypes->count());
        $this->line('Ready for request creation: '.$readyRequestTypes->count());

        if ($requestTypes->isEmpty()) {
            $this->warn('No request types exist. Create at least one active request type linked to an active workflow.');

            return self::SUCCESS;
        }

        $this->table(
            [
                'ID',
                'Company',
                'Code',
                'Name',
                'Active',
                'Workflow',
                'Workflow Active',
                'Ready',
            ],
            $requestTypes->map(
                fn (RequestType $requestType): array => [
                    $requestType->id,
                    $requestType->company_id,
                    $requestType->code,
                    $requestType->name,
                    $requestType->is_active ? 'yes' : 'no',
                    $requestType->workflowDefinition?->code ?? 'missing',
                    $requestType->workflowDefinition?->is_active ? 'yes' : 'no',
                    $requestType->is_active
                        && $requestType->workflowDefinition !== null
                        && $requestType->workflowDefinition->is_active
                            ? 'yes'
                            : 'no',
                ]
            )->all()
        );

        if ($readyRequestTypes->isEmpty()) {
            $this->warn('The request dialog will remain empty until at least one request type is active and linked to an active workflow.');
        }

        return self::SUCCESS;
    }
}
