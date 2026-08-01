<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table(
            'workflow_tasks',
            function (Blueprint $table): void {
                $table->timestamp('reminder_sent_at')
                    ->nullable()
                    ->after('due_at');

                $table->timestamp('overdue_notified_at')
                    ->nullable()
                    ->after('reminder_sent_at');

                $table->unsignedSmallInteger(
                    'escalation_level'
                )
                    ->default(0)
                    ->after('overdue_notified_at');

                $table->timestamp('escalated_at')
                    ->nullable()
                    ->after('escalation_level');

                $table->index([
                    'company_id',
                    'status',
                    'due_at',
                ]);
            }
        );
    }

    public function down(): void
    {
        Schema::table(
            'workflow_tasks',
            function (Blueprint $table): void {
                $table->dropIndex([
                    'company_id',
                    'status',
                    'due_at',
                ]);

                $table->dropColumn([
                    'reminder_sent_at',
                    'overdue_notified_at',
                    'escalation_level',
                    'escalated_at',
                ]);
            }
        );
    }
};