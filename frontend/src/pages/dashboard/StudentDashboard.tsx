import { useEffect, useState } from 'react';
import { 
  BookOpen, FileText, Trophy, Upload, Loader2, Calendar, Clock, Star, 
  BrainCircuit, Award, CalendarCheck, Activity, CheckCircle, XCircle,
  Check, X, TrendingUp, Download, PieChart
} from 'lucide-react';

const HOURS = [ 
  { label: "09:00 - 10:00", start: "09:00" }, 
  { label: "10:00 - 11:00", start: "10:00" }, 
  { label: "11:00 - 12:00", start: "11:00" }, 
  { label: "12:00 - 01:00", start: "12:00" }, 
  { label: "02:00 - 03:00", start: "14:00" }, 
  { label: "03:00 - 04:00", start: "15:00" } 
];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface Assignment { id: number; title: string; subject: string; status: string; dueDate: string; grade?: string; feedback?: string; }
interface ExamResult { id: number; examName: string; score: number; maxScore: number; date: string; }
interface TimetableSlot { id: number; day: string; startTime: string; subject: string; }
interface AttendanceRecord { id: number; status: string; date: string; }
interface StudentData { name: string; email: string; branch: string; rollNumber: string; assignments: Assignment[]; examResults: ExamResult[]; attendance: AttendanceRecord[]; }

