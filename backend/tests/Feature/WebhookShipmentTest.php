<?php

namespace Tests\Feature;

use App\Models\Shipment;
use App\Models\SourceSystem;
use App\Models\TrackingEvent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WebhookShipmentTest extends TestCase
{
    use RefreshDatabase;

    public function test_accepts_raw_json_array_payload(): void
    {
        $source = SourceSystem::create([
            'name' => 'SiteGiant',
            'system_type' => 'oms',
            'api_key' => 'test-api-key',
            'webhook_secret' => 'secret',
            'status' => 'active',
            'status_mappings' => ['Paid' => 'shipped'],
        ]);

        $payload = [[
            'order_number' => '584379499639047610',
            'tracking_number' => null,
            'courier' => 'J&T Express',
            'current_status' => 'Paid',
            'ship_date' => '2026-06-08',
            'delivery_date' => null,
            'state' => 'Perak',
            'city' => 'Parit',
            'postcode' => '32***',
            'sku_count' => 1,
            'weight' => null,
            'shipping_cost' => 2.7,
        ]];

        $response = $this->postJson("/api/webhooks/{$source->id}/shipments", $payload, [
            'X-API-Key' => 'test-api-key',
        ]);

        $response->assertCreated();

        $shipment = Shipment::query()->first();
        $this->assertNotNull($shipment);
        $this->assertSame('584379499639047610', $shipment->order_number);
        $this->assertSame('J&T Express', $shipment->courier);
        $this->assertSame('shipped', $shipment->current_status);
        $this->assertSame('2026-06-08', $shipment->ship_date->format('Y-m-d'));
        $this->assertSame('Perak', $shipment->state);
        $this->assertSame('Parit', $shipment->city);
        $this->assertSame('32***', $shipment->postcode);
        $this->assertSame(1, $shipment->sku_count);
        $this->assertSame(2.7, $shipment->shipping_cost);
        $this->assertSame(1, TrackingEvent::query()->count());
        $this->assertSame('shipped', TrackingEvent::query()->value('status'));
    }

    public function test_updates_existing_shipment_for_same_order_number(): void
    {
        $source = SourceSystem::create([
            'name' => 'SiteGiant',
            'system_type' => 'oms',
            'api_key' => 'test-api-key',
            'webhook_secret' => 'secret',
            'status' => 'active',
            'status_mappings' => ['Paid' => 'shipped', 'Delivered' => 'delivered'],
        ]);

        $payload = [[
            'order_number' => '193504',
            'courier' => 'J&T Express',
            'current_status' => 'Paid',
            'ship_date' => '2026-06-08',
            'state' => 'Perak',
            'city' => 'Parit',
        ]];

        $this->postJson("/api/webhooks/{$source->id}/shipments", $payload, [
            'X-API-Key' => 'test-api-key',
        ])->assertCreated();

        $response = $this->postJson("/api/webhooks/{$source->id}/shipments", [[
            ...$payload[0],
            'current_status' => 'Delivered',
            'tracking_number' => 'TRK-123',
        ]], [
            'X-API-Key' => 'test-api-key',
        ]);

        $response->assertCreated()
            ->assertJsonPath('created', 0)
            ->assertJsonPath('updated', 1);

        $this->assertSame(1, Shipment::query()->count());

        $shipment = Shipment::query()->first();
        $this->assertSame('193504', $shipment->order_number);
        $this->assertSame('delivered', $shipment->current_status);
        $this->assertSame('TRK-123', $shipment->tracking_number);
        $this->assertSame(2, TrackingEvent::query()->count());
    }
}
