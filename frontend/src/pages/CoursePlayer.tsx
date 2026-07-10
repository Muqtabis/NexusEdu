import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, CheckCircle, Circle, Loader2, ArrowLeft, Send, MessageSquare } from 'lucide-react';
import { API_BASE_URL } from '../lib/api';

const CoursePlayer = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState<any>(null);
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // NEW: Comments state initialized as empty array
  const [comments, setComments] = useState<any[]>([]); 
  const [newComment, setNewComment] = useState('');
  
  const userId = localStorage.getItem('userId');
  const userName = localStorage.getItem('name') || "Student";

  useEffect(() => {
    const fetchCourseAndProgress = async () => {
      try {
        const courseRes = await fetch(`${API_BASE_URL}/api/courses/${courseId}`);
        const courseData = await courseRes.json();
        setCourse(courseData);
        
        if (courseData.modules && courseData.modules.length > 0) {
          setActiveLesson(courseData.modules[0].lessons[0]);
        }

        const progressRes = await fetch(`${API_BASE_URL}/api/students/${userId}/learning`);
        if (progressRes.ok) {
          const progressData = await progressRes.json();
          const completedIds = progressData.progress.map((p: any) => p.lessonId);
          setCompletedLessons(completedIds);
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseAndProgress();
  }, [courseId, userId]);

  // NEW: Fetch comments when activeLesson changes
  useEffect(() => {
    if (activeLesson?.id) {
      fetch(`${API_BASE_URL}/api/lessons/${activeLesson.id}/comments`)
        .then(res => res.json())
        .then(data => {
            // Force ensure we set an array
            setComments(Array.isArray(data) ? data : []);
        })
        .catch(() => setComments([]));
    }
  }, [activeLesson]);

  const markComplete = async (lessonId: string) => {
    setCompletedLessons(prev => [...prev, lessonId]);
    try {
      await fetch(`${API_BASE_URL}/api/progress/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: parseInt(userId!), lessonId })
      });
    } catch (err) {
      console.error("Failed to mark complete in DB:", err);
    }
  };

  // NEW: Post comment handler
  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    const res = await fetch(`${API_BASE_URL}/api/lessons/${activeLesson.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: newComment, userName, userId: parseInt(userId!) })
    });
    if (res.ok) {
      setNewComment('');
      const data = await res.json();
      setComments([data, ...comments]);
    }
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return "";
    try {
      if (url.includes("youtube.com/embed/")) return url;
      if (url.includes("youtu.be/")) {
        const videoId = url.split("youtu.be/")[1].split("?")[0];
        return `https://www.youtube.com/embed/${videoId}`;
      }
      if (url.includes("watch?v=")) {
        const videoId = url.split("watch?v=")[1].split("&")[0];
        return `https://www.youtube.com/embed/${videoId}`;
      }
      return url;
    } catch (error) {
      return "";
    }
  };

  if (loading || !course) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-indigo-600" size={40} /></div>;

  const isCurrentCompleted = completedLessons.includes(activeLesson?.id);

  return (
    <div className="max-w-6xl mx-auto p-6 min-h-screen">
      <div className="mb-8">
        <button 
          onClick={() => { localStorage.setItem('studentTab', 'courses'); navigate('/'); }} 
          className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors font-black uppercase text-xs tracking-widest"
        >
          <ArrowLeft size={16} /> Back to Courses
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <div className="aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl mb-6">
             {activeLesson ? (
               <iframe 
                 className="w-full h-full"
                 src={getEmbedUrl(activeLesson.videoUrl)} 
                 allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                 allowFullScreen
               />
             ) : (
               <div className="w-full h-full flex items-center justify-center text-white font-black">No lesson selected</div>
             )}
          </div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            {activeLesson?.title || "Select a lesson to begin"}
            {isCurrentCompleted && <CheckCircle className="text-emerald-500" size={28} />}
          </h1>

          {/* NEW: Fixed Comment Section UI with safety check */}
          <div className="mt-10 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
            <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2"><MessageSquare size={18}/> Lesson Discussion ({Array.isArray(comments) ? comments.length : 0})</h3>
            <div className="flex gap-4 mb-8">
              <input 
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500" 
                placeholder="Ask a question about this lesson..." 
                value={newComment} 
                onChange={(e) => setNewComment(e.target.value)} 
              />
              <button onClick={handlePostComment} className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700">
                <Send size={20} />
              </button>
            </div>
            <div className="space-y-4">
              {Array.isArray(comments) && comments.map((c) => (
                <div key={c.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-xs font-black text-indigo-600 uppercase mb-1">{c.userName}</p>
                  <p className="text-sm text-slate-700 font-medium">{c.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm h-fit">
          <h2 className="font-black text-slate-400 uppercase text-xs tracking-widest mb-6">Course Content</h2>
          {course.modules.map((mod: any) => (
            <div key={mod.id} className="mb-6">
              <h3 className="font-bold text-slate-800 mb-3">{mod.title}</h3>
              {mod.lessons.map((lesson: any) => {
                const isLessonCompleted = completedLessons.includes(lesson.id);
                const isLessonActive = activeLesson?.id === lesson.id;
                return (
                  <button 
                    key={lesson.id}
                    onClick={() => setActiveLesson(lesson)}
                    className={`w-full text-left p-3 rounded-xl mb-2 flex items-center justify-between gap-3 text-sm font-bold transition-all ${isLessonActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center gap-3">
                      {isLessonActive ? <Play size={16} /> : <Circle size={16} />}
                      <span className="truncate">{lesson.title}</span>
                    </div>
                    {isLessonCompleted && <CheckCircle size={16} className="text-emerald-500 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          ))}
          {activeLesson && (
            <button 
              onClick={() => !isCurrentCompleted && markComplete(activeLesson.id)}
              disabled={isCurrentCompleted}
              className={`w-full mt-6 text-white font-black py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all ${isCurrentCompleted ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100'}`}
            >
              <CheckCircle size={16} /> {isCurrentCompleted ? 'Completed' : 'Mark as Complete'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoursePlayer;