import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';

export default function GlobalFilters({ filters, setFilters, couriers = [], states = [], cities = [], sourceSystems = [] }) {
  const [expanded, setExpanded] = useState(false);

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value === 'all' ? '' : value }));
  };

  const clearFilters = () => {
    setFilters({ dateFrom: '', dateTo: '', courier: '', state: '', city: '', status: '', source_system: '' });
  };

  const hasFilters = Object.values(filters).some(v => v);
  const activeCount = Object.values(filters).filter(v => v).length;

  return (
    <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
      {/* Header / Toggle Row */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <span className="text-sm font-medium text-foreground">Filters</span>
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
              {activeCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasFilters && !expanded && (
            <button
              onClick={e => { e.stopPropagation(); clearFilters(); }}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Expandable Body */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-border/50">
          {/* Date Row */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">From</span>
              <Input
                type="date"
                value={filters.dateFrom || ''}
                onChange={e => updateFilter('dateFrom', e.target.value)}
                className="h-9 text-xs w-full"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">To</span>
              <Input
                type="date"
                value={filters.dateTo || ''}
                onChange={e => updateFilter('dateTo', e.target.value)}
                className="h-9 text-xs w-full"
              />
            </div>
          </div>

          {/* Selects Grid */}
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            <Select value={filters.courier || 'all'} onValueChange={v => updateFilter('courier', v)}>
              <SelectTrigger className="h-9 text-xs w-full"><SelectValue placeholder="All Couriers" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Couriers</SelectItem>
                {couriers.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filters.state || 'all'} onValueChange={v => updateFilter('state', v)}>
              <SelectTrigger className="h-9 text-xs w-full"><SelectValue placeholder="All States" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {states.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filters.city || 'all'} onValueChange={v => updateFilter('city', v)}>
              <SelectTrigger className="h-9 text-xs w-full"><SelectValue placeholder="All Cities" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filters.status || 'all'} onValueChange={v => updateFilter('status', v)}>
              <SelectTrigger className="h-9 text-xs w-full"><SelectValue placeholder="All Statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="out_for_delivery">Out For Delivery</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="failed_delivery">Failed Delivery</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
              </SelectContent>
            </Select>

            {sourceSystems.length > 0 && (
              <Select value={filters.source_system || 'all'} onValueChange={v => updateFilter('source_system', v)}>
                <SelectTrigger className="h-9 text-xs w-full"><SelectValue placeholder="All Sources" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  {sourceSystems.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Clear Button */}
          {hasFilters && (
            <div className="mt-3 flex justify-end">
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 gap-1 text-xs">
                <X className="w-3 h-3" /> Clear All Filters
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}