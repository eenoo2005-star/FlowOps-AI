<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create(
            'internal_requests',
            function (Blueprint $table): void {
                $table->id();

                $table->foreignId('company_id')
                    ->constrained()
                    ->cascadeOnDelete();

                $table->foreignId('request_type_id')
                    ->constrained()
                    ->restrictOnDelete();

                $table->foreignId('workflow_definition_id')
                    ->constrained()
                    ->restrictOnDelete();

                $table->foreignId('requester_employee_id')
                    ->constrained('employees')
                    ->restrictOnDelete();

                $table->foreignId('current_workflow_step_id')
                    ->nullable()
                    ->constrained('workflow_steps')
                    ->nullOnDelete();

                $table->string('reference_number', 64);
                $table->string('title');
                $table->text('description')->nullable();
                $table->json('payload')->nullable();

                $table->string('priority', 20)
                    ->default('normal');

                $table->string('status', 30)
                    ->default('draft');

                $table->timestamp('submitted_at')->nullable();
                $table->timestamp('completed_at')->nullable();
                $table->timestamp('cancelled_at')->nullable();

                $table->timestamps();

                $table->unique([
                    'company_id',
                    'reference_number',
                ]);

                $table->index([
                    'company_id',
                    'status',
                ]);

                $table->index([
                    'company_id',
                    'requester_employee_id',
                ]);

                $table->index([
                    'company_id',
                    'request_type_id',
                ]);
            }
        );
    }

    public function down(): void
    {
        Schema::dropIfExists('internal_requests');
    }
};