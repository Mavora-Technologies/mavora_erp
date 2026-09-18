'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Bell, LogOut, UserCheck, Menu } from 'lucide-react';

interface TopbarProps {
  onMenuToggle?: () => void;
}

export default function Topbar({ onMenuToggle }: TopbarProps) {
  const router = useRouter();
  const [user, setUser] = useState<{ firstName: string; lastName: string; email: string } | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('mavora_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse user session');
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('mavora_token');
    localStorage.removeItem('mavora_user');
    router.push('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 sm:px-6 sticky top-0 z-30 w-full shadow-sm">
      <div className="flex items-center justify-between w-full gap-2 sm:gap-4">
        
        {/* Left: Mobile Menu Toggle & Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="lg:hidden text-mavora-navy hover:text-mavora-blue p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition shrink-0 flex items-center justify-center shadow-sm"
            aria-label="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="text-base sm:text-xl font-bold text-mavora-navy tracking-tight flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-mavora-blue text-white flex items-center justify-center text-xs font-extrabold shrink-0 shadow-sm">M</div>
            <span className="inline">MAVORA <span className="text-mavora-blue">ERP</span></span>
          </div>
        </div>
        
        {/* Center: Search (Hidden on small mobile, visible on tablet/desktop) */}
        <div className="hidden md:flex flex-1 items-center bg-gray-100 rounded-lg px-3.5 py-2 max-w-md mx-4 border border-transparent focus-within:border-mavora-blue focus-within:bg-white transition">
          <Search className="w-4 h-4 text-gray-400 mr-2.5 shrink-0" />
          <input
            type="text"
            placeholder="Search customers, projects, invoices..."
            className="bg-transparent border-none outline-none w-full text-sm placeholder-gray-400 text-mavora-charcoal"
          />
        </div>

        {/* Right: User Profile & Logout */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-gray-200">
            <div className="w-8 h-8 rounded-full bg-mavora-navy text-white flex items-center justify-center font-semibold text-xs shadow-sm shrink-0">
              {user ? `${user.firstName[0]}${user.lastName[0]}` : <UserCheck className="w-4 h-4" />}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-bold text-mavora-navy">{user ? `${user.firstName} ${user.lastName}` : 'Administrator'}</p>
              <p className="text-[10px] text-gray-400">{user?.email || 'admin@mavoratech.com'}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="text-gray-400 hover:text-red-600 transition p-2 rounded-lg hover:bg-red-50 shrink-0 ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </header>
  );
}