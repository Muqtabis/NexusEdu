import { useEffect, useState } from 'react';
import { 
  Users, Save, Check, X, PlusCircle, Clock, Loader2, FileText, 
  Star, ExternalLink, Trophy, Filter, Lock, Send, AlertCircle, 
  Layers, BookOpen, CheckCircle, ArrowRight
} from 'lucide-react';

interface Assignment { id: number; title: string; status: string; submissionUrl?: string; grade?: string; feedback?: string; }
interface Student { id: number; name: string; email: string; branch?: string; rollNumber?: string; status: 'present' | 'absent' | 'late'; assignments: Assignment[]; }
interface DashboardOption { label: string; className: string; subject: string; role: "class_teacher" | "subject_teacher"; }

const TeacherDashboard = () => {
  // Data State
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [dashboardOptions, setDashboardOptions] = useState<DashboardOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<DashboardOption | null>(null);
  
  // Course State for LMS
  const [courses, setCourses] = useState<any[]>([]);
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Tab Memory Fix
  const [activeTab, setActiveTab] = useState<'attendance' | 'assignments' | 'gradebook' | 'courses'>(
    (localStorage.getItem('teacherTab') as any) || 'attendance'
  );

  useEffect(() => {
    localStorage.setItem('teacherTab', activeTab);
  }, [activeTab]);

  // Grading Modal State
  const [selectedWork, setSelectedWork] = useState<{student: Student, work: Assignment} | null>(null);
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');

  // Smart Gradebook State
  const [examCategory, setExamCategory] = useState('Class Test');
  const [examTitle, setExamTitle] = useState('');
  const [maxScore, setMaxScore] = useState('100');
  const [marks, setMarks] = useState<Record<number, string>>({});

  const teacherId = parseInt(localStorage.getItem('userId') || '0');

  const fetchMyData = async () => {
    try {
      // 1. Fetch Students & Classes
      const res = await fetch(`${import.meta.env.VITE_API_URL}/teacher/${teacherId}/students`);
      const data = await res.json();
      
      if (data.students) {
        const formatted = data.students.map((s: any) => ({ ...s, status: 'present', assignments: s.assignments || [] }));
        setAllStudents(formatted);
        setDashboardOptions(data.dashboardOptions);
        if (data.dashboardOptions.length > 0) setSelectedOption(data.dashboardOptions[0]);
      }

      // 2. Fetch Published LMS Courses
      const courseRes = await fetch(`${import.meta.env.VITE_API_URL}/api/courses`);
      if (courseRes.ok) setCourses(await courseRes.json());

    } catch (error) { 
      console.error(error); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchMyData(); }, []);

  useEffect(() => {
    if (selectedOption) {
      setFilteredStudents(allStudents.filter(s => s.branch === selectedOption.className));
    } else {
      setFilteredStudents([]);
    }
  }, [selectedOption, allStudents]);

  // --- ANALYTICS CALCULATIONS ---
  const presentCount = filteredStudents.filter(s => s.status === 'present').length;
  const absentCount = filteredStudents.filter(s => s.status === 'absent').length;
  const lateCount = filteredStudents.filter(s => s.status === 'late').length;
  
  const pendingGradingCount = filteredStudents.reduce((acc, student) => {
    return acc + student.assignments.filter(a => a.status === 'submitted').length;
  }, 0);

  // --- ACTIONS ---
  const toggleStatus = (id: number) => {
    if (selectedOption?.role !== "class_teacher") {
      alert("🔒 Access Denied: Only the Class Teacher can mark attendance.");
      return;
    }
    setFilteredStudents(prev => prev.map(s => {
      if (s.id !== id) return s;
      if (s.status === 'present') return { ...s, status: 'absent' };
      if (s.status === 'absent') return { ...s, status: 'late' };
      return { ...s, status: 'present' };
    }));
  };

  const saveAttendance = async () => {
    setSaving(true);
    try {
      const date = new Date().toISOString();
      for (const student of filteredStudents) {
        await fetch(`${import.meta.env.VITE_API_URL}/attendance`, { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ studentId: student.id, status: student.status, date: date, teacherId: teacherId }) 
        });
      }
      alert(`Attendance Saved for ${selectedOption?.className}! ✅`);
    } catch (err) { 
      alert('Error saving attendance.'); 
    } finally { 
      setSaving(false); 
    }
  };

  const assignHomework = async () => {
    if (!selectedOption) return;
    const defaultSubject = selectedOption.subject !== "General" ? selectedOption.subject : "";
    const title = prompt(`Assign Homework to ${selectedOption.className}\nEnter Title:`);
    if (!title) return;
    const subject = prompt("Enter Subject:", defaultSubject);
    if (!subject) return;

    try {
      for (const student of filteredStudents) {
        await fetch(`${import.meta.env.VITE_API_URL}/assignment`, { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ title, subject, dueDate: new Date().toISOString(), studentId: student.id }) 
        });
      }
      alert(`Assignment sent to ${selectedOption.className}! 📚`);
      fetchMyData();
    } catch (err) { 
      alert('Failed to send assignment.'); 
    }
  };

  const handleBulkPublish = async () => {
    if (!examTitle) return alert("Please enter an Exam Title (e.g., Term 1)!");

    const subjectPrefix = selectedOption?.subject && selectedOption.subject !== "General" ? `${selectedOption.subject} - ` : "General - ";
    const finalExamName = `${subjectPrefix}${examCategory} | ${examTitle}`;

    const resultsPayload = Object.entries(marks).map(([studentId, score]) => ({
        studentId: parseInt(studentId), 
        examName: finalExamName, 
        score: parseInt(score), 
        maxScore: parseInt(maxScore)
    }));

    if (resultsPayload.length === 0) return alert("Please enter marks for at least one student.");

    try {
        await fetch(`${import.meta.env.VITE_API_URL}/exam/publish-bulk`, {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ results: resultsPayload })
        });
        alert(`Results published for ${examTitle}! 🏆`);
        setMarks({}); 
        setExamTitle('');
    } catch (err) { 
      alert("Failed to publish results."); 
    }
  };

  const handleGradeSubmit = async () => {
    if (!selectedWork) return;
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/assignment/${selectedWork.work.id}/grade`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ grade, feedback }) 
      });
      alert("Graded Successfully! 🌟");
      setSelectedWork(null); 
      setGrade(''); 
      setFeedback(''); 
      fetchMyData();
    } catch (err) { 
      alert("Failed to save grade."); 
    }
  };

  if (loading) return <div className="p-20 text-center flex flex-col items-center gap-4"><Loader2 className="animate-spin text-indigo-600" size={40} /> <p className="font-bold text-slate-500">Loading Faculty Dashboard...</p></div>;

  return (
    <div className="max-w-5xl mx-auto w-full flex flex-col gap-6 pb-32 pt-4 relative min-h-screen px-4 md:px-0">
      
      {/* 1. HEADER & CLASS ANALYTICS */}
      <div className="bg-slate-900 text-white rounded-[2.5rem] shadow-2xl p-8 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Faculty Portal</h1>
            <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-xs">Classroom Management</p>
          </div>
          
          <div className="flex items-center gap-3 bg-white/10 border border-white/20 rounded-2xl p-2 backdrop-blur-md w-full md:w-auto">
             <Filter size={18} className="ml-3 text-slate-300"/>
             <select 
               className="bg-transparent font-bold text-white outline-none cursor-pointer pr-4 py-2 appearance-none w-full"
               onChange={(e) => {
                 const selected = dashboardOptions.find(opt => opt.label === e.target.value);
                 setSelectedOption(selected || null);
               }}
               value={selectedOption?.label || ""}
             >
               {dashboardOptions.length === 0 && <option className="text-slate-800">No Classes Assigned</option>}
               {dashboardOptions.map(opt => <option key={opt.label} value={opt.label} className="text-slate-800">{opt.label}</option>)}
             </select>
          </div>
        </div>

        {/* Quick Analytics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 relative z-10">
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Roster</p>
            <h2 className="text-2xl font-black text-white">{filteredStudents.length} <span className="text-sm font-normal text-slate-500">Students</span></h2>
          </div>
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Present Today</p>
            <h2 className="text-2xl font-black text-emerald-300">{presentCount}</h2>
          </div>
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
            <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Absent/Late</p>
            <h2 className="text-2xl font-black text-rose-300">{absentCount + lateCount}</h2>
          </div>
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col justify-center">
            <div className="flex items-center gap-2">
               <AlertCircle size={16} className={pendingGradingCount > 0 ? "text-amber-400" : "text-slate-500"} />
               <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Pending Grading</p>
            </div>
            <h2 className="text-2xl font-black text-amber-300 mt-1">{pendingGradingCount} <span className="text-sm font-normal text-slate-500">Items</span></h2>
          </div>
        </div>
        <div className="absolute right-0 top-0 h-full w-full md:w-96 bg-gradient-to-l from-indigo-500/20 to-transparent pointer-events-none" />
      </div>

      {/* 2. NAVIGATION TABS */}
      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto hide-scrollbar px-2">
        {[
          { id: 'attendance', label: 'Daily Attendance' },
          { id: 'assignments', label: 'Manage Assignments' },
          { id: 'gradebook', label: 'Class Gradebook' },
          { id: 'courses', label: 'Course Catalog' }
        ].map(tab => (
           <button 
             key={tab.id}
             onClick={() => setActiveTab(tab.id as any)} 
             className={`whitespace-nowrap pb-4 px-6 text-sm font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
           >
             {tab.label}
           </button>
        ))}
      </div>

      {/* --- TAB 1: ATTENDANCE CONTENT --- */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <div className="px-6 md:px-8 py-6 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/30">
            <div>
              <h3 className="font-black text-slate-800 uppercase text-sm tracking-widest flex items-center gap-2">
                <Users size={18} className="text-indigo-600" /> Register: {selectedOption?.className || "Select Class"}
              </h3>
            </div>
            {selectedOption?.role === "class_teacher" ? (
              <button onClick={saveAttendance} disabled={saving} className="w-full md:w-auto justify-center bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-indigo-200">
                {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} {saving ? 'Syncing...' : 'Save Register'}
              </button>
            ) : (
              <div className="w-full md:w-auto flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest font-black bg-slate-100 text-slate-400 px-4 py-3 rounded-xl border border-slate-200 cursor-not-allowed">
                <Lock size={14} /> View Only Access
              </div>
            )}
          </div>
          <div className="divide-y divide-slate-50">
            {filteredStudents.length === 0 ? ( 
              <div className="p-10 text-center text-slate-400 font-medium">No students enrolled in this class.</div> 
            ) : (
              filteredStudents.map((student, index) => (
                <div key={student.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center font-black text-sm border border-slate-200 shrink-0">{student.rollNumber || index + 1}</div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-base">{student.name}</h4>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1 truncate max-w-[200px] md:max-w-none">{student.email}</p>
                    </div>
                  </div>
                  <div className={`cursor-pointer ${selectedOption?.role !== "class_teacher" ? 'opacity-50 pointer-events-none' : ''}`} onClick={() => toggleStatus(student.id)}>
                    <span className={`px-5 py-3 md:py-2.5 rounded-xl text-[10px] font-black flex items-center gap-2 w-full sm:w-32 justify-center uppercase tracking-widest border transition-all
                      ${student.status === 'present' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : student.status === 'absent' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                      {student.status === 'present' && <Check size={14} />} 
                      {student.status === 'absent' && <X size={14} />} 
                      {student.status === 'late' && <Clock size={14} />} 
                      {student.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* --- TAB 2: ASSIGNMENTS CONTENT --- */}
      {activeTab === 'assignments' && (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <div className="px-6 md:px-8 py-6 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/30">
            <h3 className="font-black text-slate-800 uppercase text-sm tracking-widest flex items-center gap-2">
              <FileText size={18} className="text-indigo-600" /> Grading Queue
            </h3>
            <button onClick={assignHomework} className="w-full md:w-auto justify-center bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all">
              <PlusCircle size={16} /> New Assignment
            </button>
          </div>
          <div className="p-6 md:p-8 flex flex-col gap-6">
            {filteredStudents.length === 0 ? ( 
              <div className="text-center text-slate-400 font-medium">No students available for assignments.</div> 
            ) : (
              filteredStudents.map((student) => (
                student.assignments.length > 0 && (
                  <div key={student.id} className="border border-slate-100 rounded-[2rem] p-6 shadow-sm hover:border-indigo-100 transition-all">
                    <h4 className="font-black text-slate-800 mb-5 pb-4 border-b border-slate-50 text-lg">{student.name}</h4>
                    <div className="space-y-4">
                      {student.assignments.map(work => (
                        <div key={work.id} className="flex flex-col md:flex-row md:justify-between md:items-center bg-slate-50 p-5 rounded-2xl border border-slate-100 gap-4">
                          <span className="text-sm font-bold text-slate-700 truncate max-w-[400px]">{work.title}</span>
                          {work.status === 'graded' ? (
                            <div className="flex items-center gap-2 text-emerald-600 font-black bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-xl text-xs self-start md:self-auto uppercase tracking-widest">
                              <Star size={14} fill="currentColor" /> {work.grade}
                            </div>
                          ) : work.status === 'submitted' ? (
                            <button onClick={() => setSelectedWork({ student, work })} className="w-full md:w-auto text-white font-black bg-indigo-600 px-5 py-3 md:py-2.5 rounded-xl text-xs uppercase tracking-widest hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 self-start md:self-auto">
                              Grade Now
                            </button>
                          ) : (
                            <span className="w-full md:w-auto text-center text-slate-400 text-[10px] uppercase font-black tracking-widest px-4 py-3 md:py-2.5 bg-white border border-slate-200 rounded-xl self-start md:self-auto">
                              Pending Submission
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ))
            )}
          </div>
        </div>
      )}

      {/* --- TAB 3: GRADEBOOK CONTENT --- */}
      {activeTab === 'gradebook' && (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <div className="p-6 md:p-8 border-b border-slate-100 bg-amber-50/30">
            <h3 className="font-black text-slate-800 uppercase text-sm tracking-widest flex items-center gap-2 mb-6">
               <Trophy size={20} className="text-amber-500" /> Result Publisher
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-black text-slate-400 mb-2">Exam Type</label>
                <select 
                  className="w-full p-4 border border-slate-200 rounded-2xl bg-white outline-none focus:ring-2 focus:ring-amber-400 text-sm font-bold text-slate-700 cursor-pointer transition-all" 
                  value={examCategory} 
                  onChange={(e) => setExamCategory(e.target.value)}
                >
                  <option value="Class Test">Class Test</option>
                  <option value="Formative Assessment">Formative Assessment (FA)</option>
                  <option value="Summative Assessment">Summative Assessment (SA)</option>
                  <option value="Final Examination">Final Examination</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-black text-slate-400 mb-2">Term / Title</label>
                <input 
                  className="w-full p-4 border border-slate-200 rounded-2xl bg-white outline-none focus:ring-2 focus:ring-amber-400 text-sm font-bold transition-all" 
                  placeholder="e.g. Unit 1, Midterm" 
                  value={examTitle} 
                  onChange={(e) => setExamTitle(e.target.value)} 
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-black text-slate-400 mb-2">Maximum Score</label>
                <input 
                  className="w-full p-4 border border-slate-200 rounded-2xl bg-white outline-none focus:ring-2 focus:ring-amber-400 text-sm font-bold transition-all" 
                  type="number" 
                  value={maxScore} 
                  onChange={(e) => setMaxScore(e.target.value)} 
                />
              </div>
            </div>

            <div className="mt-6 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white inline-block px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
               System Tag: <span className="text-indigo-600">{selectedOption?.subject !== "General" ? selectedOption?.subject : "General"} - {examCategory} | {examTitle || '[Title]'}</span>
            </div>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-sm text-left min-w-[500px]">
              <thead className="bg-slate-50/50 text-slate-400 font-black text-[10px] uppercase tracking-widest border-b border-slate-100">
                <tr>
                  <th className="p-6 pl-8">Identity</th>
                  <th className="p-6 pr-8 text-right">Marks Obtained</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredStudents.length === 0 ? ( 
                  <tr><td colSpan={2} className="p-10 text-center text-slate-400 font-medium">No students available.</td></tr> 
                ) : (
                  filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-6 pl-8">
                         <div className="font-bold text-slate-800 text-base">{student.name}</div>
                         <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Roll No: {student.rollNumber || '-'}</div>
                      </td>
                      <td className="p-6 pr-8 flex justify-end">
                        <input 
                          type="number" 
                          className="w-full max-w-[120px] p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-400 outline-none font-black text-indigo-700 text-lg text-center bg-slate-50 transition-all" 
                          placeholder="0" 
                          value={marks[student.id] || ''} 
                          onChange={(e) => setMarks({ ...marks, [student.id]: e.target.value })} 
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="p-6 md:p-8 bg-slate-50/50 border-t border-slate-100">
            <button onClick={handleBulkPublish} className="w-full p-4 md:p-5 bg-slate-900 text-white text-xs uppercase tracking-widest font-black rounded-2xl hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all flex justify-center items-center gap-3">
              <Send size={18} /> Publish to Student Portals
            </button>
          </div>
        </div>
      )}

      {/* --- NEW TAB 4: COURSES (LMS) CONTENT --- */}
      {activeTab === 'courses' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900 p-6 md:p-8 rounded-[2.5rem] text-white shadow-xl gap-6">
             <div>
                <h3 className="text-2xl font-black">Course Catalog</h3>
                <p className="text-slate-400 text-sm font-medium mt-1">Manage your video lectures and publish new curriculum.</p>
             </div>
             
             {/* Link to the TeacherBuilder page */}
             <button 
                onClick={() => window.location.href = '/teacher/build'} 
                className="w-full md:w-auto justify-center bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/30"
             >
                <PlusCircle size={18} /> Create New Course
             </button>
          </div>

          {courses.length === 0 ? (
             <div className="text-center p-12 bg-white rounded-[2rem] border border-slate-200 text-slate-500 shadow-sm font-bold">
               You haven't published any courses yet. Click the button above to start building!
             </div>
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {courses.map(course => (
                 <div key={course.id} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all flex flex-col h-full group">
                   <div className="relative h-44 overflow-hidden bg-slate-100">
                     <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                     <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                     <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                        <span className="bg-emerald-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-lg flex items-center gap-1">
                          <CheckCircle size={12} /> Published
                        </span>
                        <span className="text-white text-xs font-bold flex items-center gap-1"><Layers size={14} /> {course.modules?.length || 0} Modules</span>
                     </div>
                   </div>
                   
                   <div className="p-6 flex-1 flex flex-col justify-between">
                     <div>
                       <h3 className="font-black text-lg text-slate-800 mb-2 leading-tight">{course.title}</h3>
                       <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed mb-4">{course.description}</p>
                     </div>
                     <button className="w-full bg-slate-50 text-slate-600 font-black py-3 rounded-xl text-xs flex justify-center items-center gap-2 border border-slate-100 hover:bg-slate-100 transition-colors">
                        <ArrowRight size={14} /> View Details
                     </button>
                   </div>
                 </div>
               ))}
             </div>
          )}
        </div>
      )}

      {/* --- GRADING MODAL --- */}
      {selectedWork && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 md:p-10 relative animate-in zoom-in-95">
            <button onClick={() => setSelectedWork(null)} className="absolute right-6 top-6 text-slate-300 hover:text-slate-600 transition-colors"><X size={24} /></button>
            <h2 className="text-2xl font-black mb-1 text-slate-800">Review Work</h2>
            <p className="text-slate-400 text-sm font-medium mb-8">{selectedWork.student.name} • {selectedWork.work.title}</p>
            
            {selectedWork.work.submissionUrl ? ( 
              <a href={selectedWork.work.submissionUrl} target="_blank" rel="noreferrer" className="w-full p-4 bg-indigo-50 text-indigo-700 rounded-2xl text-center font-bold text-sm mb-8 hover:bg-indigo-100 border border-indigo-100 flex items-center justify-center gap-2 transition-colors">
                <ExternalLink size={18} /> Open Submitted Document
              </a> 
            ) : ( 
              <div className="w-full p-4 bg-amber-50 text-amber-700 rounded-2xl text-center text-xs font-black uppercase tracking-widest mb-8 border border-amber-100 border-dashed">
                ⚠️ No file attached
              </div> 
            )}
            
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Assign Score</label>
            <input className="w-full p-4 border border-slate-100 rounded-2xl mb-6 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 font-bold text-slate-800" placeholder="e.g., 95/100 or A+" value={grade} onChange={(e) => setGrade(e.target.value)} />
            
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Constructive Feedback</label>
            <textarea className="w-full p-4 border border-slate-100 rounded-2xl mb-8 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 font-medium text-sm text-slate-800" rows={4} placeholder="Excellent reasoning, but check your formatting..." value={feedback} onChange={(e) => setFeedback(e.target.value)} />
            
            <button onClick={handleGradeSubmit} className="w-full p-4 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
               Confirm Grade
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;