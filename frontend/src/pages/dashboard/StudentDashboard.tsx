import { useEffect, useState } from 'react';
import { BookOpen, CheckCircle, AlertCircle, Loader2, X, ChevronRight, UploadCloud, Star, MessageSquare, Trophy, TrendingUp } from 'lucide-react';

interface Assignment {
  id: number;
  title: string;
  subject: string;
  dueDate: string;
  status: string;
  submissionUrl?: string;
  grade?: string;
  feedback?: string;
}

interface ExamResult {
  id: number;
  examName: string;
  score: number;
  maxScore: number;
  date: string;
}

const getGrade = (score: number, max: number) => {
  const percentage = (score / max) * 100;
  if (percentage >= 90) return { label: 'A+', color: 'text-emerald-600', status: 'Pass' };
  if (percentage >= 80) return { label: 'A', color: 'text-emerald-500', status: 'Pass' };
  if (percentage >= 70) return { label: 'B', color: 'text-indigo-500', status: 'Pass' };
  if (percentage >= 50) return { label: 'C', color: 'text-amber-500', status: 'Pass' };
  return { label: 'F', color: 'text-rose-600', status: 'Fail' };
};

const StudentDashboard = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('Student');
  
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) return;

      const res = await fetch(`http://localhost:4000/dashboard/${userId}`);
      const data = await res.json();

      if (data) {
        if (data.assignments) setAssignments(data.assignments);
        if (data.name) setUserName(data.name);
      }

      const resExams = await fetch(`http://localhost:4000/student/${userId}/results`);
      const dataExams = await resExams.json();
      if (Array.isArray(dataExams)) {
        setExamResults(dataExams);
      }

    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedAssignment) return;
    if (!selectedFile) { alert("Please select a file! 📂"); return; }
    setSubmitting(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await fetch(`http://localhost:4000/assignment/${selectedAssignment.id}/submit`, { method: 'POST', body: formData });
      if (res.ok) { alert("Uploaded successfully! 🎉"); setSelectedAssignment(null); setSelectedFile(null); fetchData(); } 
      else { alert("Upload failed."); }
    } catch (err) { alert("Error uploading file."); } 
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="p-10 text-center text-slate-400"><Loader2 className="animate-spin inline"/> Loading...</div>;

  return (
    <div className="flex flex-col gap-6 relative">
      <div className="p-6 rounded-[1.5rem] bg-white border border-slate-200 shadow-soft relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl font-semibold text-slate-800 mb-1">Hello, {userName} 👋</h1>
          <p className="text-slate-500 text-sm">Welcome to your academic portal.</p>
        </div>
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-50 rounded-full" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* --- ASSIGNMENTS --- */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><BookOpen size={18} className="text-slate-400" /> Assignments</h3>
          <div className="space-y-3">
            {assignments.length === 0 ? ( <p className="text-sm text-slate-400 italic">No homework assigned! 🎉</p> ) : (
              assignments.map((item) => (
                <div key={item.id} onClick={() => { setSelectedAssignment(item); setSelectedFile(null); }} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer hover:bg-indigo-50 hover:border-indigo-100 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${item.status === 'graded' ? 'bg-indigo-100 text-indigo-600' : item.status === 'submitted' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                      {item.status === 'graded' ? <Star size={16} fill="currentColor" /> : item.status === 'submitted' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    </div>
                    <div><h4 className="text-sm font-medium text-slate-800 group-hover:text-indigo-700">{item.title}</h4><p className="text-[10px] text-slate-500 uppercase font-bold">{item.subject}</p></div>
                  </div>
                  {item.status === 'graded' && ( <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">{item.grade}</span> )}
                  {item.status !== 'graded' && <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-400" />}
                </div>
              ))
            )}
          </div>
        </div>

        {/* --- OFFICIAL TRANSCRIPT --- */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><Trophy size={18} className="text-amber-500" /> Academic Transcript</h3>
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                <tr><th className="p-3">Date</th><th className="p-3">Exam</th><th className="p-3 text-center">Score</th><th className="p-3 text-center">Grade</th><th className="p-3 text-right">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {examResults.length === 0 ? (
                  <tr><td colSpan={5} className="p-6 text-center text-slate-400 italic">No results published yet.</td></tr>
                ) : (
                  examResults.map((exam) => {
                    const gradeInfo = getGrade(exam.score, exam.maxScore);
                    return (
                      <tr key={exam.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 text-slate-500 text-xs">{new Date(exam.date).toLocaleDateString()}</td>
                        <td className="p-3 font-medium text-slate-800">{exam.examName}</td>
                        <td className="p-3 text-center font-bold text-slate-700">{exam.score} <span className="text-slate-400 text-xs font-normal">/ {exam.maxScore}</span></td>
                        <td className={`p-3 text-center font-black ${gradeInfo.color}`}>{gradeInfo.label}</td>
                        <td className="p-3 text-right"><span className={`px-2 py-1 rounded-md text-xs font-bold ${gradeInfo.status === 'Pass' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{gradeInfo.status}</span></td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- ASSIGNMENT MODAL --- */}
      {selectedAssignment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 relative">
            <button onClick={() => setSelectedAssignment(null)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"><X size={20} /></button>
            <div className="mb-6"><span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md uppercase tracking-wider">{selectedAssignment.subject}</span><h2 className="text-2xl font-bold text-slate-800 mt-3">{selectedAssignment.title}</h2><p className="text-slate-500 text-sm mt-1">Due: {new Date(selectedAssignment.dueDate).toLocaleDateString()}</p></div>
            {selectedAssignment.status === 'graded' ? (
              <div className="space-y-4">
                 <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-xl text-center"><div className="w-16 h-16 bg-white text-yellow-400 shadow-sm rounded-full flex items-center justify-center mx-auto mb-3"><Star size={32} fill="currentColor" /></div><h3 className="text-indigo-900 font-bold text-lg">Graded!</h3><p className="text-indigo-600 text-sm mb-2">You scored:</p><div className="text-4xl font-black text-indigo-600 mb-4">{selectedAssignment.grade}</div></div>
                 {selectedAssignment.feedback && ( <div className="bg-slate-50 p-4 rounded-xl border border-slate-100"><div className="flex items-center gap-2 text-slate-800 font-bold text-sm mb-2"><MessageSquare size={16} /> Teacher's Feedback:</div><p className="text-slate-600 text-sm italic">"{selectedAssignment.feedback}"</p></div> )}
              </div>
            ) : selectedAssignment.status === 'submitted' ? (
              <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-xl text-center"><div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3"><CheckCircle size={24} /></div><h3 className="text-emerald-800 font-bold">Assignment Submitted!</h3><p className="text-emerald-600 text-xs mt-1">Your teacher has received your file. <br/>Check back later for your grade.</p></div>
            ) : (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors relative"><input type="file" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" /><div className="flex flex-col items-center gap-2"><UploadCloud size={32} className="text-indigo-400" /><p className="text-sm font-medium text-slate-600">{selectedFile ? selectedFile.name : "Click to Upload PDF or Image"}</p><p className="text-xs text-slate-400">Max size: 5MB</p></div></div>
                <button onClick={handleSubmit} disabled={submitting || !selectedFile} className="w-full p-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 active:scale-95 disabled:opacity-50">{submitting ? "Uploading..." : "Submit Assignment"}</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;