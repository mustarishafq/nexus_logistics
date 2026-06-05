import React, { useMemo, useState } from 'react';
import { TrendingUp, Award, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import GlobalFilters from '@/components/shared/GlobalFilters';
import DataTable from '@/components/shared/DataTable';
import { useShipmentData } from '@/hooks/useShipmentData';
import { computeGroupMetrics } from '@/lib/analyticsUtils';

const COLORS = ['hsl(230,80%,56%)', 'hsl(168,60%,44%)', 'hsl(280,60%,56%)', 'hsl(36,90%,56%)', 'hsl(0,72%,56%)'];

export default function CourierPerformance() {
  const { filtered, filters, setFilters, isLoading, couriers, states, cities, sourceSystems } = useShipmentData();
  const [matrixDim, setMatrixDim] = useState('state');

  const courierData = useMemo(() => computeGroupMetrics(filtered, 'courier'), [filtered]);

  const bestCouriers = useMemo(() => courierData.filter(c => c.total >= 5).sort((a, b) => parseFloat(a.returnRate) - parseFloat(b.returnRate)), [courierData]);
  const worstCouriers = useMemo(() => courierData.filter(c => c.total >= 5).sort((a, b) => parseFloat(b.returnRate) - parseFloat(a.returnRate)), [courierData]);

  // Matrix data: courier performance by state/city
  const matrixData = useMemo(() => {
    const dim = matrixDim === 'state' ? 'state' : 'city';
    const dimValues = [...new Set(filtered.map(s => s[dim]).filter(Boolean))].sort();
    const courierNames = [...new Set(filtered.map(s => s.courier).filter(Boolean))].sort();

    return dimValues.map(dv => {
      const dimShipments = filtered.filter(s => s[dim] === dv);
      const row = { name: dv };
      courierNames.forEach(cn => {
        const cs = dimShipments.filter(s => s.courier === cn);
        const total = cs.length;
        const returned = cs.filter(s => s.current_status === 'returned').length;
        row[`${cn}_total`] = total;
        row[`${cn}_returns`] = returned;
        row[`${cn}_rate`] = total ? ((returned / total) * 100).toFixed(1) : '-';
      });
      return row;
    });
  }, [filtered, matrixDim]);

  const matrixCourierNames = useMemo(() => [...new Set(filtered.map(s => s.courier).filter(Boolean))].sort(), [filtered]);

  const comparisonCols = [
    { key: 'name', label: 'Courier' },
    { key: 'total', label: 'Shipments' },
    { key: 'returnRate', label: 'Return Rate %', render: v => <span className="font-semibold">{v}%</span> },
    { key: 'slaCompliance', label: 'SLA Compliance %', render: v => <span className="font-semibold">{v}%</span> },
    { key: 'avgDeliveryDays', label: 'Avg Delivery Days' },
    { key: 'delivered', label: 'Delivered' },
    { key: 'returned', label: 'Returned' },
  ];

  const matrixCols = [
    { key: 'name', label: matrixDim === 'state' ? 'State' : 'City' },
    ...matrixCourierNames.map(cn => ({
      key: `${cn}_rate`,
      label: cn,
      render: (v) => {
        if (v === '-') return <span className="text-muted-foreground">-</span>;
        const n = parseFloat(v);
        return <span className={n > 10 ? 'text-destructive font-semibold' : n > 5 ? 'text-amber-500 font-medium' : 'text-accent font-medium'}>{v}%</span>;
      }
    })),
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <GlobalFilters filters={filters} setFilters={setFilters} couriers={couriers} states={states} cities={cities} sourceSystems={sourceSystems} />

      {/* Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5 border-border/50">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-accent" /> Best Couriers (Lowest Return Rate)
          </h3>
          <div className="space-y-3">
            {bestCouriers.slice(0, 8).map((c, i) => (
              <div key={c.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-bold">{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.total} shipments · {c.slaCompliance}% SLA</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-accent">{c.returnRate}%</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 border-border/50">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive" /> Worst Couriers (Highest Return Rate)
          </h3>
          <div className="space-y-3">
            {worstCouriers.slice(0, 8).map((c, i) => (
              <div key={c.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-destructive/10 text-destructive flex items-center justify-center text-xs font-bold">{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.total} shipments · {c.slaCompliance}% SLA</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-destructive">{c.returnRate}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Side-by-side comparison */}
      <Card className="p-5 border-border/50">
        <h3 className="text-sm font-semibold mb-4">Courier Comparison</h3>
        <DataTable columns={comparisonCols} data={courierData} />
      </Card>

      {/* Matrix */}
      <Card className="p-5 border-border/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Courier Performance Matrix</h3>
          <Tabs value={matrixDim} onValueChange={setMatrixDim}>
            <TabsList className="h-7">
              <TabsTrigger value="state" className="text-xs px-2 h-5">By State</TabsTrigger>
              <TabsTrigger value="city" className="text-xs px-2 h-5">By City</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <DataTable columns={matrixCols} data={matrixData} pageSize={20} />
      </Card>
    </div>
  );
}