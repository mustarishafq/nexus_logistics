<?php

namespace App\Models;

use App\Models\Concerns\HasApiFormat;
use Illuminate\Database\Eloquent\Model;

class SlaRule extends Model
{
    use HasApiFormat;

    protected $fillable = [
        'rule_type', 'courier', 'state', 'postcode', 'sla_days', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'sla_days' => 'integer',
            'is_active' => 'boolean',
        ];
    }
}
