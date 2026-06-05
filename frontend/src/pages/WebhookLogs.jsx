import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import api from '@/api/client';

import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatDateTime } from '@/lib/dateUtils';

export default function WebhookLogs() {
  const [eventFilter, setEventFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['webhook-logs'],
    queryFn: () => api.entities.WebhookLog.list('-created_date', 500),
  });

  const filtered = logs.filter(l => {
    if (eventFilter !== 'all' && l.event_type !== eventFilter) return false;
    if (statusFilter !== 'all' && l.processing_status !== statusFilter) return false;
    return true;
  });

  const columns = [
    { key: 'created_date', label: 'Time', render: v => formatDateTime(v) },
    { key: 'event_type', label: 'Event Type', render: v => <span className="capitalize text-xs">{(v || '').replace(/_/g, ' ')}</span> },
    { key: 'source_system', label: 'Source System' },
    { key: 'processing_status', label: 'Status', render: v => <StatusBadge status={v} /> },
    { key: 'records_processed', label: 'Records' },
    { key: 'error_message', label: 'Error', render: v => v ? <span className="text-xs text-destructive truncate max-w-48 inline-block">{v}</span> : '-' },
    { key: 'payload_summary', label: 'Summary', render: v => <span className="text-xs text-muted-foreground truncate max-w-48 inline-block">{v || '-'}</span> },
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={eventFilter} onValueChange={setEventFilter}>
          <SelectTrigger className="h-9 w-44 text-xs"><SelectValue placeholder="Event Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="shipment_create">Shipment Create</SelectItem>
            <SelectItem value="shipment_update">Shipment Update</SelectItem>
            <SelectItem value="status_update">Status Update</SelectItem>
            <SelectItem value="bulk_import">Bulk Import</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-40 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="received">Received</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="p-5 border-border/50">
        <DataTable columns={columns} data={filtered} pageSize={20} />
      </Card>
    </div>
  );
}