<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create(
            'workflow_instances',
            function (Blueprint $table): void {
                $table->id();

                $table->foreignId('company_id')
                    ->constrained()
                    ->cascadeOnDelete();

                $table->foreignId('internal_request_id')
                    ->unique()
                    ->constrained()
                    ->cascadeOnDelete();

                $table->foreignId('workflow_definition_id')
                    ->constrained()
                    ->restrictOnDelete();

                $table->foreignId('current_workflow_step_id')
                    ->nullable()
                    ->constrained('workflow_steps')
                    ->nullOnDelete();

                $table->string('status', 30)
                    ->default('active');

                $table->timestamp('started_at');
                $table->timestamp('completed_at')->nullable();

                $table->timestamps();

                $table->index([
                    'company_id',
                    'status',
                ]);
            }
        );
    }

    public function down(): void
    {
        Schema::dropIfExists('workflow_instances');
    }
};