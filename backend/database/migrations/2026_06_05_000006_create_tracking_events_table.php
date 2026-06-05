<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tracking_events', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('shipment_id')->nullable();
            $table->string('tracking_number');
            $table->string('status');
            $table->timestamp('timestamp')->nullable();
            $table->string('source_system')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('tracking_number');
            $table->foreign('shipment_id')->references('id')->on('shipments')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tracking_events');
    }
};
