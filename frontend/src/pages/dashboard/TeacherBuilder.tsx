import { useState } from 'react';
import { BookOpen, PlusCircle, Save, Video, LayoutList } from 'lucide-react';
import { API_BASE_URL } from '../../lib/api';

const TeacherBuilder = () => {
  const [loading, setLoading] = useState(false);
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600',
    modules: [
      {
        title: '',
        lessons: [{ title: '', videoUrl: '' }]
      }
    ]
  });

  const handlePublish = async () => {
    if (!courseData.title || !courseData.modules[0].title || !courseData.modules[0].lessons[0].title) {
      return alert("Please fill out the Course Title, Module Title, and Lesson Title!");
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseData)
      });

      if (res.ok) {
        alert("Course Published Successfully to the Student Catalog! 🎉");
        window.location.href = '/teacher'; // Send them back to the dashboard
      } else {
        alert("Database error: Could not save the course.");
      }
    } catch (err) {
      alert("Network Error: Is your backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 min-h-screen">
      <div className="bg-slate-900 text-white rounded-[2rem] p-8 mb-8 shadow-xl flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3"><BookOpen /> Course Creator</h1>
          <p className="text-slate-400 mt-2">Design and publish curriculum directly to the student dashboard.</p>
        </div>
        <button 
          onClick={handlePublish}
          disabled={loading}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black tracking-widest uppercase text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
        >
          {loading ? 'Publishing...' : <><Save size={18} /> Publish Course</>}
        </button>
      </div>

      <div className="space-y-6">
        {/* Course Details */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">1. Course Details</h2>
          <input 
            placeholder="Course Title (e.g. Master React.js)" 
            className="w-full text-2xl font-black text-slate-800 border-none outline-none placeholder:text-slate-300 mb-4 bg-transparent"
            value={courseData.title}
            onChange={e => setCourseData({...courseData, title: e.target.value})}
          />
          <textarea 
            placeholder="What will students learn in this course?" 
            className="w-full font-medium text-slate-600 border border-slate-100 rounded-2xl p-4 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all bg-slate-50"
            rows={3}
            value={courseData.description}
            onChange={e => setCourseData({...courseData, description: e.target.value})}
          />
        </div>

        {/* Module Details */}
        <div className="bg-indigo-50/50 p-8 rounded-[2rem] border border-indigo-100 shadow-sm">
          <h2 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2"><LayoutList size={16}/> 2. Curriculum Setup</h2>
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200 mb-4">
            <input 
              placeholder="Module Title (e.g. Week 1: The Basics)" 
              className="w-full text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 outline-none placeholder:text-slate-300 mb-6"
              value={courseData.modules[0].title}
              onChange={e => {
                const newModules = [...courseData.modules];
                newModules[0].title = e.target.value;
                setCourseData({...courseData, modules: newModules});
              }}
            />
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Lesson Title</label>
                <input 
                  placeholder="e.g. Introduction to APIs" 
                  className="w-full font-bold text-slate-700 bg-white border border-slate-200 rounded-lg p-3 outline-none focus:border-indigo-500"
                  value={courseData.modules[0].lessons[0].title}
                  onChange={e => {
                    const newModules = [...courseData.modules];
                    newModules[0].lessons[0].title = e.target.value;
                    setCourseData({...courseData, modules: newModules});
                  }}
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Video size={12}/> YouTube URL</label>
                <input 
                  placeholder="https://youtube.com/watch?v=..." 
                  className="w-full font-medium text-slate-600 bg-white border border-slate-200 rounded-lg p-3 outline-none focus:border-indigo-500"
                  value={courseData.modules[0].lessons[0].videoUrl}
                  onChange={e => {
                    const newModules = [...courseData.modules];
                    newModules[0].lessons[0].videoUrl = e.target.value;
                    setCourseData({...courseData, modules: newModules});
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherBuilder;