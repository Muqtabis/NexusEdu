import { useEffect, useState } from 'react';
import { Users, Trash2, Shield, TrendingUp, BookOpen, Search, Loader2 } from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  branch?: string; // <--- The new field
}

interface ExamResult {
  id: number;
  examName: string;
  score: number;
  maxScore: number;
  date: string;
  student: {
    name: string;
    email: string;
    branch?: string;
  };
}

const getGrade = (score: number, max: number) => {
  const percentage = (score / max) * 100;
  if (percentage >= 90) return { label: 'A+', color: 'text-emerald-600', bg: 'bg-emerald-100 text-emerald-700', status: 'Pass' };
  if (percentage >= 80) return { label: 'A', color: 'text-emerald-500', bg: 'bg-emerald-50 text-emerald-700', status: 'Pass' };
  if (percentage >= 70) return { label: 'B', color: 'text-indigo-500', bg: 'bg-indigo-50 text-indigo-700', status: 'Pass' };
  if (percentage >= 50) return { label: 'C', color: 'text-amber-500', bg: 'bg-amber-50 text-amber-700', status: 'Pass' };
  return { label: 'F', color: 'text-rose-600', bg: 'bg-rose-50 text-rose-700', status: 'Fail' };
};

const AdminDashboard = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [stats, setStats] = useState({ totalStudents: 0, totalTeachers: 0, totalAssignments: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'results'>('users');

  const fetchData = async () => {
    try {
      const resStats = await fetch('http://localhost:4000/admin/stats');
      const dataStats = await resStats.json();
      setStats(dataStats);

      const resUsers = await fetch('http://localhost:4000/admin/users');
      const dataUsers = await resUsers.json();
      setUsers(dataUsers);

      const resResults = await fetch('http://localhost:4000/admin/results');
      if (resResults.ok) {
        const dataResults = await resResults.json();
        setResults(dataResults);
      }
    } catch (error) {
      console.error("Failed to fetch admin data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure? This will delete all their data! ⚠️")) return;
    try {
      await fetch(`http://localhost:4000/admin/user/${id}`, { method: 'DELETE' });
      alert("User deleted.");
      fetchData();
    } catch (err) { alert("Failed to delete."); }
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin inline"/> Loading Admin Panel...</div>;

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header */}
      <div className="p-6 rounded-[1.5rem] bg-slate-900 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/10 rounded-lg"><Shield size={24} className="text-emerald-400" /></div>
            <h1 className="text-2xl font-bold">Principal's Command Center</h1>
          </div>
          <p className="text-slate-400 text-sm">System Overview & Academic Records</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div><p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Students</p><h3 className="text-3xl font-black text-slate-800">{stats.totalStudents}</h3></div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center"><Users size={24} /></div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div><p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Teachers</p><h3 className="text-3xl font-black text-slate-800">{stats.totalTeachers}</h3></div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center"><BookOpen size={24} /></div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div><p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Assignments</p><h3 className="text-3xl font-black text-slate-800">{stats.totalAssignments}</h3></div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center"><TrendingUp size={24} /></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200">
        <button onClick={() => setActiveTab('users')} className={`pb-3 text-sm font-bold transition-colors ${activeTab === 'users' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>User Management</button>
        <button onClick={() => setActiveTab('results')} className={`pb-3 text-sm font-bold transition-colors ${activeTab === 'results' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>School Academic Records</button>
      </div>

      {/* --- TAB 1: USERS --- */}
      {activeTab === 'users' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-700 flex items-center gap-2"><Users size={18} /> Registered Users</h3>
            <div className="bg-white border border-slate-200 rounded-lg px-3 py-1 flex items-center gap-2 text-xs"><Search size={14} className="text-slate-400"/> Search...</div>
          </div>
          <table className="w-full text-sm text-left">
            <thead className="bg-white text-slate-500 font-bold border-b border-slate-100">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Branch / Class</th> {/* NEW COLUMN */}
                <th className="p-4">Role</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-medium text-slate-800">{user.name}</td>
                  <td className="p-4 text-slate-500">{user.email}</td>
                  <td className="p-4">
                    {user.branch ? <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-bold border border-slate-200">{user.branch}</span> : <span className="text-slate-300">-</span>}
                  </td>
                  <td className="p-4"><span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : user.role === 'teacher' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{user.role}</span></td>
                  <td className="p-4 text-right">
                    {user.role !== 'admin' && ( <button onClick={() => handleDelete(user.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={16} /></button> )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- TAB 2: RESULTS --- */}
      {activeTab === 'results' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
           <div className="p-4 bg-slate-50 border-b border-slate-100"><h3 className="font-bold text-slate-700 flex items-center gap-2"><TrendingUp size={18} /> Global Examination Results</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-white text-slate-500 font-bold border-b border-slate-100">
                <tr><th className="p-4">Student Name</th><th className="p-4">Class</th><th className="p-4">Exam Name</th><th className="p-4 text-center">Score</th><th className="p-4 text-center">Grade</th><th className="p-4 text-right">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {results.length === 0 ? ( <tr><td colSpan={6} className="p-8 text-center text-slate-400 italic">No exams published yet.</td></tr> ) : (
                  results.map((res) => {
                    const gradeInfo = getGrade(res.score, res.maxScore);
                    return (
                      <tr key={res.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-bold text-slate-800">{res.student.name}</td>
                        <td className="p-4">
                          {res.student.branch ? <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-bold border border-slate-200">{res.student.branch}</span> : <span className="text-slate-300">-</span>}
                        </td>
                        <td className="p-4 text-slate-600">{res.examName}</td>
                        <td className="p-4 text-center font-mono font-bold">{res.score} <span className="text-slate-400 text-xs font-normal">/ {res.maxScore}</span></td>
                        <td className={`p-4 text-center font-black ${gradeInfo.color}`}>{gradeInfo.label}</td>
                        <td className="p-4 text-right"><span className={`px-3 py-1 rounded-full text-xs font-bold ${gradeInfo.bg}`}>{gradeInfo.status}</span></td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;