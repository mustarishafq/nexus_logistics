<?php

namespace App\Http\Controllers\Api;

use App\Models\SlaRule;

class SlaRuleController extends EntityController
{
    protected function modelClass(): string
    {
        return SlaRule::class;
    }
}
