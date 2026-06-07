<?php

namespace App\Http\Controllers\Api;

use App\Models\Shipment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShipmentController extends EntityController
{
    protected function modelClass(): string
    {
        return Shipment::class;
    }

    public function bulkDestroy(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'required',
        ]);

        $shipments = Shipment::query()->whereIn('id', $data['ids'])->get();

        foreach ($shipments as $shipment) {
            $shipment->delete();
        }

        return response()->json([
            'message' => 'Deleted.',
            'deleted' => $shipments->count(),
        ]);
    }
}
