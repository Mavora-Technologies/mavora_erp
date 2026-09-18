'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, TrendingUp, Users, Briefcase, FileText, ArrowUpRight, ShieldAlert } from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('mavora_token');
    if (!token) {
      router.replace('/login');
    } else {
      setAuthorized(true);
      setLoading(false);
    }
  }, [router]);

  if (loading || !authorized) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-gray-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-mavora-blue" />
        <p className="text-sm font-medium">Verifying enterprise session...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-mavora-navy tracking-tight">Executive Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Real-time overview of Mavora ERP core modules and performance metrics.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
            System Online (KES Node)
          </span>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Total Active Leads', value: '24', change: '+12% this month', icon: Users, color: 'text-blue-600 bg-blue-50' },
          { title: 'Active Projects', value: '06', change: 'On track', icon: Briefcase, color: 'text-indigo-600 bg-indigo-50' },
          { title: 'Pending Invoices', value: 'KES 450,200', change: '3 due this week', icon: FileText, color: 'text-amber-600 bg-amber-50' },
          { title: 'Monthly Revenue', value: 'KES 2,840,000', change: '+18.4% vs target', icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200/80 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{stat.title}</span>
                <div className={`p-2.5 rounded-lg ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-mavora-navy tracking-tight">{stat.value}</h3>
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1 font-medium">
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                  {stat.change}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200/80 p-6 flex flex-col justify-between min-h-[320px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-mavora-navy">Financial Performance & Cashflow (KES)</h3>
            <span className="text-xs text-gray-400 font-medium">Real-time telemetry</span>
          </div>
          <div className="flex-1 border-2 border-dashed border-gray-100 rounded-lg flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-gray-50/50">
            <p className="text-sm font-medium text-gray-600">Analytics Engine Ready</p>
            <p className="text-xs text-gray-400 mt-1">Modules and financial graphs will populate as transactions are recorded.</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-mavora-navy mb-4">Compliance Status</h3>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-mavora-charcoal">KRA eTIMS Sync</p>
                  <p className="text-[11px] text-gray-400">Last synced: Today, 08:00 EAT</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">Active</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-mavora-charcoal">M-Pesa B2B Gateway</p>
                  <p className="text-[11px] text-gray-400">Sandbox API connected</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">Ready</span>
              </div>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-400 text-center">
            Mavora Technologies Security Subsystem v1.0
          </div>
        </div>
      </div>
    </div>
  );
}