import React, { useEffect, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
import SsoVerifiedScreen from '@/components/SsoVerifiedScreen';

export default function Logout() {
  const { logout, user } = useAuth();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) {
      return;
    }
    started.current = true;
    logout();
  }, [logout]);

  return <SsoVerifiedScreen user={user} mode="logout" />;
}
