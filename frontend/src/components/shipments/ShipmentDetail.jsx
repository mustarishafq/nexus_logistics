import React from 'react';
import { useQuery } from '@tanstack/react-query';

import api from '@/api/client';

import { Badge } from '@/components/ui/badge';
import StatusBadge from '@/components/shared/StatusBadge';
import { Package, Truck, MapPin, Calendar, Clock, DollarSign, Hash } from 'lucide-react';
import { formatDate, formatTimelineDate } from '@/lib/dateUtils';
import { buildFallbackTimeline, sortTimelineEvents } from '@/lib/shipmentTimeline';

export default function ShipmentDetail({ shipment }) {
  const { data: events, isPending, isError } = useQuery({
    queryKey: ['tracking-events', shipment.id],
    queryFn: () => api.entities.TrackingEvent.filter({ shipment_id: shipment.id }, '-timestamp', 50),
    enabled: !!shipment.id,
  });

  const timelineEvents = isPending
    ? null
    : sortTimelineEvents(
        !isError && events?.length > 0 ? events : buildFallbackTimeline(shipment),
      );

  const fields = [
    { icon: Hash, label: 'Order #', value: shipment.order_number },
    { icon: Package, label: 'Tracking #', value: shipment.tracking_number },
    { icon: Truck, label: 'Courier', value: shipment.courier },
    { icon: MapPin, label: 'Destination', value: [shipment.city, shipment.postcode, shipment.state].filter(Boolean).join(', ') || '-' },
    { icon: Calendar, label: 'Ship Date', value: formatDate(shipment.ship_date) },
    { icon: Calendar, label: 'Delivery Date', value: formatDate(shipment.delivery_date) },
    { icon: Clock, label: 'Delivery Days', value: shipment.delivery_days || '-' },
    { icon: DollarSign, label: 'Shipping Cost', value: shipment.shipping_cost ? `RM ${shipment.shipping_cost}` : '-' },
  ];

  return (
    <div className="space-y-6">
      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-4">
        {fields.map(f => (
          <div key={f.label} className="flex items-start gap-3">
            <f.icon className="w-4 h-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">{f.label}</p>
              <p className="text-sm font-medium">{f.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Status & SLA */}
      <div className="flex items-center gap-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Status</p>
          <StatusBadge status={shipment.current_status} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">SLA Result</p>
          <StatusBadge status={shipment.sla_result || 'pending'} />
        </div>
        {shipment.sla_target_days && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">SLA Target</p>
            <Badge variant="outline" className="text-xs">{shipment.sla_target_days} days</Badge>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Tracking Timeline</h4>
        {isPending ? (
          <p className="text-sm text-muted-foreground">Loading timeline...</p>
        ) : timelineEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tracking events recorded</p>
        ) : (
          <div className="rounded-lg border border-border/50 bg-muted/20 px-4 py-3">
            {timelineEvents.map((evt, i) => (
              <div key={evt.id} className="relative pl-6 pb-5 last:pb-0">
                {i < timelineEvents.length - 1 && (
                  <div className="absolute left-[5px] top-2.5 bottom-0 w-px bg-border" />
                )}
                <div className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-[3px] ring-primary/15" />
                <div className="flex min-h-5 items-center gap-3">
                  <StatusBadge status={evt.status} />
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {formatTimelineDate(evt.timestamp || evt.created_date)}
                  </span>
                </div>
                {evt.notes && (
                  <p className="mt-1.5 pl-0 text-xs text-muted-foreground">{evt.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}