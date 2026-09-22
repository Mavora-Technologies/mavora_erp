'use client';

import React from 'react';
import { 
  TrendingUp, 
  Users, 
  Briefcase, 
  FileText, 
  ArrowUpRight, 
  UserCheck, 
  Boxes, 
  Package, 
  HelpCircle,
  AlertCircle,
  Activity
} from 'lucide-react';

export default function Dashboard() {
  // Mapping metrics to all 8 core operational modules
  const metrics = [
    { module: 'CRM', title: 'Active Leads', value: '24', change: '+12% this month', icon: Users, color: 'text-blue-600 bg-blue-50' },
    { module: 'Sales', title: 'Monthly Revenue', value: 'KES 2.84M', change: '+18.4% vs target', icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50' },
    { module: 'Projects', title: 'Active Projects', value: '06', change: '2 due this week', icon: Briefcase, color: 'text-indigo-600 bg-indigo-50' },
    { module: 'Finance', title: 'Pending Invoices', value: 'KES 450.2K', change: '5 awaiting payment', icon: FileText, color: 'text-amber-600 bg-amber-50' },
    { module: 'HRM', title: 'Present Staff', value: '142 / 150', change: '94.6% attendance', icon: UserCheck, color: 'text-purple-600 bg-purple-50' },
    { module: 'Procurement', title: 'Active POs', value: '18', change: 'KES 1.2M committed', icon: Boxes, color: 'text-cyan-600 bg-cyan-50' },
    { module: 'Inventory', title: 'Stock Alerts', value: '07', change: 'Items below minimum', icon: Package, color: 'text-rose-600 bg-rose-50' },
    { module: 'Helpdesk', title: 'Open Tickets', value: '14', change: '3 critical priority', icon: HelpCircle, color: 'text-orange-600 bg-orange-50' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
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

      {/* Module Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200/80 flex flex-col justify-between group hover:border-gray-300 transition-colors cursor-default">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">{stat.module}</span>
                  <span className="text-xs font-semibold text-gray-600">{stat.title}</span>
                </div>
                <div className={`p-2.5 rounded-lg ${stat.color} group-hover:scale-105 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-mavora-navy tracking-tight">{stat.value}</h3>
                <p className={`text-xs mt-1 flex items-center gap-1 font-medium ${stat.change.includes('below') || stat.change.includes('critical') ? 'text-rose-500' : 'text-gray-400'}`}>
                  {!stat.change.includes('below') && !stat.change.includes('critical') && (
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                  )}
                  {stat.change}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Charts & Activity (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Financial & Sales Chart Placeholder */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 p-6 flex flex-col justify-between min-h-[320px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-mavora-navy">Financial Performance & Cashflow (KES)</h3>
              <span className="text-xs text-gray-400 font-medium">Real-time telemetry</span>
            </div>
            <div className="flex-1 border-2 border-dashed border-gray-100 rounded-lg flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-gray-50/50">
              <Activity className="w-8 h-8 mb-3 text-gray-300" />
              <p className="text-sm font-medium text-gray-600">Analytics Engine Ready</p>
              <p className="text-xs text-gray-400 mt-1">Sales & Finance graphs will populate as transactions are recorded.</p>
            </div>
          </div>

          {/* Cross-Module Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-mavora-navy mb-4">Latest Operations Activity</h3>
            <div className="space-y-4">
              {[
                { module: 'HRM', text: 'New employee onboarding completed for IT Dept.', time: '10 mins ago', icon: UserCheck, color: 'text-purple-600 bg-purple-50' },
                { module: 'Procurement', text: 'Purchase Order #PO-2026-089 approved.', time: '1 hour ago', icon: Boxes, color: 'text-cyan-600 bg-cyan-50' },
                { module: 'Projects', text: 'Milestone "Phase 1 Delivery" marked as complete.', time: '2 hours ago', icon: Briefcase, color: 'text-indigo-600 bg-indigo-50' },
              ].map((activity, i) => {
                const ActivityIcon = activity.icon;
                return (
                  <div key={i} className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className={`p-2 rounded-lg shrink-0 ${activity.color}`}>
                      <ActivityIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{activity.text}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{activity.module} • {activity.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Compliance & Alerts (Span 1) */}
        <div className="space-y-6">
          {/* Action Required / System Alerts */}
          <div className="bg-white rounded-xl shadow-sm border border-rose-100 p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-mavora-navy mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              Action Required
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-rose-50 rounded-lg border border-rose-100">
                <p className="text-xs font-bold text-rose-800 mb-1">Inventory: Low Stock</p>
                <p className="text-[11px] text-rose-600">7 SKUs have fallen below the reorder threshold. Procurement action recommended.</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg border border-orange-100">
                <p className="text-xs font-bold text-orange-800 mb-1">Helpdesk: SLA Warning</p>
                <p className="text-[11px] text-orange-600">3 critical tickets are approaching their resolution SLA limit.</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                <p className="text-xs font-bold text-amber-800 mb-1">Finance: Overdue Invoices</p>
                <p className="text-[11px] text-amber-600">2 client invoices (KES 120,000) are past their due date.</p>
              </div>
            </div>
          </div>

          {/* Compliance Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-mavora-navy mb-4">Compliance & Gateways</h3>
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
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-mavora-charcoal">SMTP Mail Server</p>
                    <p className="text-[11px] text-gray-400">Notifications active</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">Active</span>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-400 text-center">
              Mavora Technologies Security Subsystem v1.0
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}