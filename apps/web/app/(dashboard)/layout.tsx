'use client';

import React, { useState } from 'react';
import Topbar from '../../components/Topbar';
import Sidebar from '../../components/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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