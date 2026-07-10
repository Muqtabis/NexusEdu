import { useEffect, useState } from 'react';
import { Users, Trash2, Shield, BookOpen, Loader2, Plus, X, Calendar, Megaphone, Trophy, Filter, Search, UserPlus, AlertTriangle } from 'lucide-react';
import { API_BASE_URL } from '../../lib/api';

interface SubjectAllocation { id: number; className: string; subject: string; }
interface User { id: number; name: string; email: string; role: string; branch?: string; classTeacherOf?: string; subjectAllocations: SubjectAllocation[]; }
interface ExamResult { id: number; examName: string; score: number; maxScore: number; date: string; student: { name: string; branch?: string }; }

const HOURS = [ { label: "09:00 - 10:00", start: "09:00", end: "10:00" }, { label: "10:00 - 11:00", start: "10:00", end: "11:00" }, { label: "11:00 - 12:00", start: "11:00", end: "12:00" }, { label: "12:00 - 01:00", start: "12:00", end: "13:00" }, { label: "02:00 - 03:00", start: "14:00", end: "15:00" }, { label: "03:00 - 04:00", start: "15:00", end: "16:00" } ];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const COMMON_SUBJECTS = ["Mathematics", "Science", "English", "History", "Physics", "Chemistry", "Biology", "Computer Science", "Social Studies", "Art", "Physical Education", "Break", "Library", "Sports"];

const getClassOptions = () => {
  const classes = ["Kindergarten"];
  for (let i = 1; i <= 10; i++) { classes.push(`Class ${i}-A`); if(i <= 6) classes.push(`Class ${i}-B`); }
  return classes;
};

