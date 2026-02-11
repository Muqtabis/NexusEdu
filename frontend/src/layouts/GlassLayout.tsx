import React from 'react';
import { Bell } from 'lucide-react';
import { MobileNav } from '../components/layout/MobileNav';
import { DesktopSidebar } from '../components/layout/DesktopSidebar'; // Import the new sidebar

interface GlassLayoutProps {
  children: React.ReactNode;
}

const GlassLayout: React.FC<GlassLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-nexus-bg text-nexus-text font-sans pb-safe-bottom overflow-x-hidden">
      
      {/* 1. Top Header (Fixed) */}
      <nav className="fixed top-0 left-0 right-0 z-40 px-6 h-16 flex justify-between items-center bg-white/80 backdrop-blur-md border-b border-slate-200">
        {/* Logo - added padding for desktop sidebar alignment */}
        <div className="flex items-center gap-2 md:pl-4"> 
          <span className="text-xl font-bold tracking-tight text-nexus-primary">NexusEdu</span>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
            <Bell size={20} />
            <span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
          </button>
          <div className="h-8 w-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-xs font-bold text-indigo-700 cursor-pointer">
            M
          </div>
        </div>
      </nav>

      {/* 2. Navigation Systems */}
      <MobileNav />       {/* Visible only on Mobile */}
      <DesktopSidebar />  {/* Visible only on Desktop */}

      {/* 3. Main Content Area */}
      {/* Added 'md:pl-72' to push content right when sidebar is visible */}
      <main className="relative z-10 pt-24 px-5 pb-32 max-w-7xl mx-auto md:pl-72 animate-fade-in transition-all">
        {children}
      </main>

    </div>
  );
};

export default GlassLayout;