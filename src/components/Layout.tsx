import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Settings, Building2, Calculator, LogIn, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../lib/AuthContext';
import { signInWithGoogle, logOut } from '../lib/firebase';

export function Layout() {
  const location = useLocation();
  const { user, isAdmin } = useAuth();

  const navigation = [
    { name: 'Projects', href: '/', icon: LayoutDashboard },
    { name: 'Templates', href: '/templates', icon: FileText },
  ];

  if (isAdmin) {
    navigation.push({ name: 'Settings', href: '/settings', icon: Settings });
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', width: '100%' }}>
      {/* Sidebar */}
      <aside>
        <div className="logo">
          <Building2 className="h-6 w-6 mr-2" />
          ESTIMATIQ.
        </div>
        {navigation.map((item) => {
          const isActive = location.pathname === item.href || 
                           (item.href !== '/' && location.pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn('nav-item', isActive && 'active')}
            >
              <item.icon className="h-5 w-5" aria-hidden="true" />
              {item.name}
            </Link>
          );
        })}
      </aside>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top Bar for Admin Login */}
        <header style={{ 
          height: '64px', 
          borderBottom: '1px solid var(--border)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'flex-end', 
          padding: '0 32px',
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(8px)'
        }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-main)', fontWeight: 500 }}>
                {user.email} {isAdmin && <span className="theme-badge theme-badge-info" style={{ marginLeft: '8px' }}>Admin</span>}
              </span>
              <button className="btn btn-outline" onClick={logOut} style={{ padding: '6px 12px' }}>
                <LogOut className="h-4 w-4 mr-2" /> Sign Out
              </button>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={signInWithGoogle} style={{ padding: '6px 12px' }}>
              <LogIn className="h-4 w-4 mr-2" /> Admin / User Login
            </button>
          )}
        </header>

        <main className="main-content" style={{ flex: 1, overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
