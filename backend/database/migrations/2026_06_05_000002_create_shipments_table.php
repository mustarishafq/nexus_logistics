<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shipments', function (Blueprint $table) {
            $table->id();
            $table->string('source_system')->nullable();
            $table->string('order_number');
            $table->string('tracking_number');
            $table->string('courier');
            $table->date('ship_date')->nullable();
            $table->date('delivery_date')->nullable();
            $table->string('current_status')->default('pending');
            $table->string('state')->nullable();
            $table->string('city')->nullable();
            $table->unsignedInteger('sku_count')->nullable();
            $table->decimal('weight', 10, 2)->nullable();
            $table->decimal('shipping_cost', 10, 2)->nullable();
            $table->unsignedInteger('delivery_days')->nullable();
            $table->unsignedInteger('sla_target_days')->nullable();
            $table->string('sla_result')->default('pending');
            $table->timestamps();

            $table->index('tracking_number');
            $table->index('courier');
            $table->index('current_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shipments');
    }
};
