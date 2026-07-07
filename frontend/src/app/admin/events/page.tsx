"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Calendar, MapPin, Trophy } from "lucide-react";

interface Event {
  id: string;
  title: string;
  date: string;
  description: string;
  location: string;
  teamA?: string;
  teamB?: string;
  isPoster: boolean;
  ticketLink?: string;
}

interface EventFormData {
  title: string;
  date: string;
  description: string;
  location: string;
  teamA: string;
  teamB: string;
  isPoster: boolean;
  ticketLink: string;
  imageFile: File | null;
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<EventFormData>({
    title: "",
    date: "",
    description: "",
    location: "",
    teamA: "",
    teamB: "",
    isPoster: false,
    ticketLink: "",
    imageFile: null
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch("https://horizon-backend-production-4f7a.up.railway.app/api/events");
      const data = await res.json();
      setEvents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (event: Event | null = null) => {
    if (event) {
      setEditingId(event.id);
      // Format date for input type="datetime-local" (YYYY-MM-DDTHH:mm)
      const dateStr = new Date(event.date).toISOString().slice(0, 16);
      setFormData({
        title: event.title,
        date: dateStr,
        description: event.description,
        location: event.location,
        teamA: event.teamA || "",
        teamB: event.teamB || "",
        isPoster: event.isPoster,
        ticketLink: event.ticketLink || "",
        imageFile: null
      });
    } else {
      setEditingId(null);
      setFormData({
        title: "",
        date: "",
        description: "",
        location: "",
        teamA: "",
        teamB: "",
        isPoster: false,
        ticketLink: "",
        imageFile: null
      });
    }
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({...formData, imageFile: e.target.files[0]});
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const token = localStorage.getItem("adminToken");
    
    const url = editingId 
      ? `https://horizon-backend-production-4f7a.up.railway.app/api/admin/events/${editingId}`
      : `https://horizon-backend-production-4f7a.up.railway.app/api/admin/events`;
      
    const method = editingId ? "PUT" : "POST";

    const payload = new FormData();
    payload.append("title", formData.title);
    payload.append("date", formData.date);
    payload.append("description", formData.description);
    payload.append("location", formData.location);
    payload.append("teamA", formData.teamA);
    payload.append("teamB", formData.teamB);
    payload.append("isPoster", String(formData.isPoster));
    payload.append("ticketLink", formData.ticketLink);
    if (formData.imageFile) {
      payload.append("image", formData.imageFile);
    }

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: payload
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchEvents();
      } else {
        alert("Failed to save event");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    const token = localStorage.getItem("adminToken");
    try {
      const res = await fetch(`https://horizon-backend-production-4f7a.up.railway.app/api/admin/events/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) fetchEvents();
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-white">Loading events...</div>;
  }

  return (
    <>
      <div className="animate-[fadeIn_0.5s_ease-out]">
        <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-oswald font-bold uppercase tracking-widest text-brand-gold mb-2">Calendar Events</h1>
          <p className="text-gray-400">Manage upcoming activities for the landing page.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-brand-gold text-brand-black px-6 py-3 rounded-xl font-bold uppercase tracking-widest hover:bg-white transition-colors shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]"
        >
          <Plus className="w-5 h-5" /> Add Event
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <div key={event.id} className="bg-brand-black border border-brand-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col relative group">
            {event.isPoster && (
               <div className="absolute top-4 right-4 z-10 px-2 py-1 bg-brand-gold text-brand-black text-[10px] font-bold uppercase tracking-widest rounded">Poster Style</div>
            )}
            <div className="p-6 bg-brand-white/5 border-b border-brand-white/10">
              <h3 className="text-xl font-oswald font-bold text-white uppercase tracking-widest">{event.title}</h3>
              <p className="text-brand-gold text-sm font-medium mt-1">{new Date(event.date).toLocaleString()}</p>
            </div>
            <div className="p-6 flex-1 text-gray-400 text-sm flex flex-col gap-4">
              <p className="line-clamp-2">{event.description}</p>
              
              <div className="flex items-center gap-2 mt-auto text-gray-500">
                <MapPin className="w-4 h-4" /> {event.location}
              </div>

              {(event.teamA || event.teamB) && (
                <div className="flex items-center gap-2 text-white font-oswald tracking-widest">
                  <Trophy className="w-4 h-4 text-brand-gold" /> {event.teamA || 'TBA'} <span className="text-brand-gold mx-1 italic">VS</span> {event.teamB || 'TBA'}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-brand-white/10 flex justify-end gap-2 bg-black/20">
              <button onClick={() => openModal(event)} className="p-2 text-gray-400 hover:text-brand-gold hover:bg-brand-gold/10 rounded-lg transition-colors">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(event.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {events.length === 0 && (
          <div className="col-span-full py-16 text-center text-gray-500 border border-dashed border-brand-white/10 rounded-2xl">
            No events scheduled yet.
          </div>
        )}
      </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-brand-black border border-brand-white/10 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-brand-white/10 flex justify-between items-center sticky top-0 bg-brand-black z-10">
              <h2 className="text-xl font-oswald font-bold text-white tracking-widest uppercase">{editingId ? 'Edit Event' : 'Add Event'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">&#10005;</button>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Title</label>
                  <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required className="w-full bg-brand-white/5 border border-brand-white/10 rounded-xl px-4 py-3 text-white" placeholder="e.g. NLO Matchday 1" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Date & Time</label>
                  <input type="datetime-local" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required className="w-full bg-brand-white/5 border border-brand-white/10 rounded-xl px-4 py-3 text-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Description</label>
                  <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required className="w-full bg-brand-white/5 border border-brand-white/10 rounded-xl px-4 py-3 text-white h-24 resize-none" placeholder="Short details about the event" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Location</label>
                  <input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} required className="w-full bg-brand-white/5 border border-brand-white/10 rounded-xl px-4 py-3 text-white" placeholder="e.g. Horizon Training Pitch" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Team A (Optional)</label>
                    <input type="text" value={formData.teamA} onChange={e => setFormData({...formData, teamA: e.target.value})} className="w-full bg-brand-white/5 border border-brand-white/10 rounded-xl px-4 py-3 text-white" placeholder="e.g. HZN" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Team B (Optional)</label>
                    <input type="text" value={formData.teamB} onChange={e => setFormData({...formData, teamB: e.target.value})} className="w-full bg-brand-white/5 border border-brand-white/10 rounded-xl px-4 py-3 text-white" placeholder="e.g. OPP" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Ticket / Match Link (Optional)</label>
                  <input type="text" value={formData.ticketLink} onChange={e => setFormData({...formData, ticketLink: e.target.value})} className="w-full bg-brand-white/5 border border-brand-white/10 rounded-xl px-4 py-3 text-white" placeholder="https://" />
                </div>
                <div className="flex items-center gap-3 py-2 border-t border-brand-white/10 mt-4">
                  <input type="checkbox" id="isPoster" checked={formData.isPoster} onChange={e => setFormData({...formData, isPoster: e.target.checked})} className="w-5 h-5 rounded border-gray-600 bg-brand-white/5 text-brand-gold focus:ring-brand-gold focus:ring-offset-brand-black" />
                  <label htmlFor="isPoster" className="text-sm text-gray-300 font-medium">Display as Large Poster Card (Scouting/Highlight)</label>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Event Image / Poster</label>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="w-full bg-brand-white/5 border border-brand-white/10 rounded-xl px-4 py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-brand-gold file:text-black hover:file:bg-white" />
                </div>
                <div className="pt-4">
                  <button type="submit" disabled={isSaving} className="w-full bg-brand-gold text-black font-bold uppercase tracking-widest py-3 rounded-xl hover:bg-white transition-colors disabled:opacity-50">
                    {isSaving ? "Saving..." : "Save Event"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
