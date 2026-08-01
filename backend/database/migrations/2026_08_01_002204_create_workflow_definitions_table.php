<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create(
            'workflow_definitions',
            function (Blueprint $table): void {
                $table->id();

                $table->foreignId('company_id')
                    ->constrained()
                    ->cascadeOnDelete();

                $table->string('name');
                $table->string('code', 80);
                $table->text('description')->nullable();

                $table->unsignedInteger('version')
                    ->default(1);

                $table->boolean('is_active')
                    ->default(true);

                $table->timestamps();

                $table->unique([
                    'company_id',
                    'code',
                    'version',
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
        Schema::dropIfExists('workflow_definitions');
    }
};