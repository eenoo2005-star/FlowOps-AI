<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create(
            'request_attachments',
            function (Blueprint $table): void {
                $table->id();

                $table->foreignId('company_id')
                    ->constrained()
                    ->cascadeOnDelete();

                $table->foreignId('internal_request_id')
                    ->constrained()
                    ->cascadeOnDelete();

                $table->foreignId('uploaded_by_user_id')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();

                $table->foreignId('uploaded_by_employee_id')
                    ->nullable()
                    ->constrained('employees')
                    ->nullOnDelete();

                $table->string('uploaded_by_name');
                $table->string('disk', 40)->default('local');
                $table->string('path', 1000);
                $table->string('original_name');
                $table->string('mime_type', 150)->nullable();
                $table->unsignedBigInteger('size');
                $table->char('sha256', 64);
                $table->timestamps();

                $table->index([
                    'company_id',
                    'internal_request_id',
                    'created_at',
                ]);

                $table->index('sha256');
            }
        );
    }

    public function down(): void
    {
        Schema::dropIfExists('request_attachments');
    }
};