<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sla_rules', function (Blueprint $table) {
            $table->string('postcode')->nullable()->after('state');
        });

        Schema::table('shipments', function (Blueprint $table) {
            $table->string('postcode')->nullable()->after('city');
        });
    }

    public function down(): void
    {
        Schema::table('sla_rules', function (Blueprint $table) {
            $table->dropColumn('postcode');
        });

        Schema::table('shipments', function (Blueprint $table) {
            $table->dropColumn('postcode');
        });
    }
};
