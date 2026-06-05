import React, { useMemo, useState } from 'react';
import { Clock, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import KpiCard from '@/components/shared/KpiCard';
import GlobalFilters from '@/components/shared/GlobalFilters';
import DataTable from '@/components/shared/DataTable';
import { useShipmentData } from '@/hooks/useShipmentData';
import { computeMetrics, computeGroupMetrics, computeTrends } from '@/lib/analyticsUtils';

const COLORS = ['hsl(230,80%,56%)', 'hsl(168,60%,44%)', 'hsl(280,60%,56%)', 'hsl(36,90%,56%)', 'hsl(0,72%,56%)'];

export default function SlaMonitoring() {
  const { filtered, filters, setFilters, isLoading, couriers, states, cities, sourceSystems } = useShipmentData();
  const [trendPeriod, setTrendPeriod] = useState('daily');
  const [view, setView] = useState('courier');

  const metrics = useMemo(() => computeMetrics(filtered), [filtered]);
  const courierData = useMemo(() => computeGroupMetrics(filtered, 'courier'), [filtered]);
  const stateData = useMemo(() => computeGroupMetrics(filtered, 'state'), [filtered]);
  const cityData = useMemo(() => computeGroupMetrics(filtered, 'city'), [filtered]);
  const trends = useMemo(() => computeTrends(filtered, 'ship_date', trendPeriod), [filtered, trendPeriod]);

  const slaCols = [
    { key: 'name', label: view === 'courier' ? 'Courier' : view === 'state' ? 'State' : 'City' },
    { key: 'total', label: 'Shipments' },
    { key: 'slaBreached', label: 'Breached' },
    { key: 'slaCompliance', label: 'Compliance %', render: v => <span className="font-semibold">{v}%</span> },
    { key: 'avgDeliveryDays', label: 'Avg Days' },
  ];

  const deliveryTimeCols = [
    { key: 'name', label: view === 'courier' ? 'Courier' : view === 'state' ? 'State' : 'City' },
    { key: 'avgDeliveryDays', label: 'Avg Days' },
    { key: 'medianDeliveryDays', label: 'Median Days' },
    { key: 'p90DeliveryDays', label: 'P90 Days' },
    { key: 'total', label: 'Shipments' },
  ];

  const currentData = view === 'courier' ? courierData : view === 'state' ? stateData : cityData;

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <GlobalFilters filters={filters} setFilters={setFilters} couriers={couriers} states={states} cities={cities} sourceSystems={sourceSystems} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Total Evaluated" value={metrics.slaEvaluated.toLocaleString()} icon={Clock} />
        <KpiCard title="SLA Met" value={metrics.slaMet.toLocaleString()} icon={CheckCircle} accentColor="accent" />
        <KpiCard title="SLA Breached" value={metrics.slaBreached.toLocaleString()} icon={AlertTriangle} accentColor="destructive" />
        <KpiCard title="Compliance" value={`${metrics.slaCompliance}%`} icon={TrendingUp} accentColor="chart3" />
      </div>

      {/* SLA Trend */}
      <Card className="p-5 border-border/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">SLA Compliance Trends</h3>
          <Tabs value={trendPeriod} onValueChange={setTrendPeriod}>
            <TabsList className="h-7">
              <TabsTrigger value="daily" className="text-xs px-2 h-5">Daily</TabsTrigger>
              <TabsTrigger value="weekly" className="text-xs px-2 h-5">Weekly</TabsTrigger>
              <TabsTrigger value="monthly" className="text-xs px-2 h-5">Monthly</TabsTrigger>
              <TabsTrigger value="yearly" className="text-xs px-2 h-5">Yearly</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={trends}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" unit="%" domain={[0, 100]} />
            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
            <Line type="monotone" dataKey="slaCompliance" stroke={COLORS[1]} strokeWidth={2} dot={false} name="Compliance %" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Breakdown */}
      <Tabs value={view} onValueChange={setView} className="mb-0">
        <TabsList>
          <TabsTrigger value="courier">By Courier</TabsTrigger>
          <TabsTrigger value="state">By State</TabsTrigger>
          <TabsTrigger value="city">By City</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5 border-border/50">
          <h3 className="text-sm font-semibold mb-4">SLA Performance</h3>
          <DataTable columns={slaCols} data={currentData} pageSize={10} />
        </Card>
        <Card className="p-5 border-border/50">
          <h3 className="text-sm font-semibold mb-4">Delivery Time Analytics</h3>
          <DataTable columns={deliveryTimeCols} data={currentData} pageSize={10} />
        </Card>
      </div>

      {/* Bar Chart */}
      <Card className="p-5 border-border/50">
        <h3 className="text-sm font-semibold mb-4">SLA Compliance by {view === 'courier' ? 'Courier' : view === 'state' ? 'State' : 'City'}</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={currentData.slice(0, 15)}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" unit="%" domain={[0, 100]} />
            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="slaCompliance" fill={COLORS[1]} radius={[4, 4, 0, 0]} name="Compliance %" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}