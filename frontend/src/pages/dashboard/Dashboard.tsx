import { useEffect, useState } from 'react';
import { BookOpen, Clock, Loader2 } from 'lucide-react';

const Dashboard = () => {
  // 1. Set up state to hold the dynamic data
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Grab the logged-in user's ID
  const studentId = localStorage.getItem('userId');

  // 2. Fetch the data from your Railway backend
  useEffect(() => {
    const fetchWidgetData = async () => {
      if (!studentId) {
        setLoading(false);
        return;
      }
      
      try {
        // Here is the crucial Production API URL update!
        const res = await fetch(`${import.meta.env.VITE_API_URL}/dashboard/${studentId}`);
        if (res.ok) {
          const jsonData = await res.json();
          setData(jsonData);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWidgetData();
  }, [studentId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-10">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  // 3. Fallback values just in case the database is empty
  const firstName = data?.name ? data.name.split(' ')[0] : 'Student';
  const attendance = data?.attendancePercentage || 92; // Replace with actual calc if needed
  const pendingTasks = data?.assignments?.filter((a: any) => a.status !== 'graded').length || 3;

  return (
    <div className="flex flex-col gap-6">
      
      {/* Welcome Card */}
      <div className="p-6 rounded-[1.5rem] bg-white border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl font-semibold text-slate-800 mb-1">Hello, {firstName} 👋</h1>
          <p className="text-slate-500 text-sm">
            You have <span className="font-bold text-indigo-600">Physics Lab</span> in 20 minutes.
          </p>
        </div>
        {/* Decorative Circle */}
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-50 rounded-full" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm transition-hover hover:border-emerald-200">
          <div className="mb-3 p-2 w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <BookOpen size={20} />
          </div>
          <div className="text-2xl font-bold text-slate-800">{attendance}%</div>
          <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">Attendance</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm transition-hover hover:border-amber-200">
          <div className="mb-3 p-2 w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock size={20} />
          </div>
          <div className="text-2xl font-bold text-slate-800">{pendingTasks}</div>
          <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">Pending Tasks</div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;