import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  RotateCcw,
  Clock,
  MapPin,
  FileText,
  Plug,
  Settings,
  ChevronLeft,
  ChevronRight,
  Activity,
  TrendingUp,
  X,
} from 'lucide-react';

const navSections = [
  {
    label: 'Overview',
    items: [
      { label: 'Executive Dashboard', path: '/', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { label: 'Return Analytics', path: '/returns', icon: RotateCcw },
      { label: 'SLA Monitoring', path: '/sla', icon: Clock },
      { label: 'Geographic Analytics', path: '/geographic', icon: MapPin },
      { label: 'Courier Performance', path: '/couriers', icon: TrendingUp },
    ],
  },
  {
    label: 'Data',
    items: [
      { label: 'Shipments', path: '/shipments', icon: Package },
      { label: 'Reports', path: '/reports', icon: FileText },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Integrations', path: '/integrations', icon: Plug },
      { label: 'Webhook Logs', path: '/webhook-logs', icon: Activity },
      { label: 'Settings', path: '/settings', icon: Settings },
    ],
  },
];

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
  const location = useLocation();
  const isIconOnly = collapsed && !mobileOpen;

  return (
    <aside className={cn(
      // Base styles
      "fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300",
      // Desktop: always visible, width controlled by collapsed
      "lg:translate-x-0",
      collapsed ? "lg:w-16" : "lg:w-60",
      // Mobile/tablet: slide in/out, always full width (w-60)
      "w-60",
      mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
    )}>
      {/* Logo + mobile close */}
      <div className={cn(
        "h-16 flex items-center border-b border-sidebar-border flex-shrink-0",
        isIconOnly ? "justify-center px-0" : "justify-between px-4"
      )}>
        <div className={cn("flex items-center min-w-0", isIconOnly ? "justify-center" : "gap-3")}>
          <img
            src="/logo.png"
            alt="EMZI Nexus Logistics"
            className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
          />
          {!isIconOnly && (
            <div className="truncate">
              <h1 className="text-sm font-semibold text-sidebar-foreground truncate">EMZI Nexus Logistics</h1>
            </div>
          )}
        </div>
        {/* Close button — only on mobile */}
        {!isIconOnly && (
          <button
            onClick={onMobileClose}
            className="lg:hidden text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className={cn("flex-1 overflow-y-auto py-4 space-y-6", isIconOnly ? "px-1" : "px-2")}>
        {navSections.map((section) => (
          <div key={section.label}>
            {!isIconOnly && (
              <p className="px-3 mb-2 text-[10px] font-medium text-sidebar-foreground/40 uppercase tracking-wider">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'flex items-center rounded-lg text-sm transition-all duration-150',
                      isIconOnly ? 'justify-center px-0 py-2.5 w-full' : 'gap-3 px-3 py-2',
                      isActive
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                        : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                    )}
                    title={isIconOnly ? item.label : undefined}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    {!isIconOnly && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Desktop collapse toggle — hidden on mobile */}
      <button
        onClick={onToggle}
        className="hidden lg:flex h-12 w-full items-center justify-center border-t border-sidebar-border text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}