const StudentDashboard = () => {
  const [student, setStudent] = useState<StudentData | null>(null);
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'timetable' | 'results' | 'attendance'>('overview');

  const studentId = localStorage.getItem('userId');

  const fetchData = async () => {
    try {
      // 🚀 Updated API URL here
      const res = await fetch(`${import.meta.env.VITE_API_URL}/dashboard/${studentId}`);
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      const data = await res.json();
      setStudent(data);
      
      if (data.branch) {
        // 🚀 Updated API URL here
        const ttRes = await fetch(`${import.meta.env.VITE_API_URL}/timetable/class/${data.branch}`);
        if (ttRes.ok) setTimetable(await ttRes.json());
      }
    } catch (error) { 
      console.error("Dashboard fetch error:", error); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    if (studentId) fetchData(); 
  }, [studentId]);

  // --- ANALYTICS CALCULATIONS ---
  const attendanceRecords = student?.attendance || [];
  const totalDays = attendanceRecords.length;
  const presentDays = attendanceRecords.filter(a => a.status === 'present').length;
  const absentDays = attendanceRecords.filter(a => a.status === 'absent').length;
  const lateDays = attendanceRecords.filter(a => a.status === 'late').length;
  
  // Standard weighted percentage
  const attendancePercentage = totalDays > 0 ? Math.round(((presentDays + (lateDays * 0.5)) / totalDays) * 100) : 0;
  const isCritical = attendancePercentage < 75;

  const getSubject = (day: string, startTime: string) => { 
    const slot = timetable.find(s => s.day === day && s.startTime === startTime); 
    return slot ? slot.subject : ""; 
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, assignmentId: number) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(assignmentId);
    const formData = new FormData();
    formData.append('file', e.target.files[0]);

    try {
      // 🚀 Updated API URL here
      const res = await fetch(`${import.meta.env.VITE_API_URL}/assignment/${assignmentId}/submit`, { method: 'POST', body: formData });
      if (res.ok) {
        alert("Assignment Submitted Successfully! 🎉");
        fetchData(); 
      }
    } catch (err) { 
      alert("Upload failed. Is your backend running?"); 
    } finally { 
      setUploading(null); 
    }
  };

  const groupedReportCards = () => {
    if (!student || !student.examResults) return {};
    return student.examResults.reduce((acc: any, result) => {
      let subject = "General", examCategory = "Examination", examTitle = result.examName;
      if (result.examName.includes(' - ')) {
        const parts = result.examName.split(' - ');
        subject = parts[0];
        const details = parts[1];
        if (details.includes(' | ')) {
          const detailParts = details.split(' | ');
          examCategory = detailParts[0]; examTitle = detailParts[1];
        } else examTitle = details;
      }
      const groupKey = `${examCategory}_${examTitle}`;
      if (!acc[groupKey]) { 
        acc[groupKey] = { category: examCategory, title: examTitle, date: result.date, subjects: [], totalScore: 0, totalMax: 0 }; 
      }
      acc[groupKey].subjects.push({ name: subject, score: result.score, maxScore: result.maxScore });
      acc[groupKey].totalScore += result.score;
      acc[groupKey].totalMax += result.maxScore;
      return acc;
    }, {});
  };

  const reportCards = groupedReportCards();

  if (loading || !student) return <div className="p-20 text-center flex flex-col items-center gap-4"><Loader2 className="animate-spin text-indigo-600" size={40} /> <p className="font-bold text-slate-500">Syncing with Campus Servers...</p></div>;

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full pb-24 pt-4 px-4 relative min-h-screen">
      
      {/* 1. HEADER WITH QUICK ANALYTICS */}
      <div className="p-8 rounded-[2rem] bg-indigo-600 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="relative z-10">
          <h1 className="text-3xl font-black flex items-center gap-3">Hello, {student.name.split(' ')[0]}! 👋</h1>
          <p className="text-indigo-100 font-bold mt-1 opacity-90">{student.branch} • Roll No: {student.rollNumber || 'N/A'}</p>
        </div>
        
        <div className="flex gap-4 relative z-10">
           <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-2xl flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full border-4 flex items-center justify-center text-[10px] font-black ${isCritical ? 'border-rose-400 text-rose-200' : 'border-emerald-400 text-emerald-200'}`}>
                 {attendancePercentage}%
              </div>
              <div className="hidden sm:block">
                 <p className="text-[9px] font-black uppercase opacity-60">Status</p>
                 <p className="text-xs font-bold">{isCritical ? 'Attention Required' : 'On Track'}</p>
              </div>
           </div>
           <button className="bg-white text-indigo-600 hover:bg-indigo-50 transition-all px-6 py-3 rounded-2xl font-black flex items-center gap-2 text-sm shadow-lg shadow-indigo-900/20">
             <BrainCircuit size={18} /> AI Agent
           </button>
        </div>
        <div className="absolute right-0 top-0 h-full w-96 bg-gradient-to-l from-indigo-500/50 to-transparent pointer-events-none" />
      </div>

      {/* 2. NAVIGATION */}
      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto hide-scrollbar px-2">
        {['overview', 'timetable', 'attendance', 'results'].map(tab => (
           <button 
            key={tab}
            onClick={() => setActiveTab(tab as any)} 
            className={`pb-4 px-6 text-sm font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* --- CONTENT TABS --- */}
      <div className="flex-1">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4">
            {/* ASSIGNMENTS COLUMN */}
            <div className="lg:col-span-2 space-y-6">
               <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
                  <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      <BookOpen size={20} className="text-indigo-600" />
                      <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Active Assignments</h3>
                    </div>
                  </div>
                  <div className="divide-y divide-slate-100 p-2">
                    {!student.assignments?.length ? <p className="p-10 text-center text-slate-400 font-medium">Clear for today! No pending tasks.</p> : 
                      student.assignments.map(work => (
                       <div key={work.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors rounded-2xl">
                          <div>
                            <h4 className="font-bold text-slate-800">{work.title}</h4>
                            <p className="text-[10px] font-black text-indigo-500 mt-1 uppercase tracking-wider">{work.subject} • Due {new Date(work.dueDate).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            {work.status === 'graded' ? (
                              <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-100 flex items-center gap-2 font-black text-xs">
                                <Award size={14} /> {work.grade}
                              </div>
                            ) : work.status === 'submitted' ? (
                                <span className="bg-amber-50 text-amber-700 px-4 py-2 rounded-xl text-xs font-bold border border-amber-100">Review Pending</span>
                            ) : (
                              <label className="cursor-pointer bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all flex items-center gap-2">
                                <Upload size={14} /> {uploading === work.id ? 'Syncing...' : 'Submit'}
                                <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, work.id)} disabled={uploading !== null} />
                              </label>
                            )}
                          </div>
                       </div>
                    ))}
                  </div>
               </div>
            </div>

            {/* PERFORMANCE TRENDS SIDEBAR */}
            <div className="space-y-6">
               <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm">
                  <h3 className="font-black text-slate-800 uppercase text-[10px] tracking-widest mb-6 flex items-center gap-2">
                    <TrendingUp size={14} className="text-indigo-600" /> Grade Trends
                  </h3>
                  <div className="space-y-5">
                    {student.examResults.slice(-4).map((res, i) => {
                       const percentage = Math.round((res.score / res.maxScore) * 100);
                       return (
                        <div key={i}>
                            <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-2">
                            <span>{res.examName.split(' - ')[0]}</span>
                            <span className="text-indigo-600">{percentage}%</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                                className={`h-full rounded-full transition-all duration-1000 ${percentage >= 80 ? 'bg-emerald-500' : percentage >= 50 ? 'bg-indigo-500' : 'bg-rose-500'}`} 
                                style={{ width: `${percentage}%` }} 
                            />
                            </div>
                        </div>
                       )
                    })}
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* ATTENDANCE ANALYTICS */}
        {activeTab === 'attendance' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in">
             <div className="md:col-span-1 bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm flex flex-col items-center justify-center text-center">
                <div className="relative w-44 h-44 mb-6 flex items-center justify-center">
                   <svg className="absolute w-full h-full -rotate-90">
                      <circle cx="88" cy="88" r="75" className="fill-none stroke-slate-100" strokeWidth="14" />
                      <circle 
                        cx="88" cy="88" r="75" 
                        className={`fill-none transition-all duration-1000 ${isCritical ? 'stroke-rose-500' : 'stroke-indigo-600'}`} 
                        strokeWidth="14" 
                        strokeDasharray={471}
                        strokeDashoffset={471 - (471 * attendancePercentage) / 100}
                        strokeLinecap="round"
                      />
                   </svg>
                   <div className="text-center">
                      <h2 className="text-4xl font-black text-slate-800">{attendancePercentage}%</h2>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attendance</p>
                   </div>
                </div>
                <h3 className="font-black text-slate-800 text-lg">System Status</h3>
                <p className="text-slate-500 text-xs font-medium mt-2 leading-relaxed px-4">
                  {isCritical ? "Warning: Your attendance is below the institutional requirement of 75%." : "You're doing great! Keep up the consistent presence."}
                </p>
             </div>

             <div className="md:col-span-2 grid grid-cols-2 gap-4">
                <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-[2.5rem] flex flex-col items-center justify-center shadow-sm">
                   <div className="p-4 bg-white rounded-2xl text-emerald-600 shadow-sm mb-4"><CheckCircle size={32} /></div>
                   <h4 className="text-4xl font-black text-emerald-800">{presentDays}</h4>
                   <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mt-1">Days Present</p>
                </div>
                <div className="bg-rose-50 border border-rose-100 p-8 rounded-[2.5rem] flex flex-col items-center justify-center shadow-sm">
                   <div className="p-4 bg-white rounded-2xl text-rose-600 shadow-sm mb-4"><XCircle size={32} /></div>
                   <h4 className="text-4xl font-black text-rose-800">{absentDays}</h4>
                   <p className="text-xs font-black text-rose-600 uppercase tracking-widest mt-1">Days Absent</p>
                </div>
             </div>
          </div>
        )}

        {/* OFFICIAL TRANSCRIPT */}
        {activeTab === 'results' && (
           <div className="space-y-6 animate-in fade-in">
              <div className="flex justify-between items-center bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl">
                 <div>
                    <h3 className="text-2xl font-black">Academic Transcript</h3>
                    <p className="text-slate-400 text-sm font-medium">Validated results for the 2025-2026 session</p>
                 </div>
                 <button className="bg-white/10 hover:bg-white/20 border border-white/20 p-4 rounded-2xl flex items-center gap-3 font-bold text-sm transition-all">
                    <Download size={20} /> Generate PDF
                 </button>
              </div>

              {Object.values(reportCards).map((card: any, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
                  <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center px-8">
                    <div>
                      <span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">{card.category}</span>
                      <h3 className="text-xl font-black text-slate-800 mt-1">{card.title}</h3>
                    </div>
                    <div className="text-right">
                       <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Total Score</p>
                       <div className="text-3xl font-black text-indigo-700">{card.totalScore} <span className="text-slate-300 text-base font-normal">/ {card.totalMax}</span></div>
                    </div>
                  </div>
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <tr><th className="p-6 pl-10">Subject</th><th className="p-6 text-center">Maximum</th><th className="p-6 text-center">Obtained</th><th className="p-6 text-right pr-10">Status</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {card.subjects.map((s: any, sIdx: number) => {
                         const percent = (s.score / s.maxScore) * 100;
                         return (
                          <tr key={sIdx} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-6 pl-10 font-bold text-slate-700">{s.name}</td>
                            <td className="p-6 text-center font-bold text-slate-400">{s.maxScore}</td>
                            <td className="p-6 text-center font-black text-indigo-600 text-base">{s.score}</td>
                            <td className="p-6 text-right pr-10">
                               <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase border ${percent >= 40 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                  {percent >= 40 ? 'Qualified' : 'Backlog'}
                               </span>
                            </td>
                          </tr>
                         )
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
           </div>
        )}

        {/* TIMETABLE */}
        {activeTab === 'timetable' && (
           <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm animate-in fade-in">
              <div className="flex items-center gap-3 mb-8">
                 <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Calendar size={24} /></div>
                 <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Weekly Lecture Plan</h3>
              </div>
              <div className="overflow-x-auto rounded-[2rem] border border-slate-100">
                <table className="w-full text-xs text-center">
                  <thead className="bg-slate-50 text-slate-400 font-black uppercase tracking-tighter">
                    <tr>
                      <th className="p-6 border-b border-r border-slate-100 w-32 bg-slate-100/50 text-center">Day / Slot</th>
                      {HOURS.map(h => <th key={h.start} className="p-6 border-b border-slate-100">{h.label}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {DAYS.map(day => (
                      <tr key={day} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-6 font-black text-slate-500 border-r border-slate-100 bg-slate-50/30 uppercase tracking-tighter">{day.substring(0,3)}</td>
                        {HOURS.map(hour => {
                           const subject = getSubject(day, hour.start);
                           return (
                             <td key={hour.start} className={`p-6 border-r border-slate-50 font-black transition-all ${subject ? 'text-indigo-600 bg-indigo-50/30' : 'text-slate-200'}`}>
                               {subject || '—'}
                             </td>
                           )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;