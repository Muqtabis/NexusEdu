import { BookOpen, Clock } from 'lucide-react';

const Dashboard = () => {
  return (
    <div className="flex flex-col gap-6">
      
      {/* Welcome Card */}
      <div className="p-6 rounded-[1.5rem] bg-white border border-slate-200 shadow-soft relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl font-semibold text-slate-800 mb-1">Hello, Muqtabis 👋</h1>
          <p className="text-slate-500 text-sm">You have <span className="font-bold text-indigo-600">Physics Lab</span> in 20 minutes.</p>
        </div>
        {/* Decorative Circle */}
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-50 rounded-full" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="mb-3 p-2 w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <BookOpen size={20} />
          </div>
          <div className="text-2xl font-bold text-slate-800">92%</div>
          <div className="text-xs text-slate-500 font-medium">Attendance</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="mb-3 p-2 w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock size={20} />
          </div>
          <div className="text-2xl font-bold text-slate-800">3</div>
          <div className="text-xs text-slate-500 font-medium">Pending Tasks</div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;