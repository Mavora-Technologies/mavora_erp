'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Building, 
  Mail, 
  Globe, 
  DollarSign, 
  Percent, 
  Save, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  X
} from 'lucide-react';

interface SystemSettings {
  companyName: string;
  supportEmail: string;
  timezone: string;
  currency: string;
  taxRate: string | number;
  moduleFlags: {
    crm: boolean;
    projects: boolean;
    finance: boolean;
  };
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    companyName: '',
    supportEmail: '',
    timezone: 'UTC',
    currency: 'USD',
    taxRate: '0.00',
    moduleFlags: { crm: true, projects: true, finance: true },
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('mavora_token') || ''}`
  });

  const fetchSettings = async () => {
    try {
      setError(null);
      const res = await fetch(`${API_BASE_URL}/settings`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch settings');
      const data = await res.json();
      if (data.success) {
        setSettings(data.data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`${API_BASE_URL}/settings`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update settings');

      if (data.success) {
        setSettings(data.data);
        setSuccessMessage('Settings updated successfully.');
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-mavora-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-mavora-navy tracking-tight flex items-center gap-2">
          <span>Enterprise Settings</span>
          <span className="text-xs bg-blue-100 text-mavora-blue font-semibold px-2.5 py-0.5 rounded-full border border-blue-200">
            System Config
          </span>
        </h1>
        <p className="text-sm text-gray-500 mt-1">Configure your workspace defaults, regional parameters, and active modules.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center justify-between text-sm border border-red-100">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-50 text-emerald-700 p-4 rounded-lg flex items-center justify-between text-sm border border-emerald-100">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* General Workspace Information */}
        <div className="bg-white border border-gray-200/80 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200/80 bg-gray-50/50 flex items-center gap-2">
            <Building className="w-4 h-4 text-mavora-blue" />
            <h2 className="text-sm font-bold text-mavora-navy uppercase tracking-wider">Workspace Profile</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-600 mb-2">Company Name</label>
              <input
                type="text"
                value={settings.companyName}
                onChange={e => setSettings({ ...settings, companyName: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-mavora-charcoal focus:bg-white focus:border-mavora-blue outline-none transition"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-gray-600 mb-2">Support Email</label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={e => setSettings({ ...settings, supportEmail: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-mavora-charcoal focus:bg-white focus:border-mavora-blue outline-none transition"
                required
              />
            </div>
          </div>
        </div>

        {/* Regional & Financial Defaults */}
        <div className="bg-white border border-gray-200/80 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200/80 bg-gray-50/50 flex items-center gap-2">
            <Globe className="w-4 h-4 text-mavora-blue" />
            <h2 className="text-sm font-bold text-mavora-navy uppercase tracking-wider">Regional & Financial Defaults</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-600 mb-2">Timezone</label>
              <select
                value={settings.timezone}
                onChange={e => setSettings({ ...settings, timezone: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-mavora-charcoal focus:bg-white focus:border-mavora-blue outline-none transition"
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
                value={settings.currency}
                onChange={e => setSettings({ ...settings, currency: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-mavora-charcoal focus:bg-white focus:border-mavora-blue outline-none transition"
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
                value={settings.taxRate}
                onChange={e => setSettings({ ...settings, taxRate: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-mavora-charcoal focus:bg-white focus:border-mavora-blue outline-none transition"
              />
            </div>
          </div>
        </div>

        {/* Module Feature Flags */}
        <div className="bg-white border border-gray-200/80 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200/80 bg-gray-50/50 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-mavora-blue" />
            <h2 className="text-sm font-bold text-mavora-navy uppercase tracking-wider">Module Permissions & Toggles</h2>
          </div>
          <div className="p-6 space-y-4">
            {Object.entries(settings.moduleFlags).map(([key, enabled]) => (
              <div key={key} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-none">
                <div>
                  <span className="font-bold text-sm text-mavora-navy uppercase">{key} Module</span>
                  <p className="text-xs text-gray-500">Enable or disable the {key.toUpperCase()} module ecosystem workspace-wide.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={e => setSettings({
                      ...settings,
                      moduleFlags: { ...settings.moduleFlags, [key]: e.target.checked }
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-mavora-blue"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="bg-mavora-blue hover:bg-blue-600 text-white font-medium py-2.5 px-6 rounded-lg transition flex items-center justify-center gap-2 text-sm shadow-md shadow-blue-500/20"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Changes</span>
          </button>
        </div>
      </form>
    </div>
  );
}