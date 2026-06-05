import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Download, BarChart3, Clock, Truck } from 'lucide-react';
import DataTable from '@/components/shared/DataTable';
import { useShipmentData } from '@/hooks/useShipmentData';
import { computeMetrics, computeGroupMetrics, computeTrends } from '@/lib/analyticsUtils';
import { formatDate } from '@/lib/dateUtils';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['hsl(230,80%,56%)', 'hsl(168,60%,44%)', 'hsl(280,60%,56%)', 'hsl(36,90%,56%)', 'hsl(0,72%,56%)'];

export default function Reports() {
  const { filtered, filters, setFilters, isLoading, couriers, states, cities } = useShipmentData();
  const [report, setReport] = useState('return');

  const metrics = useMemo(() => computeMetrics(filtered), [filtered]);
  const courierData = useMemo(() => computeGroupMetrics(filtered, 'courier'), [filtered]);
  const stateData = useMemo(() => computeGroupMetrics(filtered, 'state'), [filtered]);
  const cityData = useMemo(() => computeGroupMetrics(filtered, 'city'), [filtered]);
  const trends = useMemo(() => computeTrends(filtered, 'ship_date', 'monthly'), [filtered]);

  const exportFullCSV = () => {
    const headers = ['Order #', 'Tracking #', 'Courier', 'Status', 'State', 'City', 'Ship Date', 'Delivery Date', 'Delivery Days', 'SLA Result', 'Source'];
    const rows = filtered.map(s => [s.order_number, s.tracking_number, s.courier, s.current_status, s.state, s.city, formatDate(s.ship_date, ''), formatDate(s.delivery_date, ''), s.delivery_days, s.sla_result, s.source_system]);
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c || ''}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logistics-report-${report}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const reports = [
    { id: 'return', label: 'Return Performance', icon: BarChart3, desc: 'Return trends, courier return rates, state & city return rates' },
    { id: 'sla', label: 'SLA Performance', icon: Clock, desc: 'SLA compliance trends, courier & state SLA rankings' },
    { id: 'courier', label: 'Courier Comparison', icon: Truck, desc: 'Side-by-side courier comparison with all metrics' },
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Report Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {reports.map(r => (
          <Card
            key={r.id}
            className={`p-5 cursor-pointer transition-all border-2 ${report === r.id ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-primary/30'}`}
            onClick={() => setReport(r.id)}
          >
            <div className="flex items-center gap-3 mb-2">
              <r.icon className={`w-5 h-5 ${report === r.id ? 'text-primary' : 'text-muted-foreground'}`} />
              <h3 className="text-sm font-semibold">{r.label}</h3>
            </div>
            <p className="text-xs text-muted-foreground">{r.desc}</p>
          </Card>
        ))}
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <Button onClick={exportFullCSV} className="gap-1.5">
          <Download className="w-4 h-4" /> Export Report CSV
        </Button>
      </div>

      {/* Report Content */}
      {report === 'return' && (
        <div className="space-y-4">
          <Card className="p-5 border-border/50">
            <h3 className="text-sm font-semibold mb-4">Monthly Return Trends</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" unit="%" />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="returnRate" stroke={COLORS[4]} strokeWidth={2} name="Return Rate %" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
          <Card className="p-5 border-border/50">
            <h3 className="text-sm font-semibold mb-4">Return Rate by Courier</h3>
            <DataTable columns={[
              { key: 'name', label: 'Courier' }, { key: 'total', label: 'Shipments' }, { key: 'returned', label: 'Returns' },
              { key: 'returnRate', label: 'Return Rate %', render: v => `${v}%` }
            ]} data={courierData} />
          </Card>
        </div>
      )}

      {report === 'sla' && (
        <div className="space-y-4">
          <Card className="p-5 border-border/50">
            <h3 className="text-sm font-semibold mb-4">Monthly SLA Trends</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" unit="%" domain={[0, 100]} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="slaCompliance" stroke={COLORS[1]} strokeWidth={2} name="SLA Compliance %" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
          <Card className="p-5 border-border/50">
            <h3 className="text-sm font-semibold mb-4">SLA by Courier</h3>
            <DataTable columns={[
              { key: 'name', label: 'Courier' }, { key: 'total', label: 'Shipments' }, { key: 'slaBreached', label: 'Breached' },
              { key: 'slaCompliance', label: 'Compliance %', render: v => `${v}%` }, { key: 'avgDeliveryDays', label: 'Avg Days' }
            ]} data={courierData} />
          </Card>
        </div>
      )}

      {report === 'courier' && (
        <div className="space-y-4">
          <Card className="p-5 border-border/50">
            <h3 className="text-sm font-semibold mb-4">Courier Comparison</h3>
            <DataTable columns={[
              { key: 'name', label: 'Courier' }, { key: 'total', label: 'Shipments' },
              { key: 'returnRate', label: 'Return Rate %', render: v => `${v}%` },
              { key: 'slaCompliance', label: 'SLA Compliance %', render: v => `${v}%` },
              { key: 'avgDeliveryDays', label: 'Avg Days' }, { key: 'delivered', label: 'Delivered' }, { key: 'returned', label: 'Returned' },
            ]} data={courierData} />
          </Card>
          <Card className="p-5 border-border/50">
            <h3 className="text-sm font-semibold mb-4">Courier Comparison Chart</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={courierData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="returnRate" fill={COLORS[4]} name="Return Rate %" radius={[4, 4, 0, 0]} />
                <Bar dataKey="slaCompliance" fill={COLORS[1]} name="SLA Compliance %" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}
    </div>
  );
}