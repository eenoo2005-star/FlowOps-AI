<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('login_attempts', function (Blueprint $table) {
            $table->id();

            $table->foreignId('company_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            $table->foreignId('user_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            $table->string('email_hash', 64)->index();
            $table->string('email_masked')->nullable();

            $table->string('ip_address', 45)->index();
            $table->text('user_agent')->nullable();

            $table->boolean('was_successful')
                ->default(false)
                ->index();

            $table->string('failure_reason', 50)
                ->nullable()
                ->index();

            $table->string('country_code', 2)
                ->nullable()
                ->index();

            $table->string('country', 100)->nullable();
            $table->string('region', 100)->nullable();
            $table->string('city', 100)->nullable();

            $table->unsignedTinyInteger('risk_score')
                ->default(0)
                ->index();

            $table->timestamp('attempted_at')->useCurrent()->index();

            $table->timestamps();

            $table->index([
                'ip_address',
                'attempted_at',
            ]);

            $table->index([
                'user_id',
                'attempted_at',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('login_attempts');
    }
};