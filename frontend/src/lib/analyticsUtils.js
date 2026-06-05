import { formatDate, formatMonthLabel, toIsoDate } from '@/lib/dateUtils';

// Shared analytics computation utilities
export function computeMetrics(shipments) {
  const total = shipments.length;
  const delivered = shipments.filter(s => s.current_status === 'delivered').length;
  const returned = shipments.filter(s => s.current_status === 'returned').length;
  const failed = shipments.filter(s => s.current_status === 'failed_delivery').length;
  const slaMet = shipments.filter(s => s.sla_result === 'met').length;
  const slaBreached = shipments.filter(s => s.sla_result === 'breached').length;
  const slaEvaluated = slaMet + slaBreached;
  
  const deliveryDays = shipments.filter(s => s.delivery_days > 0).map(s => s.delivery_days);
  const avgDeliveryDays = deliveryDays.length ? (deliveryDays.reduce((a, b) => a + b, 0) / deliveryDays.length).toFixed(1) : 0;
  
  const sortedDays = [...deliveryDays].sort((a, b) => a - b);
  const medianDeliveryDays = sortedDays.length ? sortedDays[Math.floor(sortedDays.length / 2)] : 0;
  const p90DeliveryDays = sortedDays.length ? sortedDays[Math.floor(sortedDays.length * 0.9)] : 0;

  return {
    total,
    delivered,
    returned,
    failed,
    returnRate: total ? ((returned / total) * 100).toFixed(1) : '0.0',
    slaCompliance: slaEvaluated ? ((slaMet / slaEvaluated) * 100).toFixed(1) : '0.0',
    slaMet,
    slaBreached,
    slaEvaluated,
    avgDeliveryDays,
    medianDeliveryDays,
    p90DeliveryDays,
  };
}

export function groupBy(items, key) {
  const map = {};
  items.forEach(item => {
    const k = item[key] || 'Unknown';
    if (!map[k]) map[k] = [];
    map[k].push(item);
  });
  return map;
}

export function computeGroupMetrics(shipments, key) {
  const groups = groupBy(shipments, key);
  return Object.entries(groups).map(([name, items]) => {
    const metrics = computeMetrics(items);
    return { name, ...metrics };
  }).sort((a, b) => b.total - a.total);
}

export function filterShipments(shipments, filters) {
  return shipments.filter(s => {
    const shipDate = toIsoDate(s.ship_date);
    if (filters.dateFrom && shipDate < filters.dateFrom) return false;
    if (filters.dateTo && shipDate > filters.dateTo) return false;
    if (filters.courier && s.courier !== filters.courier) return false;
    if (filters.state && s.state !== filters.state) return false;
    if (filters.city && s.city !== filters.city) return false;
    if (filters.status && s.current_status !== filters.status) return false;
    if (filters.source_system && s.source_system !== filters.source_system) return false;
    return true;
  });
}

export function getUniqueValues(shipments, key) {
  return [...new Set(shipments.map(s => s[key]).filter(Boolean))].sort();
}

export function computeTrends(shipments, dateKey = 'ship_date', period = 'daily') {
  const buckets = {};
  shipments.forEach(s => {
    const isoDate = toIsoDate(s[dateKey]);
    if (!isoDate) return;

    let bucket;
    if (period === 'daily') bucket = isoDate;
    else if (period === 'weekly') {
      const date = new Date(`${isoDate}T00:00:00`);
      const start = new Date(date);
      start.setDate(date.getDate() - date.getDay());
      bucket = start.toISOString().slice(0, 10);
    } else if (period === 'monthly') bucket = isoDate.slice(0, 7);
    else bucket = isoDate.slice(0, 4);
    
    if (!buckets[bucket]) buckets[bucket] = { total: 0, returned: 0, delivered: 0, slaMet: 0, slaBreached: 0 };
    buckets[bucket].total++;
    if (s.current_status === 'returned') buckets[bucket].returned++;
    if (s.current_status === 'delivered') buckets[bucket].delivered++;
    if (s.sla_result === 'met') buckets[bucket].slaMet++;
    if (s.sla_result === 'breached') buckets[bucket].slaBreached++;
  });

  return Object.entries(buckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({
      date: period === 'monthly'
        ? formatMonthLabel(`${date}-01`)
        : /^\d{4}$/.test(date)
          ? date
          : formatDate(date),
      ...data,
      returnRate: data.total ? parseFloat(((data.returned / data.total) * 100).toFixed(1)) : 0,
      slaCompliance: (data.slaMet + data.slaBreached) ? parseFloat(((data.slaMet / (data.slaMet + data.slaBreached)) * 100).toFixed(1)) : 0,
    }));
}