import { useEffect, useState } from 'react';
import { BookOpen, FileText, Trophy, Upload, Loader2, Calendar, Clock, Star, BrainCircuit, Award, CalendarCheck, Activity, CheckCircle, XCircle } from 'lucide-react';

const HOURS = [ { label: "09:00 - 10:00", start: "09:00" }, { label: "10:00 - 11:00", start: "10:00" }, { label: "11:00 - 12:00", start: "11:00" }, { label: "12:00 - 01:00", start: "12:00" }, { label: "02:00 - 03:00", start: "14:00" }, { label: "03:00 - 04:00", start: "15:00" } ];
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
  
  // Set to 'attendance' so it opens this tab automatically!
  const [activeTab, setActiveTab] = useState<'overview' | 'timetable' | 'results' | 'attendance'>('attendance');

  const studentId = localStorage.getItem('userId');

  const fetchData = async () => {
    try {
      const res = await fetch(`http://localhost:4000/dashboard/${studentId}`);
      const data = await res.json();
      setStudent(data);
      if (data.branch) {
        const ttRes = await fetch(`http://localhost:4000/timetable/class/${data.branch}`);
        if (ttRes.ok) setTimetable(await ttRes.json());
      }
    } catch (error) { 
      console.error(error); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchData(); }, [studentId]);

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
      await fetch(`http://localhost:4000/assignment/${assignmentId}/submit`, { method: 'POST', body: formData });
      alert("Assignment Submitted Successfully! 🎉");
      fetchData(); 
    } catch (err) { 
      alert("Upload failed. Is your backend running?"); 
    } finally { 
      setUploading(null); 
    }
  };

  // --- REPORT CARD PARSER ---
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
          examCategory = detailParts[0];
          examTitle = detailParts[1];
        } else examTitle = details;
      }
      const groupKey = `${examCategory}_${examTitle}`;
      if (!acc[groupKey]) { acc[groupKey] = { category: examCategory, title: examTitle, date: result.date, subjects: [], totalScore: 0, totalMax: 0 }; }
      acc[groupKey].subjects.push({ name: subject, score: result.score, maxScore: result.maxScore });
      acc[groupKey].totalScore += result.score;
      acc[groupKey].totalMax += result.maxScore;
      return acc;
    }, {});
  };

  const reportCards = groupedReportCards();

  // --- ATTENDANCE CALCULATOR ---
  const attendanceRecords = student?.attendance || [];
  const totalDays = attendanceRecords.length;
  const presentDays = attendanceRecords.filter(a => a.status === 'present').length;
  const absentDays = attendanceRecords.filter(a => a.status === 'absent').length;
  const lateDays = attendanceRecords.filter(a => a.status === 'late').length;
  const attendancePercentage = totalDays > 0 ? Math.round(((presentDays + lateDays) / totalDays) * 100) : 0;

  if (loading || !student) return <div className="p-10 text-center flex flex-col items-center gap-2"><Loader2 className="animate-spin text-indigo-600" /> Loading your profile...</div>;

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full pb-10 pt-4">
      
      {/* 1. HEADER */}
      <div className="p-8 rounded-[1.5rem] bg-indigo-600 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold flex items-center gap-3">Welcome, {student.name.split(' ')[0]} 👋</h1>
          <p className="text-indigo-200 font-medium mt-1">{student.branch} • Roll No: {student.rollNumber || 'N/A'}</p>
        </div>
        <button className="relative z-10 bg-white/20 hover:bg-white/30 transition-colors px-5 py-3 rounded-xl font-bold flex items-center gap-2 text-sm backdrop-blur-sm border border-white/30 shadow-sm">
          <BrainCircuit size={18} /> Ask AI Tutor
        </button>
        <div className="absolute right-0 top-0 h-full w-64 bg-gradient-to-l from-indigo-500 to-transparent opacity-50" />
      </div>

      {/* 2. NAVIGATION TABS */}
      <div className="flex gap-4 border-b border-slate-200 overflow-x-auto hide-scrollbar px-2">
        <button onClick={() => setActiveTab('overview')} className={`pb-3 text-sm font-bold whitespace-nowrap px-4 ${activeTab === 'overview' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>Assignments</button>
        <button onClick={() => setActiveTab('timetable')} className={`pb-3 text-sm font-bold whitespace-nowrap px-4 ${activeTab === 'timetable' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>Weekly Timetable</button>
        <button onClick={() => setActiveTab('attendance')} className={`pb-3 text-sm font-bold whitespace-nowrap px-4 ${activeTab === 'attendance' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>Attendance Stats</button>
        <button onClick={() => setActiveTab('results')} className={`pb-3 text-sm font-bold whitespace-nowrap px-4 ${activeTab === 'results' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>Official Report Cards</button>
      </div>

      {/* --- TAB 1: ASSIGNMENTS --- */}
      {activeTab === 'overview' && (
        <div className="bg-white border border-slate-200 rounded-[1.5rem] overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-2">
          <div className="p-6 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
            <BookOpen size={20} className="text-indigo-600" />
            <h3 className="font-bold text-slate-700 text-lg">Pending & Graded Homework</h3>
          </div>
          <div className="divide-y divide-slate-100 p-2">
            {!student.assignments || student.assignments.length === 0 ? (
              <p className="p-10 text-center text-slate-400">No assignments yet. Enjoy your free time! 🎮</p>
            ) : (
              student.assignments.map(work => (
                <div key={work.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors rounded-xl">
                  <div>
                    <h4 className="font-bold text-slate-800 text-[15px]">{work.title}</h4>
                    <p className="text-xs font-bold text-indigo-600 mt-1 uppercase tracking-wider">{work.subject} • Due: {new Date(work.dueDate).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {work.status === 'graded' ? (
                      <div className="text-right">
                        <span className="px-4 py-2 bg-emerald-100 text-emerald-700 font-black rounded-xl flex items-center gap-2 shadow-sm"><Star size={16} fill="currentColor" /> Grade: {work.grade}</span>
                        {work.feedback && <p className="text-[11px] font-medium text-slate-500 mt-2 max-w-[200px] truncate">"{work.feedback}"</p>}
                      </div>
                    ) : work.status === 'submitted' ? (
                      <span className="px-4 py-2 bg-amber-100 text-amber-700 font-bold text-xs rounded-xl shadow-sm">Under Review ⏳</span>
                    ) : (
                      <label className="cursor-pointer bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors border border-indigo-100 shadow-sm">
                        {uploading === work.id ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                        {uploading === work.id ? 'Uploading...' : 'Submit Work'}
                        <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, work.id)} disabled={uploading === work.id} />
                      </label>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* --- TAB 2: TIMETABLE --- */}
      {activeTab === 'timetable' && (
        <div className="bg-white border border-slate-200 rounded-[1.5rem] p-6 shadow-sm animate-in fade-in slide-in-from-bottom-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><Calendar className="text-indigo-600" /> My Class Routine</h3>
            <span className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold border border-slate-200 uppercase tracking-wider">{student.branch}</span>
          </div>
          <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold">
                <tr>
                  <th className="p-4 border-b border-r border-slate-200 w-32 bg-slate-100 sticky left-0 z-10">Day / Time</th>
                  {HOURS.map(h => ( <th key={h.start} className="p-4 border-b border-slate-200 min-w-[120px] text-center whitespace-nowrap text-xs uppercase tracking-wider"><div className="flex flex-col items-center gap-1"><Clock size={12} className="text-slate-400"/> {h.label}</div></th> ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {DAYS.map(day => (
                  <tr key={day} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-bold text-slate-700 bg-slate-50 border-r border-slate-200 sticky left-0 z-10">{day}</td>
                    {HOURS.map(hour => {
                      const subject = getSubject(day, hour.start);
                      const isBreak = subject === 'Break';
                      return (
                        <td key={`${day}-${hour.start}`} className={`p-4 border-r border-slate-100 text-center font-bold text-xs ${isBreak ? 'bg-amber-50 text-amber-600' : subject ? 'text-indigo-700 bg-indigo-50/30' : 'text-slate-300 font-normal'}`}>{subject || '-'}</td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 3: ATTENDANCE STATS --- */}
      {activeTab === 'attendance' && (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-[1.5rem] p-6 shadow-sm flex flex-col items-center justify-center text-center">
              <Activity className="text-indigo-500 mb-2" size={28} />
              <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Attendance</h4>
              <span className={`text-4xl font-black ${attendancePercentage >= 75 ? 'text-indigo-600' : 'text-rose-600'}`}>{attendancePercentage}%</span>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-[1.5rem] p-6 shadow-sm flex flex-col items-center justify-center text-center">
              <CheckCircle className="text-emerald-500 mb-2" size={28} />
              <h4 className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-1">Present</h4>
              <span className="text-4xl font-black text-emerald-700">{presentDays}</span>
            </div>
            <div className="bg-rose-50 border border-rose-100 rounded-[1.5rem] p-6 shadow-sm flex flex-col items-center justify-center text-center">
              <XCircle className="text-rose-500 mb-2" size={28} />
              <h4 className="text-sm font-bold text-rose-600 uppercase tracking-wider mb-1">Absent</h4>
              <span className="text-4xl font-black text-rose-700">{absentDays}</span>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-[1.5rem] p-6 shadow-sm flex flex-col items-center justify-center text-center">
              <Clock className="text-amber-500 mb-2" size={28} />
              <h4 className="text-sm font-bold text-amber-600 uppercase tracking-wider mb-1">Late</h4>
              <span className="text-4xl font-black text-amber-700">{lateDays}</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-[1.5rem] overflow-hidden shadow-sm">
             <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><CalendarCheck className="text-indigo-600" /> Recent Records</h3>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Working Days: {totalDays}</span>
             </div>
             
             <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto">
                {attendanceRecords.length === 0 ? (
                  <p className="p-10 text-center text-slate-400">No attendance data recorded yet.</p>
                ) : (
                  [...attendanceRecords].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(record => (
                    <div key={record.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-700">{new Date(record.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      </div>
                      <span className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider w-28 justify-center
                          ${record.status === 'present' ? 'bg-[#dcfce7] text-[#166534]' : record.status === 'absent' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                          {record.status === 'present' && <Check size={14} />} {record.status === 'absent' && <X size={14} />} {record.status === 'late' && <Clock size={14} />} {record.status}
                      </span>
                    </div>
                  ))
                )}
             </div>
          </div>
        </div>
      )}

      {/* --- TAB 4: OFFICIAL REPORT CARDS --- */}
      {activeTab === 'results' && (
        <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2">
          {Object.keys(reportCards).length === 0 ? (
            <div className="bg-white rounded-[1.5rem] border border-slate-200 p-10 text-center shadow-sm">
              <Trophy size={48} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-xl font-bold text-slate-700">No Exams Published Yet</h3>
              <p className="text-slate-500 mt-2">Your report cards will appear here automatically.</p>
            </div>
          ) : (
            Object.values(reportCards).map((card: any, index: number) => {
              const percentage = Math.round((card.totalScore / card.totalMax) * 100);
              let grade = 'F';
              if (percentage >= 90) grade = 'A+';
              else if (percentage >= 80) grade = 'A';
              else if (percentage >= 70) grade = 'B';
              else if (percentage >= 60) grade = 'C';
              else if (percentage >= 50) grade = 'D';

              return (
                <div key={index} className="bg-white border border-slate-200 rounded-[1.5rem] overflow-hidden shadow-sm">
                  <div className="p-6 bg-slate-900 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
                    <div className="relative z-10">
                      <span className="text-xs font-black tracking-widest text-indigo-400 uppercase">{card.category}</span>
                      <h3 className="text-2xl font-bold flex items-center gap-2 mt-1"><Award className="text-amber-400" /> {card.title}</h3>
                    </div>
                    <div className="relative z-10 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/20 text-right">
                      <span className="block text-[10px] uppercase tracking-wider text-slate-300 font-bold mb-1">Overall Grade</span>
                      <span className="text-3xl font-black text-amber-400 leading-none">{grade}</span>
                    </div>
                  </div>
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <tr><th className="p-4 pl-6 uppercase text-xs tracking-wider">Subject</th><th className="p-4 uppercase text-xs tracking-wider text-center">Max Marks</th><th className="p-4 uppercase text-xs tracking-wider text-center">Marks Obtained</th><th className="p-4 pr-6 text-right uppercase text-xs tracking-wider">Status</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {card.subjects.map((subj: any, sIdx: number) => {
                        const subjPercent = (subj.score / subj.maxScore) * 100;
                        const isPass = subjPercent >= 40; 
                        return (
                          <tr key={sIdx} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4 pl-6 font-bold text-slate-800 text-[15px]">{subj.name}</td>
                            <td className="p-4 text-center font-medium text-slate-400">{subj.maxScore}</td>
                            <td className="p-4 text-center font-black text-indigo-700 text-lg">{subj.score}</td>
                            <td className="p-4 pr-6 text-right">
                              {isPass ? ( <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-lg uppercase tracking-wider">Pass</span> ) : ( <span className="inline-block px-3 py-1 bg-rose-100 text-rose-700 text-[10px] font-bold rounded-lg uppercase tracking-wider">Fail</span> )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Published Date: {new Date(card.date).toLocaleDateString()}</div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Total Score</span>
                        <span className="text-xl font-black text-slate-800">{card.totalScore} <span className="text-sm font-medium text-slate-400">/ {card.totalMax}</span></span>
                      </div>
                      <div className="h-10 w-px bg-slate-300"></div>
                      <div className="text-right">
                        <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Percentage</span>
                        <span className={`text-xl font-black ${percentage >= 75 ? 'text-indigo-600' : percentage >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>{percentage}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;