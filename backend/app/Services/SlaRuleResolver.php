<?php

namespace App\Services;

use App\Models\SlaRule;
use Illuminate\Support\Collection;

class SlaRuleResolver
{
    /** @var list<string> */
    private const PRIORITY = [
        'courier_postcode_state',
        'courier_state',
        'courier',
        'global',
    ];

    private ?Collection $activeRules = null;

    public function resolveTargetDays(?string $courier, ?string $state, ?string $postcode): ?int
    {
        $courier = $this->normalize($courier);
        $state = $this->normalize($state);
        $postcode = $this->normalizePostcode($postcode);

        foreach (self::PRIORITY as $ruleType) {
            $rule = $this->activeRules()->first(
                fn (SlaRule $rule) => $this->matches($rule, $ruleType, $courier, $state, $postcode)
            );

            if ($rule) {
                return $rule->sla_days;
            }
        }

        return null;
    }

    private function activeRules(): Collection
    {
        return $this->activeRules ??= SlaRule::query()
            ->where('is_active', true)
            ->get();
    }

    private function matches(
        SlaRule $rule,
        string $expectedType,
        ?string $courier,
        ?string $state,
        ?string $postcode,
    ): bool {
        if ($this->normalize($rule->rule_type) !== $expectedType) {
            return false;
        }

        return match ($expectedType) {
            'courier_postcode_state' => $courier !== null
                && $state !== null
                && $postcode !== null
                && $this->normalize($rule->courier) === $courier
                && $this->normalize($rule->state) === $state
                && $this->normalizePostcode($rule->postcode) === $postcode,
            'courier_state' => $courier !== null
                && $state !== null
                && $this->normalize($rule->courier) === $courier
                && $this->normalize($rule->state) === $state
                && $this->normalizePostcode($rule->postcode) === null,
            'courier' => $courier !== null
                && $this->normalize($rule->courier) === $courier,
            'global' => true,
            default => false,
        };
    }

    private function normalize(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $value = trim($value);

        return $value === '' ? null : mb_strtolower($value);
    }

    private function normalizePostcode(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $value = preg_replace('/\s+/', '', trim($value));

        return $value === '' ? null : mb_strtolower($value);
    }
}
