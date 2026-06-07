<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('source_systems', function (Blueprint $table) {
            $table->json('deletion_statuses')->nullable()->after('status_mappings');
        });
    }

    public function down(): void
    {
        Schema::table('source_systems', function (Blueprint $table) {
            $table->dropColumn('deletion_statuses');
        });
    }
};
