import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Briefcase, FileText, BarChart2,
  Mic, Type, LogOut, Sparkles
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/api';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/dashboard', label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/jobs',      label: 'Job posts',   icon: Briefcase },
  { to: '/resume',    label: 'My resume',   icon: FileText },
  { to: '/analyze',   label: 'Analyze',     icon: BarChart2 },
  { to: '/interview', label: 'Mock interview', icon: Mic },
  { to: '/paraphraser', label: 'Paraphraser', icon: Type },
];

export const AppLayout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await authApi.logout().catch(() => {});
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-gray-100 flex flex-col shrink-0">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">JobAI</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="px-3 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-semibold">
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
