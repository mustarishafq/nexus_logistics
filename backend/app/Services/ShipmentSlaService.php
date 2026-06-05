<?php

namespace App\Services;

use App\Models\Shipment;

class ShipmentSlaService
{
    public function __construct(private SlaRuleResolver $resolver) {}

    public function apply(Shipment $shipment): void
    {
        $shipment->sla_target_days = $this->resolver->resolveTargetDays(
            $shipment->courier,
            $shipment->state,
            $shipment->postcode,
        );

        if ($shipment->ship_date && $shipment->delivery_date) {
            $shipment->delivery_days = $shipment->ship_date->diffInDays($shipment->delivery_date);
        }

        if (! $shipment->sla_target_days || ! $shipment->delivery_days) {
            $shipment->sla_result = 'pending';

            return;
        }

        $shipment->sla_result = $shipment->delivery_days <= $shipment->sla_target_days
            ? 'met'
            : 'breached';
    }
}
