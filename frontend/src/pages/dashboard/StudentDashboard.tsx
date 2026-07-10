import { useEffect, useState } from 'react';
import { 
  BookOpen, Loader2, Calendar, Star, BrainCircuit, Award, Activity, 
  CheckCircle, XCircle, TrendingUp, Download, Layers, PlusCircle, Search,
  Flame, PlayCircle, BookA, ChevronRight, Upload
} from 'lucide-react';
import { API_BASE_URL } from '../../lib/api';

// IMPORT THE LIVE CHAT COMPONENT HERE
import LiveChat from '../../components/LiveChat';

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
interface StudentData { id: number; name: string; email: string; role: string; branch: string; rollNumber: string; assignments: Assignment[]; examResults: ExamResult[]; attendance: AttendanceRecord[]; }

const StudentDashboard = () => {
  const [student, setStudent] = useState<StudentData | null>(null);
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [progressData, setProgressData] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<number | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  
  const [activeTab, setActiveTab] = useState<'overview' | 'timetable' | 'results' | 'attendance' | 'courses'>(
    (localStorage.getItem('studentTab') as any) || 'overview'
  );

  useEffect(() => {
    localStorage.setItem('studentTab', activeTab);
  }, [activeTab]);

  const studentId = localStorage.getItem('userId');

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/dashboard/${studentId}`);
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      const data = await res.json();
      setStudent(data);
      
      if (data.branch) {
        const ttRes = await fetch(`${API_BASE_URL}/timetable/class/${data.branch}`);
        if (ttRes.ok) setTimetable(await ttRes.json());
      }

      const courseRes = await fetch(`${API_BASE_URL}/api/courses`);
      if (courseRes.ok) setCourses(await courseRes.json());

      const learningRes = await fetch(`${API_BASE_URL}/api/students/${studentId}/learning`);
      if (learningRes.ok) {
        const lData = await learningRes.json();
        setEnrolledCourses(lData.enrollments.map((e: any) => e.course));
        setProgressData(lData.progress);
      }

      const actRes = await fetch(`${API_BASE_URL}/api/students/${studentId}/activity`);
      if (actRes.ok) setActivity(await actRes.json());

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
  const lateDays = attendanceRecords.filter(a => a.status === 'late').length;
  const absentDays = attendanceRecords.filter(a => a.status === 'absent').length;
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
      const res = await fetch(`${API_BASE_URL}/assignment/${assignmentId}/submit`, { method: 'POST', body: formData });
      if (res.ok) { alert("Assignment Submitted Successfully! 🎉"); fetchData(); }
    } catch (err) { alert("Upload failed. Is your backend running?"); } 
    finally { setUploading(null); }
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

  const enrolledCourseIds = enrolledCourses.map(c => c.id);
  const availableCourses = courses.filter(c => !enrolledCourseIds.includes(c.id));
  
  const filteredAvailableCourses = availableCourses.filter(course => {
    const searchLower = searchQuery.toLowerCase();
    const titleMatch = (course.title || "").toLowerCase().includes(searchLower);
    const descMatch = (course.description || "").toLowerCase().includes(searchLower);
    return titleMatch || descMatch;
  });

  const calculateProgress = (course: any) => {
    if (!course.modules) return 0;
    const totalLessons = course.modules.reduce((acc: number, mod: any) => acc + (mod.lessons?.length || 0), 0);
    if (totalLessons === 0) return 0;
    const completedLessons = progressData.filter(p => {
      return course.modules.some((m: any) => m.lessons.some((l: any) => l.id === p.lessonId));
    }).length;
    return Math.round((completedLessons / totalLessons) * 100);
  };

  const heroCourse = enrolledCourses.find(c => calculateProgress(c) < 100) || enrolledCourses[0];
  const heroProgress = heroCourse ? calculateProgress(heroCourse) : 0;

  if (loading || !student) return <div className="p-20 text-center flex flex-col items-center gap-4"><Loader2 className="animate-spin text-slate-400" size={40} /> <p className="font-bold text-slate-500">Syncing workspace...</p></div>;

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto w-full pb-28 pt-8 px-4 md:px-8 min-h-screen relative">
      
      {/* CLASSIC, SIMPLE, MODERN HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
            Good morning, {student.name.split(' ')[0]}.
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-2 flex items-center gap-2">
            <span className="bg-white border border-slate-200 text-slate-700 px-3 py-1 rounded-md shadow-sm">
              {student.branch}
            </span>
            <span className="hidden sm:inline">•</span>
            <span>Roll No: {student.rollNumber || 'N/A'}</span>
          </p>
        </div>

        <div className="flex flex-row items-center gap-3 w-full md:w-auto">
           {/* Minimalist Attendance Badge */}
           <div className="bg-white border border-slate-200 pl-3 pr-5 py-2 rounded-xl flex items-center gap-3 flex-1 md:flex-none shadow-sm">
              <div className="relative flex h-10 w-10 items-center justify-center">
                <svg className="absolute w-full h-full -rotate-90">
                  <circle cx="20" cy="20" r="16" className="fill-none stroke-slate-100" strokeWidth="3.5" />
                  <circle 
                    cx="20" cy="20" r="16" 
                    className={`fill-none ${isCritical ? 'stroke-rose-500' : 'stroke-emerald-500'} transition-all duration-1000`} 
                    strokeWidth="3.5" 
                    strokeDasharray={100.5}
                    strokeDashoffset={100.5 - (100.5 * attendancePercentage) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <span className={`text-[10px] font-bold ${isCritical ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {attendancePercentage}%
                </span>
              </div>
              <div className="flex flex-col">
                 <span className="text-[9px] font-bold uppercase text-slate-400 tracking-widest">Attendance</span>
                 <span className="text-xs font-semibold text-slate-700 mt-0.5">{isCritical ? 'Critical' : 'On Track'}</span>
              </div>
           </div>

           {/* Classic Dark Button */}
           <button className="bg-slate-900 text-white hover:bg-slate-800 transition-colors p-3 md:px-5 md:py-3 rounded-xl font-medium flex items-center justify-center gap-2 shadow-sm shrink-0">
             <BrainCircuit size={18} /> <span className="hidden md:block text-sm">AI Agent</span>
           </button>
        </div>
      </div>

      {/* HORIZONTALLY SCROLLABLE MOBILE NAVIGATION */}
      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto snap-x hide-scrollbar px-1 -mx-2 sm:mx-0">
        {['overview', 'courses', 'timetable', 'attendance', 'results'].map(tab => (
           <button 
            key={tab}
            onClick={() => setActiveTab(tab as any)} 
            className={`whitespace-nowrap snap-start pb-4 px-4 sm:px-6 text-sm font-bold capitalize transition-all ${activeTab === tab ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="lg:col-span-2 space-y-6">
               <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
                  <div className="p-5 md:p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      <BookOpen size={18} className="text-slate-700" />
                      <h3 className="font-bold text-slate-800 text-sm">Active Assignments</h3>
                    </div>
                  </div>
                  <div className="divide-y divide-slate-100 p-2 md:p-4">
                    {!student.assignments?.length ? <p className="p-10 text-center text-slate-400 font-medium">Clear for today! No pending tasks.</p> : 
                      student.assignments.map(work => (
                       <div key={work.id} className="p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors rounded-2xl">
                          <div>
                            <h4 className="font-bold text-slate-800 text-sm md:text-base">{work.title}</h4>
                            <p className="text-[11px] font-semibold text-slate-500 mt-1">{work.subject} • Due {new Date(work.dueDate).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center gap-3 self-start sm:self-auto w-full sm:w-auto">
                            {work.status === 'graded' ? (
                              <div className="w-full sm:w-auto bg-emerald-50 text-emerald-700 px-4 py-3 sm:py-2 rounded-xl border border-emerald-100 flex items-center justify-center gap-2 font-bold text-xs">
                                <Award size={14} /> {work.grade}
                              </div>
                            ) : work.status === 'submitted' ? (
                                <div className="w-full sm:w-auto text-center bg-amber-50 text-amber-700 px-4 py-3 sm:py-2 rounded-xl text-xs font-bold border border-amber-100 whitespace-nowrap">Review Pending</div>
                            ) : (
                              <label className="cursor-pointer w-full sm:w-auto bg-slate-900 text-white px-5 py-3 sm:py-2.5 rounded-xl text-xs font-medium hover:bg-slate-800 transition-all flex items-center justify-center gap-2 whitespace-nowrap">
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
            
            <div className="space-y-6">
               <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm">
                 <h3 className="font-bold text-slate-800 text-sm mb-6">Recent Activity</h3>
                 <div className="space-y-6">
                   {activity.length === 0 ? <p className="text-slate-400 text-sm italic">No recent activity.</p> : activity.map((act, i) => (
                     <div key={i} className="flex gap-4">
                       <div className="w-2 h-2 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                       <div>
                         <p className="text-xs font-semibold text-slate-800 leading-tight">{act.title}</p>
                         <p className="text-[11px] text-slate-400 mt-1">{new Date(act.date).toLocaleDateString()}</p>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>

               <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm">
                  <h3 className="font-bold text-slate-800 text-sm mb-6 flex items-center gap-2">
                    <TrendingUp size={16} className="text-slate-700" /> Grade Trends
                  </h3>
                  <div className="space-y-5">
                    {(student.examResults || []).slice(-4).map((res, i) => {
                       const percentage = Math.round((res.score / res.maxScore) * 100);
                       return (
                        <div key={i}>
                            <div className="flex justify-between text-[12px] font-semibold text-slate-600 mb-2">
                            <span className="truncate pr-2">{res.examName.split(' - ')[0]}</span>
                            <span className="text-slate-900 font-bold">{percentage}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-1000 ${percentage >= 80 ? 'bg-emerald-500' : percentage >= 50 ? 'bg-slate-800' : 'bg-rose-500'}`} style={{ width: `${percentage}%` }} />
                            </div>
                        </div>
                       )
                    })}
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* COURSES TAB (LMS) */}
        {activeTab === 'courses' && (
           <div className="space-y-8 md:space-y-10 animate-in fade-in slide-in-from-bottom-4">
              
              {heroCourse && (
                <div className="relative bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col md:flex-row items-center justify-between border border-slate-800 group">
                  <div className="absolute inset-0 w-full h-full">
                     <img src={heroCourse.thumbnail} className="w-full h-full object-cover opacity-30 group-hover:scale-105 transition-transform duration-1000" />
                     <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900/40 md:to-transparent"></div>
                  </div>

                  <div className="relative z-10 p-6 md:p-12 w-full md:w-2/3">
                    <div className="flex items-center gap-2 mb-4">
                       <Flame size={16} className="text-slate-300" />
                       <span className="text-slate-300 text-[10px] md:text-xs font-semibold uppercase tracking-widest">Resume</span>
                    </div>
                    <h2 className="text-2xl md:text-4xl font-bold text-white mb-2 md:mb-3 leading-tight">{heroCourse.title}</h2>
                    <p className="text-slate-400 text-xs md:text-sm mb-6 md:mb-8 line-clamp-2 md:line-clamp-3">{heroCourse.description}</p>
                    
                    <button 
                      onClick={() => window.location.href = `/player/${heroCourse.id}`}
                      className="w-full md:w-fit bg-white hover:bg-slate-100 text-slate-900 font-medium px-6 py-4 md:py-3.5 rounded-xl flex items-center justify-center gap-3 transition-all shadow-sm"
                    >
                      <PlayCircle size={18} /> Continue Learning
                    </button>
                  </div>

                  <div className="relative z-10 p-6 md:p-12 w-full md:w-1/3 justify-center md:justify-end hidden sm:flex">
                    <div className="relative w-24 h-24 md:w-32 md:h-32 flex items-center justify-center bg-slate-800/50 rounded-full backdrop-blur-sm border border-white/10">
                      <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" className="fill-none stroke-slate-700" strokeWidth="6" />
                        <circle 
                          cx="50" cy="50" r="40" 
                          className={`fill-none transition-all duration-1000 ease-out ${heroProgress === 100 ? 'stroke-emerald-400' : 'stroke-white'}`} 
                          strokeWidth="6" 
                          strokeLinecap="round"
                          strokeDasharray="251.2"
                          strokeDashoffset={251.2 - (251.2 * heroProgress) / 100}
                        />
                      </svg>
                      <div className="text-center">
                        <span className="text-xl md:text-2xl font-bold text-white">{heroProgress}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {enrolledCourses.length > 1 && (
                <div>
                  <h4 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 px-1">
                     Other Active Courses
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {enrolledCourses.filter(c => c.id !== heroCourse?.id).map(course => {
                      const progress = calculateProgress(course);
                      return (
                        <div key={course.id} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden relative group hover:shadow-md transition-shadow">
                          <div className={`absolute top-4 right-4 backdrop-blur px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest z-10 shadow-sm ${progress === 100 ? 'bg-emerald-50 text-emerald-700' : 'bg-white/90 text-slate-800'}`}>
                            {progress === 100 ? 'Completed' : 'In Progress'}
                          </div>
                          <img src={course.thumbnail} className="w-full h-32 md:h-40 object-cover opacity-90 group-hover:scale-105 transition-transform duration-500" />
                          <div className="p-5 md:p-6">
                            <h3 className="font-bold text-base md:text-lg text-slate-800 mb-1 truncate">{course.title}</h3>
                            
                            <div className="my-5 md:my-6">
                              <div className="flex justify-between text-[11px] font-semibold text-slate-500 mb-2">
                                <span>Progress</span>
                                <span className={progress === 100 ? "text-emerald-600" : "text-slate-800"}>{progress}%</span>
                              </div>
                              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-1000 ${progress === 100 ? 'bg-emerald-500' : 'bg-slate-800'}`} style={{ width: `${progress}%` }} />
                              </div>
                            </div>

                            <button 
                              onClick={() => window.location.href = `/player/${course.id}`}
                              className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium py-3 md:py-2.5 rounded-xl text-xs transition-colors flex justify-center items-center gap-2">
                              {progress === 100 ? 'Review Course' : 'Continue'} <ChevronRight size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <hr className="border-slate-200 my-8" />

              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8 px-1">
                  <h4 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    Course Catalog
                  </h4>
                  
                  <div className="relative w-full sm:w-80">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Search size={16} className="text-slate-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search topics or skills..."
                      className="w-full pl-10 pr-4 py-3 md:py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-slate-400 bg-white transition-all font-medium text-slate-700 shadow-sm"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                {filteredAvailableCourses.length === 0 ? (
                  <div className="text-center p-10 md:p-12 bg-slate-50 rounded-[2rem] border border-slate-200 border-dashed">
                     <p className="text-slate-500 text-sm md:text-base font-medium">{searchQuery ? "No courses match your search criteria." : "No new courses available right now."}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {filteredAvailableCourses.map(course => (
                       <div key={course.id} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all duration-300">
                         <div className="relative h-40 md:h-48 overflow-hidden bg-slate-100">
                           <img src={course.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                           <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent opacity-80" />
                           <div className="absolute bottom-4 left-4 md:bottom-5 md:left-5 text-white text-xs font-medium flex items-center gap-2">
                             <span className="flex items-center gap-1 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/20"><Layers size={14} /> {course.modules?.length || 0} Modules</span>
                           </div>
                         </div>
                         
                         <div className="p-6 md:p-6 flex-1 flex flex-col justify-between">
                           <div>
                             <h3 className="font-bold text-lg text-slate-800 mb-2 leading-tight">{course.title}</h3>
                             <p className="text-slate-500 text-xs md:text-sm line-clamp-2 leading-relaxed mb-5 md:mb-6">{course.description}</p>
                             
                             {course.modules && course.modules.length > 0 && (
                               <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                 <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1"><BookA size={12}/> Syllabus Preview</p>
                                 <ul className="space-y-2">
                                   {course.modules.slice(0, 2).map((mod: any, idx: number) => (
                                      <li key={idx} className="text-xs font-medium text-slate-600 flex items-center gap-2 truncate">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0"></div>
                                        <span className="truncate">{mod.title}</span>
                                      </li>
                                   ))}
                                   {course.modules.length > 2 && (
                                      <li className="text-xs font-medium text-slate-400 italic pl-3">+ {course.modules.length - 2} more modules</li>
                                   )}
                                 </ul>
                               </div>
                             )}
                           </div>

                           <button 
                              onClick={async () => {
                                try {
                                  await fetch(`${API_BASE_URL}/api/courses/${course.id}/enroll`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ userId: parseInt(studentId || '0') })
                                  });
                                  fetchData(); 
                                } catch (err) { alert("Failed to enroll."); }
                              }}
                              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 rounded-xl text-sm transition-colors flex justify-center items-center gap-2 shadow-sm">
                             <PlusCircle size={16} /> Enroll Now
                           </button>
                         </div>
                       </div>
                     ))}
                   </div>
                )}
              </div>
           </div>
        )}

        {/* ATTENDANCE TAB */}
        {activeTab === 'attendance' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in">
             <div className="md:col-span-1 bg-white border border-slate-200 rounded-[2rem] p-6 md:p-8 shadow-sm flex flex-col items-center justify-center text-center">
                <div className="relative w-40 h-40 md:w-44 md:h-44 mb-6 flex items-center justify-center">
                   <svg className="absolute w-full h-full -rotate-90">
                      <circle cx="80" cy="80" r="68" className="fill-none stroke-slate-100" strokeWidth="10" />
                      <circle 
                        cx="80" cy="80" r="68" 
                        className={`fill-none transition-all duration-1000 ${isCritical ? 'stroke-rose-500' : 'stroke-slate-800'}`} 
                        strokeWidth="10" 
                        strokeDasharray={427}
                        strokeDashoffset={427 - (427 * attendancePercentage) / 100}
                        strokeLinecap="round"
                      />
                   </svg>
                   <div className="text-center">
                      <h2 className="text-3xl md:text-4xl font-bold text-slate-800">{attendancePercentage}%</h2>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Attendance</p>
                   </div>
                </div>
                <h3 className="font-bold text-slate-800 text-base md:text-lg">System Status</h3>
                <p className="text-slate-500 text-xs mt-2 leading-relaxed px-2 md:px-4">
                  {isCritical ? "Warning: Your attendance is below the institutional requirement of 75%." : "You're doing great! Keep up the consistent presence."}
                </p>
             </div>
             <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-[2rem] flex flex-col items-center justify-center shadow-sm">
                   <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600 mb-4"><CheckCircle size={28} className="md:w-8 md:h-8" /></div>
                   <h4 className="text-3xl md:text-4xl font-bold text-slate-800">{presentDays}</h4>
                   <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-1 md:mt-2">Days Present</p>
                </div>
                <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-[2rem] flex flex-col items-center justify-center shadow-sm">
                   <div className="p-4 bg-rose-50 rounded-2xl text-rose-600 mb-4"><XCircle size={28} className="md:w-8 md:h-8" /></div>
                   <h4 className="text-3xl md:text-4xl font-bold text-slate-800">{absentDays}</h4>
                   <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-1 md:mt-2">Days Absent</p>
                </div>
             </div>
          </div>
        )}

        {/* OFFICIAL TRANSCRIPT (Results) */}
        {activeTab === 'results' && (
           <div className="space-y-6 animate-in fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-900 p-6 md:p-8 rounded-[2rem] text-white shadow-lg gap-6 md:gap-4">
                 <div>
                    <h3 className="text-xl md:text-2xl font-bold">Academic Transcript</h3>
                    <p className="text-slate-400 text-xs md:text-sm font-medium mt-1">Validated results for the 2025-2026 session</p>
                 </div>
                 <button className="w-full sm:w-auto justify-center bg-white text-slate-900 hover:bg-slate-100 px-6 py-4 md:py-3 rounded-xl flex items-center gap-2 font-medium text-sm transition-colors whitespace-nowrap">
                    <Download size={18} /> Generate PDF
                 </button>
              </div>
              
              {Object.values(reportCards).map((card: any, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
                  <div className="p-5 md:p-6 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center px-6 md:px-8 gap-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">{card.category}</span>
                      <h3 className="text-lg md:text-xl font-bold text-slate-800 mt-1">{card.title}</h3>
                    </div>
                    <div className="text-left sm:text-right w-full sm:w-auto border-t border-slate-200 sm:border-none pt-4 sm:pt-0">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Score</p>
                       <div className="text-2xl md:text-3xl font-bold text-slate-800">{card.totalScore} <span className="text-slate-400 text-sm md:text-base font-normal">/ {card.totalMax}</span></div>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto w-full hide-scrollbar">
                    <table className="w-full text-xs md:text-sm text-left min-w-[500px]">
                      <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <tr>
                          <th className="p-4 md:p-6 pl-6 md:pl-10">Subject</th>
                          <th className="p-4 md:p-6 text-center">Maximum</th>
                          <th className="p-4 md:p-6 text-center">Obtained</th>
                          <th className="p-4 md:p-6 text-right pr-6 md:pr-10">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {card.subjects.map((s: any, sIdx: number) => {
                           const percent = (s.score / s.maxScore) * 100;
                           return (
                            <tr key={sIdx} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-4 md:p-6 pl-6 md:pl-10 font-semibold text-slate-700">{s.name}</td>
                              <td className="p-4 md:p-6 text-center font-medium text-slate-500">{s.maxScore}</td>
                              <td className="p-4 md:p-6 text-center font-bold text-slate-900 text-sm md:text-base">{s.score}</td>
                              <td className="p-4 md:p-6 text-right pr-6 md:pr-10">
                                 <span className={`px-3 py-1.5 md:px-3 md:py-1 rounded-md text-[10px] font-bold uppercase border whitespace-nowrap ${percent >= 40 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                                    {percent >= 40 ? 'Qualified' : 'Backlog'}
                                 </span>
                              </td>
                            </tr>
                           )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
           </div>
        )}

        {/* TIMETABLE TAB */}
        {activeTab === 'timetable' && (
           <div className="bg-white border border-slate-200 rounded-[2rem] p-5 md:p-8 shadow-sm animate-in fade-in">
              <div className="flex items-center gap-3 mb-6">
                 <div className="p-2.5 bg-slate-100 text-slate-600 rounded-lg border border-slate-200"><Calendar size={18} /></div>
                 <h3 className="font-bold text-slate-800 text-sm">Weekly Lecture Plan</h3>
              </div>
              
              <div className="overflow-x-auto rounded-xl border border-slate-200 w-full hide-scrollbar">
                <table className="w-full text-xs text-center min-w-[700px]">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-4 border-b border-r border-slate-200 w-24 md:w-32 bg-slate-100/50 text-center">Day / Slot</th>
                      {HOURS.map(h => <th key={h.start} className="p-4 border-b border-slate-200 whitespace-nowrap">{h.label}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {DAYS.map((day, idx) => (
                      <tr key={day} className={`hover:bg-slate-50/50 transition-colors ${idx !== DAYS.length - 1 ? 'border-b border-slate-100' : ''}`}>
                        <td className="p-4 font-bold text-slate-600 border-r border-slate-200 bg-slate-50/30 uppercase tracking-wider">{day.substring(0,3)}</td>
                        {HOURS.map(hour => {
                           const subject = getSubject(day, hour.start);
                           return (
                             <td key={hour.start} className={`p-4 border-r border-slate-100 font-semibold transition-all ${subject ? 'text-slate-900 bg-slate-50/50' : 'text-slate-300'}`}>
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

      {/* RENDER THE LIVE CHAT COMPONENT */}
      {student && <LiveChat currentUser={student} roomName={student.branch || "General"} />}
    </div>
  );
};
export default StudentDashboard;