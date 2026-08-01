<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create(
            'workflow_tasks',
            function (Blueprint $table): void {
                $table->id();

                $table->foreignId('company_id')
                    ->constrained()
                    ->cascadeOnDelete();

                $table->foreignId('workflow_instance_id')
                    ->constrained()
                    ->cascadeOnDelete();

                $table->foreignId('workflow_step_id')
                    ->constrained()
                    ->restrictOnDelete();

                $table->foreignId('assigned_employee_id')
                    ->nullable()
                    ->constrained('employees')
                    ->nullOnDelete();

                $table->string('assigned_role', 100)
                    ->nullable();

                $table->string('status', 30)
                    ->default('pending');

                $table->timestamp('due_at')->nullable();
                $table->timestamp('acted_at')->nullable();

                $table->foreignId('acted_by_employee_id')
                    ->nullable()
                    ->constrained('employees')
                    ->nullOnDelete();

                $table->text('decision_note')->nullable();

                $table->timestamps();

                $table->index([
                    'company_id',
                    'status',
                ]);

                $table->index([
                    'company_id',
                    'assigned_employee_id',
                    'status',
                ]);

                $table->index([
                    'company_id',
                    'assigned_role',
                    'status',
                ]);
            }
        );
    }

    public function down(): void
    {
        Schema::dropIfExists('workflow_tasks');
    }
};