import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { cn } from '@/lib/utils';

const pageTitles = {
  '/': 'Executive Dashboard',
  '/returns': 'Return Rate Analytics',
  '/sla': 'SLA Monitoring',
  '/geographic': 'Geographic Analytics',
  '/couriers': 'Courier Performance',
  '/shipments': 'Shipment Repository',
  '/reports': 'Reports',
  '/integrations': 'Integration Hub',
  '/webhook-logs': 'Webhook Logs',
  '/settings': 'Settings',
};

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const location = useLocation();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const title = pageTitles[location.pathname] || 'Logistics Analytics Hub';

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — hidden on mobile/tablet unless mobileOpen */}
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main content */}
      <div className={cn(
        "transition-all duration-300",
        // On lg+ follow the collapsed state; on mobile always no left margin
        "ml-0 lg:ml-60",
        collapsed && "lg:ml-16"
      )}>
        <TopBar
          title={title}
          darkMode={darkMode}
          onToggleDark={() => setDarkMode(!darkMode)}
          onMenuToggle={() => setMobileOpen(o => !o)}
        />
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}