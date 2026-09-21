// apps/web/app/(dashboard)/helpdesk/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { LifeBuoy, Plus, Search, RefreshCw, CheckCircle2, Clock, AlertCircle, ShieldAlert, PhoneCall, Globe, Building, Mail } from 'lucide-react';

interface Ticket {
  id: string;
  ticketNumber: string;
  title: string;
  description?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  ticketType: 'CLIENT' | 'INTERNAL';
  source: 'PHONE' | 'WEBSITE' | 'WALK_IN' | 'EMAIL';
  clientName?: string;
  companyName?: string;
  category: string;
  location: string;
  department: string;
  requesterName: string;
  assignee: string;
  createdAt: string;
}

export default function HelpdeskPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL'); // ALL, CLIENT, INTERNAL
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    ticketType: 'CLIENT',
    source: 'WEBSITE',
    clientName: '',
    companyName: '',
    category: 'Software Development',
    location: 'Nairobi HQ',
    department: 'Client Services',
    requesterName: '',
  });
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/helpdesk/tickets`);
      if (!res.ok) throw new Error('Failed to load support tickets');
      const json = await res.json();
      setTickets(json.data || []);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching tickets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch(`${API_URL}/helpdesk/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to log ticket');

      setIsModalOpen(false);
      setFormData({
        title: '',
        description: '',
        priority: 'MEDIUM',
        ticketType: 'CLIENT',
        source: 'WEBSITE',
        clientName: '',
        companyName: '',
        category: 'Software Development',
        location: 'Nairobi HQ',
        department: 'Client Services',
        requesterName: '',
      });
      fetchTickets();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`${API_URL}/helpdesk/tickets/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      fetchTickets();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.requesterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.companyName && t.companyName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === 'ALL' || t.ticketType === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'PHONE':
        return <span title="Logged via Phone Call"><PhoneCall className="h-3.5 w-3.5 text-blue-600" /></span>;
      case 'WALK_IN':
        return <span title="Reception Walk-in"><Building className="h-3.5 w-3.5 text-purple-600" /></span>;
      case 'EMAIL':
        return <span title="Client Email Inquiry"><Mail className="h-3.5 w-3.5 text-amber-600" /></span>;
      default:
        return <span title="Website Inquiry"><Globe className="h-3.5 w-3.5 text-emerald-600" /></span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800 flex items-center gap-1 w-fit"><ShieldAlert className="h-3 w-3"/> Urgent</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-orange-100 text-orange-800 w-fit">High</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 w-fit">Medium</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-700 w-fit">Low</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 flex items-center gap-1"><AlertCircle className="h-3 w-3"/> Open</span>;
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 flex items-center gap-1"><Clock className="h-3 w-3"/> In Progress</span>;
      case 'RESOLVED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 flex items-center gap-1"><CheckCircle2 className="h-3 w-3"/> Resolved</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">Closed</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <LifeBuoy className="h-7 w-7 text-blue-600" />
            Mavora Helpdesk & Client Support Center
          </h1>
          <p className="text-sm text-gray-500">
            Record and manage client service issues (Phone calls, Website, Walk-ins) and internal department tasks.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm"
        >
          <Plus className="h-4 w-4" /> Log New Support Issue
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by ticket #, title, client company, or service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Types (Client & Internal)</option>
            <option value="CLIENT">Client Issues Only</option>
            <option value="INTERNAL">Internal Issues Only</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>

          <button
            onClick={fetchTickets}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Table View */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4">Ticket # / Issue</th>
                <th className="py-3 px-4">Client / Contact</th>
                <th className="py-3 px-4">Channel / Type</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {loading && tickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-500">
                    Loading support tickets...
                  </td>
                </tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-500">
                    No support tickets found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50/50 transition">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{ticket.title}</div>
                      <div className="text-xs font-mono text-blue-600 font-semibold">
                        {ticket.ticketNumber} • {ticket.category}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {ticket.ticketType === 'CLIENT' ? (
                        <div>
                          <div className="font-medium text-gray-900">{ticket.companyName || ticket.clientName || 'Client'}</div>
                          <div className="text-xs text-gray-500">Contact: {ticket.clientName || ticket.requesterName}</div>
                        </div>
                      ) : (
                        <div>
                          <div className="font-medium text-gray-800">Internal Staff</div>
                          <div className="text-xs text-gray-500">{ticket.requesterName} ({ticket.department})</div>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {getSourceIcon(ticket.source)}
                        <span className="text-xs font-medium text-gray-700">
                          {ticket.source.replace('_', ' ')}
                        </span>
                      </div>
                      <span className={`inline-flex mt-1 px-2 py-0.5 rounded text-[10px] font-bold ${ticket.ticketType === 'CLIENT' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-700'}`}>
                        {ticket.ticketType}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {getPriorityBadge(ticket.priority)}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(ticket.status)}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {ticket.status === 'OPEN' && (
                        <button
                          onClick={() => handleUpdateStatus(ticket.id, 'IN_PROGRESS')}
                          className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-2.5 py-1 rounded-md font-medium transition"
                        >
                          Take On
                        </button>
                      )}
                      {ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && (
                        <button
                          onClick={() => handleUpdateStatus(ticket.id, 'RESOLVED')}
                          className="text-xs bg-green-50 text-green-700 hover:bg-green-100 px-2.5 py-1 rounded-md font-medium transition"
                        >
                          Resolve
                        </button>
                      )}
                      {ticket.status === 'RESOLVED' && (
                        <button
                          onClick={() => handleUpdateStatus(ticket.id, 'CLOSED')}
                          className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 px-2.5 py-1 rounded-md font-medium transition"
                        >
                          Close
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Ticket Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 my-8">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <LifeBuoy className="h-5 w-5 text-blue-600" /> Log Support Issue / Inquiry
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Issue Type *</label>
                  <select
                    value={formData.ticketType}
                    onChange={(e) => setFormData({ ...formData, ticketType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="CLIENT">Client Issue / Request</option>
                    <option value="INTERNAL">Internal Issue</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Intake Channel *</label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="WEBSITE">Website Inquiry</option>
                    <option value="PHONE">Phone Call</option>
                    <option value="WALK_IN">Reception Walk-in</option>
                    <option value="EMAIL">Email Inquiry</option>
                  </select>
                </div>
              </div>

              {formData.ticketType === 'CLIENT' && (
                <div className="grid grid-cols-2 gap-4 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                  <div>
                    <label className="block text-xs font-semibold text-blue-900 uppercase mb-1">Client Company</label>
                    <input
                      type="text"
                      placeholder="e.g. Equity Bank Kenya"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-blue-900 uppercase mb-1">Client Contact Name *</label>
                    <input
                      type="text"
                      required={formData.ticketType === 'CLIENT'}
                      placeholder="e.g. David Kamau"
                      value={formData.clientName}
                      onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Logged By (Staff) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Receptionist / Agent"
                    value={formData.requesterName}
                    onChange={(e) => setFormData({ ...formData, requesterName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Mavora Service / Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <optgroup label="Mavora Services">
                      <option value="Software Development">Software Development</option>
                      <option value="AI & Automation">AI & Automation</option>
                      <option value="Web Development">Web Development</option>
                      <option value="Mobile Applications">Mobile Applications</option>
                      <option value="Cybersecurity">Cybersecurity</option>
                      <option value="Cloud & IT Solutions">Cloud & IT Solutions</option>
                      <option value="Data Analytics">Data Analytics</option>
                      <option value="Digital Transformation">Digital Transformation</option>
                    </optgroup>
                    <optgroup label="Internal Support">
                      <option value="Internal IT">Internal IT Hardware/Software</option>
                      <option value="Facilities">Facilities & Office</option>
                      <option value="HR & Payroll">HR & Payroll</option>
                    </optgroup>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Issue Title / Summary *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. API Gateway timeout on client portal integration"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Location / Branch</label>
                  <select
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Nairobi HQ">Nairobi HQ</option>
                    <option value="Mombasa Branch">Mombasa Branch</option>
                    <option value="Kisumu Hub">Kisumu Hub</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Description & Next Steps</label>
                <textarea
                  rows={3}
                  placeholder="Provide details gathered from call, walk-in, or web inquiry..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {submitting ? 'Logging...' : 'Save Support Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}