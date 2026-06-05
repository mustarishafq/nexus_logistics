<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('source_systems', function (Blueprint $table) {
            $table->json('status_mappings')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('source_systems', function (Blueprint $table) {
            $table->dropColumn('status_mappings');
        });
    }
};
