"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import gsap from "gsap";
import { ArrowDown, Check, Star, Shield, Trophy, Activity, ArrowRight, BookOpen, Lock, CalendarPlus } from "lucide-react";

const Countdown = ({ targetDate }: { targetDate: string | null }) => {
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    if (!targetDate) return;
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = new Date(targetDate).getTime() - now;
      if (distance < 0) return;
      setTimeLeft({
        d: Math.floor(distance / (1000 * 60 * 60 * 24)),
        h: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        s: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div className="flex items-start gap-2 font-oswald font-black text-4xl md:text-5xl text-brand-black leading-none">
      <div className="flex flex-col items-center">
        <span>{String(timeLeft.d).padStart(2, '0')}</span>
        <span className="text-[10px] text-gray-800 font-bold uppercase tracking-widest mt-1">Days</span>
      </div>
      <span>:</span>
      <div className="flex flex-col items-center">
        <span>{String(timeLeft.h).padStart(2, '0')}</span>
        <span className="text-[10px] text-gray-800 font-bold uppercase tracking-widest mt-1">Hours</span>
      </div>
      <span>:</span>
      <div className="flex flex-col items-center">
        <span>{String(timeLeft.m).padStart(2, '0')}</span>
        <span className="text-[10px] text-gray-800 font-bold uppercase tracking-widest mt-1">Mins</span>
      </div>
      <span>:</span>
      <div className="flex flex-col items-center">
        <span>{String(timeLeft.s).padStart(2, '0')}</span>
        <span className="text-[10px] text-gray-800 font-bold uppercase tracking-widest mt-1">Secs</span>
      </div>
    </div>
  );
};

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [registrationFee, setRegistrationFee] = useState<number | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const footerTextRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    if (localStorage.getItem("playerToken")) {
      setIsLoggedIn(true);
    }

    const fetchFee = async () => {
      try {
        const res = await fetch('https://horizon-backend-production-4f7a.up.railway.app/api/fees');
        const data = await res.json();
        const coreFee = data.find((f: any) => f.key === 'registration');
        if (coreFee) setRegistrationFee(coreFee.amount);
      } catch (err) {
        console.error("Failed to fetch fees", err);
      }
    };
    
    const fetchEvents = async () => {
      try {
        const res = await fetch('https://horizon-backend-production-4f7a.up.railway.app/api/events');
        const data = await res.json();
        setEvents(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchFee();
    fetchEvents();

    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);

    if (footerTextRef.current) {
      gsap.to(footerTextRef.current, {
        opacity: 0.9,
        scale: 1.03,
        duration: 3,
        yoyo: true,
        repeat: -1,
        ease: "power2.inOut"
      });
    }

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSyncCalendar = () => {
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Horizon United FC//EN\n";
    events.forEach(evt => {
      const startDate = new Date(evt.date);
      const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours later
      
      const formatICSDate = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };

      icsContent += "BEGIN:VEVENT\n";
      icsContent += `DTSTART:${formatICSDate(startDate)}\n`;
      icsContent += `DTEND:${formatICSDate(endDate)}\n`;
      icsContent += `SUMMARY:${evt.title}\n`;
      icsContent += `DESCRIPTION:${evt.description}\n`;
      if (evt.location) icsContent += `LOCATION:${evt.location}\n`;
      icsContent += "END:VEVENT\n";
    });
    icsContent += "END:VCALENDAR";

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', 'horizon-events.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const scrollToPaths = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById("enrollment-paths")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-[100dvh] bg-brand-black text-brand-white font-sans overflow-x-hidden selection:bg-brand-gold/30">
      
      {/* Dynamic Navbar */}
      <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 border-b ${isScrolled ? 'bg-brand-black/95 backdrop-blur-md border-brand-gold/20 py-4 shadow-2xl' : 'bg-transparent border-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between">
          <span className="font-oswald font-bold tracking-widest uppercase text-xl flex items-center gap-3 text-brand-white">
            <img src="/logo.png" alt="Horizon United Logo" className="h-10 w-auto object-contain" />
            <span className="hidden sm:block">HORIZON UNITED FC</span>
          </span>
          <div className="flex items-center gap-6">
            <button onClick={scrollToPaths} className="hidden md:block text-sm font-bold uppercase tracking-wider text-brand-white/70 hover:text-brand-gold transition-colors">Apply Now</button>
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

      {/* 1. Full-Bleed Cinematic Hero Section */}
      <main className="relative w-full h-[100vh] flex flex-col justify-end pb-12 md:pb-24 px-4 md:px-8 max-w-[100vw]">
        {/* Background Action Shot */}
        <div className="absolute inset-0 w-full h-full z-0">
          <img src="/hero_action_bg.png" alt="Football Action" className="w-full h-full object-cover object-top" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-brand-black/30 to-transparent" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <div className="inline-flex items-center justify-center gap-3 px-4 py-1.5 bg-brand-gold/10 border border-brand-gold/30 text-[10px] md:text-xs uppercase tracking-[0.2em] font-bold text-brand-gold mb-6 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-brand-gold animate-pulse" />
            Official Academy Recruitment 2026
          </div>
          
          <h1 className="font-oswald text-6xl md:text-[8rem] lg:text-[10rem] uppercase font-black leading-[0.85] tracking-tighter mb-6 drop-shadow-2xl text-brand-white">
            FORGE YOUR<br/>
            <span className="text-brand-gold">LEGACY.</span>
          </h1>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-8 border-t border-brand-white/10 pt-8 mt-8">
            <p className="max-w-xl text-lg md:text-xl text-brand-white/80 font-medium leading-relaxed">
              Horizon United FC is an elite football academy bridging the gap between raw talent and professional contracts. Exceptional coaching, direct European scouting.
            </p>
            <button onClick={scrollToPaths} className="group flex items-center justify-center gap-4 bg-brand-white text-brand-black px-8 py-4 font-bold uppercase tracking-wider text-sm hover:bg-brand-gold transition-colors shrink-0">
              <span>Start Your Journey</span>
              <ArrowDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Floating 3D Trophy */}
        <div className="absolute bottom-8 right-8 md:bottom-16 md:right-16 z-20 pointer-events-none drop-shadow-2xl">
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes spinY {
              from { transform: perspective(1000px) rotateY(0deg); }
              to { transform: perspective(1000px) rotateY(360deg); }
            }
          `}} />
          <img 
            src="/trophy.png" 
            alt="Horizon Trophy" 
            className="w-32 h-auto md:w-48" 
            style={{ animation: 'spinY 10s linear infinite' }}
          />
        </div>
      </main>

      {/* 2. Asymmetrical "The Academy" Section */}
      <section className="relative z-10 py-32 px-4 md:px-8 bg-brand-white text-brand-black">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Text Side */}
          <div className="flex flex-col justify-center">
            <h2 className="font-oswald text-5xl md:text-7xl font-bold uppercase tracking-tight leading-[0.9] mb-8">
              THE HORIZON<br/>STANDARD.
            </h2>
            <p className="text-brand-black/70 text-lg md:text-xl leading-relaxed mb-10 max-w-lg">
              We provide everything you need to reach the top tier. State-of-the-art facilities, intense physical conditioning, and tactical mastery under UEFA-licensed coaches. We train you to think and play like a European professional.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="border-l-2 border-brand-gold pl-4">
                <Shield className="w-8 h-8 text-brand-gold mb-3" />
                <h3 className="font-oswald text-2xl font-bold uppercase mb-2">Direct Scouting</h3>
                <p className="text-brand-black/60 text-sm">Bi-annual events attended by top-tier European and African delegates.</p>
              </div>
              <div className="border-l-2 border-brand-black pl-4">
                <Activity className="w-8 h-8 text-brand-black mb-3" />
                <h3 className="font-oswald text-2xl font-bold uppercase mb-2">Complete Welfare</h3>
                <p className="text-brand-black/60 text-sm">Premium accommodation, strictly managed dietary feeding, and medical care.</p>
              </div>
            </div>
          </div>

          {/* Image Side (Overlapping/Asymmetrical) */}
          <div className="relative w-full h-[600px] lg:h-[800px] lg:-mt-24 lg:-mb-24 z-10">
            <div className="absolute inset-0 bg-brand-gold translate-x-4 translate-y-4 shadow-2xl" />
            <img src="/bento_main.png" alt="Elite Training" className="absolute inset-0 w-full h-full object-cover shadow-2xl grayscale-[20%] contrast-125" />
            
            {/* Floating Stat Box */}
            <div className="absolute bottom-10 -left-10 bg-brand-black p-6 shadow-2xl border-l-4 border-brand-gold hidden md:block">
              <p className="font-oswald text-5xl font-black text-brand-white mb-1">50+</p>
              <p className="text-sm font-bold uppercase tracking-wider text-brand-gold">Players Scouted</p>
            </div>
          </div>

        </div>
      </section>

      {/* 3. Detailed Benefits Breakdown */}
      <section className="relative z-10 py-32 px-4 md:px-8 bg-brand-white text-brand-black border-t border-brand-black/5 overflow-hidden">
        
        {/* Left Floating Image (Academic Player) */}
        <div className="hidden lg:block absolute -left-[10.625rem] bottom-0 h-[90%] pointer-events-none z-0">
          <img src="/academic-player.png" alt="Academic Player" className="w-auto h-full object-contain object-bottom drop-shadow-2xl" />
        </div>

        {/* Right Floating Image (Pro Player) */}
        <div className="hidden lg:block absolute -right-[25rem] bottom-0 h-[90%] pointer-events-none z-0">
          <img src="/pro-player.png" alt="Professional Player" className="w-auto h-full object-contain object-bottom drop-shadow-2xl" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2 className="font-oswald text-5xl md:text-6xl font-bold uppercase tracking-tight text-brand-black mb-6">Player Type Benefits</h2>
            <p className="text-brand-black/70 text-lg max-w-2xl mx-auto">Every player joins Horizon with a different goal. Here is a detailed breakdown of the distinct advantages of our two primary pathways.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Academic Benefits Detail */}
            <div className="flex flex-col gap-8">
              <div className="flex items-center gap-4 border-b border-brand-black/10 pb-4">
                <div className="w-16 h-16 bg-brand-gold flex items-center justify-center text-brand-black font-black text-2xl font-oswald">01</div>
                <div>
                  <h3 className="font-oswald text-3xl font-bold uppercase text-brand-black">Academic Player Benefits</h3>
                  <p className="text-brand-black/60 font-medium uppercase tracking-widest text-xs">The Foundational Development Route</p>
                </div>
              </div>
              <ul className="space-y-6">
                <li className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-brand-black text-brand-gold flex items-center justify-center shrink-0">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1 uppercase">Elite Training at Liberty Stadium</h4>
                    <p className="text-brand-black/70 text-sm">Train with modern equipment and learn the absolute rudiments of international standard football.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-brand-black text-brand-gold flex items-center justify-center shrink-0">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1 uppercase">Academic League & Promotion</h4>
                    <p className="text-brand-black/70 text-sm">Play in a dedicated academic league. Once proven to be skillful, you will be promoted to Scholarship status and enjoy all its free benefits.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-brand-black text-brand-gold flex items-center justify-center shrink-0">
                    <Star className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1 uppercase">Scouting & Free Passport</h4>
                    <p className="text-brand-black/70 text-sm">Attend both academic and in-house scouting programs. Receive a free international passport if selected by European scouts for a club deal.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-brand-black text-brand-gold flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1 uppercase">Comprehensive Medical Care</h4>
                    <p className="text-brand-black/70 text-sm">A Registered Medical Team is always available for any injuries sustained during training or official matches.</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Scholarship Benefits Detail */}
            <div className="flex flex-col gap-8">
              <div className="flex items-center gap-4 border-b border-brand-black/10 pb-4">
                <div className="w-16 h-16 bg-brand-black flex items-center justify-center text-brand-white font-black text-2xl font-oswald">02</div>
                <div>
                  <h3 className="font-oswald text-3xl font-bold uppercase text-brand-black">Scholarship Player Benefits</h3>
                  <p className="text-brand-black/60 font-medium uppercase tracking-widest text-xs">The 100% Sponsored Professional Route</p>
                </div>
              </div>
              <ul className="space-y-6">
                <li className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-brand-gold text-brand-black flex items-center justify-center shrink-0">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1 uppercase">Free Liberty Stadium Hostel & Kits</h4>
                    <p className="text-brand-black/70 text-sm">100% free boarding at the Liberty Stadium hostel equipped with mattresses, standard PHCN, and generator to power A.C and fans. Includes free personal jerseys and training gear.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-brand-gold text-brand-black flex items-center justify-center shrink-0">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1 uppercase">Nigerian League Progression</h4>
                    <p className="text-brand-black/70 text-sm">Train and play matches at the Main Bowl. Progress through the NLO, NLL, NPFL, <br /> Africa FA CUP, and Nigerian Football Cup.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-brand-gold text-brand-black flex items-center justify-center shrink-0">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1 uppercase">Global Scouting Access</h4>
                    <p className="text-brand-black/70 text-sm">We have a partner who works in Bournemouth Stadium to facilitate European opportunities. You also get access to external scouting events.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-brand-gold text-brand-black flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1 uppercase">Free Passport & Medical Coverage</h4>
                    <p className="text-brand-black/70 text-sm">Free international passport if selected by European scouts for a club deal. A Registered Medical Team is on standby for any training or match injuries.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Enrollment Paths (Player Cards) */}
      <section id="enrollment-paths" className="relative z-10 py-32 px-4 md:px-8 bg-brand-black overflow-hidden">
        
        {/* Background Image with increased visibility */}
        <div className="absolute inset-0 z-0 bg-[url('/hero_stadium.png')] bg-cover bg-center opacity-30" />
        
        {/* Black & Gold Radial Gradient Overlay */}
        <div className="absolute inset-0 z-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top, rgba(255, 215, 0, 0.2) 0%, rgba(0, 0, 0, 0.8) 60%, rgba(0, 0, 0, 1) 100%)' }} />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2 className="font-oswald text-5xl md:text-7xl font-bold uppercase tracking-tight text-brand-white mb-6">Choose Your Path</h2>
            <p className="text-brand-white/60 text-lg max-w-2xl mx-auto">Two distinct routes. One ultimate destination. Select the development path that matches your current stage.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 max-w-5xl mx-auto">
            
            {/* Academic Player Card */}
            <div className="group relative bg-brand-white/5 border border-brand-white/10 overflow-hidden flex flex-col hover:border-brand-gold/50 transition-colors duration-500 shadow-2xl">
              <div className="h-64 relative w-full overflow-hidden border-b border-brand-white/10">
                <div className="absolute inset-0 bg-gradient-to-t from-brand-white/5 to-transparent z-10" />
                <img src="/bento_welfare.png" alt="Academic" className="w-full h-full object-cover opacity-60 group-hover:scale-105 group-hover:opacity-80 transition-all duration-700" />
                <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1 bg-brand-black/50 backdrop-blur-md border border-brand-white/10 text-xs font-bold uppercase tracking-wider text-brand-gold">
                  <BookOpen className="w-3 h-3" /> Long-Term
                </div>
              </div>
              
              <div className="p-8 md:p-10 flex flex-col flex-1 relative z-20">
                <h3 className="font-oswald text-4xl font-bold uppercase text-brand-white mb-2">Academic Player</h3>
                <p className="text-brand-gold font-medium text-sm tracking-wide uppercase mb-8">Development & Education {registrationFee ? `(Reg Fee: \u20A6${registrationFee.toLocaleString()})` : ""}</p>
                
                <ul className="space-y-4 mb-12 flex-1">
                  {[
                    "Academy players train at Liberty Stadium",
                    "Play in the Official Academic League",
                    "Promotion Pathway to Scholarship Status",
                    "Access to Academic & In-House Scouting",
                    "Free Int'l Passport if selected for club deal",
                    "Registered Medical Team on Standby"
                  ].map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-brand-gold shrink-0" strokeWidth={3} />
                      <span className="text-brand-white/80 font-medium text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href="/register/academic" className="w-full block text-center bg-brand-gold text-brand-black px-6 py-4 font-oswald font-bold uppercase tracking-widest text-lg hover:bg-[#E6C200] transition-colors">
                  Select Academic
                </Link>
              </div>
            </div>

            {/* Scholarship Player Card */}
            <div className="group relative bg-brand-white/5 border border-brand-white/10 overflow-hidden flex flex-col hover:border-brand-white/50 transition-colors duration-500 shadow-2xl">
              <div className="h-64 relative w-full overflow-hidden border-b border-brand-white/10">
                <div className="absolute inset-0 bg-gradient-to-t from-brand-white/5 to-transparent z-10" />
                <img src="/bento_scout.png" alt="Scholarship" className="w-full h-full object-cover opacity-60 group-hover:scale-105 group-hover:opacity-80 transition-all duration-700" />
                <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1 bg-brand-black/50 backdrop-blur-md border border-brand-white/10 text-xs font-bold uppercase tracking-wider text-brand-white">
                  <Trophy className="w-3 h-3" /> Fast-Track
                </div>
              </div>
              
              <div className="p-8 md:p-10 flex flex-col flex-1 relative z-20">
                <h3 className="font-oswald text-4xl font-bold uppercase text-brand-white mb-2">Scholarship Player</h3>
                <p className="text-brand-white/80 font-medium text-sm tracking-wide uppercase mb-8">Professional Trial Callup {registrationFee?.toLocaleString() ? `(Reg Fee: \u20A6${registrationFee.toLocaleString()})` : ""}</p>
                
                <ul className="space-y-4 mb-12 flex-1">
                  {[
                    "100% Free Hostel (Standard PHCN & Generator for AC/Fans)",
                    "Free Personal Jersey & Training Gear",
                    "Play in NLO, NLL, NPFL & Africa FA Cup",
                    "Partner connection working in Bournemouth Stadium",
                    "Free Int'l Passport if selected for club deal",
                    "Registered Medical Team on Standby"
                  ].map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-brand-white shrink-0" strokeWidth={3} />
                      <span className="text-brand-white/80 font-medium text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href="/register/scholarship" className="w-full block text-center bg-brand-white text-brand-black px-6 py-4 font-oswald font-bold uppercase tracking-widest text-lg hover:bg-gray-200 transition-colors">
                  Apply For Scholarship
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Calendar Section */}
      <section className="relative z-10 py-32 px-4 md:px-8 bg-gray-50 overflow-hidden border-y border-gray-200 shadow-[inset_0_20px_40px_rgba(0,0,0,0.03)]">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 mb-16 border-b border-gray-200 pb-8">
            <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-12">
              <h2 className="font-oswald text-5xl md:text-6xl font-black uppercase tracking-tight text-brand-black m-0 leading-none">
                CALENDAR
              </h2>
              <div className="flex items-center gap-6">
                <span className="text-sm font-black italic uppercase tracking-widest text-brand-black/80">NEXT EVENT</span>
                <Countdown targetDate={events.length > 0 ? events[0].date : null} />
              </div>
            </div>
            
            <button onClick={handleSyncCalendar} className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-brand-black font-bold text-sm uppercase tracking-widest rounded-full transition-colors whitespace-nowrap">
              Sync Calendar <CalendarPlus className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {events.map((evt) => {
              if (evt.isPoster) {
                return (
                  <div key={evt.id} className="relative border border-gray-200 overflow-hidden shadow-2xl group rounded-xl">
                    <img src={evt.image ? (evt.image.startsWith('http') ? evt.image : `https://horizon-backend-production-4f7a.up.railway.app${evt.image}`) : "/scouting_poster.png"} alt={evt.title} className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-brand-black/40 to-transparent" />
                    <div className="absolute inset-0 p-8 flex flex-col justify-end">
                      <h3 className="text-4xl font-oswald font-black text-white tracking-widest uppercase mb-2" dangerouslySetInnerHTML={{ __html: evt.title.replace(' ', '<br/>') }}></h3>
                      <p className="text-sm text-gray-200 font-medium mb-6">{evt.description}</p>
                      <Link href="/events" className="text-left text-sm font-bold uppercase tracking-widest text-brand-gold flex items-center gap-2 hover:text-white transition-colors drop-shadow-md">
                        Full Calendar <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                );
              }

              return (
                <div key={evt.id} className="bg-white border border-gray-200 overflow-hidden shadow-xl group hover:border-brand-gold/50 transition-colors flex flex-col relative rounded-xl">
                  <div className="h-40 relative w-full overflow-hidden border-b border-gray-100">
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-black/80 to-transparent z-10" />
                    <img src={evt.image ? (evt.image.startsWith('http') ? evt.image : `https://horizon-backend-production-4f7a.up.railway.app${evt.image}`) : "/hero_stadium.png"} alt={evt.title} className="w-full h-full object-cover opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700" />
                    <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1 bg-brand-gold text-brand-black text-xs font-bold uppercase tracking-wider shadow-lg rounded-sm">
                      {evt.location.split(' ')[0]}
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col relative z-20 bg-white">
                    {evt.teamA && evt.teamB ? (
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-brand-black font-oswald font-bold text-xl">{evt.teamA}</div>
                        <span className="text-brand-gold font-oswald italic font-bold">VS</span>
                        <div className="text-gray-500 font-oswald font-bold text-xl">{evt.teamB}</div>
                      </div>
                    ) : (
                      <h3 className="text-xl font-oswald font-bold text-brand-black tracking-widest uppercase mb-2">{evt.title}</h3>
                    )}
                    
                    <p className="text-sm font-bold text-brand-gold mb-2">
                      {new Date(evt.date).toLocaleString([], { weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                    </p>
                    <p className="text-xs text-gray-600 mb-6 leading-relaxed font-medium">{evt.description}</p>
                    <div className="mt-auto flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500">
                      {evt.teamA ? <Trophy className="w-4 h-4 text-brand-gold" /> : <Activity className="w-4 h-4 text-brand-gold" />} {evt.location}
                    </div>
                  </div>
                </div>
              );
            })}

            {events.length === 0 && (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-300 rounded-2xl">
                <p className="text-gray-500 font-medium">No upcoming activities scheduled at this time.</p>
              </div>
            )}

          </div>
        </div>
      </section>

      {/* 5. Proven Success (Testimonials) */}
      <section className="relative z-10 py-32 bg-brand-black overflow-hidden" style={{ backgroundImage: 'url(/testimonial_bg.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 bg-brand-black/50 z-0 pointer-events-none"></div>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes marquee {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee-custom {
            animation: marquee 30s linear infinite;
          }
        `}} />
        <div className="max-w-7xl mx-auto px-4 md:px-8 mb-16 relative z-10">
          <h2 className="font-oswald text-5xl md:text-7xl font-bold uppercase tracking-tight text-center text-brand-white">Proven Success.</h2>
        </div>
        
        <div className="flex overflow-hidden relative group z-10">
          <div className="flex gap-8 min-w-max hover:[animation-play-state:paused] px-4 animate-marquee-custom">
            {[
              {
                quote: "Horizon gave me the platform to showcase my raw talent. Within 6 months of my scholarship trial, I signed my first professional contract in Lagos.",
                name: "David O.",
                role: "Pro Player (Lagos)",
                image: "/test_david.png"
              },
              {
                quote: "The academic structure is incredible. My parents wanted me to finish school, but I wanted to play football. Horizon allowed me to perfectly balance both.",
                name: "Samuel K.",
                role: "Academic Graduate",
                image: "/test_samuel.png"
              },
              {
                quote: "The coaching staff here is elite. The tactical drills changed the way I see the game, making me much more attractive to top Nigerian club scouts.",
                name: "Emmanuel T.",
                role: "Pro Player (Rivers)",
                image: "/test_emmanuel.png"
              },
              {
                quote: "The European scouting event organized by Horizon changed my life. I was spotted by UK delegates and immediately got a trial call-up.",
                name: "Chidera A.",
                role: "European Trialist (Abuja)",
                image: "/test_emmanuel.png"
              }
            ].concat([
              {
                quote: "Horizon gave me the platform to showcase my raw talent. Within 6 months of my scholarship trial, I signed my first professional contract in Lagos.",
                name: "David O.",
                role: "Pro Player (Lagos)",
                image: "/test_david.png"
              },
              {
                quote: "The academic structure is incredible. My parents wanted me to finish school, but I wanted to play football. Horizon allowed me to perfectly balance both.",
                name: "Samuel K.",
                role: "Academic Graduate",
                image: "/test_samuel.png"
              },
              {
                quote: "The coaching staff here is elite. The tactical drills changed the way I see the game, making me much more attractive to top Nigerian club scouts.",
                name: "Emmanuel T.",
                role: "Pro Player (Rivers)",
                image: "/test_emmanuel.png"
              },
              {
                quote: "The European scouting event organized by Horizon changed my life. I was spotted by UK delegates and immediately got a trial call-up.",
                name: "Chidera A.",
                role: "European Trialist (Abuja)",
                image: "/test_emmanuel.png"
              }
            ]).map((test, idx) => (
              <div key={idx} className="w-[400px] md:w-[450px] p-8 bg-brand-black border-t-4 border-brand-gold flex flex-col shadow-xl shrink-0">
                <div className="flex gap-1 mb-6">
                  {[1,2,3,4,5].map(star => (
                    <Star key={star} className="w-5 h-5 text-brand-gold fill-brand-gold" />
                  ))}
                </div>
                <p className="text-brand-white/80 font-medium italic mb-8 flex-1 leading-relaxed text-lg">"{test.quote}"</p>
                <div className="flex items-center gap-4">
                  <img src={test.image} alt={test.name} className="w-12 h-12 rounded-full object-cover border-2 border-brand-gold" />
                  <div>
                    <h4 className="font-oswald text-xl font-bold uppercase text-brand-white mb-1">{test.name}</h4>
                    <p className="text-xs text-brand-gold uppercase tracking-widest font-bold">{test.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="relative z-10 bg-brand-black pt-32 pb-12 border-t border-brand-white/5 overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 z-0 pointer-events-none"
          style={{ 
            backgroundImage: "url('/ready_to_play_bg.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />
        {/* Gradients for text legibility */}
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-brand-black/90 via-brand-black/70 to-transparent pointer-events-none" />
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-brand-black via-transparent to-brand-black/50 pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 text-center">
          <h2 className="font-oswald text-6xl md:text-8xl font-black uppercase text-brand-white mb-6 tracking-tighter">Ready To Play?</h2>
          <p className="text-brand-white/60 mb-12 text-xl max-w-2xl mx-auto">Registration for the 2026 intake is closing soon. Don't let your talent go unnoticed.</p>
          <button onClick={scrollToPaths} className="bg-brand-gold text-brand-black px-12 py-5 font-oswald font-bold uppercase tracking-widest text-xl hover:bg-[#E6C200] transition-colors mb-32 inline-flex items-center gap-3">
            Enroll Now <ArrowRight className="w-6 h-6" />
          </button>
          
          <div className="w-full flex flex-col items-center justify-center pt-24 pb-12 overflow-hidden pointer-events-none opacity-40" ref={footerTextRef}>
            <div className="flex flex-col items-center opacity-50 mix-blend-screen">
              <img src="/logo.png" alt="Logo" className="w-24 h-24 mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] grayscale" />
              <h1 className="text-[9vw] font-black font-oswald uppercase leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-brand-white/50 to-transparent">
                HORIZON UNITED FC
              </h1>
            </div>
          </div>
          
          <div className="border-t border-brand-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-brand-white/50 font-medium relative z-10">
            <p>&copy; {new Date().getFullYear()} Horizon United FC. All rights reserved.</p>
            <div className="flex gap-6 uppercase tracking-wider text-xs font-bold">
              <a href="#" className="hover:text-brand-gold transition-colors">Terms</a>
              <a href="#" className="hover:text-brand-gold transition-colors">Privacy</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp */}
      <a 
        href="https://wa.me/2348106131520" 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-8 right-8 z-50 p-4 bg-brand-gold text-brand-black rounded-none shadow-[4px_4px_0_0_#fff] hover:translate-x-1 hover:translate-y-1 hover:shadow-[0px_0px_0_0_#fff] transition-all duration-200"
      >
        <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
        </svg>
      </a>
    </div>
  );
}
