import { parseDate } from '@/lib/dateUtils';

export function buildFallbackTimeline(shipment) {
  const items = [];

  if (shipment.ship_date && shipment.current_status !== 'pending') {
    items.push({
      id: 'fallback-shipped',
      status: 'shipped',
      timestamp: shipment.ship_date,
      notes: null,
    });
  }

  if (shipment.current_status && shipment.current_status !== 'shipped') {
    items.push({
      id: 'fallback-current',
      status: shipment.current_status,
      timestamp: shipment.delivery_date || shipment.ship_date || shipment.created_date,
      notes: null,
    });
  } else if (shipment.current_status === 'pending') {
    items.push({
      id: 'fallback-pending',
      status: 'pending',
      timestamp: shipment.created_date,
      notes: null,
    });
  }

  return items.filter(item => item.timestamp);
}

export function sortTimelineEvents(events) {
  return [...events].sort((a, b) => {
    const aTime = parseDate(a.timestamp || a.created_date)?.getTime() ?? 0;
    const bTime = parseDate(b.timestamp || b.created_date)?.getTime() ?? 0;
    return aTime - bTime;
  });
}
