'use client';
import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { SessionProvider } from 'next-auth/react';
import { AppProvider, useApp, NavPage } from '@/components/AppContext';

const Icons = {
  home: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  users: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  alert: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  wallet: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  calendar: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  logout: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  menu: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  refresh: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
};

function Shell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { page, setPage, triggerRefresh } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboard, setDashboard] = useState<any>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (!session) return;
    fetch('/api/dashboard').then(r => r.json()).then(setDashboard).catch(() => {});
  }, [session]);

  if (status === 'loading') return <div className="auth-page"><div className="spinner" style={{width:32,height:32,borderWidth:3}} /></div>;
  if (!session) return null;

  const user = session.user as any;
  const navItems: { key: NavPage; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: 'dashboard', label: '工作台', icon: Icons.home },
    { key: 'customers', label: '客户管理', icon: Icons.users, badge: dashboard?.totalCustomers },
    { key: 'contract', label: '合同预警', icon: Icons.alert, badge: dashboard?.expiringContracts },
    { key: 'balance', label: '余额预警', icon: Icons.wallet, badge: dashboard?.lowBalance },
    { key: 'followups', label: '跟进计划', icon: Icons.calendar, badge: dashboard?.pendingFollowUps },
  ];

  const titles: Record<NavPage, string> = {
    dashboard: '工作台', customers: '客户管理', contract: '合同到期预警',
    balance: '余额不足预警', followups: '跟进计划',
  };

  return (
    <div className="layout">
      <button className="mobile-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>{Icons.menu}</button>
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <h1>客户成功工作台</h1>
          <span className="tag">天润融通</span>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button key={item.key} className={`nav-item ${page === item.key ? 'active' : ''}`}
              onClick={() => { setPage(item.key); setSidebarOpen(false); }}>
              {item.icon}
              <span>{item.label}</span>
              {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user.name?.[0] || 'U'}</div>
            <div>
              <div className="user-name">{user.name}</div>
              <div className="user-role">{user.role === 'admin' ? '管理员' : '客户经理'}</div>
            </div>
          </div>
          <button className="nav-item" onClick={() => signOut({ callbackUrl: '/login' })} style={{color:'var(--danger)'}}>
            {Icons.logout}<span>退出登录</span>
          </button>
        </div>
      </aside>
      <main className="main">
        <div className="topbar">
          <span className="topbar-title">{titles[page]}</span>
          <div className="topbar-actions">
            <button className="btn btn-ghost btn-sm" onClick={triggerRefresh}>{Icons.refresh} 刷新</button>
          </div>
        </div>
        <div className="content">{children}</div>
      </main>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AppProvider>
        <Shell>{children}</Shell>
      </AppProvider>
    </SessionProvider>
  );
}
