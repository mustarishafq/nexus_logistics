import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import api from '@/api/client';
import { useAuth } from '@/lib/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Users, Clock, Upload, CheckCircle } from 'lucide-react';
import DataTable from '@/components/shared/DataTable';
import { toast } from 'sonner';
import { formatDate } from '@/lib/dateUtils';

export default function Settings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'admin';

  const { data: slaRules = [] } = useQuery({
    queryKey: ['sla-rules'],
    queryFn: () => api.entities.SlaRule.list('-created_date', 100),
  });

  const [showAddSla, setShowAddSla] = useState(false);
  const [importingSla, setImportingSla] = useState(false);
  const [slaForm, setSlaForm] = useState({ rule_type: 'global', courier: '', state: '', postcode: '', sla_days: 3, is_active: true });

  const handleSlaImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportingSla(true);
    await api.integrations.Core.UploadFile({ file });
    const extracted = await api.integrations.Core.ExtractDataFromUploadedFile({});
    if (extracted.status === 'success') {
      const records = Array.isArray(extracted.output) ? extracted.output : [extracted.output];
      await api.entities.SlaRule.bulkCreate(records.map(r => ({
        rule_type: r.rule_type || 'global',
        courier: r.courier || '',
        state: r.state || '',
        postcode: r.postcode || '',
        sla_days: Number(r.sla_days) || 3,
        is_active: r.is_active !== false,
      })));
      queryClient.invalidateQueries({ queryKey: ['sla-rules'] });
      toast.success(`Imported ${records.length} SLA rules`);
    } else {
      toast.error('Import failed: ' + extracted.details);
    }
    setImportingSla(false);
    e.target.value = '';
  };

  const createSlaMutation = useMutation({
    mutationFn: data => api.entities.SlaRule.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sla-rules'] });
      setShowAddSla(false);
      setSlaForm({ rule_type: 'global', courier: '', state: '', postcode: '', sla_days: 3, is_active: true });
      toast.success('SLA rule created');
    },
  });

  const deleteSlaMutation = useMutation({
    mutationFn: id => api.entities.SlaRule.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sla-rules'] });
      toast.success('SLA rule deleted');
    },
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.entities.User.list('-created_date', 100),
    enabled: isAdmin,
  });

  const approveUserMutation = useMutation({
    mutationFn: (userId) => api.auth.approveUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User approved');
    },
    onError: (err) => toast.error(err.message || 'Failed to approve user'),
  });

  const slaCols = [
    { key: 'rule_type', label: 'Type', render: v => <Badge variant="outline" className="text-xs capitalize">{v?.replace(/_/g, ' ')}</Badge> },
    { key: 'courier', label: 'Courier', render: v => v || '-' },
    { key: 'state', label: 'State', render: v => v || '-' },
    { key: 'postcode', label: 'Postcode', render: v => v || '-' },
    { key: 'sla_days', label: 'SLA Days', render: v => <span className="font-semibold">{v} days</span> },
    { key: 'is_active', label: 'Active', render: v => v ? <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px]">Active</Badge> : <Badge variant="outline" className="text-[10px]">Inactive</Badge> },
    ...(isAdmin ? [{
      key: 'id', label: '', sortable: false,
      render: (v) => <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); deleteSlaMutation.mutate(v); }}><Trash2 className="w-3.5 h-3.5" /></Button>
    }] : []),
  ];

  const userCols = [
    { key: 'full_name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: v => <Badge variant="outline" className="text-xs capitalize">{v}</Badge> },
    {
      key: 'is_approved',
      label: 'Status',
      render: (v) => v
        ? <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px]">Approved</Badge>
        : <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/30">Pending</Badge>,
    },
    { key: 'created_date', label: 'Joined', render: v => formatDate(v) },
    ...(isAdmin ? [{
      key: 'id',
      label: '',
      sortable: false,
      render: (v, row) => !row.is_approved ? (
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={(e) => { e.stopPropagation(); approveUserMutation.mutate(v); }}
        >
          <CheckCircle className="w-3.5 h-3.5" /> Approve
        </Button>
      ) : null,
    }] : []),
  ];

  return (
    <div className="space-y-6">
      <Tabs defaultValue="sla">
        <TabsList>
          <TabsTrigger value="sla" className="gap-1.5"><Clock className="w-3.5 h-3.5" /> SLA Rules</TabsTrigger>
          {isAdmin && <TabsTrigger value="users" className="gap-1.5"><Users className="w-3.5 h-3.5" /> Users</TabsTrigger>}
        </TabsList>

        <TabsContent value="sla" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">Configure SLA targets. Priority: Courier+Postcode+State → Courier+State → Courier → Global</p>
            {isAdmin && (
              <div className="flex gap-2">
                <label className={`cursor-pointer inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-md border border-border bg-background hover:bg-muted transition-colors ${importingSla ? 'opacity-50 pointer-events-none' : ''}`}>
                  <Upload className="w-3.5 h-3.5" />
                  {importingSla ? 'Importing...' : 'Import CSV'}
                  <input type="file" accept=".csv,.xlsx" className="hidden" onChange={handleSlaImport} disabled={importingSla} />
                </label>
                <Button onClick={() => setShowAddSla(true)} size="sm" className="gap-1.5">
                  <Plus className="w-4 h-4" /> Add Rule
                </Button>
              </div>
            )}
          </div>
          <Card className="p-5 border-border/50">
            <DataTable columns={slaCols} data={slaRules} searchable={false} />
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="users" className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">Manage platform users, approve registrations, and assign roles</p>
            <Card className="p-5 border-border/50">
              <DataTable columns={userCols} data={users} />
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <Dialog open={showAddSla} onOpenChange={setShowAddSla}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add SLA Rule</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Rule Type</Label>
              <Select value={slaForm.rule_type} onValueChange={v => setSlaForm(f => ({ ...f, rule_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global</SelectItem>
                  <SelectItem value="courier">Courier-specific</SelectItem>
                  <SelectItem value="courier_state">Courier + State</SelectItem>
                  <SelectItem value="courier_postcode_state">Courier + Postcode + State</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(slaForm.rule_type === 'courier' || slaForm.rule_type === 'courier_state' || slaForm.rule_type === 'courier_postcode_state') && (
              <div>
                <Label className="text-xs">Courier</Label>
                <Input value={slaForm.courier} onChange={e => setSlaForm(f => ({ ...f, courier: e.target.value }))} placeholder="e.g. J&T" />
              </div>
            )}
            {(slaForm.rule_type === 'courier_state' || slaForm.rule_type === 'courier_postcode_state') && (
              <div>
                <Label className="text-xs">State</Label>
                <Input value={slaForm.state} onChange={e => setSlaForm(f => ({ ...f, state: e.target.value }))} placeholder="e.g. Sabah" />
              </div>
            )}
            {slaForm.rule_type === 'courier_postcode_state' && (
              <div>
                <Label className="text-xs">Postcode</Label>
                <Input value={slaForm.postcode} onChange={e => setSlaForm(f => ({ ...f, postcode: e.target.value }))} placeholder="e.g. 88000" />
              </div>
            )}
            <div>
              <Label className="text-xs">SLA Target (Days)</Label>
              <Input type="number" value={slaForm.sla_days} onChange={e => setSlaForm(f => ({ ...f, sla_days: parseInt(e.target.value) || 0 }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSla(false)}>Cancel</Button>
            <Button onClick={() => createSlaMutation.mutate(slaForm)} disabled={!slaForm.sla_days}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
