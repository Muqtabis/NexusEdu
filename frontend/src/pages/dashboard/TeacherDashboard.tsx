import { useEffect, useState } from 'react';
import { Users, Save, Check, X, PlusCircle, Clock, Loader2, FileText, Star, ExternalLink, Trophy } from 'lucide-react';

interface Assignment {
  id: number;
  title: string;
  status: string;
  submissionUrl?: string;
  grade?: string;
  feedback?: string;
}

interface Student {
  id: number;
  name: string;
  email: string;
  status: 'present' | 'absent' | 'late';
  assignments: Assignment[];
}

const TeacherDashboard = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Grading Modal State
  const [selectedWork, setSelectedWork] = useState<{student: Student, work: Assignment} | null>(null);
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');

  // Bulk Gradebook State
  const [showGradebook, setShowGradebook] = useState(false);
  const [examName, setExamName] = useState('');
  const [maxScore, setMaxScore] = useState('100');
  const [marks, setMarks] = useState<Record<number, string>>({});

  const fetchClass = async () => {
    try {
      const res = await fetch('http://localhost:4000/teacher/class');
      const data = await res.json();
      const formatted = data.map((s: any) => ({
        ...s,
        status: 'present',
        assignments: s.assignments || [] 
      }));
      setStudents(formatted);
    } catch (error) {
      console.error("Failed to fetch class list:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClass();
  }, []);

  const toggleStatus = (id: number) => {
    setStudents(prev => prev.map(s => {
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
      for (const student of students) {
        await fetch('http://localhost:4000/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId: student.id, status: student.status, date: date })
        });
      }
      alert('Attendance Saved Successfully! ✅');
    } catch (err) { alert('Failed to save attendance.'); } 
    finally { setSaving(false); }
  };

  const assignHomework = async () => {
    const title = prompt("Enter Assignment Title (e.g., Chapter 5 Essay):");
    if (!title) return;
    const subject = prompt("Enter Subject (e.g., History):");
    if (!subject) return;

    try {
      for (const student of students) {
        await fetch('http://localhost:4000/assignment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, subject, dueDate: new Date().toISOString(), studentId: student.id })
        });
      }
      alert(`Assignment "${title}" sent to class! 📚`);
      fetchClass();
    } catch (err) { alert('Failed to send assignment.'); }
  };

  // --- BULK PUBLISH LOGIC ---
  const handleBulkPublish = async () => {
    if (!examName) { alert("Please enter an Exam Name!"); return; }

    const resultsPayload = Object.entries(marks).map(([studentId, score]) => ({
      studentId: parseInt(studentId),
      examName: examName,
      score: parseInt(score),
      maxScore: parseInt(maxScore)
    }));

    if (resultsPayload.length === 0) { alert("Please enter marks for at least one student."); return; }

    try {
      await fetch('http://localhost:4000/exam/publish-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results: resultsPayload })
      });
      alert(`Successfully published results for ${resultsPayload.length} students! 🏆`);
      setShowGradebook(false);
      setMarks({});
      setExamName('');
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
      fetchClass();
    } catch (err) { alert("Failed to save grade."); }
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin inline" /> Loading...</div>;

  return (
    <div className="flex flex-col gap-6 relative">
      <div className="p-6 rounded-[1.5rem] bg-white border border-slate-200 shadow-soft relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl font-semibold text-slate-800">Class 12-A</h1>
          <p className="text-slate-500 text-sm">Teacher Dashboard • Term 2</p>
        </div>
        <div className="absolute right-0 top-0 h-full w-32 bg-gradient-to-l from-indigo-50 to-transparent opacity-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2"><Users size={18} /> Students ({students.length})</h3>
            <button onClick={saveAttendance} disabled={saving} className="flex items-center gap-2 text-xs font-bold bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />} {saving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {students.map((student) => (
              <div key={student.id} className="p-4 hover:bg-slate-50 transition-colors group">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-600 border border-slate-200">{student.name.charAt(0)}</div>
                    <div><span className="font-medium text-slate-800 block">{student.name}</span><span className="text-[10px] text-slate-400 block">{student.email}</span></div>
                  </div>
                  <div className="cursor-pointer" onClick={() => toggleStatus(student.id)}>
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 w-24 justify-center ${student.status === 'present' ? 'bg-emerald-100 text-emerald-700' : student.status === 'absent' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                      {student.status === 'present' && <Check size={12} />}{student.status === 'absent' && <X size={12} />}{student.status === 'late' && <Clock size={12} />}{student.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                {student.assignments.length > 0 && (
                  <div className="ml-11 space-y-2 border-l-2 border-slate-100 pl-3">
                    {student.assignments.map(work => (
                      <div key={work.id} className="flex items-center justify-between text-xs bg-white p-2 rounded border border-slate-100 shadow-sm">
                        <span className="text-slate-600 font-medium truncate max-w-[150px]">{work.title}</span>
                        {work.status === 'graded' ? ( <div className="flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded"><Star size={10} fill="currentColor" /> {work.grade}</div> ) : work.status === 'submitted' ? ( <button onClick={() => setSelectedWork({ student, work })} className="text-blue-600 font-bold hover:underline flex items-center gap-1 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors"><FileText size={12} /> Grade Now</button> ) : ( <span className="text-slate-400 italic bg-slate-50 px-2 py-1 rounded">Pending...</span> )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col gap-4">
           <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
             <h3 className="font-semibold text-slate-800 mb-3 text-sm">Quick Actions</h3>
             <button onClick={assignHomework} className="w-full p-3 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center gap-2 font-medium hover:bg-indigo-100 transition-colors text-sm mb-3">
               <PlusCircle size={16} /> New Assignment
             </button>
             {/* GRADEBOOK BUTTON */}
             <button onClick={() => setShowGradebook(true)} className="w-full p-3 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center gap-2 font-medium hover:bg-amber-100 transition-colors text-sm">
               <Trophy size={16} /> Open Gradebook
             </button>
           </div>
        </div>
      </div>

      {/* --- GRADEBOOK MODAL --- */}
      {showGradebook && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-6 relative flex flex-col max-h-[90vh]">
            <button onClick={() => setShowGradebook(false)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"><X size={20} /></button>
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2"><Trophy className="text-amber-500" /> Class Gradebook</h2>
            <div className="grid grid-cols-2 gap-4 mb-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div><label className="block text-xs font-bold text-slate-500 mb-1">Exam Name</label><input className="w-full p-2 border border-slate-200 rounded-lg bg-white" placeholder="e.g. Final Mathematics" value={examName} onChange={(e) => setExamName(e.target.value)} /></div>
              <div><label className="block text-xs font-bold text-slate-500 mb-1">Max Score</label><input className="w-full p-2 border border-slate-200 rounded-lg bg-white" type="number" value={maxScore} onChange={(e) => setMaxScore(e.target.value)} /></div>
            </div>
            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl mb-4">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0">
                  <tr><th className="p-3 border-b">Student Name</th><th className="p-3 border-b w-32">Marks Obtained</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50">
                      <td className="p-3 font-medium text-slate-700">{student.name}</td>
                      <td className="p-3"><input type="number" className="w-full p-2 border border-slate-200 rounded-md focus:border-indigo-500 outline-none" placeholder="0" value={marks[student.id] || ''} onChange={(e) => setMarks({ ...marks, [student.id]: e.target.value })} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={handleBulkPublish} className="w-full p-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200">Publish All Results</button>
          </div>
        </div>
      )}

      {/* Assignment Grading Modal */}
      {selectedWork && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 relative">
            <button onClick={() => setSelectedWork(null)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"><X size={20} /></button>
            <h2 className="text-xl font-bold mb-1 text-slate-800">Grade {selectedWork.student.name}'s Work</h2>
            <p className="text-slate-500 text-sm mb-4">{selectedWork.work.title}</p>
            {selectedWork.work.submissionUrl ? ( <a href={selectedWork.work.submissionUrl} target="_blank" rel="noreferrer" className="block w-full p-3 bg-blue-50 text-blue-600 rounded-lg text-center font-bold mb-4 hover:bg-blue-100 border border-blue-100 flex items-center justify-center gap-2 transition-colors"><ExternalLink size={16} /> View Submitted File</a> ) : ( <div className="w-full p-3 bg-amber-50 text-amber-600 rounded-lg text-center text-xs font-bold mb-4 border border-amber-100 border-dashed">⚠️ No file attached</div> )}
            <label className="block text-xs font-bold text-slate-500 mb-1">Grade / Score</label>
            <input className="w-full p-3 border border-slate-200 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g., 95/100 or A+" value={grade} onChange={(e) => setGrade(e.target.value)} />
            <label className="block text-xs font-bold text-slate-500 mb-1">Feedback</label>
            <textarea className="w-full p-3 border border-slate-200 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500" rows={3} placeholder="Good work..." value={feedback} onChange={(e) => setFeedback(e.target.value)} />
            <div className="flex gap-2">
              <button onClick={() => setSelectedWork(null)} className="flex-1 p-3 text-slate-500 font-bold hover:bg-slate-50 rounded-lg transition-colors">Cancel</button>
              <button onClick={handleGradeSubmit} className="flex-1 p-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">Submit Grade</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;