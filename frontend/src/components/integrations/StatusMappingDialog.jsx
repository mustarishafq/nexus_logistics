import React, { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import api from '@/api/client';
import { SHIPMENT_STATUSES } from '@/lib/shipmentStatuses';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import StatusBadge from '@/components/shared/StatusBadge';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const VALID_STATUSES = new Set(SHIPMENT_STATUSES.map(s => s.value));

function mappingsToRows(mappings) {
  if (!mappings || typeof mappings !== 'object' || Array.isArray(mappings)) {
    return [];
  }

  return Object.entries(mappings).map(([external, internal], index) => ({
    id: `${external}-${index}`,
    external: String(external),
    internal: VALID_STATUSES.has(internal) ? internal : 'pending',
  }));
}

function deletionStatusesToRows(statuses) {
  if (!Array.isArray(statuses)) {
    return [];
  }

  return statuses.map((status, index) => ({
    id: `delete-${status}-${index}`,
    value: String(status),
  }));
}

export default function StatusMappingDialog({ source, open, onOpenChange }) {
  const queryClient = useQueryClient();
  const [rows, setRows] = useState([]);
  const [deletionRows, setDeletionRows] = useState([]);
  const sourceId = source?.id;

  useEffect(() => {
    if (open && source) {
      setRows(mappingsToRows(source.status_mappings));
      setDeletionRows(deletionStatusesToRows(source.deletion_statuses));
    }
  }, [open, source]);

  const saveMutation = useMutation({
    mutationFn: payload => api.entities.SourceSystem.update(sourceId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['source-systems'] });
      toast.success('Status mappings saved');
      onOpenChange(false);
    },
  });

  const addRow = () => {
    setRows(prev => [...prev, { id: `new-${Date.now()}`, external: '', internal: 'pending' }]);
  };

  const removeRow = (id) => {
    setRows(prev => prev.filter(row => row.id !== id));
  };

  const addDeletionRow = () => {
    setDeletionRows(prev => [...prev, { id: `new-delete-${Date.now()}`, value: '' }]);
  };

  const removeDeletionRow = (id) => {
    setDeletionRows(prev => prev.filter(row => row.id !== id));
  };

  const updateRow = (id, field, value) => {
    setRows(prev => prev.map(row => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const updateDeletionRow = (id, value) => {
    setDeletionRows(prev => prev.map(row => (row.id === id ? { ...row, value } : row)));
  };

  const handleSave = () => {
    const mappings = {};
    for (const row of rows) {
      const external = row.external.trim();
      if (!external) continue;
      mappings[external] = row.internal;
    }

    const deletionStatuses = deletionRows
      .map(row => row.value.trim())
      .filter(Boolean);

    saveMutation.mutate({ status_mappings: mappings, deletion_statuses: deletionStatuses });
  };

  return (
    <Dialog open={open && !!source} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 px-6 pt-6 pb-4">
          <DialogTitle>Status Mappings — {source?.name}</DialogTitle>
          <DialogDescription>
            Map external OMS status values to this system&apos;s shipment statuses. Configure which OMS statuses should automatically remove shipments from the system.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 space-y-4">
          <div className="space-y-3">
            {rows.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">No mappings yet. Add one to get started.</p>
            )}

            {rows.map(row => (
              <div key={row.id} className="flex items-end gap-2">
                <div className="flex-1 space-y-1">
                  <Label className="text-[10px] text-muted-foreground">External OMS Status</Label>
                  <Input
                    value={row.external}
                    onChange={e => updateRow(row.id, 'external', e.target.value)}
                    placeholder="e.g. Order Shipped"
                    className="text-xs"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <Label className="text-[10px] text-muted-foreground">System Status</Label>
                  <Select value={row.internal} onValueChange={v => updateRow(row.id, 'internal', v)}>
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SHIPMENT_STATUSES.map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-destructive" onClick={() => removeRow(row.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}

            <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={addRow}>
              <Plus className="w-3.5 h-3.5" /> Add Mapping
            </Button>
          </div>

          <div className="space-y-3 pt-2 border-t border-border/50">
            <div>
              <p className="text-xs font-medium">Auto-Delete Triggers</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                When the OMS sends one of these statuses, the matching shipment is removed from the system.
              </p>
            </div>

            {deletionRows.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">No deletion triggers configured.</p>
            )}

            {deletionRows.map(row => (
              <div key={row.id} className="flex items-end gap-2">
                <div className="flex-1 space-y-1">
                  <Label className="text-[10px] text-muted-foreground">External OMS Status</Label>
                  <Input
                    value={row.value}
                    onChange={e => updateDeletionRow(row.id, e.target.value)}
                    placeholder="e.g. Cancelled"
                    className="text-xs"
                  />
                </div>
                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-destructive" onClick={() => removeDeletionRow(row.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}

            <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={addDeletionRow}>
              <Plus className="w-3.5 h-3.5" /> Add Deletion Trigger
            </Button>
          </div>

          <div className="rounded-lg border border-border/50 p-3 space-y-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">System Statuses</p>
            <div className="flex flex-wrap gap-1.5">
              {SHIPMENT_STATUSES.map(s => (
                <StatusBadge key={s.value} status={s.value} />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0 px-6 py-4 border-t bg-background">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saveMutation.isPending}>Save Mappings</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
