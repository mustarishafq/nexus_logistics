<?php

namespace Tests\Unit;

use App\Models\SlaRule;
use App\Services\SlaRuleResolver;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SlaRuleResolverTest extends TestCase
{
    use RefreshDatabase;

    public function test_resolves_most_specific_postcode_rule_first(): void
    {
        SlaRule::create([
            'rule_type' => 'global',
            'sla_days' => 7,
            'is_active' => true,
        ]);
        SlaRule::create([
            'rule_type' => 'courier_state',
            'courier' => 'J&T',
            'state' => 'Sabah',
            'sla_days' => 5,
            'is_active' => true,
        ]);
        SlaRule::create([
            'rule_type' => 'courier_postcode_state',
            'courier' => 'J&T',
            'state' => 'Sabah',
            'postcode' => '88000',
            'sla_days' => 3,
            'is_active' => true,
        ]);

        $resolver = app(SlaRuleResolver::class);

        $this->assertSame(3, $resolver->resolveTargetDays('J&T', 'Sabah', '88000'));
        $this->assertSame(5, $resolver->resolveTargetDays('J&T', 'Sabah', '88100'));
        $this->assertSame(7, $resolver->resolveTargetDays('Pos Laju', 'Sabah', '88000'));
    }

    public function test_ignores_inactive_rules(): void
    {
        SlaRule::create([
            'rule_type' => 'courier_postcode_state',
            'courier' => 'J&T',
            'state' => 'Sabah',
            'postcode' => '88000',
            'sla_days' => 3,
            'is_active' => false,
        ]);
        SlaRule::create([
            'rule_type' => 'global',
            'sla_days' => 7,
            'is_active' => true,
        ]);

        $resolver = app(SlaRuleResolver::class);

        $this->assertSame(7, $resolver->resolveTargetDays('J&T', 'Sabah', '88000'));
    }
}
