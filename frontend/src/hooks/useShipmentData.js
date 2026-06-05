import { useQuery } from '@tanstack/react-query';

import { useMemo, useState } from 'react';
import api from '@/api/client';
import { filterShipments, getUniqueValues } from '@/lib/analyticsUtils';

export function useShipmentData() {
  const [filters, setFilters] = useState({
    dateFrom: '', dateTo: '', courier: '', state: '', city: '', status: '', source_system: ''
  });

  const { data: shipments = [], isLoading } = useQuery({
    queryKey: ['shipments'],
    queryFn: () => api.entities.Shipment.list('-created_date', 10000),
  });

  const filtered = useMemo(() => filterShipments(shipments, filters), [shipments, filters]);

  const couriers = useMemo(() => getUniqueValues(shipments, 'courier'), [shipments]);
  const states = useMemo(() => getUniqueValues(shipments, 'state'), [shipments]);
  const cities = useMemo(() => getUniqueValues(shipments, 'city'), [shipments]);
  const sourceSystems = useMemo(() => getUniqueValues(shipments, 'source_system'), [shipments]);

  return {
    shipments,
    filtered,
    filters,
    setFilters,
    isLoading,
    couriers,
    states,
    cities,
    sourceSystems,
  };
}
