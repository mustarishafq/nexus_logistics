import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function SsoVerifiedScreen({ user, mode = 'login' }) {
  const isLogout = mode === 'logout';
  const displayName = user?.full_name || user?.name;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-6">
      <div className="max-w-sm w-full bg-card border border-border rounded-xl shadow-lg p-8 text-center space-y-5">
        <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center mx-auto">
          <ShieldCheck className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
        </div>

        <div>
          <h1 className="text-xl font-bold text-foreground">
            {isLogout ? 'Signing Out' : 'SSO Verified'}
          </h1>
          {!isLogout && displayName && (
            <p className="text-muted-foreground text-sm mt-2">
              Welcome,{' '}
              <span className="font-semibold text-foreground">{displayName}</span>
            </p>
          )}
          {!isLogout && user?.email && (
            <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          {isLogout ? 'Returning to EMZI Nexus…' : 'Redirecting you to the dashboard…'}
        </p>

        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
      </div>
    </div>
  );
}
