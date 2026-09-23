'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Building, 
  Globe, 
  Save, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  X,
  User,
  Key,
  Bell,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';

interface SystemSettings {
  companyName: string;
  supportEmail: string;
  timezone: string;
  currency: string;
  taxRate: string | number;
  moduleFlags: Record<string, boolean>;
}

interface UserProfileSettings {
  fullName: string;
  email: string;
  phone: string;
  role: string;
  notifications: {
    emailAlerts: boolean;
    systemDigest: boolean;
  };
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'workspace'>('profile');
  
  // User Role & Privileges state
  const [currentUserRole, setCurrentUserRole] = useState<string>('');

  // Personal Profile State (Available to all users)
  const [profile, setProfile] = useState<UserProfileSettings>({
    fullName: '',
    email: '',
    phone: '',
    role: '',
    notifications: { emailAlerts: true, systemDigest: false }
  });

  // Password Update State
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  // System Configuration State (Privileged Users)
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    companyName: '',
    supportEmail: '',
    timezone: 'UTC',
    currency: 'USD',
    taxRate: '0.00',
    moduleFlags: { crm: true, projects: true, finance: true },
  });

  // UI Status States
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const getAuthHeaders = useCallback(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('mavora_token') || '' : '';
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }, []);

  // Determine if the current user has administrative permissions
  const isPrivilegedAdmin = useMemo(() => {
    if (!currentUserRole) return false;
    const roleLower = currentUserRole.toLowerCase().replace(/[^a-z0-9]/g, '_');
    return (
      roleLower === 'super_admin' || 
      roleLower === 'administrator' || 
      roleLower === 'admin' || 
      roleLower === 'executive'
    );
  }, [currentUserRole]);

  // Fallback to profile tab if non-privileged user lands on workspace tab
  useEffect(() => {
    if (!isPrivilegedAdmin && activeTab === 'workspace') {
      setActiveTab('profile');
    }
  }, [isPrivilegedAdmin, activeTab]);

  // Read authenticated user role and initial profile directly from localStorage
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('mavora_user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        const name = parsed.name || `${parsed.firstName || ''} ${parsed.lastName || ''}`.trim() || 'User';
        const email = parsed.email || '';
        const phone = parsed.phone || '';
        
        const rawRole = parsed.role ?? parsed.roleName ?? parsed.user_role ?? parsed.roles;
        let resolvedRole = 'User';

        if (typeof rawRole === 'string' && rawRole.trim() !== '') {
          resolvedRole = rawRole;
        } else if (typeof rawRole === 'object' && rawRole !== null) {
          if (Array.isArray(rawRole) && rawRole.length > 0) {
            const first = rawRole[0];
            resolvedRole = typeof first === 'string' ? first : (first?.name || first?.title || 'User');
          } else {
            resolvedRole = rawRole.name || rawRole.title || 'User';
          }
        }

        setCurrentUserRole(resolvedRole);
        setProfile((prev) => ({
          ...prev,
          fullName: name,
          email: email,
          phone: phone,
          role: resolvedRole
        }));
      } else {
        // Fallback so loading state doesn't hang if no user is found
        setCurrentUserRole('User');
      }
    } catch {
      setCurrentUserRole('User'); // Fallback silently if localStorage parsing fails
    }
  }, []);

  // Fetch Enterprise System settings
  const fetchSettings = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`${API_BASE_URL}/settings`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setSystemSettings({
            ...data.data,
            moduleFlags: data.data.moduleFlags || { crm: true, projects: true, finance: true }
          });
        }
      }
    } catch {
      // Fallback silently for standard non-admin API restrictions
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  // SAFE FETCH LOGIC: Only fetch workspace settings if the user is an admin
  useEffect(() => {
    // Wait until we have resolved the user's role from local storage
    if (!currentUserRole) return; 

    if (isPrivilegedAdmin) {
      fetchSettings();
    } else {
      // For standard users, skip the API call to prevent 403 Forbidden redirects
      // and immediately drop the loading screen so they can see their profile
      setLoading(false);
    }
  }, [fetchSettings, isPrivilegedAdmin, currentUserRole]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    if (passwords.newPassword) {
      if (!passwords.currentPassword) {
        setError('Please enter your current password to set a new password.');
        setIsSaving(false);
        return;
      }
      if (passwords.newPassword !== passwords.confirmPassword) {
        setError('New password and confirm password do not match.');
        setIsSaving(false);
        return;
      }
    }

    try {
      const payload = {
        fullName: profile.fullName,
        phone: profile.phone,
        notifications: profile.notifications,
        ...(passwords.newPassword ? { currentPassword: passwords.currentPassword, newPassword: passwords.newPassword } : {})
      };

      const res = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to update personal profile.');
      }

      // Update cached user in localStorage
      const storedUser = localStorage.getItem('mavora_user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        parsed.name = profile.fullName;
        parsed.phone = profile.phone;
        localStorage.setItem('mavora_user', JSON.stringify(parsed));
      }

      setSuccessMessage('Profile settings updated successfully.');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSystemSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPrivilegedAdmin) return;

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`${API_BASE_URL}/settings`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(systemSettings),
      });
      
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to update system settings');

      if (data.success) {
        setSystemSettings({
          ...data.data,
          moduleFlags: data.data.moduleFlags || { crm: true, projects: true, finance: true }
        });
        setSuccessMessage('Workspace settings updated successfully.');
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving workspace settings.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#075BFF]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#04152F] tracking-tight flex items-center gap-2">
          <span>Settings & Preferences</span>
          <span className="text-xs bg-blue-100 text-[#075BFF] font-semibold px-2.5 py-0.5 rounded-full border border-blue-200">
            {profile.role || 'User Workspace'}
          </span>
        </h1>
        <p className="text-sm text-gray-500 mt-1">Manage your personal account profile, security credentials, and system options.</p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-200 gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`pb-3 text-sm font-bold transition-colors relative flex items-center gap-2 cursor-pointer ${
            activeTab === 'profile' 
              ? 'text-[#075BFF] border-b-2 border-[#075BFF]' 
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <User className="w-4 h-4" />
          <span>My Profile & Security</span>
        </button>

        {isPrivilegedAdmin && (
          <button
            type="button"
            onClick={() => setActiveTab('workspace')}
            className={`pb-3 text-sm font-bold transition-colors relative flex items-center gap-2 cursor-pointer ${
              activeTab === 'workspace' 
                ? 'text-[#075BFF] border-b-2 border-[#075BFF]' 
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Workspace & System Config</span>
          </button>
        )}
      </div>

      {/* Alert Notifications */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center justify-between text-sm border border-red-100">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => setError(null)} className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-50 text-emerald-700 p-4 rounded-lg flex items-center justify-between text-sm border border-emerald-100">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button type="button" onClick={() => setSuccessMessage(null)} className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TAB 1: PERSONAL PROFILE & SECURITY (AVAILABLE TO ALL USERS) */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Account Details */}
          <div className="bg-white border border-gray-200/80 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200/80 bg-gray-50/50 flex items-center gap-2">
              <User className="w-4 h-4 text-[#075BFF]" />
              <h2 className="text-sm font-bold text-[#04152F] uppercase tracking-wider">Personal Information</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-2">Full Name</label>
                <input
                  type="text"
                  value={profile.fullName}
                  onChange={e => setProfile({ ...profile, fullName: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:bg-white focus:border-[#075BFF] outline-none transition"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-2">Email Address</label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-500 cursor-not-allowed outline-none"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">Email is managed by organization admin.</span>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-2">Phone Number</label>
                <input
                  type="text"
                  value={profile.phone}
                  onChange={e => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:bg-white focus:border-[#075BFF] outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-2">Assigned Role</label>
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-700 font-medium">
                  <ShieldCheck className="w-4 h-4 text-[#19D3C5]" />
                  <span className="capitalize">{profile.role || 'Standard User'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Password Security */}
          <div className="bg-white border border-gray-200/80 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200/80 bg-gray-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-[#075BFF]" />
                <h2 className="text-sm font-bold text-[#04152F] uppercase tracking-wider">Security & Password</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs text-[#075BFF] hover:underline flex items-center gap-1 cursor-pointer font-semibold"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPassword ? 'Hide Passwords' : 'Show Passwords'}</span>
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-2">Current Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwords.currentPassword}
                    onChange={e => setPasswords({ ...passwords, currentPassword: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:bg-white focus:border-[#075BFF] outline-none transition pr-8"
                  />
                  <Lock className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-2">New Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwords.newPassword}
                  onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })}
                  placeholder="Leave blank to keep current"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:bg-white focus:border-[#075BFF] outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-2">Confirm New Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwords.confirmPassword}
                  onChange={e => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:bg-white focus:border-[#075BFF] outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white border border-gray-200/80 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200/80 bg-gray-50/50 flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#075BFF]" />
              <h2 className="text-sm font-bold text-[#04152F] uppercase tracking-wider">Notification Preferences</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div>
                  <span className="font-bold text-sm text-[#04152F]">Email Notifications</span>
                  <p className="text-xs text-gray-500">Receive email alerts for task assignments and ticket updates.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profile.notifications.emailAlerts}
                    onChange={e => setProfile({
                      ...profile,
                      notifications: { ...profile.notifications, emailAlerts: e.target.checked }
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#075BFF]"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <span className="font-bold text-sm text-[#04152F]">Daily Digest Summaries</span>
                  <p className="text-xs text-gray-500">Receive a daily summary email of workspace activity.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profile.notifications.systemDigest}
                    onChange={e => setProfile({
                      ...profile,
                      notifications: { ...profile.notifications, systemDigest: e.target.checked }
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#075BFF]"></div>
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="bg-[#075BFF] hover:bg-blue-600 text-white font-medium py-2.5 px-6 rounded-lg transition flex items-center justify-center gap-2 text-sm shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Profile</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: SYSTEM & WORKSPACE CONFIGURATION (PRIVILEGED ROLES ONLY) */}
      {activeTab === 'workspace' && isPrivilegedAdmin && (
        <form onSubmit={handleSaveSystemSettings} className="space-y-6">
          {/* General Workspace Information */}
          <div className="bg-white border border-gray-200/80 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200/80 bg-gray-50/50 flex items-center gap-2">
              <Building className="w-4 h-4 text-[#075BFF]" />
              <h2 className="text-sm font-bold text-[#04152F] uppercase tracking-wider">Workspace Profile</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-2">Company Name</label>
                <input
                  type="text"
                  value={systemSettings.companyName}
                  onChange={e => setSystemSettings({ ...systemSettings, companyName: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:bg-white focus:border-[#075BFF] outline-none transition"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-2">Support Email</label>
                <input
                  type="email"
                  value={systemSettings.supportEmail}
                  onChange={e => setSystemSettings({ ...systemSettings, supportEmail: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:bg-white focus:border-[#075BFF] outline-none transition"
                  required
                />
              </div>
            </div>
          </div>

          {/* Regional & Financial Defaults */}
          <div className="bg-white border border-gray-200/80 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200/80 bg-gray-50/50 flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#075BFF]" />
              <h2 className="text-sm font-bold text-[#04152F] uppercase tracking-wider">Regional & Financial Defaults</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-2">Timezone</label>
                <select
                  value={systemSettings.timezone}
                  onChange={e => setSystemSettings({ ...systemSettings, timezone: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:bg-white focus:border-[#075BFF] outline-none transition"
                >
                  <option value="UTC">UTC (Coordinated Universal Time)</option>
                  <option value="America/New_York">Eastern Time (US & Canada)</option>
                  <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                  <option value="Europe/London">London (GMT)</option>
                  <option value="Africa/Nairobi">Nairobi (EAT)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-2">Currency Code</label>
                <select
                  value={systemSettings.currency}
                  onChange={e => setSystemSettings({ ...systemSettings, currency: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:bg-white focus:border-[#075BFF] outline-none transition"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="KES">KES (KSh)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-2">Default Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={systemSettings.taxRate}
                  onChange={e => setSystemSettings({ ...systemSettings, taxRate: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:bg-white focus:border-[#075BFF] outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Module Feature Flags */}
          <div className="bg-white border border-gray-200/80 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200/80 bg-gray-50/50 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#075BFF]" />
              <h2 className="text-sm font-bold text-[#04152F] uppercase tracking-wider">Module Permissions & Toggles</h2>
            </div>
            <div className="p-6 space-y-4">
              {Object.entries(systemSettings.moduleFlags || {}).map(([key, enabled]) => (
                <div key={key} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-none">
                  <div>
                    <span className="font-bold text-sm text-[#04152F] uppercase">{key} Module</span>
                    <p className="text-xs text-gray-500">Enable or disable the {key.toUpperCase()} module ecosystem workspace-wide.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(enabled)}
                      onChange={e => setSystemSettings({
                        ...systemSettings,
                        moduleFlags: { ...systemSettings.moduleFlags, [key]: e.target.checked }
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#075BFF]"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="bg-[#075BFF] hover:bg-blue-600 text-white font-medium py-2.5 px-6 rounded-lg transition flex items-center justify-center gap-2 text-sm shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save System Config</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}