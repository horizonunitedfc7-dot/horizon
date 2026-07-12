"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function AdminSettings() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: "New passwords do not match." });
      return;
    }

    setLoading(true);
    setMessage(null);

    const token = localStorage.getItem("adminToken");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://horizon-backend-production-4f7a.up.railway.app"}/api/admin/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: "Password updated successfully." });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setMessage({ type: 'error', text: data.error || "Failed to update password." });
      }
    } catch (err) {
      setMessage({ type: 'error', text: "An error occurred. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <header className="mb-10 border-b border-brand-white/10 pb-6">
        <h1 className="text-4xl md:text-5xl font-black font-oswald uppercase tracking-wide text-brand-white">
          Admin <span className="text-brand-gold">Settings</span>
        </h1>
        <p className="text-gray-400 mt-2">Manage your account security and preferences.</p>
      </header>

      <div className="bg-brand-black/40 backdrop-blur-xl border border-brand-white/10 rounded-2xl p-8 shadow-2xl">
        <h2 className="text-2xl font-oswald font-bold uppercase tracking-widest text-brand-gold mb-6 border-b border-brand-white/10 pb-4">Change Password</h2>
        
        {message && (
          <div className={`p-4 rounded-lg mb-6 text-sm font-medium ${message.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-brand-gold/10 text-brand-gold border border-brand-gold/20'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Current Password</label>
            <div className="relative">
              <input 
                type={showPasswords ? "text" : "password"} 
                required
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className="w-full bg-brand-white/5 border border-brand-white/10 rounded-lg px-4 py-3 pr-12 text-white focus:outline-none focus:border-brand-gold transition-colors"
              />
              <button type="button" onClick={() => setShowPasswords(!showPasswords)} className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-white/40 hover:text-brand-white transition-colors">
                {showPasswords ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">New Password</label>
            <div className="relative">
              <input 
                type={showPasswords ? "text" : "password"} 
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full bg-brand-white/5 border border-brand-white/10 rounded-lg px-4 py-3 pr-12 text-white focus:outline-none focus:border-brand-gold transition-colors"
              />
              <button type="button" onClick={() => setShowPasswords(!showPasswords)} className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-white/40 hover:text-brand-white transition-colors">
                {showPasswords ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Confirm New Password</label>
            <div className="relative">
              <input 
                type={showPasswords ? "text" : "password"} 
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full bg-brand-white/5 border border-brand-white/10 rounded-lg px-4 py-3 pr-12 text-white focus:outline-none focus:border-brand-gold transition-colors"
              />
              <button type="button" onClick={() => setShowPasswords(!showPasswords)} className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-white/40 hover:text-brand-white transition-colors">
                {showPasswords ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="mt-4 px-6 py-3 rounded-lg bg-brand-gold text-brand-black font-bold uppercase tracking-widest text-sm hover:bg-white transition-colors disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
