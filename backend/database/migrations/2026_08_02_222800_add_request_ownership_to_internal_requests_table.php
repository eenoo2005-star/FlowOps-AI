<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('internal_requests', function (Blueprint $table): void {
            $table->foreignId('created_by_user_id')->nullable()->after('requester_employee_id')->constrained('users')->nullOnDelete();
            $table->text('on_behalf_of_reason')->nullable()->after('created_by_user_id');
            $table->index(['company_id', 'created_by_user_id']);
        });
    }

    public function down(): void
    {
        Schema::table('internal_requests', function (Blueprint $table): void {
            $table->dropIndex(['company_id', 'created_by_user_id']);
            $table->dropConstrainedForeignId('created_by_user_id');
            $table->dropColumn('on_behalf_of_reason');
        });
    }
};
