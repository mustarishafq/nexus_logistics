<?php

namespace App\Http\Controllers\Api;

use App\Models\TrackingEvent;

class TrackingEventController extends EntityController
{
    protected function modelClass(): string
    {
        return TrackingEvent::class;
    }
}
