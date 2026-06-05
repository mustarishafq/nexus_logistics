<?php

namespace Tests\Unit;

use App\Models\SourceSystem;
use App\Services\StatusMappingService;
use App\Support\ShipmentStatus;
use PHPUnit\Framework\TestCase;

class StatusMappingServiceTest extends TestCase
{
    private StatusMappingService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new StatusMappingService;
    }

    public function test_maps_configured_external_status(): void
    {
        $source = new SourceSystem([
            'status_mappings' => [
                'Order Shipped' => ShipmentStatus::SHIPPED,
                'DELIVERED_OK' => ShipmentStatus::DELIVERED,
            ],
        ]);

        $this->assertSame(ShipmentStatus::SHIPPED, $this->service->resolve($source, 'Order Shipped'));
        $this->assertSame(ShipmentStatus::DELIVERED, $this->service->resolve($source, 'DELIVERED_OK'));
    }

    public function test_mapping_is_case_insensitive(): void
    {
        $source = new SourceSystem([
            'status_mappings' => ['In Transit' => ShipmentStatus::IN_TRANSIT],
        ]);

        $this->assertSame(ShipmentStatus::IN_TRANSIT, $this->service->resolve($source, 'in transit'));
    }

    public function test_passes_through_valid_internal_status(): void
    {
        $source = new SourceSystem(['status_mappings' => []]);

        $this->assertSame(ShipmentStatus::DELIVERED, $this->service->resolve($source, 'delivered'));
        $this->assertSame(ShipmentStatus::IN_TRANSIT, $this->service->resolve($source, 'In Transit'));
    }

    public function test_defaults_unmapped_status_to_pending(): void
    {
        $source = new SourceSystem(['status_mappings' => []]);

        $this->assertSame(ShipmentStatus::PENDING, $this->service->resolve($source, 'Unknown OMS Status'));
        $this->assertSame(ShipmentStatus::PENDING, $this->service->resolve($source, null));
    }
}
