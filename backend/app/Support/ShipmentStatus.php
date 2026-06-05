<?php

namespace App\Support;

class ShipmentStatus
{
    public const PENDING = 'pending';

    public const SHIPPED = 'shipped';

    public const IN_TRANSIT = 'in_transit';

    public const OUT_FOR_DELIVERY = 'out_for_delivery';

    public const DELIVERED = 'delivered';

    public const FAILED_DELIVERY = 'failed_delivery';

    public const RETURNED = 'returned';

    public const ALL = [
        self::PENDING,
        self::SHIPPED,
        self::IN_TRANSIT,
        self::OUT_FOR_DELIVERY,
        self::DELIVERED,
        self::FAILED_DELIVERY,
        self::RETURNED,
    ];
}
