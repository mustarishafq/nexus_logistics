<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SlaRule;
use App\Services\ShipmentIngestService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ImportController extends Controller
{
    public function __construct(private ShipmentIngestService $ingestService) {}
    public function parseCsv(Request $request): JsonResponse
    {
        $request->validate(['file' => 'required|file|mimes:csv,txt|max:10240']);

        $content = file_get_contents($request->file('file')->getRealPath());
        $lines = array_values(array_filter(explode("\n", str_replace("\r", '', $content)), fn ($l) => trim($l) !== ''));

        if (count($lines) < 2) {
            return response()->json(['status' => 'error', 'details' => 'File is empty or has no data rows.'], 422);
        }

        $headers = str_getcsv($lines[0]);
        $headers = array_map(fn ($h) => trim(str_replace(['"', "'"], '', $h)), $headers);
        $records = [];

        for ($i = 1; $i < count($lines); $i++) {
            $values = str_getcsv($lines[$i]);
            if (count($values) === 1 && trim($values[0]) === '') {
                continue;
            }
            $row = [];
            foreach ($headers as $idx => $header) {
                $row[$header] = isset($values[$idx]) ? trim($values[$idx], " \t\"'") : null;
            }
            $records[] = $this->castNumericFields($row);
        }

        return response()->json(['status' => 'success', 'output' => $records]);
    }

    public function importShipments(Request $request): JsonResponse
    {
        $request->validate(['records' => 'required|array']);

        $shipments = [];
        foreach ($request->input('records') as $record) {
            $sourceSystem = $record['source_system'] ?? 'Bulk Import';
            $result = $this->ingestService->upsert($sourceSystem, $record);
            $shipments[] = $result['shipment']->toApiArray();
        }

        return response()->json($shipments, 201);
    }

    public function importSlaRules(Request $request): JsonResponse
    {
        $request->validate(['records' => 'required|array']);

        $created = [];
        foreach ($request->input('records') as $record) {
            $created[] = SlaRule::create([
                'rule_type' => $record['rule_type'] ?? 'global',
                'courier' => $record['courier'] ?? '',
                'state' => $record['state'] ?? '',
                'postcode' => $record['postcode'] ?? '',
                'sla_days' => (int) ($record['sla_days'] ?? 3),
                'is_active' => ($record['is_active'] ?? true) !== false,
            ])->toApiArray();
        }

        return response()->json($created, 201);
    }

    private function castNumericFields(array $row): array
    {
        foreach (['sku_count', 'weight', 'shipping_cost', 'sla_days'] as $field) {
            if (isset($row[$field]) && $row[$field] !== '' && is_numeric($row[$field])) {
                $row[$field] = str_contains((string) $row[$field], '.') ? (float) $row[$field] : (int) $row[$field];
            }
        }

        if (isset($row['is_active'])) {
            $row['is_active'] = filter_var($row['is_active'], FILTER_VALIDATE_BOOLEAN);
        }

        return $row;
    }
}
