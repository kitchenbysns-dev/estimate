import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Settings, Building2, Calculator } from 'lucide-react';
import { cn } from '../lib/utils';

export function Layout() {
  const location = useLocation();

  const navigation = [
    { name: 'Projects', href: '/', icon: LayoutDashboard },
    { name: 'Templates', href: '/templates', icon: FileText },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

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
        {/* Top Bar removed for cleaner look, as login is removed */}
        <header style={{ 
          height: '16px', 
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(8px)'
        }}>
        </header>

        <main className="main-content" style={{ flex: 1, overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
