import React, { useMemo, useState } from 'react';
import { MapPin, TrendingUp, TrendingDown, Award } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import KpiCard from '@/components/shared/KpiCard';
import GlobalFilters from '@/components/shared/GlobalFilters';
import DataTable from '@/components/shared/DataTable';
import { useShipmentData } from '@/hooks/useShipmentData';
import { computeGroupMetrics, groupBy, computeMetrics } from '@/lib/analyticsUtils';

const COLORS = ['hsl(230,80%,56%)', 'hsl(168,60%,44%)', 'hsl(280,60%,56%)', 'hsl(36,90%,56%)', 'hsl(0,72%,56%)'];

export default function GeographicAnalytics() {
  const { filtered, filters, setFilters, isLoading, couriers, states, cities, sourceSystems } = useShipmentData();
  const [mode, setMode] = useState('return_rate');

  const stateData = useMemo(() => computeGroupMetrics(filtered, 'state'), [filtered]);
  const cityData = useMemo(() => computeGroupMetrics(filtered, 'city'), [filtered]);

  const topCities = useMemo(() => cityData.filter(c => c.total >= 3).sort((a, b) => parseFloat(a.returnRate) - parseFloat(b.returnRate)).slice(0, 10), [cityData]);
  const worstCities = useMemo(() => cityData.filter(c => c.total >= 3).sort((a, b) => parseFloat(b.returnRate) - parseFloat(a.returnRate)).slice(0, 10), [cityData]);

  // Best courier per state
  const bestCourierPerState = useMemo(() => {
    return stateData.map(s => {
      const stateShipments = filtered.filter(sh => sh.state === s.name);
      const courierGroups = computeGroupMetrics(stateShipments, 'courier');
      const best = courierGroups.filter(c => c.total >= 3).sort((a, b) => parseFloat(a.returnRate) - parseFloat(b.returnRate))[0];
      return { state: s.name, totalShipments: s.total, returnRate: s.returnRate, bestCourier: best?.name || '-', bestCourierRate: best?.returnRate || '-' };
    });
  }, [filtered, stateData]);

  const leaderboardCols = [
    { key: 'state', label: 'State' },
    { key: 'totalShipments', label: 'Shipments' },
    { key: 'returnRate', label: 'Return Rate %' },
    { key: 'bestCourier', label: 'Best Courier' },
    { key: 'bestCourierRate', label: 'Best Rate %' },
  ];

  const metricKey = mode === 'return_rate' ? 'returnRate' : 'slaCompliance';
  const metricLabel = mode === 'return_rate' ? 'Return Rate %' : 'SLA Compliance %';

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <GlobalFilters filters={filters} setFilters={setFilters} couriers={couriers} states={states} cities={cities} sourceSystems={sourceSystems} />

      <Tabs value={mode} onValueChange={setMode}>
        <TabsList>
          <TabsTrigger value="return_rate">Return Rate</TabsTrigger>
          <TabsTrigger value="sla_compliance">SLA Compliance</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* State Heatmap Bar */}
      <Card className="p-5 border-border/50">
        <h3 className="text-sm font-semibold mb-4">State Performance — {metricLabel}</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stateData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" unit="%" />
            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey={metricKey} fill={mode === 'return_rate' ? COLORS[4] : COLORS[1]} radius={[4, 4, 0, 0]} name={metricLabel} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Top / Worst Cities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5 border-border/50">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent" /> Top Performing Cities
          </h3>
          <div className="space-y-2">
            {topCities.map((c, i) => (
              <div key={c.name} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-5">{i + 1}.</span>
                  <span className="text-sm font-medium">{c.name}</span>
                  <span className="text-xs text-muted-foreground">({c.total})</span>
                </div>
                <span className="text-sm font-semibold text-accent">{c.returnRate}%</span>
              </div>
            ))}
            {topCities.length === 0 && <p className="text-sm text-muted-foreground">No data</p>}
          </div>
        </Card>

        <Card className="p-5 border-border/50">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-destructive" /> Worst Performing Cities
          </h3>
          <div className="space-y-2">
            {worstCities.map((c, i) => (
              <div key={c.name} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-5">{i + 1}.</span>
                  <span className="text-sm font-medium">{c.name}</span>
                  <span className="text-xs text-muted-foreground">({c.total})</span>
                </div>
                <span className="text-sm font-semibold text-destructive">{c.returnRate}%</span>
              </div>
            ))}
            {worstCities.length === 0 && <p className="text-sm text-muted-foreground">No data</p>}
          </div>
        </Card>
      </div>

      {/* Geographic Leaderboard */}
      <Card className="p-5 border-border/50">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Award className="w-4 h-4 text-primary" /> Geographic Leaderboard — Best Courier Per State
        </h3>
        <DataTable columns={leaderboardCols} data={bestCourierPerState} />
      </Card>
    </div>
  );
}