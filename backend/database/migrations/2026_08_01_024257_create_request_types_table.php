<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create(
            'request_types',
            function (Blueprint $table): void {
                $table->id();

                $table->foreignId('company_id')
                    ->constrained()
                    ->cascadeOnDelete();

                $table->foreignId('workflow_definition_id')
                    ->constrained()
                    ->restrictOnDelete();

                $table->string('name');
                $table->string('code', 80);
                $table->text('description')->nullable();
                $table->text('instructions')->nullable();

                $table->boolean('is_active')
                    ->default(true);

                $table->timestamps();

                $table->unique([
                    'company_id',
                    'code',
                ]);

                $table->index([
                    'company_id',
                    'is_active',
                ]);
            }
        );
    }

    public function down(): void
    {
        Schema::dropIfExists('request_types');
    }
};