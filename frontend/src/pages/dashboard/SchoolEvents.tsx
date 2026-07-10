import { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, Loader2, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../../lib/api';

const SchoolEvents = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/events`);
        if (!res.ok) throw new Error('Failed to load events');
        const data = await res.json();
        setEvents(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
        // Fallback dummy data so the page isn't empty if the backend connection fails
        setEvents([
          { id: 1, title: 'Annual Science Fair', date: '2026-05-15', time: '09:00 AM', location: 'Main Auditorium', description: 'Showcasing the best science projects from the Engineering department.' },
          { id: 2, title: 'Guest Lecture: AI in Web Dev', date: '2026-05-20', time: '02:00 PM', location: 'Lab 4', description: 'Special guest speaker discussing modern AI tools and full-stack integration.' }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  if (loading) return <div className="p-20 text-center flex flex-col items-center gap-2"><Loader2 className="animate-spin text-indigo-600" /> Loading Events...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Calendar className="text-indigo-600" /> School Events
        </h1>
        <p className="text-slate-500 text-sm mt-1">Stay updated with upcoming activities and academic schedules.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-amber-50 text-amber-700 text-sm font-semibold rounded-xl border border-amber-100 flex items-center gap-2">
          <AlertCircle size={16} /> Backend connection warning. Showing sample events.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((evt) => (
          <div key={evt.id} className="bg-white p-6 rounded-[1.5rem] border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-800 mb-2">{evt.title}</h3>
              <p className="text-sm text-slate-600 mb-4 line-clamp-3">{evt.description}</p>
            </div>
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <Calendar size={14} className="text-indigo-500" /> {new Date(evt.date).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <Clock size={14} className="text-emerald-500" /> {evt.time}
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <MapPin size={14} className="text-rose-500" /> {evt.location}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {events.length === 0 && !loading && (
        <div className="text-center p-12 bg-slate-50 rounded-2xl border border-slate-200 text-slate-500">
          No upcoming events scheduled at this time.
        </div>
      )}
    </div>
  );
};

export default SchoolEvents;