import React, { useMemo, useState } from 'react';
import { Package, CheckCircle, RotateCcw, Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import KpiCard from '@/components/shared/KpiCard';
import GlobalFilters from '@/components/shared/GlobalFilters';
import { useShipmentData } from '@/hooks/useShipmentData';
import { computeMetrics, computeGroupMetrics, computeTrends } from '@/lib/analyticsUtils';

const CHART_COLORS = ['hsl(230,80%,56%)', 'hsl(168,60%,44%)', 'hsl(280,60%,56%)', 'hsl(36,90%,56%)', 'hsl(0,72%,56%)'];

export default function ExecutiveDashboard() {
  const { filtered, filters, setFilters, isLoading, couriers, states, cities, sourceSystems } = useShipmentData();
  const [trendPeriod, setTrendPeriod] = useState('daily');

  const metrics = useMemo(() => computeMetrics(filtered), [filtered]);
  const courierMetrics = useMemo(() => computeGroupMetrics(filtered, 'courier'), [filtered]);
  const stateMetrics = useMemo(() => computeGroupMetrics(filtered, 'state'), [filtered]);
  const trends = useMemo(() => computeTrends(filtered, 'ship_date', trendPeriod), [filtered, trendPeriod]);

  const topProblemStates = useMemo(() =>
    stateMetrics.filter(s => s.total >= 5).sort((a, b) => parseFloat(b.returnRate) - parseFloat(a.returnRate)).slice(0, 5)
  , [stateMetrics]);

  const bestCouriers = useMemo(() =>
    courierMetrics.filter(c => c.total >= 5).sort((a, b) => parseFloat(a.returnRate) - parseFloat(b.returnRate)).slice(0, 5)
  , [courierMetrics]);

  const courierReturnChartData = useMemo(() =>
    courierMetrics
      .filter(c => c.total >= 5)
      .sort((a, b) => parseFloat(b.returnRate) - parseFloat(a.returnRate))
      .slice(0, 6)
      .map(c => ({
        ...c,
        returnRate: parseFloat(c.returnRate),
        shortName: c.name.length > 18 ? `${c.name.slice(0, 18)}…` : c.name,
      }))
  , [courierMetrics]);

  const statusDist = useMemo(() => {
    const counts = {};
    filtered.forEach(s => { counts[s.current_status] = (counts[s.current_status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }));
  }, [filtered]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <GlobalFilters filters={filters} setFilters={setFilters} couriers={couriers} states={states} cities={cities} sourceSystems={sourceSystems} />

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard title="Total Shipments" value={metrics.total.toLocaleString()} icon={Package} accentColor="primary" />
        <KpiCard title="Delivered" value={metrics.delivered.toLocaleString()} icon={CheckCircle} accentColor="accent" />
        <KpiCard title="Returned" value={metrics.returned.toLocaleString()} icon={RotateCcw} accentColor="destructive" />
        <KpiCard title="Return Rate" value={`${metrics.returnRate}%`} icon={TrendingUp} accentColor="destructive" />
        <KpiCard title="SLA Compliance" value={`${metrics.slaCompliance}%`} icon={Clock} accentColor="chart3" />
        <KpiCard title="Avg Delivery" value={`${metrics.avgDeliveryDays}d`} icon={Package} accentColor="chart4" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Trend Chart */}
        <Card className="col-span-2 p-5 border-border/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Shipment Trends</h3>
            <Tabs value={trendPeriod} onValueChange={setTrendPeriod}>
              <TabsList className="h-7">
                <TabsTrigger value="daily" className="text-xs px-2 h-5">Daily</TabsTrigger>
                <TabsTrigger value="weekly" className="text-xs px-2 h-5">Weekly</TabsTrigger>
                <TabsTrigger value="monthly" className="text-xs px-2 h-5">Monthly</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="total" stroke={CHART_COLORS[0]} strokeWidth={2} dot={false} name="Total" />
              <Line type="monotone" dataKey="delivered" stroke={CHART_COLORS[1]} strokeWidth={2} dot={false} name="Delivered" />
              <Line type="monotone" dataKey="returned" stroke={CHART_COLORS[4]} strokeWidth={2} dot={false} name="Returned" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Status Distribution */}
        <Card className="p-5 border-border/50">
          <h3 className="text-sm font-semibold mb-4">Status Distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={statusDist} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={2}>
                {statusDist.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-2">
            {statusDist.map((s, i) => (
              <div key={s.name} className="flex items-center gap-1.5 text-xs">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                <span className="text-muted-foreground capitalize">{s.name}: {s.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Courier Performance */}
        <Card className="p-5 border-border/50">
          <h3 className="text-sm font-semibold mb-4">Best Couriers <span className="text-muted-foreground font-normal">(lowest return rate)</span></h3>
          <div className="space-y-3">
            {bestCouriers.map((c, i) => (
              <div key={c.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.total} shipments</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-accent">{c.returnRate}%</span>
              </div>
            ))}
            {bestCouriers.length === 0 && <p className="text-sm text-muted-foreground">No data</p>}
          </div>
        </Card>

        {/* Problem States */}
        <Card className="p-5 border-border/50">
          <h3 className="text-sm font-semibold mb-4">Top Problem States <span className="text-muted-foreground font-normal">(highest return rate)</span></h3>
          <div className="space-y-3">
            {topProblemStates.map((s, i) => (
              <div key={s.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-destructive/10 text-destructive flex items-center justify-center text-xs font-bold">{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.returned}/{s.total} returned</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-destructive">{s.returnRate}%</span>
              </div>
            ))}
            {topProblemStates.length === 0 && <p className="text-sm text-muted-foreground">No data</p>}
          </div>
        </Card>

        {/* Courier Return Rate Bar */}
        <Card className="p-5 border-border/50">
          <h3 className="text-sm font-semibold mb-4">Courier Return Rates</h3>
          {courierReturnChartData.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(200, courierReturnChartData.length * 40)}>
              <BarChart
                data={courierReturnChartData}
                layout="vertical"
                margin={{ top: 4, right: 12, left: 0, bottom: 4 }}
                barSize={18}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" unit="%" domain={[0, 'auto']} />
                <YAxis
                  type="category"
                  dataKey="shortName"
                  width={96}
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  stroke="hsl(var(--muted-foreground))"
                />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                  formatter={(value) => [`${value}%`, 'Return Rate']}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.name}
                />
                <Bar dataKey="returnRate" fill={CHART_COLORS[4]} radius={[0, 4, 4, 0]} name="Return Rate %" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
}