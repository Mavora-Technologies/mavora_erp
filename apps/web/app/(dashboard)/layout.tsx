// apps/web/app/(dashboard)/layout.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import Topbar from '../../components/Topbar';
import Sidebar from '../../components/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('mavora_token');

    if (!token) {
      setIsAuthenticated(false);
      setIsVerifying(false);
      router.replace('/login');
    } else {
      setIsAuthenticated(true);
      setIsVerifying(false);
    }
  }, [router]);

  // Block topbar, sidebar, and page children while verifying session
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300 gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-mavora-blue" />
        <p className="text-xs font-medium tracking-wider uppercase">Verifying Security Credentials...</p>
      </div>
    );
  }

  // Prevent layout leak during redirect transition
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-mavora-light flex flex-col w-full">
      <Topbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 flex relative w-full">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full min-w-0 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}