import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api, { applySsoLogin } from '@/api/client';
import SsoVerifiedScreen from '@/components/SsoVerifiedScreen';

export default function SsoNexus() {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(null);
  const [isExchanging, setIsExchanging] = useState(true);

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setError('Missing SSO token.');
      setIsExchanging(false);
      return;
    }

    const returnTo = searchParams.get('return_to');

    api.auth
      .exchangeNexusSso(token, returnTo)
      .then((result) => {
        applySsoLogin(result);
        window.location.replace('/');
      })
      .catch((err) => {
        setError(err.message || 'SSO sign-in failed.');
        setIsExchanging(false);
      });
  }, [searchParams]);

  if (isExchanging) {
    return <SsoVerifiedScreen mode="login" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-6">
      <div className="max-w-sm w-full bg-card border border-border rounded-xl shadow-lg p-8 text-center space-y-4">
        <h1 className="text-xl font-bold text-foreground">Sign-in failed</h1>
        <p className="text-sm text-muted-foreground">{error}</p>
        <a
          href="https://emzinexus.com/applications"
          className="inline-block text-sm font-medium text-primary hover:underline"
        >
          Return to EMZI Nexus
        </a>
      </div>
    </div>
  );
}
