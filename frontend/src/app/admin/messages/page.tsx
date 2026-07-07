"use client";

import { useState, useEffect } from "react";

export default function AdminMessages() {
  const [target, setTarget] = useState("ALL");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sendViaWhatsApp, setSendViaWhatsApp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const token = localStorage.getItem("adminToken");

    try {
      const res = await fetch("http://localhost:5000/api/admin/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ target, subject, body, sendViaWhatsApp })
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: `Message successfully sent to ${data.count} player(s).` });
        setSubject("");
        setBody("");
        setSendViaWhatsApp(false);
      } else {
        setMessage({ type: 'error', text: data.error || "Failed to send message." });
      }
    } catch (err) {
      setMessage({ type: 'error', text: "An error occurred. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-10 border-b border-brand-white/10 pb-6">
        <h1 className="text-4xl md:text-5xl font-black font-oswald uppercase tracking-wide text-brand-white">
          Inbox & <span className="text-brand-gold">Broadcasts</span>
        </h1>
        <p className="text-gray-400 mt-2">Send messages and push notifications to players' dashboards.</p>
      </header>

      <div className="bg-brand-black/40 backdrop-blur-xl border border-brand-white/10 rounded-2xl p-8 shadow-2xl">
        <h2 className="text-2xl font-oswald font-bold uppercase tracking-widest text-brand-gold mb-6 border-b border-brand-white/10 pb-4">Draft New Message</h2>
        
        {message && (
          <div className={`p-4 rounded-lg mb-6 text-sm font-medium ${message.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-brand-gold/10 text-brand-gold border border-brand-gold/20'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Target Audience</label>
              <select 
                value={target}
                onChange={e => setTarget(e.target.value)}
                className="w-full bg-brand-white/5 border border-brand-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-gold appearance-none"
              >
                <option value="ALL" className="bg-[#111]">All Players</option>
                <option value="ACADEMIC" className="bg-[#111]">Academic Only</option>
                <option value="SCHOLARSHIP" className="bg-[#111]">Scholarship Only</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Subject</label>
              <input 
                type="text" 
                required
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="e.g., Important Schedule Update"
                className="w-full bg-brand-white/5 border border-brand-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-gold transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Message Body</label>
            <textarea 
              required
              rows={6}
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Type your message here..."
              className="w-full bg-brand-white/5 border border-brand-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-gold transition-colors resize-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={sendViaWhatsApp} 
                onChange={(e) => setSendViaWhatsApp(e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
            </label>
            <span className="text-sm font-medium text-gray-300">Also push this message to players via WhatsApp</span>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="mt-4 px-8 py-4 rounded-lg bg-brand-gold text-brand-black font-bold uppercase tracking-widest text-sm hover:bg-white transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? 'Sending...' : 'Send Broadcast'}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </form>
      </div>
    </div>
  );
}
