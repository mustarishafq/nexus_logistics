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

export default function StatusMappingDialog({ source, open, onOpenChange }) {
  const queryClient = useQueryClient();
  const [rows, setRows] = useState([]);
  const sourceId = source?.id;

  useEffect(() => {
    if (open && source) {
      setRows(mappingsToRows(source.status_mappings));
    }
  }, [open, source]);

  const saveMutation = useMutation({
    mutationFn: mappings => api.entities.SourceSystem.update(sourceId, { status_mappings: mappings }),
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

  const updateRow = (id, field, value) => {
    setRows(prev => prev.map(row => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const handleSave = () => {
    const mappings = {};
    for (const row of rows) {
      const external = row.external.trim();
      if (!external) continue;
      mappings[external] = row.internal;
    }
    saveMutation.mutate(mappings);
  };

  return (
    <Dialog open={open && !!source} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Status Mappings — {source?.name}</DialogTitle>
          <DialogDescription>
            Map external OMS status values to this system&apos;s shipment statuses. Unmapped values default to pending.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
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
        </div>

        <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={addRow}>
          <Plus className="w-3.5 h-3.5" /> Add Mapping
        </Button>

        <div className="rounded-lg border border-border/50 p-3 space-y-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">System Statuses</p>
          <div className="flex flex-wrap gap-1.5">
            {SHIPMENT_STATUSES.map(s => (
              <StatusBadge key={s.value} status={s.value} />
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saveMutation.isPending}>Save Mappings</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
