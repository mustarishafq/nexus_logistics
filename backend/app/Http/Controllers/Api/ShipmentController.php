<?php

namespace App\Http\Controllers\Api;

use App\Models\Shipment;

class ShipmentController extends EntityController
{
    protected function modelClass(): string
    {
        return Shipment::class;
    }
}
