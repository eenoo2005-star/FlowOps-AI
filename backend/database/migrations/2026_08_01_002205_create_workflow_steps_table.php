<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create(
            'workflow_steps',
            function (Blueprint $table): void {
                $table->id();

                $table->foreignId('company_id')
                    ->constrained()
                    ->cascadeOnDelete();

                $table->foreignId('workflow_definition_id')
                    ->constrained()
                    ->cascadeOnDelete();

                $table->string('name');
                $table->string('code', 80);
                $table->text('description')->nullable();

                $table->unsignedInteger('step_order');

                $table->string('approver_type', 40);
                $table->string('approver_role', 100)
                    ->nullable();

                $table->foreignId('approver_employee_id')
                    ->nullable()
                    ->constrained('employees')
                    ->nullOnDelete();

                $table->string('approval_mode', 20)
                    ->default('any');

                $table->unsignedInteger('required_approvals')
                    ->default(1);

                $table->unsignedInteger('sla_hours')
                    ->nullable();

                $table->boolean('can_reject')
                    ->default(true);

                $table->boolean('is_final')
                    ->default(false);

                $table->timestamps();

                $table->unique([
                    'workflow_definition_id',
                    'code',
                ]);

                $table->unique([
                    'workflow_definition_id',
                    'step_order',
                ]);

                $table->index([
                    'company_id',
                    'workflow_definition_id',
                ]);
            }
        );
    }

    public function down(): void
    {
        Schema::dropIfExists('workflow_steps');
    }
};