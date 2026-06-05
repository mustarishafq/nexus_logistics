<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('source_systems', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('system_type');
            $table->string('api_key')->nullable();
            $table->string('webhook_secret')->nullable();
            $table->string('status')->default('active');
            $table->timestamp('last_received_at')->nullable();
            $table->unsignedInteger('total_shipments_received')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('source_systems');
    }
};