const AdminDashboard = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [events, setEvents] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'teachers' | 'timetable' | 'results' | 'events'>('users');

  // Filters & Search
  const [userFilter, setUserFilter] = useState<string>("All"); 
  const [searchQuery, setSearchQuery] = useState("");
  const [eventTabFilter, setEventTabFilter] = useState<'all' | 'event' | 'holiday' | 'exam'>('all');

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'student', branch: 'Class 1-A' });

  // Teacher Management
  const [selectedTeacher, setSelectedTeacher] = useState<number | null>(null);
  const [newSubject, setNewSubject] = useState(COMMON_SUBJECTS[0]);
  const [newClass, setNewClass] = useState("Class 1-A");

  // Timetable
  const [ttClass, setTtClass] = useState("Class 10-A");
  const [schedule, setSchedule] = useState<any[]>([]); 
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  // Events Form
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventType, setEventType] = useState("event");

  const classOptions = getClassOptions();

  const fetchData = async () => {
    try {
      const [resUsers, resResults, resEvents] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/users`), 
        fetch(`${API_BASE_URL}/admin/results`),
        fetch(`${API_BASE_URL}/events`)
      ]);
      
      setUsers(await resUsers.json());
      if (resResults.ok) setResults(await resResults.json());
      if (resEvents.ok) setEvents(await resEvents.json());
      
    } catch (error) { console.error("Data fetch error", error); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const fetchSchedule = async () => {
    setLoadingSchedule(true);
    try {
      const res = await fetch(`${API_BASE_URL}/timetable/class/${ttClass}`);
      setSchedule(await res.json());
    } catch (err) {} finally { setLoadingSchedule(false); }
  };

  useEffect(() => { if (activeTab === 'timetable') fetchSchedule(); }, [ttClass, activeTab]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      if (res.ok) {
        setShowCreateModal(false);
        setNewUser({ name: '', email: '', password: '', role: 'student', branch: 'Class 1-A' });
        fetchData();
      } else { alert("Failed to create user. Email might exist."); }
    } catch (err) { alert("Server error"); }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm("Permanently delete this user and all associated records?")) return;
    await fetch(`${API_BASE_URL}/admin/user/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const handleCellUpdate = async (day: string, hour: any, subject: string) => {
    if (subject && subject !== "Break") {
        const isConflict = schedule.some(s => s.day === day && s.startTime === hour.start && s.subject === subject);
        if (isConflict) alert("⚠️ Note: This subject is already scheduled elsewhere at this time.");
    }
    const newSlot = { day, startTime: hour.start, subject };
    setSchedule(prev => [...prev.filter(s => !(s.day === day && s.startTime === hour.start)), newSlot]);
    try { await fetch(`${API_BASE_URL}/admin/timetable`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ className: ttClass, day, startTime: hour.start, endTime: hour.end, subject }) }); } 
    catch (err) { fetchSchedule(); }
  };

  const handleAddEvent = async () => {
    if (!eventTitle || !eventDate) return;
    await fetch(`${API_BASE_URL}/admin/event`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: eventTitle, date: eventDate, description: "School Event", type: eventType }) });
    alert("Event Published! 📅"); 
    setEventTitle(""); 
    setEventDate("");
    fetchData(); 
  };

  const handleAssignClassTeacher = async (teacherId: number, className: string) => {
    await fetch(`${API_BASE_URL}/admin/assign-class-teacher`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ teacherId, className }) });
    fetchData();
  };

  const handleAddSubject = async (teacherId: number) => {
    await fetch(`${API_BASE_URL}/admin/assign-subject`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ teacherId, className: newClass, subject: newSubject }) });
    setSelectedTeacher(null); fetchData();
  };

  const handleRemoveSubject = async (allocationId: number) => {
    await fetch(`${API_BASE_URL}/admin/subject/${allocationId}`, { method: 'DELETE' }); fetchData();
  };

  const getSubject = (day: string, startTime: string) => { const slot = schedule.find(s => s.day === day && s.startTime === startTime); return slot ? slot.subject : ""; };

  // Filtering Logic
  const filteredUsers = users.filter(u => {
    const matchesFilter = userFilter === "All" || (userFilter === "Teacher" && u.role === 'teacher') || (userFilter === "Admin" && u.role === 'admin') || (u.branch === userFilter);
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filteredRecords = results.filter(r => {
    const matchClass = userFilter === "All" || r.student.branch === userFilter;
    const matchSearch = r.student.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.examName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchClass && matchSearch;
  });

  const filteredEvents = events.filter(evt => eventTabFilter === 'all' || evt.type === eventTabFilter);

  if (loading) return <div className="p-20 text-center flex flex-col items-center gap-4"><Loader2 className="animate-spin text-indigo-600" size={40} /> <p className="font-bold text-slate-500">Initializing Command Center...</p></div>;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      
      {/* HEADER & STAT CARDS */}
      <div className="p-8 rounded-[2rem] bg-slate-900 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-black flex items-center gap-3"><Shield className="text-emerald-400" size={32} /> Principal's Office</h1>
            <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-xs">NexusEdu Central Management</p>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/20">
            <UserPlus size={18} /> Add New User
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {[
                { label: "Students", val: users.filter(u => u.role === 'student').length, color: "text-blue-400" },
                { label: "Teachers", val: users.filter(u => u.role === 'teacher').length, color: "text-purple-400" },
                { label: "Classes", val: new Set(users.map(u => u.branch).filter(Boolean)).size, color: "text-amber-400" },
                { label: "Results", val: results.length, color: "text-emerald-400" }
            ].map((stat, i) => (
                <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter mb-1">{stat.label}</p>
                    <h2 className={`text-2xl font-black ${stat.color}`}>{stat.val}</h2>
                </div>
            ))}
        </div>
      </div>

      {/* NAVIGATION */}
      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        {['users', 'teachers', 'timetable', 'events', 'results'].map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab as any)} 
            className={`pb-4 px-6 text-sm font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* UNIVERSAL SEARCH BAR */}
      {(activeTab === 'users' || activeTab === 'results') && (
        <div className="flex flex-col md:flex-row gap-4 items-center">
             <div className="relative flex-1">
                <Search size={18} className="absolute left-4 top-3.5 text-slate-400" />
                <input 
                    className="w-full pl-12 p-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium" 
                    placeholder="Global Search (Name, Email, or Exam)..." 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                />
            </div>
            <div className="flex items-center gap-3 bg-white border border-slate-200 p-2 rounded-2xl shadow-sm">
                <Filter size={18} className="ml-2 text-slate-400" />
                <select className="bg-transparent font-bold text-slate-700 outline-none pr-4" value={userFilter} onChange={(e) => setUserFilter(e.target.value)}>
                    <option value="All">All Categories</option>
                    <option value="Teacher">Faculty Only</option>
                    <option value="Admin">Administrators</option>
                    <optgroup label="Filter By Class">{classOptions.map(c => <option key={c} value={c}>{c}</option>)}</optgroup>
                </select>
            </div>
        </div>
      )}

      {/* TAB CONTENT: USERS DIRECTORY */}
      {activeTab === 'users' && (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm animate-in slide-in-from-bottom-4">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-widest">
                <tr><th className="p-5">Identity</th><th className="p-5">Access Level</th><th className="p-5">Branch</th><th className="p-5 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.map(u => (
                <tr key={u.id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="p-5">
                        <div className="font-bold text-slate-800 text-base">{u.name}</div>
                        <div className="text-xs text-slate-400 font-medium">{u.email}</div>
                    </td>
                    <td className="p-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${u.role==='admin'?'bg-emerald-50 text-emerald-600 border-emerald-100':u.role==='teacher'?'bg-indigo-50 text-indigo-600 border-indigo-100':'bg-slate-50 text-slate-500 border-slate-200'}`}>
                            {u.role}
                        </span>
                    </td>
                    <td className="p-5 font-bold text-slate-600">{u.branch || '-'}</td>
                    <td className="p-5 text-right">
                        {u.role !== 'admin' && (
                            <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={18}/></button>
                        )}
                    </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB CONTENT: ACADEMIC RECORDS */}
      {activeTab === 'results' && (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-widest">
              <tr><th className="p-5">Student</th><th className="p-5">Assessment</th><th className="p-5 text-right">Score</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredRecords.map(r => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="p-5">
                    <div className="font-bold text-slate-800">{r.student.name}</div>
                    <div className="text-[10px] font-black text-slate-400 uppercase">{r.student.branch}</div>
                  </td>
                  <td className="p-5 font-bold text-indigo-600">{r.examName}</td>
                  <td className="p-5 text-right font-black text-slate-800 text-lg">{r.score}<span className="text-slate-300 text-sm font-normal">/{r.maxScore}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB CONTENT: TIMETABLE */}
      {activeTab === 'timetable' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800">Master Class Schedule</h3>
            <select className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold rounded-2xl outline-none" value={ttClass} onChange={e => setTtClass(e.target.value)}>
                {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
             <table className="w-full text-xs text-center border-collapse">
                <thead className="bg-slate-50 text-slate-400 font-black uppercase tracking-tighter">
                    <tr><th className="p-4 border-b border-r border-slate-100 bg-slate-100/50">Day</th>{HOURS.map(h => <th key={h.start} className="p-4 border-b border-slate-100 min-w-[120px]">{h.label}</th>)}</tr>
                </thead>
                <tbody>
                    {DAYS.map(day => (
                        <tr key={day} className="hover:bg-slate-50">
                            <td className="p-4 font-black text-slate-500 bg-slate-50 border-r border-slate-100">{day.substring(0,3)}</td>
                            {HOURS.map(hour => {
                                const currentSubject = getSubject(day, hour.start);
                                return (
                                    <td key={`${day}-${hour.start}`} className="p-1 border-r border-slate-100 h-16">
                                        <select 
                                            className={`w-full h-full p-2 bg-transparent rounded-lg font-black outline-none cursor-pointer transition-all ${currentSubject?'text-indigo-600':'text-slate-300 font-normal'}`}
                                            value={currentSubject} onChange={(e) => handleCellUpdate(day, hour, e.target.value)}
                                        >
                                            <option value="">-</option>
                                            {COMMON_SUBJECTS.map(subj => <option key={subj} value={subj}>{subj}</option>)}
                                        </select>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
             </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: TEACHER MANAGEMENT */}
      {activeTab === 'teachers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {users.filter(u => u.role === 'teacher').map((teacher) => (
            <div key={teacher.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:border-indigo-200 transition-all">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-black text-slate-800 text-lg leading-tight">{teacher.name}</h3>
                  <p className="text-slate-400 text-xs font-medium">{teacher.email}</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Class Teacher</p>
                    <select className="bg-slate-100 border-none font-bold text-xs rounded-lg px-2 py-1 outline-none" value={teacher.classTeacherOf || ""} onChange={(e) => handleAssignClassTeacher(teacher.id, e.target.value)}>
                        <option value="">None</option>{classOptions.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                    </select>
                </div>
              </div>
              
              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subjects & Classes</p>
                <div className="flex flex-wrap gap-2">
                  {teacher.subjectAllocations.map(alloc => (
                    <div key={alloc.id} className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl text-xs font-black border border-indigo-100">
                      {alloc.subject} • {alloc.className}
                      <button onClick={() => handleRemoveSubject(alloc.id)} className="text-indigo-300 hover:text-rose-500"><X size={14}/></button>
                    </div>
                  ))}
                  <button onClick={() => setSelectedTeacher(teacher.id)} className="flex items-center gap-1 text-[10px] font-black text-slate-400 border-2 border-dashed border-slate-200 px-3 py-1.5 rounded-xl hover:bg-slate-50 uppercase tracking-tighter transition-all">
                    <Plus size={14}/> Add Allocation
                  </button>
                </div>
              </div>

              {/* ALLOCATION POPUP */}
              {selectedTeacher === teacher.id && (
                  <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 animate-in zoom-in-95">
                      <div className="flex gap-2 mb-3">
                        <select className="flex-1 text-xs font-bold border border-slate-200 rounded-xl p-2 outline-none" value={newClass} onChange={e => setNewClass(e.target.value)}>{classOptions.map(c => <option key={c} value={c}>{c}</option>)}</select>
                        <select className="flex-1 text-xs font-bold border border-slate-200 rounded-xl p-2 outline-none" value={newSubject} onChange={e => setNewSubject(e.target.value)}>{COMMON_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}</select>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleAddSubject(teacher.id)} className="flex-1 bg-indigo-600 text-white p-2 rounded-xl text-xs font-bold">Confirm Allocation</button>
                        <button onClick={() => setSelectedTeacher(null)} className="p-2 text-slate-400"><X size={16}/></button>
                      </div>
                  </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* NEW DYNAMIC EVENTS PANEL */}
      {activeTab === 'events' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4">
          
          {/* LEFT: PUBLISH FORM */}
          <div className="lg:col-span-1 bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm h-fit">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4"><Megaphone size={32} /></div>
              <h3 className="font-black text-slate-800 text-2xl">Broadcast</h3>
              <p className="text-slate-400 text-sm font-medium">Post new updates for the campus</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">Title</label>
                <input className="w-full p-4 border border-slate-100 rounded-2xl bg-slate-50 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" value={eventTitle} onChange={e => setEventTitle(e.target.value)} placeholder="E.g., Sports Meet" />
              </div>
              <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">Date</label>
                    <input type="date" className="w-full p-4 border border-slate-100 rounded-2xl bg-slate-50 font-bold text-slate-700 outline-none" value={eventDate} onChange={e => setEventDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">Type</label>
                    <select className="w-full p-4 border border-slate-100 rounded-2xl bg-slate-50 font-bold text-slate-700 outline-none" value={eventType} onChange={e => setEventType(e.target.value)}>
                      <option value="event">General Event</option>
                      <option value="holiday">Holiday</option>
                      <option value="exam">Examination</option>
                    </select>
                  </div>
              </div>
              <button onClick={handleAddEvent} className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 mt-2">Publish Now</button>
            </div>
          </div>

          {/* RIGHT: LIVE FEED & FILTERS */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <h3 className="font-black text-slate-800 text-xl flex items-center gap-2"><Calendar size={20} className="text-indigo-600"/> Published Feed</h3>
                <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 overflow-x-auto">
                    {['all', 'event', 'exam', 'holiday'].map((f) => (
                        <button 
                            key={f}
                            onClick={() => setEventTabFilter(f as any)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${eventTabFilter === f ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 hide-scrollbar">
                {filteredEvents.length === 0 ? (
                    <div className="p-20 text-center text-slate-300">No announcements found in this category.</div>
                ) : (
                    filteredEvents.map(evt => (
                        <div key={evt.id} className="p-5 border border-slate-100 bg-slate-50 rounded-[1.5rem] flex items-center justify-between hover:border-indigo-200 transition-all group">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl border ${evt.type === 'holiday' ? 'bg-amber-100 text-amber-600 border-amber-200' : evt.type === 'exam' ? 'bg-rose-100 text-rose-600 border-rose-200' : 'bg-indigo-100 text-indigo-600 border-indigo-200'}`}>
                                    <Megaphone size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800">{evt.title}</h4>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                        {new Date(evt.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-white border border-slate-200 rounded-lg text-slate-500">{evt.type}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE USER */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full relative shadow-3xl animate-in zoom-in-95">
            <button onClick={() => setShowCreateModal(false)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-600"><X size={24} /></button>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Register User</h2>
            <p className="text-slate-400 text-sm font-medium mb-8">Manually add a student, teacher, or staff member.</p>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
                <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none" placeholder="Full Name" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} required />
                <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none" placeholder="Email" type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} required />
                <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none" placeholder="Password" type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} required />
                
                <div className="grid grid-cols-2 gap-4">
                    <select className="p-4 bg-slate-50 rounded-2xl font-bold border border-slate-100" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                        <option value="student">Student</option><option value="teacher">Teacher</option><option value="admin">Admin</option>
                    </select>
                    {newUser.role === 'student' && (
                        <select className="p-4 bg-slate-50 rounded-2xl font-bold border border-slate-100" value={newUser.branch} onChange={e => setNewUser({...newUser, branch: e.target.value})}>
                            {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    )}
                </div>
                <button type="submit" className="w-full bg-indigo-600 text-white p-5 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-indigo-100 mt-4">Save Identity</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;