// components/AppShell.tsx
'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';
import Sidebar from './Sidebar'; // Adjust path as needed
import Topbar from './Topbar'; // Adjust path as needed
import ProtectedRoute from './ProtectedRoute'; // Adjust path as needed

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Do not apply the dashboard layout or route guard to the login page
  if (pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden bg-[#04152F]">
        {/* Sidebar Navigation */}
        <Sidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
        />
        
        {/* Main Content Wrapper */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden bg-slate-50 lg:rounded-tl-3xl shadow-2xl relative z-10">
          <Topbar onMenuToggle={() => setIsSidebarOpen(true)} />
          
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}