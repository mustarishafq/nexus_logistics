<?php

namespace App\Models;

use App\Models\Concerns\HasApiFormat;
use Illuminate\Database\Eloquent\Model;

class WebhookLog extends Model
{
    use HasApiFormat;

    protected $fillable = [
        'request_time', 'event_type', 'source_system', 'processing_status',
        'error_message', 'payload_summary', 'records_processed',
    ];

    protected function casts(): array
    {
        return [
            'request_time' => 'datetime',
            'records_processed' => 'integer',
        ];
    }
}
