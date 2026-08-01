<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create(
            'app_notifications',
            function (Blueprint $table): void {
                $table->id();

                $table->foreignId('company_id')
                    ->constrained()
                    ->cascadeOnDelete();

                $table->foreignId('user_id')
                    ->constrained()
                    ->cascadeOnDelete();

                $table->string('type', 100);
                $table->string('title');
                $table->text('message');
                $table->string('action_url', 1000)
                    ->nullable();

                $table->json('data')->nullable();
                $table->string('dedupe_key', 190);
                $table->timestamp('read_at')->nullable();
                $table->timestamps();

                $table->unique([
                    'company_id',
                    'user_id',
                    'dedupe_key',
                ]);

                $table->index([
                    'company_id',
                    'user_id',
                    'read_at',
                    'created_at',
                ]);

                $table->index([
                    'company_id',
                    'type',
                ]);
            }
        );
    }

    public function down(): void
    {
        Schema::dropIfExists('app_notifications');
    }
};