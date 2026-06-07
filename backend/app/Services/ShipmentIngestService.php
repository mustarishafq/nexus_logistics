<?php

namespace App\Services;

use App\Models\Shipment;
use App\Models\SourceSystem;
use App\Models\TrackingEvent;
use Carbon\Carbon;

class ShipmentIngestService
{
    public function __construct(private StatusMappingService $statusMapping) {}

    /**
     * @return array{shipment: ?Shipment, created: bool, deleted: bool}
     */
    public function upsert(string $sourceSystem, array $record, ?SourceSystem $source = null): array
    {
        $orderNumber = trim((string) ($record['order_number'] ?? ''));
        if ($orderNumber === '') {
            throw new \InvalidArgumentException('order_number is required.');
        }

        $externalStatus = $record['current_status'] ?? $record['status'] ?? null;

        if ($source && $this->statusMapping->shouldTriggerDeletion($source, $externalStatus)) {
            return $this->deleteByOrder($sourceSystem, $orderNumber);
        }

        $status = $source
            ? $this->statusMapping->resolve($source, $externalStatus)
            : $this->normalizeStatus($externalStatus);

        $existing = Shipment::query()
            ->where('source_system', $sourceSystem)
            ->where('order_number', $orderNumber)
            ->first();

        $previousStatus = $existing?->current_status;

        $attributes = [
            'tracking_number' => $record['tracking_number'] ?? '',
            'courier' => $record['courier'] ?? 'Unknown',
            'ship_date' => ($record['ship_date'] ?? null) ?: null,
            'delivery_date' => ($record['delivery_date'] ?? null) ?: null,
            'current_status' => $status,
            'state' => $record['state'] ?? null,
            'city' => $record['city'] ?? null,
            'postcode' => $record['postcode'] ?? null,
            'sku_count' => isset($record['sku_count']) ? (int) $record['sku_count'] : null,
            'weight' => isset($record['weight']) ? (float) $record['weight'] : null,
            'shipping_cost' => isset($record['shipping_cost']) ? (float) $record['shipping_cost'] : null,
        ];

        $shipment = Shipment::query()->updateOrCreate(
            ['source_system' => $sourceSystem, 'order_number' => $orderNumber],
            $attributes,
        );

        if ($shipment->wasRecentlyCreated || $previousStatus !== $shipment->current_status) {
            $this->recordStatusChange($shipment, $sourceSystem, $shipment->current_status, $externalStatus);
        }

        if (! empty($record['tracking_events']) && is_array($record['tracking_events'])) {
            $this->syncTrackingEvents($shipment, $sourceSystem, $record['tracking_events'], $source);
        }

        return [
            'shipment' => $shipment,
            'created' => $shipment->wasRecentlyCreated,
            'deleted' => false,
        ];
    }

    /**
     * @return array{shipment: null, created: false, deleted: bool}
     */
    private function deleteByOrder(string $sourceSystem, string $orderNumber): array
    {
        $shipment = Shipment::query()
            ->where('source_system', $sourceSystem)
            ->where('order_number', $orderNumber)
            ->first();

        if ($shipment) {
            $shipment->delete();
        }

        return [
            'shipment' => null,
            'created' => false,
            'deleted' => $shipment !== null,
        ];
    }

    private function recordStatusChange(
        Shipment $shipment,
        string $sourceSystem,
        string $status,
        ?string $externalStatus = null,
    ): void {
        TrackingEvent::create([
            'shipment_id' => $shipment->id,
            'tracking_number' => $this->trackingReference($shipment),
            'status' => $status,
            'timestamp' => $this->resolveEventTimestamp($shipment, $status),
            'source_system' => $sourceSystem,
            'notes' => $externalStatus && $externalStatus !== $status
                ? "OMS status: {$externalStatus}"
                : null,
        ]);
    }

    /**
     * @param  array<int, array<string, mixed>>  $events
     */
    private function syncTrackingEvents(
        Shipment $shipment,
        string $sourceSystem,
        array $events,
        ?SourceSystem $source = null,
    ): void {
        foreach ($events as $event) {
            if (! is_array($event)) {
                continue;
            }

            $externalStatus = $event['status'] ?? $event['current_status'] ?? null;
            if ($externalStatus === null || trim((string) $externalStatus) === '') {
                continue;
            }

            $status = $source
                ? $this->statusMapping->resolve($source, (string) $externalStatus)
                : $this->normalizeStatus((string) $externalStatus);

            $timestamp = ! empty($event['timestamp'])
                ? Carbon::parse($event['timestamp'])
                : $this->resolveEventTimestamp($shipment, $status);

            $exists = TrackingEvent::query()
                ->where('shipment_id', $shipment->id)
                ->where('status', $status)
                ->where('timestamp', $timestamp)
                ->exists();

            if ($exists) {
                continue;
            }

            TrackingEvent::create([
                'shipment_id' => $shipment->id,
                'tracking_number' => $this->trackingReference($shipment),
                'status' => $status,
                'timestamp' => $timestamp,
                'source_system' => $sourceSystem,
                'notes' => $event['notes'] ?? (
                    $externalStatus !== $status ? "OMS status: {$externalStatus}" : null
                ),
            ]);
        }
    }

    private function trackingReference(Shipment $shipment): string
    {
        return $shipment->tracking_number !== ''
            ? $shipment->tracking_number
            : $shipment->order_number;
    }

    private function resolveEventTimestamp(Shipment $shipment, string $status): Carbon
    {
        if ($status === 'delivered' && $shipment->delivery_date) {
            return $shipment->delivery_date->copy()->startOfDay();
        }

        if (in_array($status, ['shipped', 'in_transit', 'out_for_delivery'], true) && $shipment->ship_date) {
            return $shipment->ship_date->copy()->startOfDay();
        }

        return now();
    }

    private function normalizeStatus(?string $status): string
    {
        if ($status === null || trim($status) === '') {
            return 'pending';
        }

        $normalized = strtolower(str_replace([' ', '-'], '_', trim($status)));

        return in_array($normalized, [
            'pending', 'shipped', 'in_transit', 'out_for_delivery',
            'delivered', 'failed_delivery', 'returned',
        ], true) ? $normalized : 'pending';
    }
}
