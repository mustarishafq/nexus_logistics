<?php

namespace Tests\Feature;

use App\Models\Shipment;
use App\Models\TrackingEvent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ShipmentDeleteTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_delete_shipment(): void
    {
        $user = User::factory()->create(['is_approved' => true]);

        $shipment = Shipment::create([
            'source_system' => 'Manual',
            'order_number' => 'ORD-999',
            'tracking_number' => 'TRK-999',
            'courier' => 'DHL',
            'current_status' => 'pending',
        ]);

        TrackingEvent::create([
            'shipment_id' => $shipment->id,
            'tracking_number' => 'TRK-999',
            'status' => 'pending',
            'timestamp' => now(),
            'source_system' => 'Manual',
        ]);

        $response = $this->actingAs($user)
            ->deleteJson("/api/shipments/{$shipment->id}");

        $response->assertOk()
            ->assertJsonPath('message', 'Deleted.');

        $this->assertDatabaseMissing('shipments', ['id' => $shipment->id]);
        $this->assertSame(0, TrackingEvent::query()->where('shipment_id', $shipment->id)->count());
    }
}
