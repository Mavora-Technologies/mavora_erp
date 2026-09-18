'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  TrendingUp, 
  Briefcase, 
  FileText, 
  UserCheck, 
  Boxes, 
  Package, 
  HelpCircle, 
  Settings,
  X 
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'CRM', href: '/crm', icon: Users },
    { name: 'Sales', href: '/sales', icon: TrendingUp },
    { name: 'Projects', href: '/projects', icon: Briefcase },
    { name: 'Finance', href: '/finance', icon: FileText },
    { name: 'HRM', href: '/hrm', icon: UserCheck },
    { name: 'Procurement', href: '/procurement', icon: Boxes },
    { name: 'Inventory', href: '/inventory', icon: Package },
    { name: 'Helpdesk', href: '/helpdesk', icon: HelpCircle },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          onClick={onClose} 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs transition-opacity cursor-pointer pointer-events-auto" 
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation Drawer */}
      <aside className={`
        fixed inset-y-0 left-0 z-50
        w-64 bg-mavora-navy text-white flex flex-col shrink-0
        transform transition-transform duration-300 ease-in-out shadow-2xl
        lg:translate-x-0 lg:static lg:z-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        pointer-events-auto
      `}>
        {/* Mobile Close Header */}
        <div className="flex items-center justify-between p-4 lg:hidden border-b border-white/10">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Navigation Menu</span>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-300 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
            aria-label="Close Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-lg text-sm font-medium transition cursor-pointer pointer-events-auto ${
                  isActive
                    ? 'bg-mavora-blue text-white shadow-md'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </aside>
    </>
  );
}