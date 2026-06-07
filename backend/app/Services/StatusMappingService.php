<?php

namespace App\Services;

use App\Models\SourceSystem;
use App\Support\ShipmentStatus;

class StatusMappingService
{
    public function resolve(SourceSystem $sourceSystem, ?string $externalStatus): string
    {
        if ($externalStatus === null || trim($externalStatus) === '') {
            return ShipmentStatus::PENDING;
        }

        $externalStatus = trim($externalStatus);
        $normalized = strtolower(str_replace([' ', '-'], '_', $externalStatus));

        if (in_array($normalized, ShipmentStatus::ALL, true)) {
            return $normalized;
        }

        $mappings = $sourceSystem->status_mappings ?? [];

        if (isset($mappings[$externalStatus]) && $this->isValid($mappings[$externalStatus])) {
            return $mappings[$externalStatus];
        }

        foreach ($mappings as $external => $internal) {
            if (strcasecmp((string) $external, $externalStatus) === 0 && $this->isValid($internal)) {
                return $internal;
            }
        }

        return ShipmentStatus::PENDING;
    }

    public function isValid(?string $status): bool
    {
        return in_array($status, ShipmentStatus::ALL, true);
    }

    public function shouldTriggerDeletion(SourceSystem $sourceSystem, ?string $externalStatus): bool
    {
        if ($externalStatus === null || trim($externalStatus) === '') {
            return false;
        }

        $externalStatus = trim($externalStatus);
        $statuses = $sourceSystem->deletion_statuses ?? [];

        foreach ($statuses as $status) {
            if (strcasecmp((string) $status, $externalStatus) === 0) {
                return true;
            }
        }

        return false;
    }
}
