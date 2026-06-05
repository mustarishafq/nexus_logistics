import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Upload } from 'lucide-react';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import ShipmentDetail from '@/components/shipments/ShipmentDetail';
import BulkImportDialog from '@/components/shipments/BulkImportDialog';
import GlobalFilters from '@/components/shared/GlobalFilters';
import { useShipmentData } from '@/hooks/useShipmentData';
import { filterShipments, getUniqueValues } from '@/lib/analyticsUtils';
import { formatDate } from '@/lib/dateUtils';

export default function Shipments() {
  const { filtered, filters, setFilters, isLoading, couriers, states, cities, sourceSystems } = useShipmentData();
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [searchText, setSearchText] = useState('');

  const searchFiltered = searchText
    ? filtered.filter(s =>
        (s.order_number || '').toLowerCase().includes(searchText.toLowerCase()) ||
        (s.tracking_number || '').toLowerCase().includes(searchText.toLowerCase())
      )
    : filtered;

  const columns = [
    { key: 'order_number', label: 'Order #' },
    { key: 'tracking_number', label: 'Tracking #' },
    { key: 'courier', label: 'Courier' },
    { key: 'current_status', label: 'Status', render: v => <StatusBadge status={v} /> },
    { key: 'state', label: 'State' },
    { key: 'city', label: 'City' },
    { key: 'ship_date', label: 'Ship Date', render: v => formatDate(v) },
    { key: 'delivery_date', label: 'Delivery Date', render: v => formatDate(v) },
    { key: 'source_system', label: 'Source' },
    { key: 'sla_result', label: 'SLA', render: v => v ? <StatusBadge status={v} /> : '-' },
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Search + Import bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search order or tracking #..." value={searchText} onChange={e => setSearchText(e.target.value)} className="pl-9 h-9 w-full" />
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowImport(true)} className="gap-1.5 flex-shrink-0">
          <Upload className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Bulk Import</span>
        </Button>
      </div>

      {/* Collapsible Filters */}
      <GlobalFilters filters={filters} setFilters={setFilters} couriers={couriers} states={states} cities={cities} sourceSystems={sourceSystems} />

      <Card className="p-5 border-border/50">
        <DataTable columns={columns} data={searchFiltered} onRowClick={setSelectedShipment} pageSize={20} />
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedShipment} onOpenChange={() => setSelectedShipment(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Shipment Details</DialogTitle></DialogHeader>
          {selectedShipment && <ShipmentDetail shipment={selectedShipment} />}
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <BulkImportDialog open={showImport} onClose={() => setShowImport(false)} />
    </div>
  );
}