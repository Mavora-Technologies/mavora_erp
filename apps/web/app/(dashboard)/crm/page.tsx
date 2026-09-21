// apps/web/app/(dashboard)/crm/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  MoreVertical, 
  Building2, 
  Mail, 
  Phone, 
  X, 
  Loader2, 
  AlertCircle,
  ArrowRight,
  TrendingUp,
  LayoutGrid,
  List,
  CheckCircle2,
  Sparkles,
  ChevronRight
} from 'lucide-react';

// Accommodates both SQL (id) and NoSQL (_id) backend implementations & camelCase/snake_case keys
interface Customer {
  id?: string;
  _id?: string;
  name: string;
  contact_person?: string;
  contactPerson?: string;
  email: string;
  phone?: string;
  status: string;
  lifecycleStage?: string;
  lifecycle_stage?: string;
}

const LIFECYCLE_STAGES = [
  { key: 'Lead', label: 'Lead (Find)', color: 'bg-blue-50 text-blue-700 border-blue-200', activeBg: 'bg-blue-600' },
  { key: 'Prospect', label: 'Prospect (Understand)', color: 'bg-purple-50 text-purple-700 border-purple-200', activeBg: 'bg-purple-600' },
  { key: 'Opportunity', label: 'Opportunity (Follow Up)', color: 'bg-amber-50 text-amber-700 border-amber-200', activeBg: 'bg-amber-600' },
  { key: 'Client', label: 'Client (Close & Serve)', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', activeBg: 'bg-emerald-600' },
  { key: 'Advocate', label: 'Advocate (Get Referrals)', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', activeBg: 'bg-indigo-600' },
];

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export default function CRMPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'pipeline'>('table');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '', 
    contact_person: '', 
    email: '', 
    phone: '', 
    status: 'Active',
    lifecycle_stage: 'Lead'
  });

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('mavora_token') || ''}`
  });

  const fetchCustomers = async () => {
    try {
      setError(null);
      const res = await fetch(`${API_BASE_URL}/crm/customers`, {
        headers: getAuthHeaders()
      });
      
      if (!res.ok) throw new Error('Failed to fetch customers');
      
      const data = await res.json();
      if (data.success) {
        setCustomers(data.data);
      } else {
        throw new Error(data.message || 'Invalid data structure received');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Customer fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      const res = await fetch(`${API_BASE_URL}/crm/customers`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || 'Failed to create customer');
      
      if (data.success) {
        setCustomers([data.data, ...customers]);
        setIsDrawerOpen(false);
        setFormData({ 
          name: '', 
          contact_person: '', 
          email: '', 
          phone: '', 
          status: 'Active',
          lifecycle_stage: 'Lead' 
        });
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Customer creation error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStage = async (customerId: string, newStage: string) => {
    setUpdatingId(customerId);
    setOpenMenuId(null);
    try {
      const res = await fetch(`${API_BASE_URL}/crm/customers/${customerId}/stage`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ stage: newStage }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update stage');

      if (data.success) {
        setCustomers(prev => prev.map(c => {
          const id = c.id || c._id;
          if (id === customerId) {
            return { ...c, lifecycleStage: newStage, lifecycle_stage: newStage };
          }
          return c;
        }));
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Stage update error:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const getCustomerId = (customer: Customer) => customer.id || customer._id || 'N/A';
  const getStage = (customer: Customer) => customer.lifecycleStage || customer.lifecycle_stage || 'Lead';
  const getContactPerson = (customer: Customer) => customer.contact_person || customer.contactPerson || 'N/A';

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const stage = getStage(c);
    const matchesStage = selectedStageFilter === 'ALL' || stage.toLowerCase() === selectedStageFilter.toLowerCase();

    return matchesSearch && matchesStage;
  });

  const getNextStage = (currentStage: string) => {
    const currentIndex = LIFECYCLE_STAGES.findIndex(s => s.key.toLowerCase() === currentStage.toLowerCase());
    if (currentIndex >= 0 && currentIndex < LIFECYCLE_STAGES.length - 1) {
      return LIFECYCLE_STAGES[currentIndex + 1].key;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-mavora-navy tracking-tight flex items-center gap-2">
            <span>Customer Relationship Management</span>
            <span className="text-xs bg-blue-100 text-mavora-blue font-semibold px-2.5 py-0.5 rounded-full border border-blue-200">
              Growth Framework
            </span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">Convert prospects into long-term customer advocates.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Switcher */}
          <div className="bg-gray-100 p-1 rounded-lg flex items-center border border-gray-200">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
                viewMode === 'table' ? 'bg-white text-mavora-navy shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              onClick={() => setViewMode('pipeline')}
              className={`p-2 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
                viewMode === 'pipeline' ? 'bg-white text-mavora-navy shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Pipeline</span>
            </button>
          </div>

          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="bg-mavora-blue hover:bg-blue-600 text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2 text-sm shadow-md shadow-blue-500/20 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Customer</span>
          </button>
        </div>
      </div>

      {error && !isDrawerOpen && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center justify-between text-sm border border-red-100">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Lifecycle Stage Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-gray-200/80 shadow-sm flex items-center gap-2 overflow-x-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-400 px-3 shrink-0 flex items-center gap-1">
          <TrendingUp className="w-3.5 h-3.5" /> Stage:
        </span>
        <button
          onClick={() => setSelectedStageFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
            selectedStageFilter === 'ALL'
              ? 'bg-mavora-navy text-white shadow-sm'
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
          }`}
        >
          All Stages ({customers.length})
        </button>
        {LIFECYCLE_STAGES.map((s) => {
          const count = customers.filter(c => getStage(c).toLowerCase() === s.key.toLowerCase()).length;
          return (
            <button
              key={s.key}
              onClick={() => setSelectedStageFilter(s.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 flex items-center gap-1.5 border ${
                selectedStageFilter === s.key
                  ? `${s.activeBg} text-white border-transparent shadow-sm`
                  : `${s.color} hover:opacity-80`
              }`}
            >
              <span>{s.key}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                selectedStageFilter === s.key ? 'bg-white/20 text-white' : 'bg-white/60 text-gray-700'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table Controls */}
      <div className="bg-white p-4 rounded-t-xl border-x border-t border-gray-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 flex items-center bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 focus-within:border-mavora-blue focus-within:bg-white transition max-w-md">
          <Search className="w-4 h-4 text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-sm placeholder-gray-400 text-mavora-charcoal"
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-mavora-navy px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* MAIN VIEW: Table View */}
      {viewMode === 'table' ? (
        <div className="bg-white border border-gray-200/80 rounded-b-xl shadow-sm overflow-hidden -mt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-bold">
                  <th className="px-6 py-4">Client Details</th>
                  <th className="px-6 py-4">Primary Contact</th>
                  <th className="px-6 py-4">Lifecycle Stage</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      <p className="text-sm">Loading enterprise data...</p>
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm">
                      No customers found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => {
                    const custId = getCustomerId(customer);
                    const currentStage = getStage(customer);
                    const nextStage = getNextStage(currentStage);
                    const stageConfig = LIFECYCLE_STAGES.find(s => s.key.toLowerCase() === currentStage.toLowerCase()) || LIFECYCLE_STAGES[0];

                    return (
                      <tr key={custId} className="hover:bg-gray-50/50 transition group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 font-bold">
                              <Building2 className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-mavora-navy">{customer.name}</p>
                              <p className="text-xs text-gray-400 font-medium">
                                ID: {custId.slice(-6)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-mavora-charcoal">{getContactPerson(customer)}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {customer.email}</span>
                            {customer.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {customer.phone}</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${stageConfig.color}`}>
                              {stageConfig.label.split(' ')[0]}
                            </span>
                            {updatingId === custId && (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            customer.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 
                            customer.status === 'Lead' ? 'bg-amber-100 text-amber-700' : 
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {customer.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="relative inline-block text-left">
                            <div className="flex items-center justify-end gap-2">
                              {/* Quick Stage Advancement Action */}
                              {nextStage && (
                                <button
                                  onClick={() => handleUpdateStage(custId, nextStage)}
                                  disabled={updatingId === custId}
                                  className="text-xs font-semibold text-mavora-blue hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 border border-blue-200 disabled:opacity-50"
                                  title={`Advance to ${nextStage}`}
                                >
                                  <span>Convert to {nextStage}</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              )}

                              {/* Dropdown Menu Toggle */}
                              <button 
                                onClick={() => setOpenMenuId(openMenuId === custId ? null : custId)}
                                className="text-gray-400 hover:text-mavora-blue p-2 rounded-lg hover:bg-gray-100 transition"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Action Menu Overlay */}
                            {openMenuId === custId && (
                              <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-xl shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20 border border-gray-100 py-1 divide-y divide-gray-100">
                                <div className="px-3 py-2">
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Change Stage</p>
                                </div>
                                <div className="py-1">
                                  {LIFECYCLE_STAGES.map((s) => (
                                    <button
                                      key={s.key}
                                      onClick={() => handleUpdateStage(custId, s.key)}
                                      className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between hover:bg-gray-50 transition ${
                                        currentStage.toLowerCase() === s.key.toLowerCase() ? 'font-bold text-mavora-blue' : 'text-gray-700'
                                      }`}
                                    >
                                      <span>{s.label}</span>
                                      {currentStage.toLowerCase() === s.key.toLowerCase() && (
                                        <CheckCircle2 className="w-3.5 h-3.5 text-mavora-blue" />
                                      )}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ALTERNATIVE VIEW: Growth Framework Pipeline Board */
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {LIFECYCLE_STAGES.map((stage) => {
            const stageCustomers = filteredCustomers.filter(
              c => getStage(c).toLowerCase() === stage.key.toLowerCase()
            );

            return (
              <div key={stage.key} className="bg-gray-50/80 p-3 rounded-xl border border-gray-200/80 flex flex-col min-h-[500px]">
                <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${stage.activeBg}`} />
                    <h3 className="text-xs font-bold text-mavora-navy uppercase tracking-wider">{stage.key}</h3>
                  </div>
                  <span className="text-xs font-bold text-gray-500 bg-white px-2 py-0.5 rounded-md border border-gray-200">
                    {stageCustomers.length}
                  </span>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto">
                  {stageCustomers.length === 0 ? (
                    <div className="p-4 text-center border border-dashed border-gray-200 rounded-lg text-gray-400 text-xs">
                      No accounts in {stage.key}
                    </div>
                  ) : (
                    stageCustomers.map((customer) => {
                      const custId = getCustomerId(customer);
                      const nextStage = getNextStage(stage.key);

                      return (
                        <div key={custId} className="bg-white p-3.5 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition">
                          <div className="flex items-start justify-between">
                            <h4 className="text-sm font-bold text-mavora-navy">{customer.name}</h4>
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                              {customer.status}
                            </span>
                          </div>

                          <p className="text-xs text-gray-500 mt-1">{getContactPerson(customer)}</p>

                          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                            <span className="truncate max-w-[120px]">{customer.email}</span>
                            {nextStage && (
                              <button
                                onClick={() => handleUpdateStage(custId, nextStage)}
                                disabled={updatingId === custId}
                                className="p-1 hover:bg-blue-50 text-mavora-blue rounded transition flex items-center gap-1 text-[11px] font-semibold"
                                title={`Move to ${nextStage}`}
                              >
                                <span>{nextStage}</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Slide-out Drawer Overlay */}
      {isDrawerOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}

      {/* Slide-out Drawer Panel */}
      <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
        isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-mavora-navy">Add New Customer</h2>
            <p className="text-xs text-gray-500">Create a new CRM record in the system.</p>
          </div>
          <button 
            onClick={() => setIsDrawerOpen(false)}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCreateCustomer} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Company Name</label>
            <input
              type="text" required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mavora-blue"
              placeholder="e.g. Mavora Technologies"
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Contact Person</label>
            <input
              type="text" required
              value={formData.contact_person}
              onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mavora-blue"
              placeholder="Full Name"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Email Address</label>
            <input
              type="email" required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mavora-blue"
              placeholder="contact@company.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Phone Number</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mavora-blue"
              placeholder="+254 700 000 000"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Account Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mavora-blue"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Initial Stage</label>
              <select
                value={formData.lifecycle_stage}
                onChange={(e) => setFormData({...formData, lifecycle_stage: e.target.value})}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mavora-blue"
              >
                {LIFECYCLE_STAGES.map(s => (
                  <option key={s.key} value={s.key}>{s.key}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-gray-100 flex gap-3">
            <button
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-mavora-blue text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition disabled:opacity-50 flex items-center justify-center"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}