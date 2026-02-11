import { Home, Sparkles, User, Calendar } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Calendar, label: 'Schedule', path: '/schedule' },
  { icon: Sparkles, label: 'AI Agent', path: '/agents' }, 
  { icon: User, label: 'Profile', path: '/profile' },
];

export const MobileNav = () => {
  const location = useLocation();

  return (
    <div className="md:hidden fixed bottom-6 left-4 right-4 z-50">
      <nav className="flex justify-between items-center px-6 py-4 rounded-[2rem] bg-nexus-dark/90 backdrop-blur-xl border border-glass-border shadow-2xl shadow-black/50">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} className="relative group">
              <div className={clsx(
                "p-3 rounded-full transition-all duration-300",
                isActive 
                  ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/40 -translate-y-2" 
                  : "text-slate-400 group-hover:text-white"
              )}>
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};