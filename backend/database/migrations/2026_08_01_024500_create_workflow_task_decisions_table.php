<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workflow_task_decisions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('workflow_task_id')->constrained()->cascadeOnDelete();
            $table->foreignId('acted_by_user_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('acted_by_employee_id')->nullable()->constrained('employees')->nullOnDelete();
            $table->string('decision', 20);
            $table->text('note')->nullable();
            $table->timestamp('acted_at');
            $table->timestamps();

            $table->unique(['workflow_task_id', 'acted_by_user_id']);
            $table->index(['company_id', 'decision']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workflow_task_decisions');
    }
};
