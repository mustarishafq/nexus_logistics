<?php

namespace App\Models;

use App\Models\Concerns\HasApiFormat;
use Illuminate\Database\Eloquent\Model;

class SourceSystem extends Model
{
    use HasApiFormat;

    protected $fillable = [
        'name', 'system_type', 'api_key', 'webhook_secret', 'status',
        'status_mappings', 'deletion_statuses', 'last_received_at', 'total_shipments_received',
    ];

    protected function casts(): array
    {
        return [
            'status_mappings' => 'array',
            'deletion_statuses' => 'array',
            'last_received_at' => 'datetime',
            'total_shipments_received' => 'integer',
        ];
    }
}
