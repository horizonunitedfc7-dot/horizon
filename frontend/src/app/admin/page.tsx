"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Activity, Star, Shield, Crosshair, MapPin, Search, Bell, X, Inbox } from "lucide-react";

type Applicant = {
  id: string;
  firstname: string;
  lastname: string;
  regno: string;
  email: string;
  mobile: string;
  position: string;
  applicationStatus: string;
  paymentStatus: string;
  paymentRef?: string;
  createdAt: string;
  playerType: string;
  feeLedger: string;
  passportPhoto?: string;
  hasHealthIssues: boolean;
  releasedFromClub: boolean;
  parentConsent: boolean;
  consentLetter?: string;
  clubReleaseLetter?: string;
  
  scoutRatings?: string;
  privateSchedule?: string;
  coachNotes?: string;
  
  // Demographics
  age: number;
  nationality: string;
  state: string;
  address: string;
  gender: string;
  
  // Football
  foot: string;
  height: string;
  weight: string;
  prevclub?: string;
  experience: number;
  achievement?: string;
  
  // Medical
  bloodgroup: string;
  genotype: string;
  emergencynumber: string;
  medicalcondition?: string;
  allergy?: string;
};

export default function AdminDashboard() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [analytics, setAnalytics] = useState({ total: 0, approved: 0, pending: 0, rejected: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [notifications, setNotifications] = useState<{id:string, title:string, message:string, isRead:boolean, createdAt:string}[]>([]);
  const [isInboxOpen, setIsInboxOpen] = useState(false);

  const [scoutRatings, setScoutRatings] = useState({ pace: 50, shooting: 50, passing: 50, physicality: 50 });
  const [coachNotes, setCoachNotes] = useState("");
  const [privateSchedule, setPrivateSchedule] = useState<{title:string, date:string, location:string, type:string}[]>([]);
  const [newScheduleItem, setNewScheduleItem] = useState({title: "", date: "", location: "", type: "MANDATORY"});
  const [isSavingSquad, setIsSavingSquad] = useState(false);

  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [msgSubject, setMsgSubject] = useState("");
  const [msgBody, setMsgBody] = useState("");
  const [msgWhatsApp, setMsgWhatsApp] = useState(false);
  const [msgLoading, setMsgLoading] = useState(false);

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchApplicants = async () => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    try {
      const res = await fetch("https://horizon-backend-production-4f7a.up.railway.app/api/admin/applicants", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) {
        localStorage.removeItem("adminToken");
        router.push("/login");
        return;
      }
      const data = await res.json();
      setApplicants(data.data || []);
      setAnalytics(data.analytics || { total: 0, approved: 0, pending: 0, rejected: 0, revenue: 0 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;
    try {
      const res = await fetch("https://horizon-backend-production-4f7a.up.railway.app/api/admin/notifications", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        
        // Trigger push notifications for new unread notifications
        const pushedIds = JSON.parse(localStorage.getItem("pushedNotifications") || "[]");
        let newPushes = false;
        
        data.forEach((notif: any) => {
          if (!notif.isRead && !pushedIds.includes(notif.id)) {
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification(notif.title, { body: notif.message });
            }
            pushedIds.push(notif.id);
            newPushes = true;
          }
        });
        
        if (newPushes) {
          localStorage.setItem("pushedNotifications", JSON.stringify(pushedIds));
        }
      }
    } catch (err) {}
  };

  const markNotificationRead = async (id: string) => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;
    try {
      await fetch(`https://horizon-backend-production-4f7a.up.railway.app/api/admin/notifications/${id}/read`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (err) {}
  };

  useEffect(() => {
    fetchApplicants();
    fetchNotifications();
    
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApplicant) return;
    setMsgLoading(true);
    const token = localStorage.getItem("adminToken");
    try {
      const res = await fetch("https://horizon-backend-production-4f7a.up.railway.app/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          target: "SPECIFIC",
          targetId: selectedApplicant.id,
          subject: msgSubject,
          body: msgBody,
          sendViaWhatsApp: msgWhatsApp
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Message sent successfully!", "success");
        setIsMessageModalOpen(false);
        setMsgSubject("");
        setMsgBody("");
        setMsgWhatsApp(false);
      } else {
        showToast(data.error || "Failed to send message.", "error");
      }
    } catch(err) {
      alert("Error occurred.");
    } finally {
      setMsgLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: string, reason?: string) => {
    const token = localStorage.getItem("adminToken");
    try {
      const res = await fetch(`https://horizon-backend-production-4f7a.up.railway.app/api/admin/applicants/${id}/status`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status, reason })
      });
      if (res.ok) {
        fetchApplicants();
        setIsRejecting(false);
        setRejectionReason("");
        if (selectedApplicant) {
          setSelectedApplicant(null);
        }
      } else {
        alert("Failed to update status");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating status");
    }
  };

  const handleSaveSquadData = async () => {
    if (!selectedApplicant) return;
    setIsSavingSquad(true);
    const token = localStorage.getItem("adminToken");
    
    try {
      const res = await fetch(`https://horizon-backend-production-4f7a.up.railway.app/api/admin/applicants/${selectedApplicant.id}/squad-data`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ scoutRatings, privateSchedule, coachNotes })
      });
      if (res.ok) {
        alert("Squad data updated successfully!");
        fetchApplicants();
      } else {
        alert("Failed to update squad data.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingSquad(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent modal opening if row is clickable later
    if (!confirm("Are you sure you want to delete this applicant? This action cannot be undone.")) return;

    const token = localStorage.getItem("adminToken");
    try {
      const res = await fetch(`https://horizon-backend-production-4f7a.up.railway.app/api/admin/applicants/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        fetchApplicants();
        if (selectedApplicant?.id === id) {
          setSelectedApplicant(null);
        }
      } else {
        alert("Failed to delete applicant");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting applicant");
    }
  };

  if (loading) return (
    <div className="min-h-[100dvh] bg-brand-black flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-brand-gold/30 border-t-brand-gold rounded-full animate-spin" />
    </div>
  );

  const renderSquadSection = (squad: Applicant[], title: string, colorClass: string) => (
    <div className="mb-16">
      <h2 className={`text-2xl font-oswald font-black uppercase tracking-widest mb-6 border-b border-white/10 pb-4 ${colorClass}`}>{title}</h2>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
        {/* Pitch */}
        <div className="lg:col-span-1 self-start border border-brand-white/10 rounded-2xl p-6 relative overflow-hidden bg-gradient-to-b from-green-900/20 to-brand-black">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none" />
          <h3 className="text-sm font-bold uppercase tracking-widest text-brand-gold mb-6 relative z-10 flex items-center gap-2"><Crosshair className="w-4 h-4" /> Tactical Depth</h3>
          <div className="w-full aspect-[2/3] border-2 border-white/20 rounded-lg relative flex flex-col justify-between py-4">
            {/* Box 1 */}
            <div className="w-1/2 h-1/6 border-2 border-t-0 border-white/20 mx-auto rounded-b-md" />
            {/* Center Circle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border-2 border-white/20 rounded-full flex items-center justify-center">
              <div className="w-1 h-1 bg-white/20 rounded-full" />
            </div>
            <div className="absolute top-1/2 left-0 w-full h-[2px] bg-white/20 -translate-y-1/2" />
            {/* Box 2 */}
            <div className="w-1/2 h-1/6 border-2 border-b-0 border-white/20 mx-auto rounded-t-md" />
            
            {/* Positions Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-between py-6 pointer-events-none">
              <div className="text-center">
                <div className="w-8 h-8 rounded-full bg-red-500/80 border-2 border-brand-black flex items-center justify-center text-xs font-bold shadow-[0_0_15px_rgba(239,68,68,0.5)] mx-auto mb-1">
                  {squad.filter(a => a.position.toLowerCase().includes('forward') || a.position.toLowerCase().includes('striker') || a.position.toLowerCase().includes('wing')).length}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">ATT</span>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 rounded-full bg-blue-500/80 border-2 border-brand-black flex items-center justify-center text-xs font-bold shadow-[0_0_15px_rgba(59,130,246,0.5)] mx-auto mb-1">
                  {squad.filter(a => a.position.toLowerCase().includes('mid') || a.position.toLowerCase().includes('wing')).length}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">MID</span>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 rounded-full bg-brand-gold/80 border-2 border-brand-black text-brand-black flex items-center justify-center text-xs font-bold shadow-[0_0_15px_rgba(250,204,21,0.5)] mx-auto mb-1">
                  {squad.filter(a => a.position.toLowerCase().includes('def') || a.position.toLowerCase().includes('back')).length}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">DEF</span>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 rounded-full bg-white/80 border-2 border-brand-black text-brand-black flex items-center justify-center text-xs font-bold shadow-[0_0_15px_rgba(255,255,255,0.5)] mx-auto mb-1">
                  {squad.filter(a => a.position.toLowerCase().includes('goal') || a.position.toLowerCase().includes('gk')).length}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">GK</span>
              </div>
            </div>
          </div>
        </div>

        {/* Player Cards Roster */}
        <div className="lg:col-span-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-white flex items-center gap-2"><User className="w-4 h-4 text-brand-gold" /> Active Roster</h3>
            <div className="flex items-center gap-4">
              <div className="text-xs text-gray-400 font-medium">Showing {squad.length} players</div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {squad.map(app => (
              <div key={app.id} className="group relative bg-gradient-to-b from-brand-black to-[#111] rounded-[2rem] border border-brand-white/10 overflow-hidden shadow-2xl hover:border-brand-gold/50 transition-all duration-300 hover:-translate-y-2">
                {/* Card Background Texture */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-gold via-brand-black to-brand-black pointer-events-none" />
                
                {/* Top Stats */}
                <div className="absolute top-4 left-4 z-20 flex flex-col items-center bg-brand-black/80 backdrop-blur-md rounded-xl p-2 min-w-[3rem] border border-brand-white/10 shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                  <div className="text-2xl font-black font-oswald text-brand-gold leading-none">{Math.min(99, 60 + ((app.experience || 1) * 5))}</div>
                  <div className="text-[9px] font-bold uppercase tracking-widest text-brand-white/70 mt-1">OVR</div>
                </div>

                <div className="absolute top-6 right-6 z-10">
                   <span className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest shadow-[0_4px_10px_rgba(0,0,0,0.5)] border backdrop-blur-md ${
                      app.applicationStatus === 'OFFICIAL_SQUAD' ? 'bg-brand-gold/90 border-brand-gold text-brand-black shadow-brand-gold/20' :
                      app.applicationStatus === 'APPROVED' ? 'bg-brand-black/80 border-brand-gold/50 text-brand-gold' :
                      app.applicationStatus === 'REJECTED' ? 'bg-brand-black/80 border-red-500/50 text-red-400' :
                      'bg-brand-black/80 border-white/20 text-white'
                    }`}>
                      {app.applicationStatus.replace('_', ' ')}
                    </span>
                </div>
                
                {/* Player Image / Silhouette */}
                <div className="relative w-full aspect-[4/3] bg-gradient-to-t from-brand-black/50 to-transparent flex items-end justify-center pt-8 overflow-hidden">
                  {app.passportPhoto ? (
                    <img 
                      src={app.passportPhoto.startsWith('http') ? app.passportPhoto : `https://horizon-backend-production-4f7a.up.railway.app${app.passportPhoto.startsWith('/') ? '' : '/'}${app.passportPhoto}`} 
                      alt={app.firstname} 
                      className="h-full w-auto object-cover object-top drop-shadow-2xl grayscale group-hover:grayscale-0 transition-all duration-500" 
                      style={{ WebkitMaskImage: 'linear-gradient(to top, transparent 0%, black 20%)' }} 
                    />
                  ) : (
                    <User className="w-32 h-32 text-brand-white/10 mb-4" />
                  )}
                </div>

                {/* Player Details */}
                <div className="relative z-10 p-6 pt-2 text-center border-t border-brand-white/10 bg-brand-black/80 backdrop-blur-md">
                  <h4 className="text-2xl font-black font-oswald uppercase tracking-wide text-white truncate">{app.firstname} {app.lastname}</h4>
                  <div className="text-xs text-brand-gold font-bold uppercase tracking-widest mb-4">{app.position}</div>
                  
                  <div className="flex justify-center items-center gap-6 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-6 pb-6 border-b border-white/5">
                    <div className="flex flex-col gap-1"><span className="text-white text-sm">{app.height || '--'}</span> HGT</div>
                    <div className="flex flex-col gap-1"><span className="text-white text-sm">{app.weight || '--'}</span> WGT</div>
                    <div className="flex flex-col gap-1"><span className="text-white text-sm">{app.foot.substring(0,1).toUpperCase() || '-'}</span> FOOT</div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => {
                        setSelectedApplicant(app);
                        if (app.scoutRatings) {
                          try { setScoutRatings(JSON.parse(app.scoutRatings)); } catch(e){}
                        } else {
                          setScoutRatings({ pace: 50, shooting: 50, passing: 50, physicality: 50 });
                        }
                        setCoachNotes(app.coachNotes || "");
                        let parsedSchedule = [];
                        try { parsedSchedule = JSON.parse(app.privateSchedule || "[]"); } catch(e){}
                        setPrivateSchedule(parsedSchedule);
                      }}
                      className="flex-1 bg-brand-white/5 text-brand-white border border-brand-white/10 text-xs font-bold uppercase tracking-widest py-3 rounded-full hover:bg-brand-gold hover:text-brand-black hover:border-brand-gold transition-colors"
                    >
                      Scout Profile
                    </button>
                    <button 
                      onClick={(e) => handleDelete(app.id, e)}
                      className="w-12 h-12 flex items-center justify-center rounded-full border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                      title="Delete Player"
                    >
                      <User className="w-4 h-4" />
                      <span className="sr-only">Delete</span>
                      <div className="absolute w-[2px] h-4 bg-current rotate-45" />
                      <div className="absolute w-[2px] h-4 bg-current -rotate-45" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {squad.length === 0 && (
              <div className="col-span-full p-12 text-center border border-dashed border-brand-white/10 rounded-3xl text-gray-500 flex flex-col items-center justify-center">
                <User className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-lg font-bold">No Recruits Found</p>
                <p className="text-sm">Waiting for new registrations to appear.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const filteredApplicants = applicants.filter(a => 
    `${a.firstname} ${a.lastname} ${a.regno} ${a.email}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-[100dvh] text-white font-sans overflow-x-hidden p-4 md:p-8 relative bg-transparent">
      <div className="max-w-7xl mx-auto relative z-10">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-brand-white/10 pb-6">
          <div>
            <h1 className="text-3xl font-medium tracking-tight mb-2">Command Center</h1>
            <p className="text-gray-400">Horizon United FC - Applicant Operations</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search applicants..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-brand-gold/50 transition-colors w-64"
              />
            </div>
            <button 
              onClick={() => setIsInboxOpen(true)}
              className="relative p-2 rounded-full bg-white/5 hover:bg-white/10 border border-brand-white/10 transition-colors"
            >
              <Bell className="w-5 h-5 text-brand-white" />
              {notifications.filter(n => !n.isRead).length > 0 && (
                <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-brand-black rounded-full" />
              )}
            </button>
            <button 
              onClick={() => { localStorage.removeItem("adminToken"); router.push("/login"); }}
              className="px-6 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-brand-white/10 transition-colors text-sm font-medium shrink-0"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Inbox Modal */}
        {isInboxOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-brand-black border border-brand-white/10 rounded-[2rem] shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto transform scale-100 animate-[scaleUp_0.2s_ease-out_forwards] flex flex-col">
              <div className="sticky top-0 bg-brand-black/90 backdrop-blur-xl border-b border-brand-white/10 px-6 py-4 flex items-center justify-between z-10">
                <h3 className="text-xl font-oswald font-bold uppercase tracking-widest text-brand-white flex items-center gap-2">
                  <Inbox className="w-5 h-5 text-brand-gold" /> Admin Inbox
                </h3>
                <button onClick={() => setIsInboxOpen(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
              <div className="p-6 flex flex-col gap-4">
                {notifications.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">
                    <Inbox className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No notifications yet.</p>
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div key={notif.id} className={`p-4 rounded-xl border ${notif.isRead ? 'bg-white/5 border-white/5' : 'bg-brand-gold/5 border-brand-gold/30'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className={`text-sm font-bold uppercase tracking-widest ${notif.isRead ? 'text-gray-400' : 'text-brand-gold'}`}>{notif.title}</h4>
                        <span className="text-[10px] text-gray-500 uppercase">{new Date(notif.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-gray-300 mb-3">{notif.message}</p>
                      {!notif.isRead && (
                        <button onClick={() => markNotificationRead(notif.id)} className="text-[10px] uppercase font-bold tracking-widest text-brand-gold hover:text-white transition-colors">
                          Mark as Read
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Matchday Scoreboard Analytics */}
        <div className="flex flex-wrap gap-4 mb-12">
          {[
            { label: "Total Recruits", value: analytics.total, color: "text-white" },
            { label: "Pending Scrutiny", value: analytics.pending, color: "text-yellow-500" },
            { label: "Contract Offered", value: analytics.approved, color: "text-brand-gold" },
            { label: "Revenue (NGN)", value: `\u20A6${analytics.revenue.toLocaleString()}`, color: "text-white" }
          ].map((stat, i) => (
            <div key={i} className="flex-1 min-w-[200px] p-1 rounded-[1.5rem] bg-gradient-to-b from-white/10 to-transparent border border-brand-white/10 relative overflow-hidden group">
              <div className="absolute inset-0 bg-[url('/hero_action_bg.png')] bg-cover opacity-10 group-hover:opacity-20 transition-opacity" />
              <div className="absolute inset-0 bg-brand-black/80 backdrop-blur-sm" />
              <div className="relative z-10 p-6 flex flex-col justify-between h-full">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4">{stat.label}</p>
                <p className={`text-4xl font-black font-oswald tracking-tight ${stat.color}`}>{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {renderSquadSection(filteredApplicants.filter(a => a.playerType === 'SCHOLARSHIP'), "Scholarship Players", "text-brand-gold")}
        {renderSquadSection(filteredApplicants.filter(a => a.playerType === 'ACADEMIC'), "Academic Players", "text-transparent bg-clip-text bg-gradient-to-r from-brand-white to-brand-gold")}

      </div>

      {/* Applicant Detail Modal */}
      {selectedApplicant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-brand-black border border-brand-white/10 rounded-[2rem] shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto transform scale-100 animate-[scaleUp_0.2s_ease-out_forwards]">
            
            {/* Modal Header */}
            <div className="sticky top-0 bg-brand-black/90 backdrop-blur-xl border-b border-brand-white/10 px-8 py-6 flex items-center justify-between z-10">
              <div className="flex items-center gap-6">
                {selectedApplicant.passportPhoto ? (
                  <img src={selectedApplicant.passportPhoto.startsWith('http') ? selectedApplicant.passportPhoto : `https://horizon-backend-production-4f7a.up.railway.app${selectedApplicant.passportPhoto.startsWith('/') ? '' : '/'}${selectedApplicant.passportPhoto}`} alt="Passport" className="w-16 h-16 rounded-full object-cover border border-white/20" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-white/5 border border-brand-white/10 flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-2xl font-medium">{selectedApplicant.firstname} {selectedApplicant.lastname}</h2>
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${selectedApplicant.playerType === 'ACADEMIC' ? 'bg-blue-500/20 text-blue-400' : 'bg-brand-gold/20 text-brand-gold'}`}>
                      {selectedApplicant.playerType}
                    </span>
                  </div>
                  <p className="text-gray-400 font-mono text-sm">{selectedApplicant.regno} &bull; {selectedApplicant.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsMessageModalOpen(true)}
                  className="px-4 py-2 rounded-lg bg-brand-gold text-brand-black text-xs font-bold uppercase tracking-widest hover:bg-white transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  Message
                </button>
                <button 
                  onClick={() => {
                    setIsRejecting(false);
                    setRejectionReason("");
                    setSelectedApplicant(null);
                  }}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
              
              <section>
                <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-4 pb-2 border-b border-brand-white/10">Athletic Profile</h3>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div><dt className="text-gray-500">Position</dt><dd className="text-white font-medium">{selectedApplicant.position}</dd></div>
                  <div><dt className="text-gray-500">Strong Foot</dt><dd className="text-white font-medium">{selectedApplicant.foot}</dd></div>
                  <div><dt className="text-gray-500">Height</dt><dd className="text-white font-medium">{selectedApplicant.height}</dd></div>
                  <div><dt className="text-gray-500">Weight</dt><dd className="text-white font-medium">{selectedApplicant.weight}</dd></div>
                  <div><dt className="text-gray-500">Experience</dt><dd className="text-white font-medium">{selectedApplicant.experience} yrs</dd></div>
                  <div><dt className="text-gray-500">Prev Club</dt><dd className="text-white font-medium">{selectedApplicant.prevclub || 'None'}</dd></div>
                </dl>
              </section>

              <section>
                <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-4 pb-2 border-b border-brand-white/10">Pre-Qualification</h3>
                <dl className="grid grid-cols-1 gap-4 text-sm">
                  {selectedApplicant.playerType === 'SCHOLARSHIP' && (
                    <div className="flex justify-between items-center">
                      <dt className="text-gray-500">Club Released</dt>
                      <dd className="flex items-center gap-2">
                        <span className={selectedApplicant.releasedFromClub ? "text-brand-gold font-medium" : "text-red-400 font-medium"}>
                          {selectedApplicant.releasedFromClub ? "Yes" : "No"}
                        </span>
                        {selectedApplicant.clubReleaseLetter && (
                          <a href={`https://horizon-backend-production-4f7a.up.railway.app${selectedApplicant.clubReleaseLetter}`} target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/10 text-white hover:bg-white/20 transition-colors">
                            View
                          </a>
                        )}
                      </dd>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <dt className="text-gray-500">Parent Consent</dt>
                    <dd className="flex items-center gap-2">
                      <span className={selectedApplicant.parentConsent ? "text-brand-gold font-medium" : "text-red-400 font-medium"}>
                        {selectedApplicant.parentConsent ? "Yes" : "No"}
                      </span>
                      {selectedApplicant.consentLetter && (
                        <a href={`https://horizon-backend-production-4f7a.up.railway.app${selectedApplicant.consentLetter}`} target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/10 text-white hover:bg-white/20 transition-colors">
                          View
                        </a>
                      )}
                    </dd>
                  </div>
                  <div className="flex justify-between items-center">
                    <dt className="text-gray-500">Health Issues</dt>
                    <dd className={selectedApplicant.hasHealthIssues ? "text-red-400 font-medium" : "text-brand-gold font-medium"}>{selectedApplicant.hasHealthIssues ? "Yes" : "None"}</dd>
                  </div>
                </dl>
              </section>

              <section>
                <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-4 pb-2 border-b border-brand-white/10">Medical</h3>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div><dt className="text-gray-500">Blood Group</dt><dd className="text-white font-medium">{selectedApplicant.bloodgroup}</dd></div>
                  <div><dt className="text-gray-500">Genotype</dt><dd className="text-white font-medium">{selectedApplicant.genotype}</dd></div>
                  <div className="col-span-2"><dt className="text-gray-500">Emergency</dt><dd className="text-white font-medium">{selectedApplicant.emergencynumber}</dd></div>
                </dl>
              </section>

              <section>
                <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-4 pb-2 border-b border-brand-white/10">Demographics</h3>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div><dt className="text-gray-500">Age</dt><dd className="text-white font-medium">{selectedApplicant.age} ({selectedApplicant.gender})</dd></div>
                  <div><dt className="text-gray-500">Location</dt><dd className="text-white font-medium">{selectedApplicant.state}, {selectedApplicant.nationality}</dd></div>
                  <div className="col-span-2"><dt className="text-gray-500">Mobile</dt><dd className="text-white font-medium">{selectedApplicant.mobile}</dd></div>
                  <div className="col-span-2"><dt className="text-gray-500">Address</dt><dd className="text-white font-medium">{selectedApplicant.address}</dd></div>
                </dl>
              </section>

              <section className="col-span-1 md:col-span-2">
                <h3 className="text-xs uppercase tracking-widest text-brand-gold mb-4 pb-2 border-b border-brand-white/10">Registration Payment</h3>
                <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="bg-white/5 p-3 rounded-xl border border-brand-white/10 flex flex-col">
                    <span className="text-gray-400 mb-2">Status</span>
                    <span className={selectedApplicant.paymentStatus === 'COMPLETED' ? "text-brand-gold font-medium flex items-center gap-1" : "text-brand-gold font-medium flex items-center gap-1"}>
                      {selectedApplicant.paymentStatus === 'COMPLETED' ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> : null}
                      {selectedApplicant.paymentStatus}
                    </span>
                  </div>
                  <div className="bg-white/5 p-3 rounded-xl border border-brand-white/10 flex flex-col col-span-1 md:col-span-3">
                    <span className="text-gray-400 mb-2">Payment Reference</span>
                    <span className="text-white font-mono">{selectedApplicant.paymentRef || 'N/A'}</span>
                  </div>
                </dl>
              </section>

              {selectedApplicant.playerType === 'ACADEMIC' && selectedApplicant.feeLedger && (
                <section className="col-span-1 md:col-span-2">
                  <h3 className="text-xs uppercase tracking-widest text-brand-gold mb-4 pb-2 border-b border-brand-white/10">Academic Fee Ledger</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {Object.entries(JSON.parse(selectedApplicant.feeLedger)).map(([key, paid]) => (
                      <div key={key} className="bg-white/5 p-3 rounded-xl border border-brand-white/10 flex flex-col">
                        <span className="text-gray-400 capitalize mb-2">{key}</span>
                        {paid ? (
                          <span className="text-brand-gold font-medium flex items-center gap-1"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Paid</span>
                        ) : (
                          <span className="text-red-400 font-medium">Unpaid</span>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

            </div>

            {/* Squad Management UI */}
            {selectedApplicant.applicationStatus === 'OFFICIAL_SQUAD' && (
              <div className="px-8 pb-8">
                <section className="bg-brand-black/50 border border-brand-gold/30 rounded-2xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-brand-gold"></div>
                  <h3 className="text-sm font-oswald font-bold uppercase tracking-widest text-brand-gold mb-6 border-b border-brand-gold/10 pb-4">
                    Squad Management (Premium Features)
                  </h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Ratings */}
                    <div>
                      <h4 className="text-xs uppercase text-gray-400 font-bold mb-4">Scout Ratings</h4>
                      <div className="space-y-4">
                        {['pace', 'shooting', 'passing', 'physicality'].map(stat => (
                          <div key={stat}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="uppercase text-white">{stat}</span>
                              <span className="text-brand-gold font-bold">{scoutRatings[stat as keyof typeof scoutRatings]}</span>
                            </div>
                            <input 
                              type="range" min="0" max="99" 
                              value={scoutRatings[stat as keyof typeof scoutRatings]}
                              onChange={(e) => setScoutRatings({...scoutRatings, [stat]: parseInt(e.target.value)})}
                              className="w-full accent-brand-gold"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Schedule and Notes */}
                    <div className="flex flex-col gap-6">
                      <div>
                        <h4 className="text-xs uppercase text-gray-400 font-bold mb-2">Coach Notes</h4>
                        <textarea 
                          value={coachNotes}
                          onChange={(e) => setCoachNotes(e.target.value)}
                          placeholder="Feedback for the player..."
                          className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-brand-gold/50 h-24"
                        />
                      </div>
                      <div>
                        <h4 className="text-xs uppercase text-gray-400 font-bold mb-2 flex justify-between items-center">
                          <span>Private Schedule</span>
                        </h4>
                        <div className="space-y-2 mb-4">
                          {privateSchedule.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-white/5 border border-white/10 rounded p-2 text-xs">
                              <div>
                                <strong className="text-brand-gold mr-2">{item.date}</strong>
                                <span className="text-white">{item.title}</span>
                              </div>
                              <button onClick={() => setPrivateSchedule(privateSchedule.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-300">
                                &#10005;
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="bg-black/30 p-3 rounded border border-brand-gold/20 flex flex-col gap-2">
                          <input type="text" placeholder="Title (e.g. Training)" value={newScheduleItem.title} onChange={(e) => setNewScheduleItem({...newScheduleItem, title: e.target.value})} className="bg-transparent text-xs text-white border-b border-white/10 p-1 focus:outline-none" />
                          <div className="flex gap-2">
                            <input type="text" placeholder="Date (e.g. Tomorrow 8AM)" value={newScheduleItem.date} onChange={(e) => setNewScheduleItem({...newScheduleItem, date: e.target.value})} className="w-1/2 bg-transparent text-xs text-white border-b border-white/10 p-1 focus:outline-none" />
                            <input type="text" placeholder="Location" value={newScheduleItem.location} onChange={(e) => setNewScheduleItem({...newScheduleItem, location: e.target.value})} className="w-1/2 bg-transparent text-xs text-white border-b border-white/10 p-1 focus:outline-none" />
                          </div>
                          <div className="flex gap-2 items-center mt-1">
                            <select value={newScheduleItem.type} onChange={(e) => setNewScheduleItem({...newScheduleItem, type: e.target.value})} className="bg-black border border-white/10 text-xs text-white p-1 rounded focus:outline-none">
                              <option value="MANDATORY">MANDATORY</option>
                              <option value="SELECTED SQUAD">SELECTED SQUAD</option>
                              <option value="OPTIONAL">OPTIONAL</option>
                            </select>
                            <button onClick={() => {
                              if (!newScheduleItem.title || !newScheduleItem.date) return;
                              setPrivateSchedule([...privateSchedule, newScheduleItem]);
                              setNewScheduleItem({title: "", date: "", location: "", type: "MANDATORY"});
                            }} className="ml-auto bg-brand-gold text-black text-[10px] font-bold px-3 py-1.5 rounded uppercase tracking-wider hover:bg-white transition-colors">Add Event</button>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={handleSaveSquadData}
                        disabled={isSavingSquad}
                        className="self-end px-6 py-2 bg-brand-gold text-black rounded-lg font-bold uppercase tracking-wider hover:bg-white transition-colors"
                      >
                        {isSavingSquad ? "Saving..." : "Save Squad Data"}
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* Actions Footer */}
            <div className="sticky bottom-0 bg-brand-black/90 backdrop-blur-xl border-t border-brand-white/10 px-8 py-6 z-10">
              {isRejecting ? (
                <div className="animate-[fadeIn_0.2s_ease-out]">
                  <label className="block text-sm font-medium text-white mb-2">Reason for Rejection</label>
                  <textarea 
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full bg-brand-white/10 border border-brand-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500/50 mb-4 min-h-[100px]"
                    placeholder="Enter the reason for rejecting this application (will be sent via WhatsApp)..."
                  />
                  <div className="flex justify-end items-center gap-4">
                    <button 
                      onClick={() => { setIsRejecting(false); setRejectionReason(""); }}
                      className="px-6 py-2.5 rounded-full text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => handleStatusChange(selectedApplicant.id, 'REJECTED', rejectionReason)}
                      disabled={!rejectionReason.trim()}
                      className="px-6 py-2.5 rounded-full text-sm font-medium bg-red-500 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-400 transition-colors shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                    >
                      Send & Reject
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Current Status: <strong className="text-white ml-1">{selectedApplicant.applicationStatus}</strong></span>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => handleStatusChange(selectedApplicant.id, "PENDING")}
                      disabled={selectedApplicant.applicationStatus === "PENDING"}
                      className="px-6 py-2 rounded-full border border-brand-gold/50 text-brand-gold hover:bg-brand-gold/10 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Set Pending
                    </button>
                    <button 
                      onClick={() => setIsRejecting(true)}
                      disabled={selectedApplicant.applicationStatus === "REJECTED"}
                      className="px-6 py-2 rounded-full border border-red-500/50 text-red-400 hover:bg-red-500/10 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Reject
                    </button>
                    {selectedApplicant.applicationStatus === "APPROVED" ? (
                      <>
                        {selectedApplicant.playerType !== 'ACADEMIC' && (
                          <button 
                            onClick={() => handleStatusChange(selectedApplicant.id, "TRIAL_FAILED")}
                            className="px-6 py-2 rounded-full border border-red-500 text-red-500 hover:bg-red-500/10 font-medium transition-colors shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                          >
                            Fail Trial
                          </button>
                        )}
                        <button 
                          onClick={() => handleStatusChange(selectedApplicant.id, "OFFICIAL_SQUAD")}
                          className="px-6 py-2 rounded-full bg-brand-gold text-black hover:bg-white font-bold transition-colors shadow-[0_0_20px_rgba(212,175,55,0.4)] uppercase tracking-wider"
                        >
                          Promote to Squad
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => handleStatusChange(selectedApplicant.id, "APPROVED")}
                        disabled={selectedApplicant.applicationStatus === "APPROVED" || selectedApplicant.applicationStatus === "OFFICIAL_SQUAD" || selectedApplicant.applicationStatus === "TRIAL_FAILED"}
                        className="px-6 py-2 rounded-full bg-brand-gold text-black hover:bg-[#E6C200] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(212,175,55,0.2)]"
                      >
                        Approve Application
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Message Specific Player Modal */}
      {isMessageModalOpen && selectedApplicant && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-brand-black border border-brand-white/10 rounded-[2rem] shadow-2xl max-w-lg w-full transform scale-100 animate-[scaleUp_0.2s_ease-out_forwards]">
            <div className="px-8 py-6 border-b border-brand-white/10 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Message {selectedApplicant.firstname}</h2>
              <button onClick={() => setIsMessageModalOpen(false)} className="text-gray-400 hover:text-white">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSendMessage} className="p-8 space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Subject</label>
                <input 
                  type="text" 
                  required
                  value={msgSubject}
                  onChange={e => setMsgSubject(e.target.value)}
                  placeholder="e.g., Important Schedule Update"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-gold transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Message Body</label>
                <textarea 
                  required
                  rows={4}
                  value={msgBody}
                  onChange={e => setMsgBody(e.target.value)}
                  placeholder="Type your message here..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-gold transition-colors resize-none"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={msgWhatsApp} 
                    onChange={(e) => setMsgWhatsApp(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                </label>
                <span className="text-sm font-medium text-gray-300">Push to WhatsApp</span>
              </div>
              <button 
                type="submit" 
                disabled={msgLoading}
                className="w-full px-8 py-4 rounded-lg bg-brand-gold text-brand-black font-bold uppercase tracking-widest text-sm hover:bg-white transition-colors disabled:opacity-50"
              >
                {msgLoading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-8 right-8 z-[300] flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl animate-[translateY_0.3s_ease-out] border ${toastType === 'success' ? 'bg-[#1a2e1a] border-[#25D366]/30 text-[#25D366]' : 'bg-[#2e1a1a] border-red-500/30 text-red-500'}`}>
          {toastType === 'success' ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          )}
          <span className="font-bold tracking-widest uppercase text-sm">{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
