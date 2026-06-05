<?php

namespace App\Http\Controllers\Api;

use App\Models\SourceSystem;
use App\Support\ShipmentStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SourceSystemController extends EntityController
{
    protected function modelClass(): string
    {
        return SourceSystem::class;
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $sourceSystem = SourceSystem::query()->findOrFail($id);

        $data = $request->only([
            'name', 'system_type', 'api_key', 'webhook_secret', 'status', 'status_mappings',
        ]);

        if (isset($data['status_mappings']) && is_array($data['status_mappings'])) {
            $data['status_mappings'] = $this->sanitizeStatusMappings($data['status_mappings']);
        }

        $sourceSystem->update($data);

        return response()->json($sourceSystem->fresh()->toApiArray());
    }

    private function sanitizeStatusMappings(array $mappings): array
    {
        $sanitized = [];

        foreach ($mappings as $external => $internal) {
            $external = trim((string) $external);
            if ($external === '' || ! in_array($internal, ShipmentStatus::ALL, true)) {
                continue;
            }
            $sanitized[$external] = $internal;
        }

        return $sanitized;
    }
}
