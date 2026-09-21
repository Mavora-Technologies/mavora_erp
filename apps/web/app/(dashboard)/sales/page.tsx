// apps/web/app/(dashboard)/sales/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  Plus,
  Search,
  LayoutGrid,
  List,
  Loader2,
  AlertCircle,
  X,
  ChevronRight,
  Calendar,
  Building2,
  CheckCircle2,
  Briefcase,
  Layers,
  ArrowUpRight
} from 'lucide-react';

interface CustomerOption {
  id: string;
  name: string;
  contactPerson?: string;
  email: string;
}

interface Deal {
  id: string;
  title: string;
  value: number;
  currency: string;
  stage: string;
  probability: number;
  expectedCloseDate?: string;
  notes?: string;
  createdAt: string;
  customer?: CustomerOption;
}

const SALES_STAGES = [
  { key: 'Discovery', label: 'Discovery', color: 'bg-blue-50 text-blue-700 border-blue-200', activeBg: 'bg-blue-600', probability: 20 },
  { key: 'Proposal', label: 'Proposal', color: 'bg-purple-50 text-purple-700 border-purple-200', activeBg: 'bg-purple-600', probability: 50 },
  { key: 'Negotiation', label: 'Negotiation', color: 'bg-amber-50 text-amber-700 border-amber-200', activeBg: 'bg-amber-600', probability: 80 },
  { key: 'Closed Won', label: 'Closed Won', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', activeBg: 'bg-emerald-600', probability: 100 },
  { key: 'Closed Lost', label: 'Closed Lost', color: 'bg-rose-50 text-rose-700 border-rose-200', activeBg: 'bg-rose-600', probability: 0 },
];

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export default function SalesPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Drawer & Form State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    customerId: '',
    title: '',
    value: '',
    currency: 'USD',
    stage: 'Discovery',
    probability: 20,
    expectedCloseDate: '',
    notes: '',
  });

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('mavora_token') || ''}`,
  });

  const fetchDealsAndCustomers = async () => {
    try {
      setError(null);
      const [dealsRes, customersRes] = await Promise.all([
        fetch(`${API_BASE_URL}/sales/deals`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/crm/customers`, { headers: getAuthHeaders() }),
      ]);

      if (!dealsRes.ok) throw new Error('Failed to load deals');
      
      const dealsData = await dealsRes.json();
      if (dealsData.success) {
        setDeals(dealsData.data);
      }

      if (customersRes.ok) {
        const customersData = await customersRes.json();
        if (customersData.success) {
          setCustomers(customersData.data);
          if (customersData.data.length > 0) {
            setFormData(prev => ({ ...prev, customerId: customersData.data[0].id }));
          }
        }
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Sales fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDealsAndCustomers();
  }, []);

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId) {
      setError('Please select a customer.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/sales/deals`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...formData,
          value: Number(formData.value),
          probability: Number(formData.probability),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create deal');

      if (data.success) {
        await fetchDealsAndCustomers();
        setIsDrawerOpen(false);
        setFormData({
          customerId: customers[0]?.id || '',
          title: '',
          value: '',
          currency: 'USD',
          stage: 'Discovery',
          probability: 20,
          expectedCloseDate: '',
          notes: '',
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStage = async (dealId: string, newStage: string) => {
    setUpdatingId(dealId);
    try {
      const res = await fetch(`${API_BASE_URL}/sales/deals/${dealId}/stage`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ stage: newStage }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update deal stage');

      if (data.success) {
        setDeals(prev =>
          prev.map(d => (d.id === dealId ? { ...d, stage: newStage } : d))
        );
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const formatCurrency = (val: number, curr = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr,
      maximumFractionDigits: 0,
    }).format(val);
  };

  const filteredDeals = deals.filter(
    d =>
      d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.customer?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Revenue Metrics
  const totalPipelineValue = filteredDeals
    .filter(d => d.stage !== 'Closed Lost')
    .reduce((sum, d) => sum + Number(d.value), 0);

  const weightedPipelineValue = filteredDeals
    .filter(d => d.stage !== 'Closed Lost' && d.stage !== 'Closed Won')
    .reduce((sum, d) => sum + Number(d.value) * (d.probability / 100), 0);

  const closedWonTotal = filteredDeals
    .filter(d => d.stage === 'Closed Won')
    .reduce((sum, d) => sum + Number(d.value), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-mavora-navy tracking-tight flex items-center gap-2">
            <span>Sales Pipeline & Deals</span>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200">
              Revenue Hub
            </span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track opportunities, forecast revenue, and convert deals into active enterprise clients.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="bg-gray-100 p-1 rounded-lg flex items-center border border-gray-200">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
                viewMode === 'kanban' ? 'bg-white text-mavora-navy shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
                viewMode === 'table' ? 'bg-white text-mavora-navy shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>

          <button
            onClick={() => setIsDrawerOpen(true)}
            className="bg-mavora-blue hover:bg-blue-600 text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2 text-sm shadow-md shadow-blue-500/20 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Deal</span>
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

      {/* KPI Revenue Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Pipeline Value</p>
            <h3 className="text-2xl font-black text-mavora-navy mt-1">{formatCurrency(totalPipelineValue)}</h3>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <Layers className="w-3 h-3 text-blue-500" />
              Across {filteredDeals.length} total deals
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-mavora-blue">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Weighted Forecast</p>
            <h3 className="text-2xl font-black text-purple-700 mt-1">{formatCurrency(weightedPipelineValue)}</h3>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-purple-500" />
              Adjusted by stage probability
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Closed Won Revenue</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">{formatCurrency(closedWonTotal)}</h3>
            <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" />
              Converted to active clients
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search & Bar Controls */}
      <div className="bg-white p-4 rounded-xl border border-gray-200/80 flex items-center justify-between">
        <div className="flex-1 flex items-center bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 focus-within:border-mavora-blue focus-within:bg-white transition max-w-md">
          <Search className="w-4 h-4 text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search deals by title or company..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-sm placeholder-gray-400 text-mavora-charcoal"
          />
        </div>
      </div>

      {/* MAIN VIEW: KANBAN BOARD */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {SALES_STAGES.map(stage => {
            const stageDeals = filteredDeals.filter(d => d.stage.toLowerCase() === stage.key.toLowerCase());
            const stageTotalValue = stageDeals.reduce((sum, d) => sum + Number(d.value), 0);

            return (
              <div key={stage.key} className="bg-gray-50/80 p-3 rounded-xl border border-gray-200/80 flex flex-col min-h-[550px] min-w-[260px]">
                {/* Column Header */}
                <div className="pb-3 border-b border-gray-200 mb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${stage.activeBg}`} />
                      <h3 className="text-xs font-bold text-mavora-navy uppercase tracking-wider">{stage.label}</h3>
                    </div>
                    <span className="text-xs font-bold text-gray-500 bg-white px-2 py-0.5 rounded-md border border-gray-200">
                      {stageDeals.length}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-gray-500 mt-2">
                    {formatCurrency(stageTotalValue)}
                  </p>
                </div>

                {/* Cards Container */}
                <div className="flex-1 space-y-3 overflow-y-auto">
                  {loading ? (
                    <div className="p-4 text-center text-gray-400">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1" />
                      <p className="text-xs">Loading deals...</p>
                    </div>
                  ) : stageDeals.length === 0 ? (
                    <div className="p-4 text-center border border-dashed border-gray-200 rounded-lg text-gray-400 text-xs">
                      No deals in {stage.label}
                    </div>
                  ) : (
                    stageDeals.map(deal => {
                      const stageIndex = SALES_STAGES.findIndex(s => s.key === stage.key);
                      const nextStage = stageIndex < SALES_STAGES.length - 2 ? SALES_STAGES[stageIndex + 1].key : null;

                      return (
                        <div key={deal.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition space-y-3">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-mavora-blue bg-blue-50 px-2 py-0.5 rounded">
                              {deal.customer?.name || 'Unassigned Customer'}
                            </span>
                            <h4 className="text-sm font-bold text-mavora-navy mt-1">{deal.title}</h4>
                          </div>

                          <div className="flex items-baseline justify-between">
                            <span className="text-base font-black text-mavora-navy">
                              {formatCurrency(deal.value, deal.currency)}
                            </span>
                            <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                              {deal.probability}% win rate
                            </span>
                          </div>

                          {deal.expectedCloseDate && (
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{new Date(deal.expectedCloseDate).toLocaleDateString()}</span>
                            </div>
                          )}

                          {/* Quick Advancement Bar */}
                          <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                            {stage.key !== 'Closed Lost' && stage.key !== 'Closed Won' ? (
                              <>
                                <button
                                  onClick={() => handleUpdateStage(deal.id, 'Closed Lost')}
                                  disabled={updatingId === deal.id}
                                  className="text-[11px] font-semibold text-rose-600 hover:underline disabled:opacity-50"
                                >
                                  Mark Lost
                                </button>

                                {nextStage && (
                                  <button
                                    onClick={() => handleUpdateStage(deal.id, nextStage)}
                                    disabled={updatingId === deal.id}
                                    className="text-[11px] font-bold text-mavora-blue hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md transition flex items-center gap-1 border border-blue-200 disabled:opacity-50"
                                  >
                                    <span>{nextStage}</span>
                                    <ChevronRight className="w-3 h-3" />
                                  </button>
                                )}
                              </>
                            ) : (
                              <span className="text-[11px] font-bold text-gray-400 italic">
                                Pipeline Finalized
                              </span>
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
      ) : (
        /* ALTERNATIVE VIEW: DENSE TABLE */
        <div className="bg-white border border-gray-200/80 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-bold">
                  <th className="px-6 py-4">Deal & Client</th>
                  <th className="px-6 py-4">Value</th>
                  <th className="px-6 py-4">Stage</th>
                  <th className="px-6 py-4">Probability</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDeals.map(deal => {
                  const stageConfig = SALES_STAGES.find(s => s.key === deal.stage) || SALES_STAGES[0];

                  return (
                    <tr key={deal.id} className="hover:bg-gray-50/50 transition">
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-mavora-navy">{deal.title}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3" /> {deal.customer?.name || 'N/A'}
                        </p>
                      </td>
                      <td className="px-6 py-4 font-bold text-sm text-mavora-navy">
                        {formatCurrency(deal.value, deal.currency)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${stageConfig.color}`}>
                          {deal.stage}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-600">
                        {deal.probability}%
                      </td>
                      <td className="px-6 py-4 text-right">
                        <select
                          value={deal.stage}
                          onChange={e => handleUpdateStage(deal.id, e.target.value)}
                          className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-mavora-blue font-semibold text-mavora-navy"
                        >
                          {SALES_STAGES.map(s => (
                            <option key={s.key} value={s.key}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-mavora-navy">Create New Sales Deal</h2>
            <p className="text-xs text-gray-500">Attach a potential revenue opportunity to an existing client.</p>
          </div>
          <button
            onClick={() => setIsDrawerOpen(false)}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCreateDeal} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
              Select Customer / Account
            </label>
            <select
              required
              value={formData.customerId}
              onChange={e => setFormData({ ...formData, customerId: e.target.value })}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mavora-blue font-medium"
            >
              {customers.length === 0 ? (
                <option value="">No customers found — create one first</option>
              ) : (
                customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.email})
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
              Deal Title
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mavora-blue"
              placeholder="e.g. Enterprise Cloud License Renewal"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
                Value
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.value}
                onChange={e => setFormData({ ...formData, value: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mavora-blue"
                placeholder="50000"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
                Currency
              </label>
              <select
                value={formData.currency}
                onChange={e => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mavora-blue"
              >
                <option value="USD">USD ($)</option>
                <option value="KES">KES (KSh)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
                Initial Stage
              </label>
              <select
                value={formData.stage}
                onChange={e => {
                  const stage = e.target.value;
                  const prob = SALES_STAGES.find(s => s.key === stage)?.probability || 20;
                  setFormData({ ...formData, stage, probability: prob });
                }}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mavora-blue"
              >
                {SALES_STAGES.map(s => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
                Win Probability (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.probability}
                onChange={e => setFormData({ ...formData, probability: Number(e.target.value) })}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mavora-blue"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
              Expected Close Date
            </label>
            <input
              type="date"
              value={formData.expectedCloseDate}
              onChange={e => setFormData({ ...formData, expectedCloseDate: e.target.value })}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mavora-blue"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
              Notes & Deal Details
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mavora-blue"
              placeholder="Include contract terms or sales notes..."
            />
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
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Deal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}