import React, { useMemo, useState } from 'react';
import { Package, RotateCcw, CheckCircle, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import KpiCard from '@/components/shared/KpiCard';
import GlobalFilters from '@/components/shared/GlobalFilters';
import DataTable from '@/components/shared/DataTable';
import { useShipmentData } from '@/hooks/useShipmentData';
import { computeMetrics, computeGroupMetrics, computeTrends } from '@/lib/analyticsUtils';

const COLORS = ['hsl(230,80%,56%)', 'hsl(168,60%,44%)', 'hsl(280,60%,56%)', 'hsl(36,90%,56%)', 'hsl(0,72%,56%)'];

const courierCols = [
  { key: 'name', label: 'Courier' },
  { key: 'total', label: 'Shipments' },
  { key: 'returned', label: 'Returns' },
  { key: 'returnRate', label: 'Return Rate %', render: v => <span className="font-semibold">{v}%</span> },
];
const stateCols = [
  { key: 'name', label: 'State' },
  { key: 'total', label: 'Shipments' },
  { key: 'returned', label: 'Returns' },
  { key: 'returnRate', label: 'Return Rate %', render: v => <span className="font-semibold">{v}%</span> },
];
const cityCols = [
  { key: 'name', label: 'City' },
  { key: 'total', label: 'Shipments' },
  { key: 'returned', label: 'Returns' },
  { key: 'returnRate', label: 'Return Rate %', render: v => <span className="font-semibold">{v}%</span> },
];

export default function ReturnAnalytics() {
  const { filtered, filters, setFilters, isLoading, couriers, states, cities, sourceSystems } = useShipmentData();
  const [trendPeriod, setTrendPeriod] = useState('daily');
  const [view, setView] = useState('courier');

  const metrics = useMemo(() => computeMetrics(filtered), [filtered]);
  const courierData = useMemo(() => computeGroupMetrics(filtered, 'courier'), [filtered]);
  const stateData = useMemo(() => computeGroupMetrics(filtered, 'state'), [filtered]);
  const cityData = useMemo(() => computeGroupMetrics(filtered, 'city'), [filtered]);
  const trends = useMemo(() => computeTrends(filtered, 'ship_date', trendPeriod), [filtered, trendPeriod]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <GlobalFilters filters={filters} setFilters={setFilters} couriers={couriers} states={states} cities={cities} sourceSystems={sourceSystems} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Total Shipments" value={metrics.total.toLocaleString()} icon={Package} />
        <KpiCard title="Delivered" value={metrics.delivered.toLocaleString()} icon={CheckCircle} accentColor="accent" />
        <KpiCard title="Returned" value={metrics.returned.toLocaleString()} icon={RotateCcw} accentColor="destructive" />
        <KpiCard title="Return Rate" value={`${metrics.returnRate}%`} icon={TrendingUp} accentColor="destructive" />
      </div>

      {/* Trend Chart */}
      <Card className="p-5 border-border/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Return Rate Trends</h3>
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
            <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" unit="%" />
            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
            <Line type="monotone" dataKey="returnRate" stroke={COLORS[4]} strokeWidth={2} dot={false} name="Return Rate %" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Breakdown Tables */}
      <div>
        <Tabs value={view} onValueChange={setView} className="mb-4">
          <TabsList>
            <TabsTrigger value="courier">By Courier</TabsTrigger>
            <TabsTrigger value="state">By State</TabsTrigger>
            <TabsTrigger value="city">By City</TabsTrigger>
          </TabsList>
        </Tabs>

        <Card className="p-5 border-border/50">
          {view === 'courier' && <DataTable columns={courierCols} data={courierData} />}
          {view === 'state' && <DataTable columns={stateCols} data={stateData} />}
          {view === 'city' && <DataTable columns={cityCols} data={cityData} />}
        </Card>
      </div>

      {/* Courier Bar Chart */}
      <Card className="p-5 border-border/50">
        <h3 className="text-sm font-semibold mb-4">Courier Return Rate Comparison</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={courierData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" unit="%" />
            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="returnRate" fill={COLORS[4]} radius={[4, 4, 0, 0]} name="Return Rate %" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}