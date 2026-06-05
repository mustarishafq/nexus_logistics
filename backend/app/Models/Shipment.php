<?php

namespace App\Models;

use App\Models\Concerns\HasApiFormat;
use App\Services\ShipmentSlaService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Shipment extends Model
{
    use HasApiFormat;

    protected $fillable = [
        'source_system', 'order_number', 'tracking_number', 'courier',
        'ship_date', 'delivery_date', 'current_status', 'state', 'city', 'postcode',
        'sku_count', 'weight', 'shipping_cost', 'delivery_days',
        'sla_target_days', 'sla_result',
    ];

    protected function casts(): array
    {
        return [
            'ship_date' => 'date',
            'delivery_date' => 'date',
            'sku_count' => 'integer',
            'weight' => 'float',
            'shipping_cost' => 'float',
            'delivery_days' => 'integer',
            'sla_target_days' => 'integer',
        ];
    }

    public function trackingEvents(): HasMany
    {
        return $this->hasMany(TrackingEvent::class);
    }

    protected static function booted(): void
    {
        static::saving(function (Shipment $shipment) {
            app(ShipmentSlaService::class)->apply($shipment);
        });
    }
}
