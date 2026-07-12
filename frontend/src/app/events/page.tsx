"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Trophy, Activity, ExternalLink, Lock, ArrowRight } from "lucide-react";

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (localStorage.getItem("playerToken")) {
      setIsLoggedIn(true);
    }

    const fetchEvents = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://horizon-backend-production-4f7a.up.railway.app"}/api/events`);
        const data = await res.json();
        setEvents(data);
      } catch (err) {
        console.error("Failed to fetch events", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();

    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-[100dvh] bg-gray-50 text-brand-black font-sans selection:bg-brand-gold/30">
      
      {/* Dynamic Navbar */}
      <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 border-b ${isScrolled ? 'bg-brand-black/95 backdrop-blur-md border-brand-gold/20 py-4 shadow-2xl' : 'bg-transparent border-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between">
          <Link href="/" className="font-oswald font-bold tracking-widest uppercase text-xl flex items-center gap-3 text-brand-white hover:text-brand-gold transition-colors">
            <img src="/logo.png" alt="Horizon United Logo" className="h-10 w-auto object-contain" />
            <span className="hidden sm:block">HORIZON UNITED FC</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/#enrollment-paths" className="hidden md:block text-sm font-bold uppercase tracking-wider text-brand-white/70 hover:text-brand-gold transition-colors">Apply Now</Link>
            <div className="hidden md:block h-4 w-[1px] bg-brand-white/20" />
            <Link href={isLoggedIn ? "/dashboard" : "/login"} className="group relative text-sm font-bold uppercase tracking-wider text-brand-black bg-brand-gold px-6 py-2.5 rounded-none hover:bg-[#E6C200] transition-colors flex items-center gap-2 overflow-hidden">
              <span className="relative z-10 flex items-center gap-2">
                {mounted && isLoggedIn ? "Dashboard" : (
                  <>
                    <Lock className="w-4 h-4" /> Login
                  </>
                )}
              </span>
              <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Header */}
      <section className="bg-brand-black text-white py-20 px-4 md:px-8 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="/hero_action_bg.png" alt="Action" className="w-full h-full object-cover opacity-20" />
        </div>
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <h1 className="font-oswald text-5xl md:text-7xl font-black uppercase tracking-tight mb-4">
            Official <span className="text-brand-gold">Calendar</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl font-medium max-w-2xl mx-auto">
            Stay updated with every fixture, trial day, and academy event happening at Horizon United FC.
          </p>
        </div>
      </section>

      {/* Events List */}
      <section className="py-16 px-4 md:px-8">
        <div className="max-w-5xl mx-auto">
          {loading ? (
            <div className="py-20 text-center text-gray-500 font-bold uppercase tracking-widest animate-pulse">Loading Events...</div>
          ) : events.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-gray-300 rounded-2xl">
              <p className="text-gray-500 font-medium">No upcoming activities scheduled at this time.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {events.map((evt) => (
                <div key={evt.id} className="bg-white border border-gray-200 overflow-hidden shadow-xl rounded-2xl flex flex-col md:flex-row group hover:border-brand-gold/50 transition-colors">
                  
                  {/* Date Column */}
                  <div className="bg-brand-black text-brand-gold md:w-48 p-6 flex flex-col justify-center items-center md:border-r border-gray-800 shrink-0">
                    <span className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-1">
                      {new Date(evt.date).toLocaleString([], { month: 'short' })}
                    </span>
                    <span className="text-5xl font-oswald font-black leading-none mb-2">
                      {new Date(evt.date).getDate()}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-widest text-white/50">
                      {new Date(evt.date).toLocaleString([], { weekday: 'long' })}
                    </span>
                    <span className="mt-4 px-3 py-1 bg-white/10 rounded-full text-[10px] text-white font-bold tracking-wider">
                      {new Date(evt.date).toLocaleString([], { hour: '2-digit', minute:'2-digit' })}
                    </span>
                  </div>

                  {/* Details Column */}
                  <div className="p-8 flex-1 flex flex-col relative">
                    {evt.teamA && evt.teamB ? (
                      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                        <div className="text-brand-black font-oswald font-bold text-2xl md:text-3xl">{evt.teamA}</div>
                        <span className="text-brand-gold font-oswald italic font-bold text-xl px-2">VS</span>
                        <div className="text-gray-600 font-oswald font-bold text-2xl md:text-3xl">{evt.teamB}</div>
                      </div>
                    ) : (
                      <h3 className="text-2xl md:text-3xl font-oswald font-bold text-brand-black tracking-widest uppercase mb-4">{evt.title}</h3>
                    )}
                    
                    <p className="text-gray-600 mb-6 leading-relaxed font-medium max-w-3xl flex-1">{evt.description}</p>
                    
                    <div className="mt-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-gray-100 pt-6">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500">
                        {evt.teamA ? <Trophy className="w-4 h-4 text-brand-gold" /> : <Activity className="w-4 h-4 text-brand-gold" />} {evt.location}
                      </div>

                      {evt.ticketLink && (
                        <a 
                          href={evt.ticketLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-gold text-brand-black text-xs font-bold uppercase tracking-widest hover:bg-[#E6C200] transition-colors rounded-full"
                        >
                          Tickets / Register <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
