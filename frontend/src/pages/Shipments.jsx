import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Search, Upload, Trash2 } from 'lucide-react';
import api from '@/api/client';
import { toast } from 'sonner';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import ShipmentDetail from '@/components/shipments/ShipmentDetail';
import BulkImportDialog from '@/components/shipments/BulkImportDialog';
import GlobalFilters from '@/components/shared/GlobalFilters';
import { useShipmentData } from '@/hooks/useShipmentData';
import { formatDate } from '@/lib/dateUtils';

export default function Shipments() {
  const queryClient = useQueryClient();
  const { filtered, filters, setFilters, isLoading, couriers, states, cities, sourceSystems } = useShipmentData();
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [pendingDeleteIds, setPendingDeleteIds] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [searchText, setSearchText] = useState('');

  const deleteMutation = useMutation({
    mutationFn: ids => (
      ids.length === 1
        ? api.entities.Shipment.delete(ids[0])
        : api.entities.Shipment.bulkDelete(ids)
    ),
    onSuccess: (result, deletedIds) => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      const deletedSet = new Set(deletedIds.map(String));
      setSelectedShipment(prev => (prev && deletedSet.has(String(prev.id)) ? null : prev));
      setSelectedIds(prev => prev.filter(id => !deletedSet.has(String(id))));
      setPendingDeleteIds(null);

      const count = result.deleted ?? deletedIds.length;
      toast.success(count === 1 ? 'Shipment deleted' : `${count} shipments deleted`);
    },
    onError: () => {
      toast.error('Failed to delete shipment(s)');
    },
  });

  const searchFiltered = searchText
    ? filtered.filter(s =>
        (s.order_number || '').toLowerCase().includes(searchText.toLowerCase()) ||
        (s.tracking_number || '').toLowerCase().includes(searchText.toLowerCase())
      )
    : filtered;

  const pendingDeleteCount = pendingDeleteIds?.length ?? 0;
  const pendingDeleteOrders = pendingDeleteIds
    ? searchFiltered
        .filter(s => pendingDeleteIds.includes(String(s.id)))
        .slice(0, 3)
        .map(s => s.order_number)
        .filter(Boolean)
    : [];

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
    {
      key: 'actions',
      label: '',
      sortable: false,
      exportable: false,
      render: (_, row) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          title="Delete shipment"
          onClick={(e) => {
            e.stopPropagation();
            setPendingDeleteIds([String(row.id)]);
          }}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      ),
    },
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
        <DataTable
          columns={columns}
          data={searchFiltered}
          onRowClick={setSelectedShipment}
          pageSize={20}
          searchable={false}
          selectable
          selectedIds={selectedIds}
          onSelectedIdsChange={setSelectedIds}
          toolbarStart={selectedIds.length > 0 ? (
            <Button
              variant="destructive"
              size="sm"
              className="gap-1.5"
              onClick={() => setPendingDeleteIds([...selectedIds])}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete ({selectedIds.length})
            </Button>
          ) : null}
        />
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

      <AlertDialog open={!!pendingDeleteIds?.length} onOpenChange={open => { if (!open) setPendingDeleteIds(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingDeleteCount === 1 ? 'Delete shipment?' : `Delete ${pendingDeleteCount} shipments?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDeleteCount === 1 ? (
                <>This will permanently remove the selected shipment from the system, including its tracking history. This cannot be undone.</>
              ) : (
                <>
                  This will permanently remove {pendingDeleteCount} shipments from the system, including their tracking history. This cannot be undone.
                  {pendingDeleteOrders.length > 0 && (
                    <> Orders include {pendingDeleteOrders.join(', ')}{pendingDeleteCount > pendingDeleteOrders.length ? ', …' : ''}.</>
                  )}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (pendingDeleteIds?.length) {
                  deleteMutation.mutate(pendingDeleteIds);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
