'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Search, 
  Bell, 
  LogOut, 
  Menu, 
  ChevronDown, 
  User, 
  Settings, 
  ShieldCheck,
  X 
} from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface UserData {
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  role?: string;
  avatarUrl?: string;
}

export interface TopbarProps {
  onMenuToggle?: () => void;
  // User session configuration
  user?: UserData | null;
  storageUserKey?: string;
  storageTokenKey?: string;
  loginPath?: string;
  // Brand Configuration
  brandName?: string;
  brandSubtext?: string;
  brandHref?: string;
  brandLogoLetter?: string;
  brandCustomLogo?: React.ReactNode;
  // Breadcrumb Configuration
  breadcrumbs?: BreadcrumbItem[];
  // Search Configuration
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  // Notification Configuration
  notificationsCount?: number;
  onNotificationClick?: () => void;
}

export default function Topbar({
  onMenuToggle,
  user: userProp,
  storageUserKey = 'mavora_user',
  storageTokenKey = 'mavora_token',
  loginPath = '/login',
  brandName = 'MAVORA',
  brandSubtext = 'ERP',
  brandHref = '/',
  brandLogoLetter = 'M',
  brandCustomLogo,
  breadcrumbs: customBreadcrumbs,
  searchPlaceholder = 'Search customers, projects, invoices...',
  onSearch,
  notificationsCount = 0,
  onNotificationClick,
}: TopbarProps) {
  const router = useRouter();
  const pathname = usePathname();

  // User session state (prefers passed prop, falls back to local storage)
  const [user, setUser] = useState<UserData | null>(userProp || null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  // Sync user prop if provided externally
  useEffect(() => {
    if (userProp !== undefined) {
      setUser(userProp);
    }
  }, [userProp]);

  // Read user from localStorage if no user prop was supplied
  useEffect(() => {
    if (!userProp && typeof window !== 'undefined') {
      const storedUser = localStorage.getItem(storageUserKey);
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error('Failed to parse user session:', e);
        }
      }
    }
  }, [userProp, storageUserKey]);

  // Keyboard shortcut (Ctrl+K or Cmd+K) to focus search input & Escape key handling
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Focus search bar on Ctrl+K / Cmd+K
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (isMobileSearchOpen) {
          mobileSearchInputRef.current?.focus();
        } else {
          searchInputRef.current?.focus();
        }
      }

      // Close overlays on Escape
      if (event.key === 'Escape') {
        setIsUserMenuOpen(false);
        setIsMobileSearchOpen(false);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileSearchOpen]);

  // Auto-focus input when mobile search drawer opens
  useEffect(() => {
    if (isMobileSearchOpen) {
      mobileSearchInputRef.current?.focus();
    }
  }, [isMobileSearchOpen]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(storageTokenKey);
      localStorage.removeItem(storageUserKey);
    }
    router.push(loginPath);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    onSearch?.(val);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  // Dynamic derivation of user display details without static fallback strings
  const firstName = user?.firstName || (user?.name ? user.name.split(' ')[0] : '');
  const lastName = user?.lastName || (user?.name && user.name.split(' ').length > 1 ? user.name.split(' ').slice(1).join(' ') : '');
  const displayName = `${firstName} ${lastName}`.trim() || user?.name || user?.email || 'User';
  const email = user?.email || '';
  const role = user?.role || 'Member';

  // Dynamic initials calculation
  const getInitials = (): string => {
    if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
    if (firstName) return firstName.slice(0, 2).toUpperCase();
    if (user?.name) {
      const parts = user.name.trim().split(' ');
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (email) return email.slice(0, 2).toUpperCase();
    return 'U';
  };

  const initials = getInitials();

  // Dynamic breadcrumb parsing from pathname if custom list is not provided
  const derivedBreadcrumbs: BreadcrumbItem[] = React.useMemo(() => {
    if (customBreadcrumbs) return customBreadcrumbs;
    if (!pathname || pathname === '/') return [{ label: 'Dashboard', href: '/' }];

    const segments = pathname.split('/').filter(Boolean);
    let accumulatedPath = '';

    return segments.map((segment) => {
      accumulatedPath += `/${segment}`;
      const formattedLabel = segment
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());

      return {
        label: formattedLabel,
        href: accumulatedPath,
      };
    });
  }, [pathname, customBreadcrumbs]);

  return (
    <header className="sticky top-0 z-30 w-full h-16 bg-white border-b border-[#E2E8F0] shadow-2xs transition-colors">
      <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-3 sm:gap-6">
        
        {/* 1. LEFT SECTION: Navigation Toggle, Brand Identity & Dynamic Breadcrumbs */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0 min-w-0">
          {onMenuToggle && (
            <button
              onClick={onMenuToggle}
              className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 text-[#061A3A] hover:bg-slate-200 hover:text-[#075BFF] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#075BFF]/30 shrink-0"
              aria-label="Toggle Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Dynamic Brand Logo & Identity */}
          <Link 
            href={brandHref} 
            className="flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-[#075BFF] rounded-lg p-0.5"
          >
            {brandCustomLogo ? (
              brandCustomLogo
            ) : (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#075BFF] to-[#19D3C5] p-0.5 shrink-0 shadow-xs shadow-[#075BFF]/20 group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-[#04152F] rounded-[9px] flex items-center justify-center">
                  <span className="font-black text-xs text-transparent bg-clip-text bg-gradient-to-r from-[#075BFF] to-[#19D3C5]">
                    {brandLogoLetter}
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-baseline gap-1">
              <span className="text-base font-black tracking-tight text-[#061A3A]">
                {brandName}
              </span>
              {brandSubtext && (
                <span className="text-xs font-extrabold tracking-wider text-[#075BFF]">
                  {brandSubtext}
                </span>
              )}
            </div>
          </Link>

          {/* Dynamic Breadcrumbs */}
          <div className="hidden md:flex items-center gap-2 pl-4 border-l border-slate-200 text-xs font-semibold overflow-hidden truncate">
            {derivedBreadcrumbs.map((crumb, index) => {
              const isLast = index === derivedBreadcrumbs.length - 1;
              return (
                <React.Fragment key={crumb.href || index}>
                  {index > 0 && <span className="text-slate-300 font-normal">/</span>}
                  {isLast || !crumb.href ? (
                    <span className={isLast ? "text-[#061A3A] font-bold truncate" : "text-[#64748B] truncate"}>
                      {crumb.label}
                    </span>
                  ) : (
                    <Link 
                      href={crumb.href} 
                      className="text-[#64748B] hover:text-[#061A3A] transition-colors truncate"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* 2. CENTER SECTION: Global Dynamic Search (Desktop) */}
        <div className="hidden md:flex flex-1 max-w-[440px] items-center mx-2">
          <form onSubmit={handleSearchSubmit} className="relative w-full group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B] group-focus-within:text-[#075BFF] transition-colors pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder={searchPlaceholder}
              className="w-full pl-10 pr-16 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-medium text-[#061A3A] placeholder-[#64748B] transition-all duration-200 focus:outline-none focus:bg-white focus:border-[#075BFF] focus:ring-3 focus:ring-[#075BFF]/10 shadow-2xs"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-200 bg-white text-[10px] font-bold text-slate-400 shadow-2xs pointer-events-none">
              <span>Ctrl</span>
              <span>K</span>
            </div>
          </form>
        </div>

        {/* 3. RIGHT SECTION: Dynamic Notifications & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Mobile Search Toggle Icon */}
          <button
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            className="md:hidden p-2 text-[#64748B] hover:text-[#061A3A] hover:bg-slate-100 rounded-xl transition cursor-pointer"
            aria-label="Toggle Search Input"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Dynamic Notifications Bell */}
          <button
            onClick={onNotificationClick}
            className="relative p-2 text-[#64748B] hover:text-[#061A3A] hover:bg-slate-100 rounded-xl transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#075BFF]/30"
            aria-label={`Notifications ${notificationsCount > 0 ? `(${notificationsCount} unread)` : ''}`}
          >
            <Bell className="w-5 h-5" />
            {notificationsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#19D3C5] text-[9px] font-black text-[#04152F] ring-2 ring-white shadow-2xs">
                {notificationsCount > 99 ? '99+' : notificationsCount}
              </span>
            )}
          </button>

          <div className="h-6 w-px bg-slate-200 mx-0.5" aria-hidden="true" />

          {/* User Profile & Account Dropdown Trigger */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2.5 p-1 sm:px-2 sm:py-1.5 rounded-xl hover:bg-slate-100 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#075BFF]/30 group"
              aria-expanded={isUserMenuOpen}
              aria-haspopup="true"
            >
              {/* Dynamic Avatar (Image or Computed Initials) */}
              <div className="relative w-8 h-8 rounded-lg bg-gradient-to-tr from-[#061A3A] to-[#075BFF] flex items-center justify-center font-bold text-xs text-white shadow-2xs shrink-0 overflow-hidden">
                {user?.avatarUrl ? (
                  <Image 
                    src={user.avatarUrl} 
                    alt={displayName} 
                    fill 
                    className="object-cover"
                  />
                ) : (
                  <span>{initials}</span>
                )}
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#19D3C5] border-2 border-white rounded-full" title="Online" />
              </div>

              {/* Desktop User Info */}
              <div className="hidden lg:block text-left min-w-0">
                <p className="text-xs font-bold text-[#061A3A] truncate leading-tight group-hover:text-[#075BFF] transition-colors">
                  {displayName}
                </p>
                <p className="text-[10px] font-semibold text-[#64748B] truncate leading-tight">
                  {role}
                </p>
              </div>

              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 hidden sm:block ${isUserMenuOpen ? 'rotate-180 text-[#075BFF]' : ''}`} />
            </button>

            {/* Account Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-[#E2E8F0] rounded-2xl shadow-xl py-2 z-50 text-xs font-medium text-[#061A3A] animate-in fade-in slide-in-from-top-2 duration-150">
                
                {/* Header User Details */}
                <div className="px-4 py-3 border-b border-slate-100 bg-[#F8FAFC]/60 rounded-t-2xl">
                  <p className="text-xs font-bold text-[#061A3A] truncate">{displayName}</p>
                  {email && <p className="text-[11px] text-[#64748B] truncate mt-0.5">{email}</p>}
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 mt-2 rounded-full bg-[#075BFF]/10 text-[#075BFF] text-[10px] font-bold">
                    <ShieldCheck className="w-3 h-3" />
                    <span>{role}</span>
                  </div>
                </div>

                {/* Account Navigation Options */}
                <div className="py-1.5 px-1.5 space-y-0.5">
                  <Link
                    href="/settings"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:text-[#061A3A] hover:bg-slate-100 transition-colors"
                  >
                    <User className="w-4 h-4 text-[#075BFF]" />
                    <span>My Profile</span>
                  </Link>

                  <Link
                    href="/settings"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:text-[#061A3A] hover:bg-slate-100 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-slate-500" />
                    <span>Account Settings</span>
                  </Link>
                </div>

                <div className="border-t border-slate-100 my-1" />

                {/* Sign Out Action */}
                <div className="p-1.5">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer text-left font-semibold"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>

              </div>
            )}
          </div>

        </div>

      </div>

      {/* MOBILE EXPANDABLE SEARCH OVERLAY */}
      {isMobileSearchOpen && (
        <form onSubmit={handleSearchSubmit} className="md:hidden px-4 py-2.5 bg-white border-b border-[#E2E8F0] shadow-sm animate-in slide-in-from-top duration-150 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
            <input
              ref={mobileSearchInputRef}
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-medium text-[#061A3A] placeholder-[#64748B] focus:outline-none focus:border-[#075BFF] focus:bg-white"
            />
          </div>
          <button
            type="button"
            onClick={() => setIsMobileSearchOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
            aria-label="Close Mobile Search"
          >
            <X className="w-4 h-4" />
          </button>
        </form>
      )}
    </header>
  );
}