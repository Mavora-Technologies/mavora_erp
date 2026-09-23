'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  MoreVertical,
  ShieldCheck
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Collapsed Desktop Mode state
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Dynamic User Profile state initialized without hardcoded placeholders
  const [user, setUser] = useState<{ name: string; role: string; initials: string }>({
    name: '',
    role: '',
    initials: ''
  });

  // User Menu dropdown state
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);

  // Load authenticated user data directly from localStorage dynamically
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('mavora_user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        
        // Derive name dynamically from DB fields
        const fullName = parsed.name || `${parsed.firstName || ''} ${parsed.lastName || ''}`.trim() || 'User';
        
        // Resolve role cleanly across various backend database structures
        const rawRole = parsed.role ?? parsed.roleName ?? parsed.user_role ?? parsed.roles;
        let resolvedRole = 'User';

        if (typeof rawRole === 'string' && rawRole.trim() !== '') {
          resolvedRole = rawRole;
        } else if (typeof rawRole === 'object' && rawRole !== null) {
          if (Array.isArray(rawRole) && rawRole.length > 0) {
            const first = rawRole[0];
            resolvedRole = typeof first === 'string' ? first : (first?.name || first?.title || first?.role_name || 'User');
          } else {
            resolvedRole = rawRole.name || rawRole.title || rawRole.role_name || 'User';
          }
        }

        // Compute user initials dynamically
        const initials = fullName
          .split(' ')
          .filter(Boolean)
          .map((n: string) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2) || 'US';

        setUser({
          name: fullName,
          role: resolvedRole,
          initials: initials
        });
      }
    } catch {
      // Fallback silently if localStorage parsing fails
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('mavora_token');
    localStorage.removeItem('mavora_user');
    router.push('/login');
  };

  // Grouped Navigation structure
  const ALL_NAV_GROUPS: NavGroup[] = [
    {
      group: 'OVERVIEW',
      items: [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard }
      ]
    },
    {
      group: 'BUSINESS',
      items: [
        { name: 'CRM', href: '/crm', icon: Users, badge: 24 },
        { name: 'Sales', href: '/sales', icon: TrendingUp },
        { name: 'Projects', href: '/projects', icon: Briefcase }
      ]
    },
    {
      group: 'OPERATIONS',
      items: [
        { name: 'Procurement', href: '/procurement', icon: Boxes, badge: 18 },
        { name: 'Inventory', href: '/inventory', icon: Package, badge: 7 },
        { name: 'Helpdesk', href: '/helpdesk', icon: HelpCircle, badge: 12 }
      ]
    },
    {
      group: 'CORPORATE',
      items: [
        { name: 'Finance', href: '/finance', icon: FileText },
        { name: 'HRM', href: '/hrm', icon: UserCheck }
      ]
    },
    {
      group: 'SYSTEM',
      items: [
        { name: 'Settings', href: '/settings', icon: Settings }
      ]
    }
  ];

  // Dynamic Role-Based Access Control Filtering
  const filteredNavGroups = useMemo(() => {
    if (!user.role) return [];

    const roleLower = user.role.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    // Define exact match checks for Super Admin, Administrator, and Executive
    const isPrivilegedAdmin = 
      roleLower === 'super_admin' || 
      roleLower === 'administrator' || 
      roleLower === 'admin' || 
      roleLower === 'executive';

    // SYSTEM (Settings) is universally accessible to all roles by default
    const allowed: string[] = ['SYSTEM'];

    if (isPrivilegedAdmin) {
      // Privileged roles see everything
      return ALL_NAV_GROUPS;
    }

    // Non-privileged roles never see 'OVERVIEW' (Dashboard)
    if (roleLower.includes('sales')) {
      allowed.push('BUSINESS');
    } else if (roleLower.includes('operations') || roleLower.includes('administration')) {
      allowed.push('OPERATIONS');
    } else if (roleLower.includes('engineering') || roleLower.includes('engineer')) {
      allowed.push('BUSINESS', 'OPERATIONS');
    } else {
      // Default fallback for standard employees
      allowed.push('OPERATIONS');
    }

    return ALL_NAV_GROUPS.filter(g => allowed.includes(g.group));
  }, [user.role]);

  const isRouteActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          onClick={onClose} 
          className="fixed inset-0 bg-black/70 z-40 lg:hidden backdrop-blur-xs transition-opacity cursor-pointer pointer-events-auto" 
          aria-hidden="true"
        />
      )}

      <aside 
        aria-label="Main Navigation"
        className={`
          fixed inset-y-0 left-0 z-50
          bg-[#04152F] text-slate-300 flex flex-col shrink-0
          transform transition-all duration-300 ease-in-out shadow-2xl border-r border-slate-800/60
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          ${isCollapsed ? 'lg:w-[76px]' : 'lg:w-[260px]'}
          w-[260px] pointer-events-auto
        `}
      >
        {/* BRAND HEADER */}
        <div className="relative flex items-center justify-between h-20 px-4 bg-[#061A3A]/80 border-b border-slate-800/80 shrink-0">
          <Link 
            href="/" 
            onClick={onClose}
            className="flex items-center gap-3 overflow-hidden focus:outline-none focus:ring-2 focus:ring-[#075BFF] rounded-lg p-1 transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#075BFF] to-[#19D3C5] p-0.5 shrink-0 shadow-md shadow-[#075BFF]/20">
              <div className="w-full h-full bg-[#04152F] rounded-[9px] flex items-center justify-center">
                <span className="font-black text-base text-transparent bg-clip-text bg-gradient-to-r from-[#075BFF] to-[#19D3C5]">
                  M
                </span>
              </div>
            </div>

            <div className={`transition-opacity duration-200 ${isCollapsed ? 'lg:hidden' : 'block'}`}>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black tracking-wider text-white leading-none">MAVORA</span>
              </div>
              <span className="text-[9px] font-bold tracking-[0.22em] text-[#19D3C5] uppercase block mt-1">
                TECHNOLOGIES
              </span>
            </div>
          </Link>

          <button 
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition lg:hidden cursor-pointer"
            aria-label="Close Sidebar Menu"
          >
            <X className="w-5 h-5" />
          </button>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 hover:bg-[#075BFF] text-slate-300 hover:text-white border border-slate-700/80 absolute -right-3 top-1/2 -translate-y-1/2 shadow-md transition-colors cursor-pointer"
            aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* NAVIGATION GROUPS & ITEMS */}
        <div className="flex-1 py-4 px-3 space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
          {filteredNavGroups.map((group) => (
            <div key={group.group} className="space-y-1">
              <div className={`px-3 mb-2 text-[10px] font-extrabold tracking-widest text-slate-400 uppercase ${isCollapsed ? 'lg:hidden' : 'block'}`}>
                {group.group}
              </div>

              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isRouteActive(item.href);

                return (
                  <div key={item.name} className="relative group">
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={`
                        relative flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-xs font-semibold
                        transition-all duration-200 cursor-pointer pointer-events-auto
                        ${active 
                          ? 'bg-[#075BFF] text-white shadow-lg shadow-[#075BFF]/25 font-bold' 
                          : 'text-slate-300 hover:bg-white/5 hover:text-white'
                        }
                      `}
                    >
                      {active && (
                        <span 
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#19D3C5] rounded-r-full shadow-sm" 
                          aria-hidden="true"
                        />
                      )}

                      <Icon className={`w-4 h-4 shrink-0 transition-colors ${active ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />

                      <span className={`truncate transition-opacity duration-200 ${isCollapsed ? 'lg:hidden' : 'block'}`}>
                        {item.name}
                      </span>

                      {item.badge !== undefined && (
                        <span className={`
                          ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight
                          ${active 
                            ? 'bg-white/20 text-white' 
                            : 'bg-[#19D3C5]/15 text-[#19D3C5] group-hover:bg-[#19D3C5]/25'
                          }
                          ${isCollapsed ? 'lg:hidden' : 'block'}
                        `}>
                          {item.badge}
                        </span>
                      )}
                    </Link>

                    {isCollapsed && (
                      <div className="hidden lg:block absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-[#061A3A] text-white text-xs font-semibold rounded-lg shadow-xl border border-slate-700/80 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50">
                        <div className="flex items-center gap-2">
                          <span>{item.name}</span>
                          {item.badge !== undefined && (
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-[#19D3C5]/20 text-[#19D3C5]">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* SYSTEM STATUS */}
        <div className="px-4 py-2.5 bg-[#061A3A]/40 border-t border-slate-800/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#19D3C5] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#19D3C5]" />
            </span>
            <div className={`text-[10px] leading-tight transition-opacity duration-200 ${isCollapsed ? 'lg:hidden' : 'block'}`}>
              <p className="font-bold text-white tracking-wide">System Online</p>
            </div>
          </div>
        </div>

        {/* DYNAMIC USER PROFILE AREA */}
        <div className="relative p-3 bg-[#061A3A] border-t border-slate-800/80 shrink-0">
          {showUserMenu && (
            <div className="absolute bottom-full left-3 right-3 mb-2 bg-[#04152F] border border-slate-700/80 rounded-xl shadow-2xl p-1.5 text-xs z-50 animate-fade-in">
              <Link 
                href="/settings" 
                onClick={() => { setShowUserMenu(false); if (onClose) onClose(); }}
                className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <User className="w-3.5 h-3.5 text-[#19D3C5]" />
                <span>Account Profile</span>
              </Link>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer text-left"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}

          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#075BFF] to-slate-700 flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-sm">
                {user.initials || '--'}
              </div>

              <div className={`min-w-0 transition-opacity duration-200 ${isCollapsed ? 'lg:hidden' : 'block'}`}>
                <p className="text-xs font-bold text-white truncate leading-tight">
                  {user.name || 'Loading...'}
                </p>
                <p className="text-[10px] font-medium text-slate-400 truncate flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3 h-3 text-[#19D3C5] shrink-0" />
                  <span className="capitalize">{user.role || 'User'}</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={`p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer ${isCollapsed ? 'lg:hidden' : 'block'}`}
              aria-label="User account settings"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}