import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import api from '@/api/client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Plug, Copy, Trash2, RefreshCcw, ArrowLeftRight } from 'lucide-react';
import StatusBadge from '@/components/shared/StatusBadge';
import StatusMappingDialog from '@/components/integrations/StatusMappingDialog';
import { toast } from 'sonner';
import { getPublicWebhookUrl } from '@/lib/publicUrls';

const systemTypes = ['oms', 'erp', 'warehouse', 'shopify', 'woocommerce', 'marketplace', 'custom'];

function generateKey(len = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function Integrations() {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [mappingSource, setMappingSource] = useState(null);
  const [form, setForm] = useState({ name: '', system_type: 'oms', api_key: '', webhook_secret: '', status: 'active' });

  const { data: sources = [], isLoading } = useQuery({
    queryKey: ['source-systems'],
    queryFn: () => api.entities.SourceSystem.list('-created_date', 100),
  });

  const createMutation = useMutation({
    mutationFn: data => api.entities.SourceSystem.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['source-systems'] });
      setShowAdd(false);
      toast.success('Source system created');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: id => api.entities.SourceSystem.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['source-systems'] });
      toast.success('Source system deleted');
    },
  });

  const handleCreate = () => {
    const data = { ...form };
    if (!data.api_key) data.api_key = generateKey();
    if (!data.webhook_secret) data.webhook_secret = generateKey();
    createMutation.mutate(data);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Manage source systems that send shipment data via webhooks</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="gap-1.5">
          <Plus className="w-4 h-4" /> Add Source System
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sources.map(src => {
          const webhookUrl = src.webhook_url || getPublicWebhookUrl(src.id);

          return (
          <Card key={src.id} className="p-5 border-border/50 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Plug className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">{src.name}</h3>
                  <p className="text-xs text-muted-foreground capitalize">{src.system_type}</p>
                </div>
              </div>
              <StatusBadge status={src.status} />
            </div>

            <div className="space-y-2">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">API Key</p>
                <div className="flex items-center gap-1">
                  <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate font-mono">{src.api_key}</code>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(src.api_key)}><Copy className="w-3 h-3" /></Button>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Webhook Secret</p>
                <div className="flex items-center gap-1">
                  <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate font-mono">{src.webhook_secret}</code>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(src.webhook_secret)}><Copy className="w-3 h-3" /></Button>
                </div>
              </div>
            </div>

            {/* Webhook Endpoint Info */}
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Webhook Endpoint</p>
              <div className="flex items-center gap-1">
                <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate font-mono text-primary">
                  POST {webhookUrl}
                </code>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(webhookUrl)}><Copy className="w-3 h-3" /></Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Pass <code className="bg-muted px-1 rounded">X-API-Key</code> header with your API key</p>
            </div>

            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Status Mappings</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {src.status_mappings && typeof src.status_mappings === 'object' && !Array.isArray(src.status_mappings)
                    ? Object.keys(src.status_mappings).length
                    : 0} mapped
                </span>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setMappingSource(src)}>
                  <ArrowLeftRight className="w-3 h-3" /> Configure
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{src.total_shipments_received || 0} shipments received</span>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(src.id)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </Card>
        );
        })}

        {sources.length === 0 && (
          <Card className="col-span-full p-8 text-center border-dashed border-2">
            <Plug className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium">No source systems configured</p>
            <p className="text-xs text-muted-foreground mt-1">Add a source system to start receiving shipment data</p>
          </Card>
        )}
      </div>

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Source System</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">System Name</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. OMS Production" />
            </div>
            <div>
              <Label className="text-xs">System Type</Label>
              <Select value={form.system_type} onValueChange={v => setForm(f => ({ ...f, system_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {systemTypes.map(t => <SelectItem key={t} value={t}>{t.toUpperCase()}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">API Key <span className="text-muted-foreground">(auto-generated if empty)</span></Label>
              <div className="flex gap-2">
                <Input value={form.api_key} onChange={e => setForm(f => ({ ...f, api_key: e.target.value }))} placeholder="Auto-generated" className="font-mono text-xs" />
                <Button variant="outline" size="icon" onClick={() => setForm(f => ({ ...f, api_key: generateKey() }))}><RefreshCcw className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
            <div>
              <Label className="text-xs">Webhook Secret <span className="text-muted-foreground">(auto-generated if empty)</span></Label>
              <div className="flex gap-2">
                <Input value={form.webhook_secret} onChange={e => setForm(f => ({ ...f, webhook_secret: e.target.value }))} placeholder="Auto-generated" className="font-mono text-xs" />
                <Button variant="outline" size="icon" onClick={() => setForm(f => ({ ...f, webhook_secret: generateKey() }))}><RefreshCcw className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.name}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <StatusMappingDialog
        source={mappingSource}
        open={!!mappingSource}
        onOpenChange={open => { if (!open) setMappingSource(null); }}
      />
    </div>
  );
}