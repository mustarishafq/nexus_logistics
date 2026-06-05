<?php

namespace App\Http\Controllers\Api;

use App\Models\WebhookLog;

class WebhookLogController extends EntityController
{
    protected function modelClass(): string
    {
        return WebhookLog::class;
    }
}
