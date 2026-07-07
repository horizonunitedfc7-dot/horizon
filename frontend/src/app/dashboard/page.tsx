"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import Link from "next/link";

type PlayerData = {
  id: string;
  firstname: string;
  lastname: string;
  regno: string;
  email?: string;
  mobile?: string;
  playerType: 'ACADEMIC' | 'SCHOLARSHIP';
  applicationStatus: string;
  feeLedger?: string;
  passportPhoto?: string;
  position?: string;
  height?: string;
  weight?: string;
  foot?: string;
  experience?: number;
  scoutRatings?: string;
  privateSchedule?: string;
  coachNotes?: string;
};


export default function PlayerDashboard() {
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [fees, setFees] = useState<{ id: string, key: string, title: string, amount: number, category: string }[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showInbox, setShowInbox] = useState(false);
  const [cart, setCart] = useState<Record<string, number>>({});
  const router = useRouter();

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem("playerToken");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const [playerRes, feesRes, msgsRes] = await Promise.all([
          fetch("https://horizon-backend-production-4f7a.up.railway.app/api/player/me", { headers: { "Authorization": `Bearer ${token}` } }),
          fetch("https://horizon-backend-production-4f7a.up.railway.app/api/fees"),
          fetch("https://horizon-backend-production-4f7a.up.railway.app/api/player/messages", { headers: { "Authorization": `Bearer ${token}` } })
        ]);

        if (!playerRes.ok) {
          localStorage.removeItem("playerToken");
          router.push("/login");
          return;
        }

        const playerData = await playerRes.json();
        const feesData = await feesRes.json();
        const msgsData = await msgsRes.json();

        setPlayer(playerData);
        setFees(feesData);
        setMessages(msgsData || []);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [router]);

  const markMessageAsRead = async (id: string) => {
    const token = localStorage.getItem("playerToken");
    try {
      await fetch(`https://horizon-backend-production-4f7a.up.railway.app/api/player/messages/${id}/read`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });
      setMessages(messages.map(m => m.id === id ? { ...m, isRead: true } : m));
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const token = localStorage.getItem("playerToken");
    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("https://horizon-backend-production-4f7a.up.railway.app/api/player/me", {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        const { applicant } = await res.json();
        setPlayer(applicant);
        setIsEditing(false);
      } else {
        alert("Failed to update profile.");
      }
    } catch (error) {
      console.error(error);
      alert("Error updating profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCartCheckout = () => {
    if (!player) return;

    const totalAmount = Object.entries(cart).reduce((sum, [key, qty]) => {
      const feeItem = fees.find(f => f.key === key);
      return sum + (feeItem ? feeItem.amount * qty : 0);
    }, 0);

    if (totalAmount <= 0) return;

    // @ts-ignore
    if (typeof window !== "undefined" && window.FlutterwaveCheckout) {
      // @ts-ignore
      window.FlutterwaveCheckout({
        public_key: process.env.NEXT_PUBLIC_FLW_PUBLIC_KEY || "FLWPUBK_TEST-dummy-key",
        tx_ref: `${player.regno}_cart_${Date.now()}`,
        amount: totalAmount, 
        currency: "NGN",
        payment_options: "card,mobilemoney,ussd",
        customer: {
          email: player.email || "user@example.com",
          phone_number: player.mobile || "",
          name: `${player.firstname} ${player.lastname}`,
        },
        customizations: {
          title: "Horizon United FC",
          description: `Academy Fees Payment`,
          logo: "https://i.imgur.com/vH0zY7X.png",
        },
        callback: async (response: any) => {
          if (response.status === "successful" || response.status === "completed") {
            try {
              const token = localStorage.getItem("playerToken");
              const res = await fetch("https://horizon-backend-production-4f7a.up.railway.app/api/payments/verify", {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ transaction_id: response.transaction_id, paidItems: cart })
              });
              if (res.ok) {
                const { applicant } = await res.json();
                setPlayer(applicant);
                setCart({});
                alert("Payment verified! Your dashboard has been updated and a notification was sent.");
              } else {
                alert("Payment successful but verification failed. Please contact admin.");
              }
            } catch (err) {
              console.error(err);
              alert("Payment verification error.");
            }
          }
        },
      });
    }
  };

  if (loading) return (
    <div className="min-h-[100dvh] bg-brand-black flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-brand-gold/30 border-t-brand-gold rounded-full animate-spin" />
    </div>
  );

  if (!player) return null;

  // Derive a random but consistent squad number based on player ID length or characters
  const squadNumber = (player.id.charCodeAt(0) % 99) + 1;

  if (player.applicationStatus === "OFFICIAL_SQUAD") {
    let scoutRatings = { pace: 50, shooting: 50, passing: 50, physicality: 50 };
    try { if (player.scoutRatings) scoutRatings = JSON.parse(player.scoutRatings); } catch(e){}

    let privateSchedule: any[] = [];
    try { if (player.privateSchedule) privateSchedule = JSON.parse(player.privateSchedule); } catch(e){}

    return (
      <div className="min-h-[100dvh] bg-[#0A0A0A] text-white font-sans overflow-x-hidden pt-24 pb-32 px-4 md:px-8 relative">
        <div className="fixed inset-0 z-0 pointer-events-none">
          <img src="/horizon_flag_bg.png" alt="Background" className="w-full h-full object-cover opacity-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-[#0A0A0A]/90 to-[#0A0A0A]/70" />
        </div>

        {/* Global Navbar */}
        <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-5xl px-6 py-4 rounded-full bg-black/40 backdrop-blur-2xl border border-brand-gold/20 flex items-center justify-between shadow-[0_0_30px_rgba(212,175,55,0.1)]">
          <span className="font-bold tracking-widest uppercase text-sm flex items-center gap-3">
            <img src="/logo.png" alt="Horizon United Logo" className="h-8 w-auto object-contain" />
            <span className="text-white hidden md:inline">Horizon United FC</span>
          </span>
          <div className="flex items-center gap-6">
            <button onClick={() => setShowInbox(true)} className="relative p-2 text-gray-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              {messages.filter(m => !m.isRead).length > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border border-brand-black"></span>
              )}
            </button>
            <Link href="/" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Return Home</Link>
            <button 
              onClick={() => { 
                localStorage.removeItem('playerToken'); 
                localStorage.removeItem('playerData');
                router.push('/login'); 
              }} 
              className="text-sm font-medium text-red-500 hover:text-red-400 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </nav>

        <main className="relative z-10 max-w-7xl mx-auto flex flex-col lg:flex-row gap-12 pt-8">
          {/* Left Column - ID Card & Profile */}
          <div className="lg:w-1/3 flex flex-col gap-8">
            <div className="bg-brand-black/40 backdrop-blur-xl border border-brand-gold/30 rounded-2xl p-8 flex flex-col items-center text-center shadow-[0_0_50px_rgba(212,175,55,0.15)] relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-brand-gold"></div>
              
              <div className="w-32 h-32 rounded-full border-4 border-brand-gold p-1 mb-6 relative z-10 bg-black">
                {player.passportPhoto ? (
                  <img src={player.passportPhoto.startsWith('http') ? player.passportPhoto : `https://horizon-backend-production-4f7a.up.railway.app${player.passportPhoto}`} alt="Profile" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div className="w-full h-full rounded-full bg-brand-white/5 flex items-center justify-center text-gray-400 font-oswald text-4xl">
                    {player.firstname[0]}{player.lastname[0]}
                  </div>
                )}
                <div className="absolute -bottom-2 -right-2 bg-brand-gold text-black font-black font-oswald text-xl w-10 h-10 rounded-full flex items-center justify-center border-2 border-brand-black shadow-lg">
                  {squadNumber}
                </div>
              </div>
              
              <div className="text-brand-gold font-bold uppercase tracking-widest text-xs mb-2 border border-brand-gold/30 rounded px-2 py-0.5 bg-brand-gold/10 inline-block">Official Squad</div>
              <h2 className="text-3xl font-oswald font-bold uppercase tracking-widest text-white mb-1">
                {player.firstname} {player.lastname}
              </h2>
              <div className="text-gray-400 font-bold uppercase tracking-widest text-sm mb-4">
                {player.position}
              </div>
              
              <div className="w-full flex justify-between px-4 py-3 bg-white/5 rounded-xl border border-white/10 mb-6">
                <div className="text-center">
                  <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Height</div>
                  <div className="font-bold">{player.height || '-'}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Weight</div>
                  <div className="font-bold">{player.weight || '-'}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Foot</div>
                  <div className="font-bold">{player.foot || '-'}</div>
                </div>
              </div>

              <button onClick={() => window.print()} className="w-full py-3 border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-black font-bold uppercase tracking-widest rounded-xl transition-all duration-300">
                Download ID Card
              </button>
            </div>
            
            {/* Scout Ratings */}
            <div className="bg-brand-black/40 backdrop-blur-xl border border-brand-white/10 rounded-2xl p-8">
              <h3 className="font-oswald font-bold text-xl uppercase tracking-widest text-white mb-6 border-b border-white/10 pb-4">Latest Scout Ratings</h3>
              <div className="space-y-4">
                {['pace', 'shooting', 'passing', 'physicality'].map((stat) => (
                  <div key={stat}>
                    <div className="flex justify-between text-xs font-bold uppercase text-gray-400 mb-1">
                      <span>{stat}</span>
                      <span className="text-brand-gold">{scoutRatings[stat as keyof typeof scoutRatings]}</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-gold rounded-full transition-all duration-1000" style={{ width: `${scoutRatings[stat as keyof typeof scoutRatings]}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Schedule & Tactics */}
          <div className="lg:w-2/3 flex flex-col gap-8">
            <div className="bg-brand-black/40 backdrop-blur-xl border border-brand-white/10 rounded-2xl p-8 flex-1">
              <div className="flex justify-between items-end mb-8 border-b border-white/10 pb-4">
                <div>
                  <h3 className="font-oswald font-bold text-2xl uppercase tracking-widest text-brand-gold mb-1">Private Schedule</h3>
                  <p className="text-sm text-gray-400">Team training and match itineraries.</p>
                </div>
              </div>

              <div className="space-y-4">
                {privateSchedule.length > 0 ? (
                  privateSchedule.map((event, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                      <div>
                        <div className="text-xs font-bold text-brand-gold uppercase tracking-widest mb-1">{event.date}</div>
                        <div className="font-bold text-white mb-1">{event.title}</div>
                        <div className="text-sm text-gray-400 flex items-center gap-2">
                          ðŸ“ {event.location}
                        </div>
                      </div>
                      <div className="bg-brand-gold/10 text-brand-gold px-3 py-1 rounded text-xs font-bold uppercase tracking-wider border border-brand-gold/20">
                        {event.type}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500 text-sm italic">No schedule posted for you right now.</div>
                )}
              </div>
            </div>

            {/* Coaches Feedback */}
            <div className="bg-brand-black/40 backdrop-blur-xl border border-brand-white/10 rounded-2xl p-8">
               <h3 className="font-oswald font-bold text-xl uppercase tracking-widest text-brand-gold mb-4">Coach's Notes</h3>
               <div className="p-6 bg-brand-gold/5 border border-brand-gold/20 rounded-xl relative">
                  <span className="absolute top-4 right-4 text-brand-gold opacity-30 text-4xl leading-none">"</span>
                  <p className="text-gray-300 italic text-sm leading-relaxed relative z-10 whitespace-pre-wrap">
                    {player.coachNotes ? player.coachNotes : `"Excellent work rate. Keep pushing in training, ${player.firstname}."`}
                  </p>
               </div>
            </div>

          </div>
        </main>
        
        {/* Inbox Modal */}
        {showInbox && (
          <div className="fixed inset-0 z-[200] flex justify-end bg-black/60 backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]">
            <div className="w-full max-w-md bg-[#0A0A0A] border-l border-brand-white/10 h-full flex flex-col animate-[translateX_0.3s_ease-out]">
              <div className="p-6 border-b border-brand-white/10 flex items-center justify-between">
                <h2 className="text-2xl font-oswald font-bold uppercase tracking-widest text-brand-white">Inbox</h2>
                <button onClick={() => setShowInbox(false)} className="text-gray-400 hover:text-white">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-10 font-medium">No messages found.</div>
                ) : (
                  messages.map((msg) => (
                    <div 
                      key={msg.id} 
                      onClick={() => !msg.isRead && markMessageAsRead(msg.id)}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer ${msg.isRead ? 'bg-brand-white/5 border-brand-white/10' : 'bg-brand-gold/5 border-brand-gold/30 shadow-[0_0_15px_rgba(255,215,0,0.1)]'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className={`font-bold text-lg ${msg.isRead ? 'text-gray-300' : 'text-brand-gold'}`}>{msg.subject}</h3>
                        {!msg.isRead && <span className="w-2 h-2 rounded-full bg-brand-gold shrink-0 mt-2"></span>}
                      </div>
                      <p className="text-sm text-gray-400 mb-4 whitespace-pre-wrap">{msg.body}</p>
                      <a 
                        href={`https://wa.me/2348000000000?text=Hello Admin, I am replying to your message: ${msg.subject}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#25D366]/10 text-[#25D366] text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-[#25D366]/20 transition-colors"
                        onClick={(e) => e.stopPropagation()} 
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.487-1.761-1.659-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        Reply on WhatsApp
                      </a>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  if (player.applicationStatus === "TRIAL_FAILED") {
    return (
      <div className="min-h-[100dvh] bg-[#0A0A0A] text-white font-sans overflow-x-hidden pt-24 pb-32 px-4 md:px-8 relative">
        <div className="fixed inset-0 z-0 pointer-events-none">
          <img src="/horizon_flag_bg.png" alt="Background" className="w-full h-full object-cover opacity-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-[#0A0A0A]/90 to-[#0A0A0A]/70" />
        </div>

        <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-5xl px-6 py-4 rounded-full bg-black/40 backdrop-blur-2xl border border-brand-white/10 flex items-center justify-between shadow-2xl">
          <span className="font-bold tracking-widest uppercase text-sm flex items-center gap-3">
            <img src="/logo.png" alt="Horizon United Logo" className="h-8 w-auto object-contain" />
            <span className="text-white hidden md:inline">Horizon United FC</span>
          </span>
          <div className="flex items-center gap-6">
            <button onClick={() => setShowInbox(true)} className="relative p-2 text-gray-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              {messages.filter(m => !m.isRead).length > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border border-brand-black"></span>
              )}
            </button>
            <Link href="/" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Return Home</Link>
          </div>
        </nav>

        <main className="relative z-10 max-w-2xl mx-auto pt-20 text-center">
          <div className="bg-brand-black/40 backdrop-blur-xl border border-brand-white/10 rounded-2xl p-10 flex flex-col items-center">
            <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mb-6 text-red-500">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h1 className="text-3xl font-oswald font-bold uppercase tracking-widest text-white mb-4">Trial Unsuccessful</h1>
            <p className="text-gray-400 mb-8 leading-relaxed max-w-md">
              Thank you for participating in the Horizon United FC trial. Unfortunately, you have not been selected for the Official Squad at this time. We encourage you to keep training hard and consider re-applying next season.
            </p>
            <button onClick={() => {
              localStorage.removeItem("playerToken");
              router.push("/login");
            }} className="px-8 py-3 bg-white/5 border border-white/10 hover:bg-white/10 font-bold uppercase tracking-widest text-sm rounded-xl transition-colors">
              Logout
            </button>
          </div>
        </main>

        {/* Inbox Modal */}
        {showInbox && (
          <div className="fixed inset-0 z-[200] flex justify-end bg-black/60 backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]">
            <div className="w-full max-w-md bg-[#0A0A0A] border-l border-brand-white/10 h-full flex flex-col animate-[translateX_0.3s_ease-out]">
              <div className="p-6 border-b border-brand-white/10 flex items-center justify-between">
                <h2 className="text-2xl font-oswald font-bold uppercase tracking-widest text-brand-white">Inbox</h2>
                <button onClick={() => setShowInbox(false)} className="text-gray-400 hover:text-white">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-10 font-medium">No messages found.</div>
                ) : (
                  messages.map((msg) => (
                    <div 
                      key={msg.id} 
                      onClick={() => !msg.isRead && markMessageAsRead(msg.id)}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer ${msg.isRead ? 'bg-brand-white/5 border-brand-white/10' : 'bg-brand-gold/5 border-brand-gold/30 shadow-[0_0_15px_rgba(255,215,0,0.1)]'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className={`font-bold text-lg ${msg.isRead ? 'text-gray-300' : 'text-brand-gold'}`}>{msg.subject}</h3>
                        {!msg.isRead && <span className="w-2 h-2 rounded-full bg-brand-gold shrink-0 mt-2"></span>}
                      </div>
                      <p className="text-sm text-gray-400 mb-4 whitespace-pre-wrap">{msg.body}</p>
                      <a 
                        href={`https://wa.me/2348000000000?text=Hello Admin, I am replying to your message: ${msg.subject}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#25D366]/10 text-[#25D366] text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-[#25D366]/20 transition-colors"
                        onClick={(e) => e.stopPropagation()} 
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.487-1.761-1.659-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        Reply on WhatsApp
                      </a>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }


  const ledger = player.feeLedger ? JSON.parse(player.feeLedger) : {};
  const academicFees = fees.filter(f => f.category === 'ACADEMIC');
  
  const isFullyPaid = academicFees.length > 0 && academicFees.every(f => ledger[f.key]);
  
  const feeImages: Record<string, string> = {
    school: '/fee_school.png',
    jersey: '/fee_jersey.png',
    accommodation: '/fee_accommodation.png',
    feeding: '/fee_feeding.png',
  };

  const cartTotal = Object.entries(cart).reduce((sum, [key, qty]) => {
    const feeItem = fees.find(f => f.key === key);
    return sum + (feeItem ? feeItem.amount * qty : 0);
  }, 0);

  return (
    <div className="min-h-[100dvh] bg-[#0A0A0A] text-white font-sans overflow-x-hidden pt-24 pb-32 px-4 md:px-8 relative">
      <Script src="https://checkout.flutterwave.com/v3.js" strategy="lazyOnload" />
      
      {/* Background Flag with Overlay */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img src="/horizon_flag_bg.png" alt="Background" className="w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-[#0A0A0A]/90 to-[#0A0A0A]/70" />
      </div>
      
      {/* Global Navbar */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-5xl px-6 py-4 rounded-full bg-black/40 backdrop-blur-2xl border border-brand-white/10 flex items-center justify-between shadow-2xl">
        <span className="font-bold tracking-widest uppercase text-sm flex items-center gap-3">
          <img src="/logo.png" alt="Horizon United Logo" className="h-8 w-auto object-contain" />
          <span className="text-white hidden md:inline">Horizon United FC</span>
        </span>
        <div className="flex items-center gap-6">
          <button onClick={() => setShowInbox(true)} className="relative p-2 text-gray-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            {messages.filter(m => !m.isRead).length > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border border-brand-black"></span>
            )}
          </button>
          <Link href="/" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Return Home</Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto relative z-10 pt-10">
        
        {/* Header / Giant Player Card */}
        <header className="mb-16">
          <div className="relative bg-gradient-to-b from-brand-black to-[#111] rounded-[3rem] border border-brand-white/10 overflow-hidden shadow-2xl">
            {/* Card Background Texture */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-gold via-brand-black to-brand-black pointer-events-none" />
            
            <div className="flex flex-col md:flex-row items-stretch relative z-10">
              
              {/* Left Side: Photo & Quick Stats */}
              <div className="md:w-2/5 p-8 flex flex-col items-center justify-center relative border-b md:border-b-0 md:border-r border-brand-white/10">
                <div className="absolute top-8 left-8 text-center">
                  <div className="text-5xl font-black font-oswald text-brand-gold drop-shadow-md leading-none">{Math.min(99, 60 + ((player.experience || 1) * 5))}</div>
                  <div className="text-xs font-bold uppercase tracking-widest text-white/70 mt-1">OVR</div>
                </div>

                <div className="absolute top-8 right-8">
                  <span className={`px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-wider border ${
                    player.applicationStatus === 'APPROVED' ? 'bg-brand-gold/10 border-brand-gold/20 text-brand-gold' :
                    player.applicationStatus === 'REJECTED' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                    'bg-brand-white/5 border-brand-white/10 text-brand-white'
                  }`}>
                    {player.applicationStatus}
                  </span>
                </div>

                {/* Photo */}
                <div className="w-48 h-48 md:w-64 md:h-64 mt-16 md:mt-24 mb-8 relative flex items-end justify-center overflow-hidden">
                  {player.passportPhoto ? (
                    <img 
                      src={player.passportPhoto.startsWith('http') ? player.passportPhoto : `https://horizon-backend-production-4f7a.up.railway.app${player.passportPhoto.startsWith('/') ? '' : '/'}${player.passportPhoto}`} 
                      alt="Passport" 
                      className="w-full h-full object-cover object-top drop-shadow-2xl grayscale hover:grayscale-0 transition-all duration-500" 
                      style={{ WebkitMaskImage: 'linear-gradient(to top, transparent 0%, black 20%)' }} 
                    />
                  ) : (
                    <svg className="w-full h-full text-brand-white/10 p-8 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  )}
                </div>

                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-brand-white/10 text-[10px] uppercase tracking-[0.2em] font-bold text-brand-gold">
                  {player.playerType} ATHLETE
                </div>
              </div>

              {/* Right Side: Identity Details */}
              <div className="md:w-3/5 p-8 md:p-12 flex flex-col justify-center bg-brand-black/40">
                <h1 className="text-5xl md:text-7xl font-black font-oswald uppercase tracking-wide text-white leading-none mb-2">
                  {player.firstname} <br />
                  <span className="text-brand-gold">{player.lastname}</span>
                </h1>
                
                <div className="text-lg text-gray-400 font-bold uppercase tracking-widest mb-10">{player.position || 'N/A'}</div>

                {/* Athletic Attributes */}
                <div className="grid grid-cols-3 gap-6 mb-10">
                  <div className="border-l-2 border-brand-gold pl-4">
                    <div className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">Height</div>
                    <div className="text-2xl font-black font-oswald text-white">{player.height || '--'}</div>
                  </div>
                  <div className="border-l-2 border-brand-gold pl-4">
                    <div className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">Weight</div>
                    <div className="text-2xl font-black font-oswald text-white">{player.weight || '--'}</div>
                  </div>
                  <div className="border-l-2 border-brand-gold pl-4">
                    <div className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">Pref. Foot</div>
                    <div className="text-2xl font-black font-oswald text-white">{player.foot ? player.foot.substring(0,1).toUpperCase() : '--'}</div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 border-t border-brand-white/10 pt-8">
                  <div className="bg-brand-white/5 px-4 py-2 rounded-lg font-mono text-sm text-gray-300 mr-auto border border-brand-white/10">
                    ID: {player.regno}
                  </div>
                  
                  {player.applicationStatus === 'APPROVED' && (
                    <button onClick={() => setIsEditing(true)} className="px-6 py-3 rounded-full border border-brand-gold/30 text-xs font-bold uppercase tracking-widest text-brand-gold hover:bg-brand-gold/10 transition-colors">
                      Edit Profile
                    </button>
                  )}
                  <button onClick={() => { localStorage.removeItem("playerToken"); router.push("/login"); }} className="px-6 py-3 rounded-full border border-red-500/30 text-xs font-bold uppercase tracking-widest text-red-400 hover:text-white hover:bg-red-500/20 transition-colors">
                    Sign Out
                  </button>
                </div>

              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Content based on Status & Player Type */}
        {player.applicationStatus === 'PENDING' ? (
          <section className="animate-[translateY_0.5s_ease-out] text-center max-w-2xl mx-auto py-12">
            <div className="w-20 h-20 mx-auto bg-brand-gold/10 text-brand-gold rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h2 className="text-3xl font-medium mb-4">Application Under Review</h2>
            <p className="text-gray-400 text-lg leading-relaxed mb-8">
              Your application and submitted documents are currently being evaluated by our team. Please check back later or await our WhatsApp notification.
            </p>
            <button onClick={() => setIsEditing(true)} className="px-8 py-3 rounded-full bg-brand-gold text-black font-semibold hover:bg-brand-gold transition-colors">
              Update Application Details
            </button>
          </section>
        ) : player.applicationStatus === 'REJECTED' ? (
          <section className="animate-[translateY_0.5s_ease-out] text-center max-w-2xl mx-auto py-12">
            <div className="w-20 h-20 mx-auto bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h2 className="text-3xl font-medium mb-4">Application Rejected</h2>
            <p className="text-gray-400 text-lg leading-relaxed mb-8">
              Unfortunately, your application did not meet our requirements at this time. You can view the reason on WhatsApp or update your documents to appeal.
            </p>
            <button onClick={() => setIsEditing(true)} className="px-8 py-3 rounded-full bg-red-500 text-white font-semibold hover:bg-red-400 transition-colors">
              Edit Application & Appeal
            </button>
          </section>
        ) : player.playerType === 'ACADEMIC' ? (
          isFullyPaid ? (
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-[translateY_0.5s_ease-out]">
              <div className="p-2 rounded-[2.5rem] bg-brand-gold/[0.02] border border-brand-gold/10 shadow-2xl backdrop-blur-xl">
                <div className="h-full bg-brand-black rounded-[calc(2.5rem-0.5rem)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] p-10">
                  <div className="w-12 h-12 rounded-full bg-brand-gold/10 flex items-center justify-center mb-6">
                    <svg className="w-6 h-6 text-brand-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                  </div>
                  <h2 className="text-2xl font-medium mb-4">Academic Schedule</h2>
                  <p className="text-gray-400 leading-relaxed text-lg mb-8">
                    Your semester timetable and training schedules have been finalized. Please meet with your academic advisor at the main campus on Monday.
                  </p>
                  <div className="inline-flex items-center gap-2 text-brand-gold bg-brand-gold/10 px-4 py-2 rounded-full text-sm font-medium mt-auto">
                    View Timetable
                  </div>
                </div>
              </div>
              
              <div className="p-2 rounded-[2.5rem] bg-white/[0.02] border border-brand-white/10 shadow-2xl backdrop-blur-xl">
                <div className="h-full bg-brand-black rounded-[calc(2.5rem-0.5rem)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] p-10">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-6">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>
                  </div>
                  <h2 className="text-2xl font-medium mb-4">Student ID & Clearance</h2>
                  <p className="text-gray-400 leading-relaxed text-lg mb-8">
                    Your Horizon United Academy Student ID is ready for collection. This ID grants you access to the library, dining hall, and training pitches.
                  </p>
                  <div className="inline-flex items-center gap-2 text-white bg-white/10 px-4 py-2 rounded-full text-sm font-medium mt-auto">
                    Download Digital ID
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <section className="animate-[translateY_0.5s_ease-out]">
              <h2 className="text-3xl font-oswald font-black uppercase tracking-widest mb-2 text-white">Academy Store</h2>
              <p className="text-gray-400 mb-8 max-w-2xl">Complete your registration by paying for the required academy items. All items are mandatory for your enrollment.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {academicFees.length === 0 ? (
                  <div className="col-span-full p-10 text-center text-gray-500 font-medium bg-brand-black border border-brand-white/10 rounded-2xl">No fees assigned currently.</div>
                ) : academicFees.map((fee) => (
                  <div key={fee.key} className="bg-brand-black border border-brand-white/10 rounded-2xl overflow-hidden shadow-xl flex flex-col transition-transform hover:scale-[1.02]">
                    <div className="aspect-[4/3] w-full bg-[#111] relative">
                      <img src={feeImages[fee.key] || '/logo.png'} alt={fee.title} className="w-full h-full object-cover opacity-80 mix-blend-screen" />
                      <div className="absolute inset-0 bg-gradient-to-t from-brand-black to-transparent" />
                      {ledger[fee.key] && (
                        <div className="absolute top-3 right-3 bg-brand-gold text-black text-[10px] font-bold uppercase px-3 py-1 rounded-sm shadow-lg">
                          Paid
                        </div>
                      )}
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      <h3 className="text-lg font-bold text-white mb-2">{fee.title}</h3>
                      <div className="text-xl font-mono text-brand-gold mb-6 tracking-tight">&#8358;{fee.amount.toLocaleString()}</div>
                      
                      <div className="mt-auto">
                        {ledger[fee.key] ? (
                          <div className="w-full text-center py-3 rounded-xl bg-brand-white/5 border border-brand-white/10 text-brand-white/50 text-sm font-bold uppercase tracking-widest">
                            Completed
                          </div>
                        ) : (
                          <div className="flex items-center justify-between bg-[#111] rounded-xl border border-brand-white/10 p-1">
                            <button 
                              onClick={() => setCart(prev => ({ ...prev, [fee.key]: Math.max(0, (prev[fee.key] || 0) - 1) }))}
                              className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            >
                              -
                            </button>
                            <span className="font-mono text-lg">{cart[fee.key] || 0}</span>
                            <button 
                              onClick={() => setCart(prev => ({ ...prev, [fee.key]: fee.key !== 'jersey' ? Math.min(1, (prev[fee.key] || 0) + 1) : (prev[fee.key] || 0) + 1 }))}
                              className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cart Summary Floating Bar */}
              {cartTotal > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl bg-brand-gold text-black p-4 rounded-2xl shadow-[0_20px_50px_rgba(255,215,0,0.2)] flex items-center justify-between z-50 animate-[translateY_0.3s_ease-out]">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest opacity-70">Total Due</div>
                    <div className="text-2xl font-black font-oswald">&#8358;{cartTotal.toLocaleString()}</div>
                  </div>
                  <button 
                    onClick={handleCartCheckout}
                    className="bg-black text-brand-gold px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-sm hover:scale-105 transition-transform"
                  >
                    Pay Total Amount
                  </button>
                </div>
              )}
            </section>
          )
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-[translateY_0.5s_ease-out]">
            <div className="p-2 rounded-[2.5rem] bg-brand-gold/[0.02] border border-brand-gold/10 shadow-2xl backdrop-blur-xl">
              <div className="h-full bg-brand-black rounded-[calc(2.5rem-0.5rem)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] p-10">
                <div className="w-12 h-12 rounded-full bg-brand-gold/10 flex items-center justify-center mb-6">
                  <svg className="w-6 h-6 text-brand-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <h2 className="text-2xl font-medium mb-4">Trial Callup Details</h2>
                <p className="text-gray-400 leading-relaxed text-lg mb-8">
                  You will be notified via WhatsApp regarding the exact date, time, and stadium location for your professional trial. Please ensure your boots and equipment are ready.
                </p>
                <div className="inline-flex items-center gap-2 text-brand-gold bg-brand-gold/10 px-4 py-2 rounded-full text-sm font-medium mt-auto">
                  Awaiting Trial Date
                </div>
              </div>
            </div>
            
            <div className="p-2 rounded-[2.5rem] bg-white/[0.02] border border-brand-white/10 shadow-2xl backdrop-blur-xl">
              <div className="h-full bg-brand-black rounded-[calc(2.5rem-0.5rem)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] p-10">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-6">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h2 className="text-2xl font-medium mb-4">Trial Expectations</h2>
                <ul className="text-gray-400 space-y-4 text-base">
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-gold mt-2 shrink-0" />
                    <span>Arrive at least 45 minutes early for registration and warm-up.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-gold mt-2 shrink-0" />
                    <span>Bring your original ID, completely unbranded training gear, and shin guards.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-gold mt-2 shrink-0" />
                    <span>Scouts will evaluate technical ability, tactical awareness, and discipline.</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>
        )}



      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-brand-black border border-brand-white/10 rounded-[2rem] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col transform scale-100 animate-[scaleUp_0.2s_ease-out_forwards]">
            
            <div className="px-8 py-6 border-b border-brand-white/10 flex items-center justify-between bg-brand-black z-10">
              <h2 className="text-2xl font-medium text-white">Edit Profile</h2>
              <button 
                onClick={() => setIsEditing(false)}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-8 overflow-y-auto">
              <form onSubmit={handleEditSubmit} className="space-y-6">
                
                {/* Basic Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">First Name</label>
                    <input name="firstname" type="text" defaultValue={player.firstname} required className="w-full bg-white/5 border border-brand-white/10 rounded-xl px-4 py-3 text-white focus:border-white/30 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Last Name</label>
                    <input name="lastname" type="text" defaultValue={player.lastname} required className="w-full bg-white/5 border border-brand-white/10 rounded-xl px-4 py-3 text-white focus:border-white/30 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Mobile Number</label>
                    {/* @ts-ignore */}
                    <input name="mobile" type="text" defaultValue={player.mobile || ''} required className="w-full bg-white/5 border border-brand-white/10 rounded-xl px-4 py-3 text-white focus:border-white/30 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Address</label>
                    {/* @ts-ignore */}
                    <input name="address" type="text" defaultValue={player.address || ''} required className="w-full bg-white/5 border border-brand-white/10 rounded-xl px-4 py-3 text-white focus:border-white/30 transition-colors" />
                  </div>
                </div>

                <div className="h-px w-full bg-white/5 my-4" />

                {/* Athletic Profile */}
                <h3 className="text-sm font-medium text-white mb-4">Athletic Profile</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Position</label>
                    {/* @ts-ignore */}
                    <select name="position" defaultValue={player.position || ''} required className="w-full bg-white/5 border border-brand-white/10 rounded-xl px-4 py-3 text-white">
                      <option value="Goalkeeper">Goalkeeper</option>
                      <option value="Defender">Defender</option>
                      <option value="Midfielder">Midfielder</option>
                      <option value="Forward">Forward</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Strong Foot</label>
                    {/* @ts-ignore */}
                    <select name="foot" defaultValue={player.foot || ''} required className="w-full bg-white/5 border border-brand-white/10 rounded-xl px-4 py-3 text-white">
                      <option value="Right">Right</option>
                      <option value="Left">Left</option>
                      <option value="Both">Both</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Height</label>
                    {/* @ts-ignore */}
                    <input name="height" type="text" defaultValue={player.height || ''} required className="w-full bg-white/5 border border-brand-white/10 rounded-xl px-4 py-3 text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Weight</label>
                    {/* @ts-ignore */}
                    <input name="weight" type="text" defaultValue={player.weight || ''} required className="w-full bg-white/5 border border-brand-white/10 rounded-xl px-4 py-3 text-white" />
                  </div>
                </div>

                <div className="h-px w-full bg-white/5 my-4" />

                {/* Documents */}
                <h3 className="text-sm font-medium text-white mb-4">Update Documents (Optional)</h3>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-white/5 border border-brand-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-white">Passport Photo</p>
                      <p className="text-xs text-gray-500">Must be an image (jpg/png)</p>
                    </div>
                    <input type="file" name="passportPhoto" accept="image/*" className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20" />
                  </div>
                  
                  <div className="p-4 rounded-xl bg-white/5 border border-brand-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-white">Parent Consent Letter</p>
                      <p className="text-xs text-gray-500">PDF Document</p>
                    </div>
                    <input type="file" name="consentLetter" accept=".pdf" className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20" />
                  </div>

                  {player.playerType === 'SCHOLARSHIP' && (
                    <div className="p-4 rounded-xl bg-white/5 border border-brand-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-white">Club Release Letter</p>
                        <p className="text-xs text-gray-500">PDF Document</p>
                      </div>
                      <input type="file" name="clubReleaseLetter" accept=".pdf" className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20" />
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-brand-white/10 flex justify-end gap-4">
                  <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-3 rounded-full text-sm font-medium text-gray-400 hover:text-white transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSaving} className="px-8 py-3 rounded-full bg-brand-gold hover:bg-brand-gold text-black font-semibold transition-colors disabled:opacity-50 flex items-center gap-2">
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : 'Save Changes'}
                  </button>
                </div>

              </form>
            </div>
          </div>
        </div>
      )}
      {/* Inbox Modal */}
      {showInbox && (
        <div className="fixed inset-0 z-[200] flex justify-end bg-black/60 backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]">
          <div className="w-full max-w-md bg-[#0A0A0A] border-l border-brand-white/10 h-full flex flex-col animate-[translateX_0.3s_ease-out]">
            <div className="p-6 border-b border-brand-white/10 flex items-center justify-between">
              <h2 className="text-2xl font-oswald font-bold uppercase tracking-widest text-brand-white">Inbox</h2>
              <button onClick={() => setShowInbox(false)} className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-10 font-medium">No messages found.</div>
              ) : (
                messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    onClick={() => !msg.isRead && markMessageAsRead(msg.id)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer ${msg.isRead ? 'bg-brand-white/5 border-brand-white/10' : 'bg-brand-gold/5 border-brand-gold/30 shadow-[0_0_15px_rgba(255,215,0,0.1)]'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className={`font-bold text-lg ${msg.isRead ? 'text-gray-300' : 'text-brand-gold'}`}>{msg.subject}</h3>
                      {!msg.isRead && <span className="w-2 h-2 rounded-full bg-brand-gold shrink-0 mt-2"></span>}
                    </div>
                    <p className="text-sm text-gray-400 mb-4 whitespace-pre-wrap">{msg.body}</p>
                    <a 
                      href={`https://wa.me/2348000000000?text=Hello Admin, I am replying to your message: ${msg.subject}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#25D366]/10 text-[#25D366] text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-[#25D366]/20 transition-colors"
                      onClick={(e) => e.stopPropagation()} // Prevent marking as read if just clicking the link, although marking as read is fine too
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.487-1.761-1.659-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      Reply on WhatsApp
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
