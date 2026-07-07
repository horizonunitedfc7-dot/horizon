"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token && pathname !== "/login") {
      router.push("/login");
    } else if (token) {
      setIsAuthenticated(true);
    }
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    setIsAuthenticated(false);
    router.push("/login");
  };

  // Login page should seamlessly blend with the root layout's stadium background
  // and have no sidebar navigation.
  if (pathname === "/login") {
    return (
      <div className="min-h-[100dvh] bg-brand-black flex items-center justify-center relative">
        <div className="absolute inset-0 z-0 bg-[url('/hero_action_bg.png')] bg-cover bg-center opacity-30 pointer-events-none" />
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-brand-black via-brand-black/50 to-transparent pointer-events-none" />
        <div className="relative z-10 w-full">{children}</div>
      </div>
    );
  }

  if (!isAuthenticated) return null; // Prevent flash before redirect

  // Dashboard page needs to override the root layout's centering and navbar
  // We use fixed inset-0 to cover the whole screen, creating a dedicated app feel
  return (
    <div className="fixed inset-0 z-[100] flex flex-col md:flex-row text-brand-white overflow-hidden bg-[#0A0A0A]">
      {/* Global Admin Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img src="/horizon_flag_bg.png" alt="Background" className="w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-[#0A0A0A]/90 to-[#0A0A0A]/70" />
      </div>

      {/* Mobile Top Bar */}
      <div className="md:hidden relative z-10 w-full bg-brand-black/60 backdrop-blur-xl border-b border-brand-white/10 flex items-center justify-between p-4 shadow-xl">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Horizon Logo" className="h-6 w-auto object-contain" />
          <h1 className="text-lg font-oswald font-bold text-brand-gold tracking-widest uppercase">Admin</h1>
        </div>
        <button 
          onClick={handleLogout}
          className="text-red-400 font-medium text-sm px-3 py-1.5 hover:bg-red-400/10 rounded-lg transition-colors"
        >
          Logout
        </button>
      </div>

      {/* Sidebar */}
      <aside className="relative z-10 w-64 bg-brand-black/40 backdrop-blur-xl border-r border-brand-white/10 flex-col hidden md:flex shadow-2xl">
        <div className="p-6 border-b border-brand-white/10 flex items-center gap-3">
          <img src="/logo.png" alt="Horizon Logo" className="h-8 w-auto object-contain" />
          <h1 className="text-xl font-oswald font-bold text-brand-gold tracking-widest uppercase">Admin</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link 
            href="/admin" 
            className={`block px-4 py-3 rounded-lg transition-colors ${pathname === '/admin' ? 'bg-brand-gold/10 text-brand-gold font-semibold' : 'text-brand-white/60 hover:bg-brand-white/5 hover:text-brand-white'}`}
          >
            Dashboard
          </Link>
          <Link 
            href="/admin/fees" 
            className={`block px-4 py-3 rounded-lg transition-colors ${pathname === '/admin/fees' ? 'bg-brand-gold/10 text-brand-gold font-semibold' : 'text-brand-white/60 hover:bg-brand-white/5 hover:text-brand-white'}`}
          >
            Fees & Shop
          </Link>
          <Link 
            href="/admin/messages" 
            className={`block px-4 py-3 rounded-lg transition-colors ${pathname === '/admin/messages' ? 'bg-brand-gold/10 text-brand-gold font-semibold' : 'text-brand-white/60 hover:bg-brand-white/5 hover:text-brand-white'}`}
          >
            Inbox & Broadcasts
          </Link>
          <Link 
            href="/admin/events" 
            className={`block px-4 py-3 rounded-lg transition-colors ${pathname === '/admin/events' ? 'bg-brand-gold/10 text-brand-gold font-semibold' : 'text-brand-white/60 hover:bg-brand-white/5 hover:text-brand-white'}`}
          >
            Calendar Events
          </Link>
          <Link 
            href="/admin/settings"  
            className={`block px-4 py-3 rounded-lg transition-colors ${pathname === '/admin/settings' ? 'bg-brand-gold/10 text-brand-gold font-semibold' : 'text-brand-white/60 hover:bg-brand-white/5 hover:text-brand-white'}`}
          >
            Settings
          </Link>
        </nav>
        <div className="p-4 border-t border-brand-white/10">
          <button 
            onClick={handleLogout}
            className="w-full text-left px-4 py-3 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors font-medium"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="relative z-10 flex-1 overflow-x-hidden overflow-y-auto bg-transparent">
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
