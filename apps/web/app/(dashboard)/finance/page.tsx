'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  MoreVertical, 
  DollarSign, 
  Calendar, 
  X, 
  Loader2, 
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  FileText
} from 'lucide-react';

interface Invoice {
  id?: string;
  _id?: string;
  invoiceNumber: string;
  customerName?: string;
  amount: number | string;
  status: string;
  issueDate?: string;
  dueDate?: string;
  notes?: string;
}

const INVOICE_STATUSES = [
  { key: 'Draft', label: 'Draft', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  { key: 'Sent', label: 'Sent', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { key: 'Paid', label: 'Paid', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { key: 'Overdue', label: 'Overdue', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  { key: 'Cancelled', label: 'Cancelled', color: 'bg-amber-50 text-amber-700 border-amber-200' },
];

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export default function FinancePage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    invoiceNumber: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
    customerId: '',
    amount: '',
    status: 'Draft',
    dueDate: '',
    notes: ''
  });

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('mavora_token') || ''}`
  });

  const fetchInvoices = async () => {
    try {
      setError(null);
      const res = await fetch(`${API_BASE_URL}/finance/invoices`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch invoices');
      const data = await res.json();
      if (data.success) setInvoices(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/invoices`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create invoice');

      if (data.success) {
        setInvoices([data.data, ...invoices]);
        setIsDrawerOpen(false);
        setFormData({
          invoiceNumber: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
          customerId: '',
          amount: '',
          status: 'Draft',
          dueDate: '',
          notes: ''
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (invoiceId: string, newStatus: string) => {
    setUpdatingId(invoiceId);
    setOpenMenuId(null);
    try {
      const res = await fetch(`${API_BASE_URL}/invoices/${invoiceId}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update invoice status');

      if (data.success) {
        setInvoices(prev => prev.map(inv => ((inv.id || inv._id) === invoiceId ? { ...inv, status: newStatus } : inv)));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.customerName && inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = selectedStatusFilter === 'ALL' || inv.status.toLowerCase() === selectedStatusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-mavora-navy tracking-tight flex items-center gap-2">
            <span>Finance & Invoicing</span>
            <span className="text-xs bg-emerald-100 text-emerald-700 font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200">
              Revenue Module
            </span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage client billing, invoice workflows, and revenue status.</p>
        </div>
        <button 
          onClick={() => setIsDrawerOpen(true)}
          className="bg-mavora-blue hover:bg-blue-600 text-white font-medium py-2.5 px-4 rounded-lg transition flex items-center justify-center gap-2 text-sm shadow-md shadow-blue-500/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Invoice</span>
        </button>
      </div>

      {error && !isDrawerOpen && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center justify-between text-sm border border-red-100">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-gray-200/80 shadow-sm flex items-center gap-2 overflow-x-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-400 px-3 shrink-0">Filter:</span>
        <button
          onClick={() => setSelectedStatusFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
            selectedStatusFilter === 'ALL' ? 'bg-mavora-navy text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
          }`}
        >
          All Invoices ({invoices.length})
        </button>
        {INVOICE_STATUSES.map(s => {
          const count = invoices.filter(i => i.status.toLowerCase() === s.key.toLowerCase()).length;
          return (
            <button
              key={s.key}
              onClick={() => setSelectedStatusFilter(s.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 flex items-center gap-1.5 border ${
                selectedStatusFilter === s.key ? 'bg-mavora-blue text-white border-transparent' : `${s.color} hover:opacity-80`
              }`}
            >
              <span>{s.key}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/40">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Table Section */}
      <div className="bg-white border border-gray-200/80 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200/80 flex items-center gap-3">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by invoice number or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-sm placeholder-gray-400"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-bold">
                <th className="px-6 py-4">Invoice #</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Due Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></td></tr>
              ) : filteredInvoices.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">No invoices found.</td></tr>
              ) : (
                filteredInvoices.map(inv => {
                  const id = inv.id || inv._id || '';
                  const statusConfig = INVOICE_STATUSES.find(s => s.key.toLowerCase() === inv.status.toLowerCase()) || INVOICE_STATUSES[0];

                  return (
                    <tr key={id} className="hover:bg-gray-50/50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 font-bold text-mavora-navy text-sm">
                          <FileText className="w-4 h-4 text-mavora-blue" />
                          <span>{inv.invoiceNumber}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{inv.customerName || 'Direct Client'}</td>
                      <td className="px-6 py-4 text-sm font-bold text-mavora-charcoal">${Number(inv.amount).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusConfig.color}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'No Due Date'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="relative inline-block text-left">
                          <button onClick={() => setOpenMenuId(openMenuId === id ? null : id)} className="p-2 hover:bg-gray-100 rounded-lg">
                            <MoreVertical className="w-4 h-4 text-gray-400" />
                          </button>
                          {openMenuId === id && (
                            <div className="origin-top-right absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-100 z-20 py-1">
                              {INVOICE_STATUSES.map(s => (
                                <button
                                  key={s.key}
                                  onClick={() => handleUpdateStatus(id, s.key)}
                                  className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center justify-between"
                                >
                                  <span>Mark as {s.key}</span>
                                  {inv.status.toLowerCase() === s.key.toLowerCase() && <CheckCircle2 className="w-3 h-3 text-mavora-blue" />}
                                </button>
                              ))}
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

      {/* Creation Drawer */}
      {isDrawerOpen && <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)} />}
      <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 flex flex-col ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-mavora-navy">Create Invoice</h2>
          <button onClick={() => setIsDrawerOpen(false)}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <form onSubmit={handleCreateInvoice} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-600 mb-2">Invoice Number</label>
            <input type="text" required value={formData.invoiceNumber} onChange={e => setFormData({...formData, invoiceNumber: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-gray-600 mb-2">Customer ID</label>
            <input type="text" required value={formData.customerId} onChange={e => setFormData({...formData, customerId: e.target.value})} placeholder="Customer UUID" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-gray-600 mb-2">Amount ($)</label>
            <input type="number" step="0.01" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="5000.00" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-gray-600 mb-2">Due Date</label>
            <input type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div className="pt-6 border-t flex gap-3">
            <button type="button" onClick={() => setIsDrawerOpen(false)} className="flex-1 px-4 py-2 border rounded-lg text-sm">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2 bg-mavora-blue text-white rounded-lg text-sm font-medium flex items-center justify-center">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}