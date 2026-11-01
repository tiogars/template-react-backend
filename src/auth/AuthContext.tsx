import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authClient, type UserAccount } from '@organization_template/react-client';
import { clearAuthToken, readAuthToken, writeAuthToken } from '../authStorage';

type AuthContextValue = {
  user: UserAccount | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (role: string) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [loading, setLoading] = useState(Boolean(readAuthToken()));

  useEffect(() => {
    if (!readAuthToken()) return;
    let active = true;
    authClient.me()
      .then((currentUser) => { if (active) setUser(currentUser); })
      .catch(() => { if (active) clearAuthToken(); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    async login(username, password) {
      const response = await authClient.login(username, password);
      writeAuthToken(response.token);
      setUser(response.user);
    },
    logout() {
      clearAuthToken();
      setUser(null);
    },
    hasRole(role) {
      return user?.roles.some((assignedRole) => assignedRole.code === role) ?? false;
    },
  }), [loading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}