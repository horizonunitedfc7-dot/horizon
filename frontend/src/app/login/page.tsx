"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

export default function PlayerLogin() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/auth/unified/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();
      if (res.ok) {
        if (data.type === 'ADMIN') {
          localStorage.setItem("adminToken", data.token);
          localStorage.setItem("adminData", JSON.stringify(data.admin));
          router.push("/admin");
        } else if (data.type === 'PLAYER') {
          localStorage.setItem("playerToken", data.token);
          localStorage.setItem("playerData", JSON.stringify(data.player));
          router.push("/dashboard");
        }
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err: any) {
      setError(err.message || "Network error. Is the server running?");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setForgotPasswordMessage("");

    try {
      const res = await fetch("http://localhost:5000/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to process request");

      setForgotPasswordMessage(data.message || "A temporary password has been sent to your email.");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-brand-black text-brand-white flex font-sans">
      
      {/* Left Column - Image Section */}
      <div className="hidden lg:block relative w-[60%] h-[100dvh]">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/login_bg.png')" }}
        />
        {/* Subtle gradient overlay to blend with the right side if needed */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-brand-black/90 pointer-events-none" />
      </div>

      {/* Right Column - Login Form Section */}
      <div className="w-full lg:w-[40%] flex flex-col justify-center px-8 sm:px-16 xl:px-24 h-[100dvh] overflow-y-auto bg-brand-black relative">
        <div className="fixed top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-brand-gold/5 blur-[120px] pointer-events-none" />

        <div className="w-full max-w-sm mx-auto relative z-10">
          
          <div className="flex justify-center mb-6">
            <img src="/logo.png" alt="Horizon United FC" className="w-20 h-20 object-contain" />
          </div>

          <h1 className="text-3xl font-black text-center mb-3 uppercase tracking-wide font-oswald text-brand-white">
            {isForgotPasswordMode ? "Reset Password" : "Portal"}
          </h1>
          <p className="text-brand-white/60 text-center text-sm mb-10">
            {isForgotPasswordMode ? "Enter your ID or Email to reset your password" : "Enter your Credentials to securely log in"}
          </p>

          {isForgotPasswordMode ? (
            <form onSubmit={handleForgotPassword} className="space-y-6">
              {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center rounded-xl">{error}</div>}
              {forgotPasswordMessage && <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 text-sm text-center rounded-xl">{forgotPasswordMessage}</div>}

              <div className="space-y-5">
                <div>
                  <input 
                    type="text" 
                    placeholder="Registration ID or Email"
                    value={identifier} 
                    onChange={e => setIdentifier(e.target.value)} 
                    required 
                    className="w-full bg-brand-white/5 border border-brand-white/10 rounded-xl px-4 py-3.5 text-brand-white placeholder:text-brand-white/40 focus:border-brand-gold focus:ring-1 focus:ring-brand-gold outline-none transition-all" 
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full mt-2 bg-brand-gold hover:bg-[#E6C200] text-brand-black py-3.5 rounded-xl font-bold uppercase tracking-wider transition-colors disabled:opacity-50 shadow-[0_0_15px_rgba(255,215,0,0.2)]">
                {loading ? "Processing..." : "Send Password"}
              </button>

              <div className="mt-6 text-center text-sm">
                <button type="button" onClick={() => {setIsForgotPasswordMode(false); setError(""); setForgotPasswordMessage("");}} className="text-brand-white/60 hover:text-brand-gold transition-colors">
                  Back to Login
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-6">
              {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center rounded-xl">{error}</div>}

              <div className="space-y-5">
                <div>
                  <input 
                    type="text" 
                    placeholder="Registration ID or Admin Email"
                    value={identifier} 
                    onChange={e => setIdentifier(e.target.value)} 
                    required 
                    className="w-full bg-brand-white/5 border border-brand-white/10 rounded-xl px-4 py-3.5 text-brand-white placeholder:text-brand-white/40 focus:border-brand-gold focus:ring-1 focus:ring-brand-gold outline-none transition-all" 
                  />
                </div>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Password"
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    required 
                    className="w-full bg-brand-white/5 border border-brand-white/10 rounded-xl px-4 py-3.5 pr-12 text-brand-white placeholder:text-brand-white/40 focus:border-brand-gold focus:ring-1 focus:ring-brand-gold outline-none transition-all" 
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-white/40 hover:text-brand-white transition-colors">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button type="button" onClick={() => {setIsForgotPasswordMode(true); setError("");}} className="text-xs text-brand-white/50 hover:text-brand-gold transition-colors">Forgot Password? (Players Only)</button>
              </div>

              <button type="submit" disabled={loading} className="w-full mt-2 bg-brand-gold hover:bg-[#E6C200] text-brand-black py-3.5 rounded-xl font-bold uppercase tracking-wider transition-colors disabled:opacity-50 shadow-[0_0_15px_rgba(255,215,0,0.2)]">
                {loading ? "Authenticating..." : "Accept and Continue"}
              </button>
            </form>
          )}

            <div className="mt-8 text-center text-sm">
              <Link href="/" className="text-brand-white/40 hover:text-brand-white transition-colors underline">Return to Home</Link>
            </div>
        </div>
      </div>
    </div>
  );
}
