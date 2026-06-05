<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SourceSystem;
use App\Models\WebhookLog;
use App\Services\ShipmentIngestService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WebhookController extends Controller
{
    public function __construct(private ShipmentIngestService $ingestService) {}

    public function receiveShipments(Request $request, string $sourceSystemId): JsonResponse
    {
        $sourceSystem = SourceSystem::query()->find($sourceSystemId);

        if (! $sourceSystem || $sourceSystem->status !== 'active') {
            return response()->json(['message' => 'Source system not found or inactive.'], 404);
        }

        $apiKey = $request->header('X-API-Key');
        if (! $apiKey || $apiKey !== $sourceSystem->api_key) {
            return response()->json(['message' => 'Invalid API key.'], 401);
        }

        $records = $this->normalizeShipmentRecords($request);
        if ($records === null) {
            return response()->json(['message' => 'Invalid payload.'], 422);
        }

        $log = WebhookLog::create([
            'request_time' => now(),
            'event_type' => 'shipment_ingest',
            'source_system' => $sourceSystem->name,
            'processing_status' => 'processing',
            'payload_summary' => count($records).' shipment(s)',
        ]);

        try {
            $shipments = [];
            $createdCount = 0;
            $updatedCount = 0;

            foreach ($records as $record) {
                if (! is_array($record)) {
                    continue;
                }

                $result = $this->ingestService->upsert($sourceSystem->name, $record, $sourceSystem);
                $shipments[] = $result['shipment']->toApiArray();

                if ($result['created']) {
                    $createdCount++;
                } else {
                    $updatedCount++;
                }
            }

            $sourceSystem->update([
                'last_received_at' => now(),
                'total_shipments_received' => $sourceSystem->total_shipments_received + $createdCount,
            ]);

            $log->update([
                'processing_status' => 'completed',
                'records_processed' => count($shipments),
            ]);

            return response()->json([
                'message' => 'Shipments received.',
                'created' => $createdCount,
                'updated' => $updatedCount,
                'shipments' => $shipments,
            ], 201);
        } catch (\Throwable $e) {
            $log->update([
                'processing_status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);

            return response()->json(['message' => 'Failed to process webhook.'], 500);
        }
    }

    /**
     * Accepts:
     * - {"shipments": [{...}, {...}]}
     * - [{...}, {...}]  (raw JSON array — common from Postman/OMS)
     * - {...}           (single shipment)
     *
     * @return array<int, array<string, mixed>>|null
     */
    private function normalizeShipmentRecords(Request $request): ?array
    {
        $payload = $request->all();

        if ($request->has('shipments')) {
            $records = $request->input('shipments');
            if (! is_array($records)) {
                return null;
            }

            return array_values(array_filter($records, fn ($record) => is_array($record)));
        }

        if ($this->isShipmentRecordList($payload)) {
            return array_values(array_filter($payload, fn ($record) => is_array($record)));
        }

        if ($this->looksLikeShipmentRecord($payload)) {
            return [$payload];
        }

        return null;
    }

    private function isShipmentRecordList(array $payload): bool
    {
        if ($payload === [] || ! array_is_list($payload)) {
            return false;
        }

        return $this->looksLikeShipmentRecord($payload[0] ?? null);
    }

    private function looksLikeShipmentRecord(mixed $record): bool
    {
        if (! is_array($record)) {
            return false;
        }

        $indicators = ['order_number', 'tracking_number', 'courier', 'current_status', 'status', 'ship_date'];

        foreach ($indicators as $field) {
            if (array_key_exists($field, $record)) {
                return true;
            }
        }

        return false;
    }
}
