import { useEffect, useState } from 'react';
import { Calendar, Star, Coffee, BookOpen, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SchoolEvents = () => {
  const [events, setEvents] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:4000/events')
      .then(res => res.json())
      .then(data => setEvents(data));
  }, []);

  const getIcon = (type: string) => {
    if (type === 'holiday') return <Coffee className="text-amber-500" />;
    if (type === 'exam') return <BookOpen className="text-rose-500" />;
    return <Star className="text-indigo-500" />;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-md mx-auto">
        <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-sm">
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg mb-6 relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-2xl font-bold flex items-center gap-3"><Calendar /> School Calendar</h1>
            <p className="text-indigo-200 text-sm mt-1">Upcoming Holidays & Events</p>
          </div>
          <div className="absolute right-0 top-0 h-full w-32 bg-white opacity-10 transform skew-x-12" />
        </div>

        <div className="space-y-4">
          {events.length === 0 ? (
            <p className="text-center text-slate-400 mt-10">No upcoming events.</p>
          ) : (
            events.map((evt) => (
              <div key={evt.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-start gap-4 hover:shadow-md transition-shadow">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  {getIcon(evt.type)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">{evt.title}</h3>
                  <p className="text-indigo-600 font-bold text-sm">{new Date(evt.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                  <span className={`inline-block mt-2 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${evt.type === 'holiday' ? 'bg-amber-100 text-amber-700' : evt.type === 'exam' ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700'}`}>
                    {evt.type}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SchoolEvents;