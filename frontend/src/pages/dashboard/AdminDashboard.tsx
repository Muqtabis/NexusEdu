import { useEffect, useState } from 'react';
import { Users, Trash2, Shield, BookOpen, Loader2, Plus, X, Calendar, Clock, Megaphone, Trophy, Filter, Search } from 'lucide-react';

interface SubjectAllocation { id: number; className: string; subject: string; }
interface User { id: number; name: string; email: string; role: string; branch?: string; classTeacherOf?: string; subjectAllocations: SubjectAllocation[]; }
interface ExamResult { id: number; examName: string; score: number; maxScore: number; date: string; student: { name: string; branch?: string }; }

const HOURS = [ { label: "09:00 - 10:00", start: "09:00", end: "10:00" }, { label: "10:00 - 11:00", start: "10:00", end: "11:00" }, { label: "11:00 - 12:00", start: "11:00", end: "12:00" }, { label: "12:00 - 01:00", start: "12:00", end: "13:00" }, { label: "02:00 - 03:00", start: "14:00", end: "15:00" }, { label: "03:00 - 04:00", start: "15:00", end: "16:00" } ];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const COMMON_SUBJECTS = ["Mathematics", "Science", "English", "History", "Physics", "Chemistry", "Biology", "Computer Science", "Social Studies", "Art", "Physical Education", "Break", "Library", "Sports"];

const getClassOptions = () => {
  const classes = ["Kindergarten"];
  for (let i = 1; i <= 6; i++) { classes.push(`Class ${i}-A`); classes.push(`Class ${i}-B`); }
  for (let i = 7; i <= 10; i++) { classes.push(`Class ${i}-A`); }
  return classes;
};

const AdminDashboard = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'users' | 'teachers' | 'timetable' | 'results' | 'events'>('users');

  const [userFilter, setUserFilter] = useState<string>("All"); 
  const [recordFilter, setRecordFilter] = useState<string>("All"); 
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedTeacher, setSelectedTeacher] = useState<number | null>(null);
  const [newSubject, setNewSubject] = useState(COMMON_SUBJECTS[0]);
  const [newClass, setNewClass] = useState("Class 1-A");

  const [ttClass, setTtClass] = useState("Class 10-A");
  const [schedule, setSchedule] = useState<any[]>([]); 
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventType, setEventType] = useState("event");

  const classOptions = getClassOptions();

  const fetchData = async () => {
    try {
      const [resUsers, resResults] = await Promise.all([
        fetch('http://localhost:4000/admin/users'), fetch('http://localhost:4000/admin/results')
      ]);
      setUsers(await resUsers.json());
      if (resResults.ok) setResults(await resResults.json());
    } catch (error) { console.error("Data fetch error", error); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const fetchSchedule = async () => {
    setLoadingSchedule(true);
    try {
      const res = await fetch(`http://localhost:4000/timetable/class/${ttClass}`);
      setSchedule(await res.json());
    } catch (err) {} finally { setLoadingSchedule(false); }
  };

  useEffect(() => { if (activeTab === 'timetable') fetchSchedule(); }, [ttClass, activeTab]);

  const handleAssignClassTeacher = async (teacherId: number, className: string) => {
    await fetch('http://localhost:4000/admin/assign-class-teacher', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ teacherId, className }) });
    fetchData();
  };
  const handleAddSubject = async (teacherId: number) => {
    await fetch('http://localhost:4000/admin/assign-subject', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ teacherId, className: newClass, subject: newSubject }) });
    setSelectedTeacher(null); fetchData();
  };
  const handleRemoveSubject = async (allocationId: number) => {
    await fetch(`http://localhost:4000/admin/subject/${allocationId}`, { method: 'DELETE' }); fetchData();
  };
  const handleDeleteUser = async (id: number) => {
    if (!confirm("Delete user?")) return;
    await fetch(`http://localhost:4000/admin/user/${id}`, { method: 'DELETE' }); fetchData();
  };
  const handleCellUpdate = async (day: string, hour: any, subject: string) => {
    const newSlot = { day, startTime: hour.start, subject };
    setSchedule(prev => [...prev.filter(s => !(s.day === day && s.startTime === hour.start)), newSlot]);
    try { await fetch('http://localhost:4000/admin/timetable', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ className: ttClass, day, startTime: hour.start, endTime: hour.end, subject }) }); } 
    catch (err) { fetchSchedule(); }
  };
  const getSubject = (day: string, startTime: string) => { const slot = schedule.find(s => s.day === day && s.startTime === startTime); return slot ? slot.subject : ""; };
  const handleAddEvent = async () => {
    if (!eventTitle || !eventDate) return;
    await fetch('http://localhost:4000/admin/event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: eventTitle, date: eventDate, description: "School Event", type: eventType }) });
    alert("Event Published! 📅"); setEventTitle(""); setEventDate("");
  };

  const filteredUsers = users
    .filter(u => {
      if (userFilter === "All") return true;
      if (userFilter === "Teacher") return u.role === 'teacher';
      if (userFilter === "Admin") return u.role === 'admin';
      return u.role === 'student' && u.branch === userFilter;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const filteredRecords = results
    .filter(r => {
      const matchClass = recordFilter === "All" || r.student.branch === recordFilter;
      const matchSearch = r.student.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.examName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchClass && matchSearch;
    })
    .sort((a, b) => a.student.name.localeCompare(b.student.name));

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin inline"/> Loading...</div>;

  return (
    <div className="flex flex-col gap-6">
      <div className="p-6 rounded-[1.5rem] bg-slate-900 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl font-bold flex items-center gap-3"><Shield className="text-emerald-400" /> Principal's Command Center</h1>
          <p className="text-slate-400 text-sm mt-1">System Overview & Academic Management</p>
        </div>
      </div>

      <div className="flex gap-4 border-b border-slate-200 overflow-x-auto hide-scrollbar">
        <button onClick={() => setActiveTab('users')} className={`pb-3 text-sm font-bold whitespace-nowrap px-4 ${activeTab === 'users' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}>Users Directory</button>
        <button onClick={() => setActiveTab('teachers')} className={`pb-3 text-sm font-bold whitespace-nowrap px-4 ${activeTab === 'teachers' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}>Manage Teachers</button>
        <button onClick={() => setActiveTab('timetable')} className={`pb-3 text-sm font-bold whitespace-nowrap px-4 ${activeTab === 'timetable' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}>Timetable</button>
        <button onClick={() => setActiveTab('events')} className={`pb-3 text-sm font-bold whitespace-nowrap px-4 ${activeTab === 'events' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}>Post Events</button>
        <button onClick={() => setActiveTab('results')} className={`pb-3 text-sm font-bold whitespace-nowrap px-4 ${activeTab === 'results' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}>Academic Records</button>
      </div>

      {activeTab === 'users' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h3 className="font-bold text-slate-700 flex items-center gap-2"><Users size={18} /> Directory ({filteredUsers.length})</h3>
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-slate-400" />
              <select className="p-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 outline-none focus:border-indigo-500" value={userFilter} onChange={(e) => setUserFilter(e.target.value)}>
                <option value="All">All Users</option>
                <option value="Teacher">Staff: Teachers</option>
                <option value="Admin">Staff: Admins</option>
                <optgroup label="Students by Class">{classOptions.map(c => <option key={c} value={c}>{c}</option>)}</optgroup>
              </select>
            </div>
          </div>
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100"><tr><th className="p-4">Name</th><th className="p-4">Role</th><th className="p-4">Class/Branch</th><th className="p-4 text-right">Action</th></tr></thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.map(u => (
                <tr key={u.id} className="hover:bg-slate-50"><td className="p-4 font-bold text-slate-700">{u.name}<br/><span className="text-xs font-normal text-slate-400">{u.email}</span></td><td className="p-4 uppercase text-xs font-bold">{u.role}</td><td className="p-4 font-medium text-slate-600">{u.branch || '-'}</td><td className="p-4 text-right">{u.role !== 'admin' && <button onClick={() => handleDeleteUser(u.id)} className="text-rose-500"><Trash2 size={16}/></button>}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'results' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h3 className="font-bold text-slate-700 flex items-center gap-2"><Trophy size={18} className="text-amber-500" /> Academic Records</h3>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative w-full md:w-48">
                <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                <input className="w-full pl-9 p-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500" placeholder="Search student or subject..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <select className="p-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 outline-none focus:border-indigo-500" value={recordFilter} onChange={(e) => setRecordFilter(e.target.value)}>
                <option value="All">All Classes</option>
                <optgroup label="Filter by Class">{classOptions.map(c => <option key={c} value={c}>{c}</option>)}</optgroup>
              </select>
            </div>
          </div>

          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
              <tr><th className="p-4">Student Name</th><th className="p-4">Class</th><th className="p-4">Subject / Exam</th><th className="p-4 text-right">Score</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredRecords.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-slate-400">No records found.</td></tr>
              ) : (
                filteredRecords.map(r => {
                  const isSubjectFormatted = r.examName.includes(' - ');
                  const subject = isSubjectFormatted ? r.examName.split(' - ')[0] : 'General';
                  const testName = isSubjectFormatted ? r.examName.split(' - ')[1] : r.examName;

                  return (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="p-4 font-bold text-slate-800">{r.student.name}</td>
                      <td className="p-4 font-medium text-slate-600"><span className="px-2 py-1 bg-slate-100 rounded text-xs">{r.student.branch || '-'}</span></td>
                      <td className="p-4">
                        <span className="font-bold text-indigo-700">{subject}</span>
                        <span className="text-slate-400 text-xs ml-2 border-l border-slate-300 pl-2">{testName}</span>
                      </td>
                      <td className="p-4 text-right font-black text-slate-800">{r.score} <span className="text-slate-400 text-xs font-normal">/ {r.maxScore}</span></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'teachers' && (
        <div className="space-y-6">
          {users.filter(u => u.role === 'teacher').map((teacher) => (
            <div key={teacher.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><BookOpen size={20} className="text-indigo-600"/> {teacher.name}</h3>
                  <p className="text-slate-400 text-sm">{teacher.email}</p>
                </div>
                <div className="flex items-center gap-2 bg-indigo-50 p-2 rounded-lg border border-indigo-100">
                  <span className="text-xs font-bold text-indigo-800 uppercase">Class Teacher Of:</span>
                  <select className="bg-white border border-indigo-200 text-sm rounded px-2 py-1 outline-none" value={teacher.classTeacherOf || ""} onChange={(e) => handleAssignClassTeacher(teacher.id, e.target.value)}>
                    <option value="">-- None --</option>{classOptions.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Subject Allocations</h4>
                <div className="flex flex-wrap gap-2 mb-3">
                  {teacher.subjectAllocations.map(alloc => (
                    <div key={alloc.id} className="flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full text-xs font-medium text-slate-700">
                      <span>{alloc.subject} • {alloc.className}</span><button onClick={() => handleRemoveSubject(alloc.id)} className="text-slate-400 hover:text-rose-500"><X size={14}/></button>
                    </div>
                  ))}
                  <div className="relative">
                    {selectedTeacher === teacher.id ? (
                      <div className="flex items-center gap-2">
                        <select className="text-xs border border-slate-300 rounded p-1" value={newClass} onChange={e => setNewClass(e.target.value)}>{classOptions.map(c => <option key={c} value={c}>{c}</option>)}</select>
                        <select className="text-xs border border-slate-300 rounded p-1" value={newSubject} onChange={e => setNewSubject(e.target.value)}>{COMMON_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}</select>
                        <button onClick={() => handleAddSubject(teacher.id)} className="bg-emerald-500 text-white p-1 rounded hover:bg-emerald-600"><Plus size={14}/></button>
                        <button onClick={() => setSelectedTeacher(null)} className="text-slate-400 hover:text-slate-600"><X size={14}/></button>
                      </div>
                    ) : ( <button onClick={() => setSelectedTeacher(teacher.id)} className="flex items-center gap-1 text-xs font-bold text-indigo-600 border border-dashed border-indigo-300 px-3 py-1.5 rounded-full hover:bg-indigo-50"><Plus size={14}/> Add Subject</button> )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'timetable' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <div><h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Calendar className="text-indigo-600" /> Weekly Class Schedule</h3></div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500 uppercase">Viewing:</span>
              <select className="p-2.5 bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold rounded-lg outline-none cursor-pointer" value={ttClass} onChange={e => setTtClass(e.target.value)}>
                {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          {loadingSchedule ? ( <div className="p-10 text-center text-slate-400"><Loader2 className="animate-spin inline"/> Loading Schedule...</div> ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-bold">
                  <tr><th className="p-4 border-b border-r border-slate-200 w-32 bg-slate-100">Day / Time</th>{HOURS.map(h => <th key={h.start} className="p-4 border-b border-slate-200 min-w-[140px] text-center">{h.label}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {DAYS.map(day => (
                    <tr key={day} className="hover:bg-slate-50">
                      <td className="p-4 font-bold text-slate-700 bg-slate-50 border-r border-slate-200">{day}</td>
                      {HOURS.map(hour => {
                        const currentSubject = getSubject(day, hour.start);
                        return (
                          <td key={`${day}-${hour.start}`} className="p-1 border-r border-slate-100 relative group h-16">
                            <select 
                              className={`w-full h-full p-2 bg-transparent rounded-lg text-xs font-bold outline-none cursor-pointer text-center ${currentSubject==='Break'?'text-amber-700':currentSubject?'text-indigo-700':'text-slate-400 font-normal'}`}
                              value={currentSubject} onChange={(e) => handleCellUpdate(day, hour, e.target.value)}
                            >
                              <option value="" className="text-slate-300">- Free -</option>
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
          )}
        </div>
      )}

      {activeTab === 'events' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm max-w-lg mx-auto mt-4">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Megaphone size={24} /></div>
            <div><h3 className="font-bold text-slate-800 text-lg">Post School Announcement</h3></div>
          </div>
          <div className="space-y-4">
            <div><label className="block text-xs font-bold text-slate-500 mb-1">Event Title</label><input className="w-full p-3 border border-slate-200 rounded-lg bg-slate-50" value={eventTitle} onChange={e => setEventTitle(e.target.value)} /></div>
            <div><label className="block text-xs font-bold text-slate-500 mb-1">Date</label><input type="date" className="w-full p-3 border border-slate-200 rounded-lg bg-slate-50" value={eventDate} onChange={e => setEventDate(e.target.value)} /></div>
            <div><label className="block text-xs font-bold text-slate-500 mb-1">Category</label><select className="w-full p-3 border border-slate-200 rounded-lg bg-slate-50" value={eventType} onChange={e => setEventType(e.target.value)}><option value="event">General Event</option><option value="holiday">Holiday</option><option value="exam">Examination</option></select></div>
            <button onClick={handleAddEvent} className="w-full bg-indigo-600 text-white p-3 rounded-xl font-bold hover:bg-indigo-700">Publish to Calendar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;