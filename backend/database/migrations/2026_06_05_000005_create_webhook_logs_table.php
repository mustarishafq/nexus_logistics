<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('webhook_logs', function (Blueprint $table) {
            $table->id();
            $table->timestamp('request_time')->nullable();
            $table->string('event_type');
            $table->string('source_system');
            $table->string('processing_status')->default('received');
            $table->text('error_message')->nullable();
            $table->text('payload_summary')->nullable();
            $table->unsignedInteger('records_processed')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('webhook_logs');
    }
};
