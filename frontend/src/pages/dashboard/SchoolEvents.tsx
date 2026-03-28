import { useEffect, useState } from 'react';
import { Calendar, Star, Coffee, BookOpen, ArrowLeft, Loader2, Megaphone, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SchoolEvents = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'event' | 'holiday' | 'exam'>('all');
  const navigate = useNavigate();

  useEffect(() => {
    // 🚀 Updated API URL here
    fetch(`${import.meta.env.VITE_API_URL}/events`)
      .then(res => res.json())
      .then(data => {
        // Sort events by date (closest first)
        const sortedData = data.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setEvents(sortedData);
      })
      .catch(err => console.error("Error fetching events:", err))
      .finally(() => setLoading(false));
  }, []);

  const getStyleParams = (type: string) => {
    if (type === 'holiday') return { icon: <Coffee size={24} />, color: 'amber', bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' };
    if (type === 'exam') return { icon: <BookOpen size={24} />, color: 'rose', bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200' };
    return { icon: <Megaphone size={24} />, color: 'indigo', bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' };
  };

  const filteredEvents = events.filter(evt => activeFilter === 'all' || evt.type === activeFilter);

  if (loading) return <div className="p-20 text-center flex flex-col items-center gap-4"><Loader2 className="animate-spin text-indigo-600" size={40} /> <p className="font-bold text-slate-500">Loading Campus Schedule...</p></div>;

  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col gap-6 pb-32 pt-4 px-4 relative min-h-screen animate-in fade-in duration-500">
      
      <button onClick={() => navigate(-1)} className="self-start flex items-center gap-2 text-slate-400 hover:text-slate-800 font-black text-[10px] uppercase tracking-widest transition-colors bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200">
        <ArrowLeft size={16} /> Return to Dashboard
      </button>

      {/* 1. PREMIUM HEADER */}
      <div className="bg-slate-900 text-white rounded-[2.5rem] shadow-2xl p-8 md:p-10 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-black flex items-center gap-4 tracking-tight">
              <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20"><Calendar size={28} /></div>
              Campus Noticeboard
            </h1>
            <p className="text-slate-400 font-medium mt-3 uppercase tracking-widest text-xs">Official Schedule & Announcements</p>
          </div>
        </div>
        <div className="absolute right-0 top-0 h-full w-96 bg-gradient-to-l from-indigo-500/20 to-transparent pointer-events-none" />
      </div>

      {/* 2. FILTER ROW */}
      <div className="flex items-center gap-3 overflow-x-auto hide-scrollbar pb-2">
         <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
            <Filter size={14} /> Filter:
         </div>
        {[
          { id: 'all', label: 'All Updates' },
          { id: 'event', label: 'General Events' },
          { id: 'exam', label: 'Examinations' },
          { id: 'holiday', label: 'Holidays' }
        ].map(filter => (
          <button 
            key={filter.id}
            onClick={() => setActiveFilter(filter.id as any)}
            className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap shadow-sm border
              ${activeFilter === filter.id 
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-200' 
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-800'}`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* 3. EVENT FEED */}
      <div className="space-y-4 mt-2">
        {filteredEvents.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-16 text-center shadow-sm">
            <Calendar size={48} className="mx-auto text-slate-200 mb-4" />
            <h3 className="text-xl font-black text-slate-800 mb-2">No Scheduled Events</h3>
            <p className="text-slate-400 text-sm font-medium">There are no updates for this category right now.</p>
          </div>
        ) : (
          filteredEvents.map((evt) => {
            const style = getStyleParams(evt.type);
            const eventDate = new Date(evt.date);
            
            return (
              <div key={evt.id} className="bg-white p-5 md:p-6 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col md:flex-row items-start md:items-center gap-6 hover:shadow-md hover:border-indigo-200 transition-all animate-in slide-in-from-bottom-2">
                
                {/* Visual Date "Tear-off Calendar" Block */}
                <div className={`flex flex-col items-center justify-center min-w-[90px] p-4 rounded-2xl border ${style.bg} ${style.border}`}>
                  <span className={`text-sm font-black uppercase tracking-widest ${style.text}`}>{eventDate.toLocaleDateString('en-US', { month: 'short' })}</span>
                  <span className={`text-3xl font-black ${style.text} leading-none my-1`}>{eventDate.getDate()}</span>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${style.text} opacity-70`}>{eventDate.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                </div>

                {/* Event Details */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                     <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${style.bg} ${style.border} ${style.text}`}>
                       {style.icon && <span className="scale-75">{style.icon}</span>}
                       {evt.type}
                     </span>
                  </div>
                  <h3 className="font-black text-slate-800 text-xl mb-2">{evt.title}</h3>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-2xl">
                    {evt.description || "Official school schedule update. Please mark your calendars and prepare accordingly."}
                  </p>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

export default SchoolEvents;