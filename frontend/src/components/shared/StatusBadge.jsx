import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusStyles = {
  pending: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
  shipped: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  in_transit: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
  out_for_delivery: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  delivered: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  failed_delivery: 'bg-red-500/10 text-red-500 border-red-500/20',
  returned: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  met: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  breached: 'bg-red-500/10 text-red-500 border-red-500/20',
  active: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  inactive: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
  error: 'bg-red-500/10 text-red-500 border-red-500/20',
  received: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  processing: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  completed: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  failed: 'bg-red-500/10 text-red-500 border-red-500/20',
};

export default function StatusBadge({ status, className }) {
  const label = (status || '').replace(/_/g, ' ');
  return (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center h-5 px-2 text-[10px] font-medium capitalize border leading-none',
        statusStyles[status] || statusStyles.pending,
        className,
      )}
    >
      {label}
    </Badge>
  );
}