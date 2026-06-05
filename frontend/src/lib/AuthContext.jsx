import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api, {
  captureSsoParams,
  clearNexusSsoVerifying,
  getToken,
  isNexusSsoUser,
  isNexusSsoVerifying,
  setToken,
} from '@/api/client';

const SSO_REDIRECT_DELAY_MS = 2000;

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSsoVerifying, setIsSsoVerifying] = useState(() => isNexusSsoVerifying());
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const checkUserAuth = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setAuthChecked(true);
      return;
    }

    try {
      setIsLoadingAuth(true);
      setAuthError(null);
      const currentUser = await api.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
    } catch (error) {
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      clearNexusSsoVerifying();
      setIsSsoVerifying(false);
      if (error.status === 401 || error.status === 403) {
        setAuthError({
          type: 'auth_required',
          message: error.message || 'Authentication required',
        });
      }
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  }, []);

  useEffect(() => {
    if (captureSsoParams()) {
      setIsSsoVerifying(true);
    }
    checkUserAuth();
  }, [checkUserAuth]);

  useEffect(() => {
    if (!isSsoVerifying || !isAuthenticated || !user) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      clearNexusSsoVerifying();
      setIsSsoVerifying(false);
    }, SSO_REDIRECT_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [isSsoVerifying, isAuthenticated, user]);

  const logout = async (shouldRedirect = true) => {
    const nexusLogout = isNexusSsoUser();
    if (nexusLogout) {
      setIsLoggingOut(true);
    }

    try {
      const result = await api.auth.logout();
      if (result?.redirected === true) {
        return;
      }
    } catch {
      setToken(null);
    }

    setIsLoggingOut(false);
    setUser(null);
    setIsAuthenticated(false);

    if (shouldRedirect) {
      window.location.href = '/login';
    }
  };

  const navigateToLogin = () => {
    api.auth.redirectToLogin(window.location.href);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings: false,
      authError,
      appPublicSettings: null,
      authChecked,
      isLoggingOut,
      isSsoVerifying,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState: checkUserAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
