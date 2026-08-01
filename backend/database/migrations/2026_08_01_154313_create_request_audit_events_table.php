<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create(
            'request_audit_events',
            function (Blueprint $table): void {
                $table->id();

                $table->foreignId('company_id')
                    ->constrained()
                    ->cascadeOnDelete();

                $table->foreignId('internal_request_id')
                    ->nullable()
                    ->constrained()
                    ->nullOnDelete();

                $table->foreignId('actor_user_id')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();

                $table->foreignId('actor_employee_id')
                    ->nullable()
                    ->constrained('employees')
                    ->nullOnDelete();

                $table->string('actor_name')->nullable();
                $table->string('event_type', 100);
                $table->string('summary');
                $table->json('metadata')->nullable();
                $table->string('ip_address', 45)->nullable();
                $table->text('user_agent')->nullable();
                $table->timestamp('occurred_at');

                $table->index([
                    'company_id',
                    'internal_request_id',
                    'occurred_at',
                ]);

                $table->index([
                    'company_id',
                    'event_type',
                ]);
            }
        );
    }

    public function down(): void
    {
        Schema::dropIfExists('request_audit_events');
    }
};