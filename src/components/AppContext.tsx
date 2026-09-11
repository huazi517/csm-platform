'use client';
import { createContext, useContext, useState, ReactNode } from 'react';

export type NavPage = 'dashboard' | 'customers' | 'contract' | 'balance' | 'followups';

interface AppContextType {
  page: NavPage;
  setPage: (p: NavPage) => void;
  refreshKey: number;
  triggerRefresh: () => void;
}

const AppContext = createContext<AppContextType>({
  page: 'dashboard',
  setPage: () => {},
  refreshKey: 0,
  triggerRefresh: () => {},
});

export function AppProvider({ children }: { children: ReactNode }) {
  const [page, setPage] = useState<NavPage>('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);
  return (
    <AppContext.Provider value={{ page, setPage, refreshKey, triggerRefresh: () => setRefreshKey(k => k + 1) }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() { return useContext(AppContext); }
