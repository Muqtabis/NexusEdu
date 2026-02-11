import { Home, Sparkles, User, Calendar, Settings, LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';

const navItems = [
  { icon: Home, label: 'Dashboard', path: '/' },
  { icon: Calendar, label: 'Schedule', path: '/schedule' },
  { icon: Sparkles, label: 'AI Agent', path: '/agents' },
  { icon: User, label: 'Profile', path: '/profile' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export const DesktopSidebar = () => {
  const location = useLocation();

  return (
    // Hidden on mobile (hidden), shown on medium screens and up (md:flex)
    <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-white border-r border-slate-200 z-50 pt-24 px-4 pb-6">
      
      <div className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.path} 
              to={item.path} 
              className={clsx(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium",
                isActive 
                  ? "bg-indigo-50 text-indigo-700" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Logout Button at bottom */}
      <button className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors text-sm font-medium">
        <LogOut size={20} />
        Sign Out
      </button>
    </aside>
  );
};