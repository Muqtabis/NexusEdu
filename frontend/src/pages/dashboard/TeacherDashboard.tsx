import { useEffect, useState } from 'react';
import { Users, Save, Check, X, PlusCircle, Clock, Loader2, FileText, Star, ExternalLink, Trophy, Filter, Lock, Send } from 'lucide-react';

interface Assignment { id: number; title: string; status: string; submissionUrl?: string; grade?: string; feedback?: string; }
interface Student { id: number; name: string; email: string; branch?: string; rollNumber?: string; status: 'present' | 'absent' | 'late'; assignments: Assignment[]; }
interface DashboardOption { label: string; className: string; subject: string; role: "class_teacher" | "subject_teacher"; }

const TeacherDashboard = () => {
  // Data State
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [dashboardOptions, setDashboardOptions] = useState<DashboardOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<DashboardOption | null>(null);
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'attendance' | 'assignments' | 'gradebook'>('attendance');

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
      const res = await fetch(`http://localhost:4000/teacher/${teacherId}/students`);
      const data = await res.json();
      
      if (data.students) {
        const formatted = data.students.map((s: any) => ({ ...s, status: 'present', assignments: s.assignments || [] }));
        setAllStudents(formatted);
        setDashboardOptions(data.dashboardOptions);
        if (data.dashboardOptions.length > 0) setSelectedOption(data.dashboardOptions[0]);
      }
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
        await fetch('http://localhost:4000/attendance', { 
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
        await fetch('http://localhost:4000/assignment', { 
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

    // Creates the structured tag: "Physics - Formative Assessment | Term 1"
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
        await fetch('http://localhost:4000/exam/publish-bulk', {
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
      await fetch(`http://localhost:4000/assignment/${selectedWork.work.id}/grade`, { 
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

  if (loading) return <div className="p-10 text-center text-slate-500"><Loader2 className="animate-spin inline mr-2" /> Loading Dashboard...</div>;

  return (
    <div className="max-w-5xl mx-auto w-full flex flex-col gap-6 pb-12 pt-4">
      
      {/* 1. HEADER */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 flex flex-col items-center justify-center text-center">
        <h1 className="text-3xl font-normal text-slate-800 tracking-tight">Teacher Dashboard</h1>
        <p className="text-slate-500 text-sm mt-2 mb-6">
          Context: <span className="font-bold text-indigo-600">{selectedOption?.label || "No Classes Assigned"}</span>
        </p>
        
        <div className="flex items-center gap-2 border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 w-full max-w-sm">
           <Filter size={16} className="text-slate-400"/>
           <select 
             className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
             onChange={(e) => {
               const selected = dashboardOptions.find(opt => opt.label === e.target.value);
               setSelectedOption(selected || null);
             }}
             value={selectedOption?.label || ""}
           >
             {dashboardOptions.length === 0 && <option>No Classes Assigned</option>}
             {dashboardOptions.map(opt => <option key={opt.label} value={opt.label}>{opt.label}</option>)}
           </select>
        </div>
      </div>

      {/* 2. THE HORIZONTAL TABS */}
      <div className="flex gap-4 border-b border-slate-200 overflow-x-auto hide-scrollbar px-2">
        <button 
          onClick={() => setActiveTab('attendance')} 
          className={`pb-3 text-sm font-bold whitespace-nowrap px-4 ${activeTab === 'attendance' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Daily Attendance
        </button>
        <button 
          onClick={() => setActiveTab('assignments')} 
          className={`pb-3 text-sm font-bold whitespace-nowrap px-4 ${activeTab === 'assignments' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Manage Assignments
        </button>
        <button 
          onClick={() => setActiveTab('gradebook')} 
          className={`pb-3 text-sm font-bold whitespace-nowrap px-4 ${activeTab === 'gradebook' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Class Gradebook
        </button>
      </div>

      {/* --- TAB 1: ATTENDANCE CONTENT --- */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2">
          <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-medium text-slate-700 flex items-center gap-2 text-[15px]">
              <Users size={18} className="text-slate-500" /> Attendance Register
            </h3>
            {selectedOption?.role === "class_teacher" ? (
              <button onClick={saveAttendance} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm">
                {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} {saving ? 'Saving...' : 'Save Attendance'}
              </button>
            ) : (
              <div className="flex items-center gap-2 text-xs font-bold bg-slate-200 text-slate-500 px-4 py-2 rounded-xl cursor-not-allowed">
                <Lock size={14} /> Read Only
              </div>
            )}
          </div>
          <div className="divide-y divide-slate-50">
            {filteredStudents.length === 0 ? ( 
              <div className="p-10 text-center text-slate-400">No students found.</div> 
            ) : (
              filteredStudents.map((student, index) => (
                <div key={student.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-sm shadow-sm">{student.rollNumber || index + 1}</div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-[15px]">{student.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{student.email}</p>
                    </div>
                  </div>
                  <div className={`cursor-pointer ${selectedOption?.role !== "class_teacher" ? 'opacity-50 pointer-events-none' : ''}`} onClick={() => toggleStatus(student.id)}>
                    <span className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 w-28 justify-center uppercase
                      ${student.status === 'present' ? 'bg-[#dcfce7] text-[#166534]' : student.status === 'absent' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
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
        <div className="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2">
          <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-medium text-slate-700 flex items-center gap-2 text-[15px]">
              <FileText size={18} className="text-slate-500" /> Student Submissions
            </h3>
            <button onClick={assignHomework} className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all">
              <PlusCircle size={16} /> New Assignment
            </button>
          </div>
          <div className="p-6 flex flex-col gap-6">
            {filteredStudents.length === 0 ? ( 
              <div className="text-center text-slate-400">No students found.</div> 
            ) : (
              filteredStudents.map((student) => (
                student.assignments.length > 0 && (
                  <div key={student.id} className="border border-slate-100 rounded-2xl p-5 shadow-sm">
                    <h4 className="font-bold text-slate-800 mb-4 pb-3 border-b border-slate-50">{student.name}'s Work</h4>
                    <div className="space-y-3">
                      {student.assignments.map(work => (
                        <div key={work.id} className="flex flex-col md:flex-row md:justify-between md:items-center bg-slate-50 p-4 rounded-xl border border-slate-100 gap-3">
                          <span className="text-sm font-medium text-slate-700 truncate max-w-[300px]">{work.title}</span>
                          {work.status === 'graded' ? (
                            <div className="flex items-center gap-1 text-emerald-600 font-bold bg-emerald-100 px-3 py-1.5 rounded-lg text-xs self-start md:self-auto"><Star size={12} fill="currentColor" /> {work.grade}</div>
                          ) : work.status === 'submitted' ? (
                            <button onClick={() => setSelectedWork({ student, work })} className="text-indigo-600 font-bold bg-indigo-100 px-4 py-2 rounded-lg text-xs hover:bg-indigo-200 transition-colors self-start md:self-auto">Grade Now</button>
                          ) : (
                            <span className="text-slate-400 italic text-xs font-medium px-3 py-1.5 bg-white border border-slate-200 rounded-lg self-start md:self-auto">Pending...</span>
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
        <div className="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2">
          <div className="p-6 border-b border-slate-100 bg-amber-50/30">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6"><Trophy size={20} className="text-amber-500" /> Exam Publishing</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-slate-500 mb-1">Exam Type</label>
                <select 
                  className="w-full p-3 border border-slate-200 rounded-xl bg-white outline-none focus:border-amber-400 text-sm font-semibold text-slate-700 cursor-pointer" 
                  value={examCategory} 
                  onChange={(e) => setExamCategory(e.target.value)}
                >
                  <option value="Class Test">Class Test</option>
                  <option value="Formative Assessment">Formative Assessment (FA)</option>
                  <option value="Summative Assessment">Summative Assessment (SA)</option>
                  <option value="Final Examination">Final Examination</option>
                </select>
              </div>
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-slate-500 mb-1">Term / Title</label>
                <input 
                  className="w-full p-3 border border-slate-200 rounded-xl bg-white outline-none focus:border-amber-400 text-sm font-semibold" 
                  placeholder="e.g. Unit 1, Midterm" 
                  value={examTitle} 
                  onChange={(e) => setExamTitle(e.target.value)} 
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-slate-500 mb-1">Max Score</label>
                <input 
                  className="w-full p-3 border border-slate-200 rounded-xl bg-white outline-none focus:border-amber-400 text-sm font-semibold" 
                  type="number" 
                  value={maxScore} 
                  onChange={(e) => setMaxScore(e.target.value)} 
                />
              </div>
            </div>

            <div className="mt-4 text-[11px] font-bold text-slate-400 bg-white inline-block px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
               Database Tag: <span className="text-indigo-600">{selectedOption?.subject !== "General" ? selectedOption?.subject : "General"} - {examCategory} | {examTitle || '[Title]'}</span>
            </div>
          </div>

          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
              <tr>
                <th className="p-4 pl-6">Roll No</th>
                <th className="p-4">Student Name</th>
                <th className="p-4 pr-6">Marks Obtained</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredStudents.length === 0 ? ( 
                <tr><td colSpan={3} className="p-8 text-center text-slate-400">No students found.</td></tr> 
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 pl-6 font-medium text-slate-500">{student.rollNumber || '-'}</td>
                    <td className="p-4 font-bold text-slate-700 text-[15px]">{student.name}</td>
                    <td className="p-4 pr-6">
                      <input 
                        type="number" 
                        className="w-full max-w-[150px] p-2.5 border border-slate-200 rounded-lg focus:border-amber-400 outline-none font-black text-indigo-700 text-lg" 
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
          <div className="p-6 bg-slate-50 border-t border-slate-100">
            <button onClick={handleBulkPublish} className="w-full p-4 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 shadow-lg shadow-slate-200 transition-all flex justify-center items-center gap-2">
              <Send size={18} /> Publish to Student Report Cards
            </button>
          </div>
        </div>
      )}

      {/* --- GRADING MODAL --- */}
      {selectedWork && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 relative">
            <button onClick={() => setSelectedWork(null)} className="absolute right-6 top-6 text-slate-400 hover:text-slate-600"><X size={20} /></button>
            <h2 className="text-xl font-bold mb-1 text-slate-800">Grade Work</h2>
            <p className="text-slate-500 text-sm mb-6">{selectedWork.student.name} • {selectedWork.work.title}</p>
            {selectedWork.work.submissionUrl ? ( 
              <a href={selectedWork.work.submissionUrl} target="_blank" rel="noreferrer" className="block w-full p-3 bg-indigo-50 text-indigo-600 rounded-xl text-center font-bold mb-6 hover:bg-indigo-100 border border-indigo-100 flex items-center justify-center gap-2 transition-colors"><ExternalLink size={16} /> View Submitted File</a> 
            ) : ( 
              <div className="w-full p-3 bg-amber-50 text-amber-600 rounded-xl text-center text-xs font-bold mb-6 border border-amber-100 border-dashed">⚠️ No file attached</div> 
            )}
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Score</label>
            <input className="w-full p-3.5 border border-slate-200 rounded-xl mb-4 focus:outline-none focus:border-indigo-500 bg-slate-50" placeholder="e.g., 95/100" value={grade} onChange={(e) => setGrade(e.target.value)} />
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Feedback</label>
            <textarea className="w-full p-3.5 border border-slate-200 rounded-xl mb-8 focus:outline-none focus:border-indigo-500 bg-slate-50" rows={3} placeholder="Great job..." value={feedback} onChange={(e) => setFeedback(e.target.value)} />
            <div className="flex gap-3">
              <button onClick={() => setSelectedWork(null)} className="flex-1 p-3.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
              <button onClick={handleGradeSubmit} className="flex-1 p-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">Submit Grade</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;