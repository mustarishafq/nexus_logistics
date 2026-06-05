<?php

namespace App\Models;

use App\Models\Concerns\HasApiFormat;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TrackingEvent extends Model
{
    use HasApiFormat;

    protected $fillable = [
        'shipment_id', 'tracking_number', 'status', 'timestamp',
        'source_system', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'timestamp' => 'datetime',
            'shipment_id' => 'integer',
        ];
    }

    public function shipment(): BelongsTo
    {
        return $this->belongsTo(Shipment::class);
    }
}
