import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function KpiCard({ title, value, subtitle, icon: Icon, trend, trendLabel, className, accentColor = 'primary' }) {
  const trendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const TrendIcon = trendIcon;

  const colorMap = {
    primary: 'bg-primary/10 text-primary',
    accent: 'bg-accent/10 text-accent',
    destructive: 'bg-destructive/10 text-destructive',
    chart3: 'bg-purple-500/10 text-purple-500',
    chart4: 'bg-amber-500/10 text-amber-500',
  };

  return (
    <Card className={cn("p-5 border border-border/50 hover:border-border transition-colors", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", colorMap[accentColor] || colorMap.primary)}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      {trendLabel && (
        <div className="mt-3 flex items-center gap-1.5">
          <TrendIcon className={cn("w-3 h-3", trend > 0 ? "text-accent" : trend < 0 ? "text-destructive" : "text-muted-foreground")} />
          <span className={cn("text-xs font-medium", trend > 0 ? "text-accent" : trend < 0 ? "text-destructive" : "text-muted-foreground")}>
            {trendLabel}
          </span>
        </div>
      )}
    </Card>
  );
}