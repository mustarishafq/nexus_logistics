<?php

namespace App\Console\Commands;

use App\Models\Shipment;
use App\Services\ShipmentSlaService;
use Illuminate\Console\Command;

class RecalculateShipmentSla extends Command
{
    protected $signature = 'shipments:recalculate-sla';

    protected $description = 'Recalculate SLA targets and results for all shipments';

    public function handle(ShipmentSlaService $slaService): int
    {
        $count = 0;

        Shipment::query()->chunkById(200, function ($shipments) use ($slaService, &$count) {
            foreach ($shipments as $shipment) {
                $slaService->apply($shipment);
                $shipment->saveQuietly();
                $count++;
            }
        });

        $this->info("Recalculated SLA for {$count} shipments.");

        return self::SUCCESS;
    }
}
