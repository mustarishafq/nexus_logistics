<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $duplicateKeys = DB::table('shipments')
            ->select('source_system', 'order_number', DB::raw('MAX(id) as keep_id'))
            ->groupBy('source_system', 'order_number')
            ->havingRaw('COUNT(*) > 1')
            ->get();

        foreach ($duplicateKeys as $duplicate) {
            DB::table('shipments')
                ->where('source_system', $duplicate->source_system)
                ->where('order_number', $duplicate->order_number)
                ->where('id', '!=', $duplicate->keep_id)
                ->delete();
        }

        Schema::table('shipments', function (Blueprint $table) {
            $table->unique(['source_system', 'order_number'], 'shipments_source_order_unique');
        });
    }

    public function down(): void
    {
        Schema::table('shipments', function (Blueprint $table) {
            $table->dropUnique('shipments_source_order_unique');
        });
    }
};
