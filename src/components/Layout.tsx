import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Settings, Building2, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from './AuthProvider';

export function Layout() {
  const location = useLocation();
  const { user, signInWithGoogle, signOut, loading } = useAuth();

  const navigation = [
    { name: 'Projects', href: '/', icon: LayoutDashboard },
    { name: 'Templates', href: '/templates', icon: FileText },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  if (loading) {
    return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  if (!user) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', flexDirection: 'column', justifyContent: 'center', backgroundColor: 'var(--bg-secondary)', padding: '24px' }}>
        <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: '400px', width: '100%' }}>
          <Building2 className="h-12 w-12 mx-auto" style={{ color: 'var(--primary)', marginBottom: '16px' }} />
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Welcome to ESTIMATIQ</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Please sign in to continue</p>
          <button className="btn btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px', padding: '12px' }} onClick={signInWithGoogle}>
            <LogIn className="h-5 w-5" />
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', width: '100%' }}>
      {/* Sidebar */}
      <aside style={{ display: 'flex', flexDirection: 'column' }}>
        <div>
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
        </div>
        
        <div style={{ marginTop: 'auto', padding: '24px 16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            {user.photoURL ? (
              <img src={user.photoURL} alt="Profile" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
            ) : (
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserIcon className="h-4 w-4 text-muted" />
              </div>
            )}
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '14px', fontWeight: 500, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user.displayName || 'User'}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user.email}</div>
            </div>
          </div>
          <button 
            className="btn btn-outline" 
            style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '8px' }} 
            onClick={signOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <main className="main-content" style={{ flex: 1, overflowY: 'auto' }}>
          <Outlet />
        </main>
        
        <footer style={{ 
          padding: '12px 24px', 
          textAlign: 'center', 
          fontSize: '12px', 
          color: 'var(--text-muted)',
          borderTop: '1px solid var(--border)',
          backgroundColor: 'rgba(255, 255, 255, 0.5)'
        }}>
          Created by and All Rights Reserved in Shape and Structure Builders Pvt. Ltd.
        </footer>
      </div>
    </div>
  );
}
