'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, MoreVertical, Building2, Mail, Phone, X, Loader2, AlertCircle } from 'lucide-react';

// Accommodates both SQL (id) and NoSQL (_id) backend implementations
interface Customer {
  id?: string;
  _id?: string;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  status: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export default function CRMPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '', contact_person: '', email: '', phone: '', status: 'Lead'
  });

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('mavora_token')}`
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
        setFormData({ name: '', contact_person: '', email: '', phone: '', status: 'Lead' });
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Customer creation error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCustomerId = (customer: Customer) => customer.id || customer._id || 'N/A';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-mavora-navy tracking-tight">Customer Relationship Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your clients, leads, and organizational contacts.</p>
        </div>
        <button 
          onClick={() => setIsDrawerOpen(true)}
          className="bg-mavora-blue hover:bg-blue-600 text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2 text-sm shadow-md shadow-blue-500/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {error && !isDrawerOpen && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2 text-sm border border-red-100">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

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
        <button className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-mavora-navy px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
          <Filter className="w-4 h-4" />
          <span>Filters</span>
        </button>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-gray-200/80 rounded-b-xl shadow-sm overflow-hidden -mt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-bold">
                <th className="px-6 py-4">Client Details</th>
                <th className="px-6 py-4">Primary Contact</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    <p className="text-sm">Loading enterprise data...</p>
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400 text-sm">
                    No customers found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={getCustomerId(customer)} className="hover:bg-gray-50/50 transition group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-mavora-navy">{customer.name}</p>
                          <p className="text-xs text-gray-400 font-medium">
                            {getCustomerId(customer).slice(-6)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-mavora-charcoal">{customer.contact_person}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {customer.email}</span>
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {customer.phone}</span>
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
                      <button className="text-gray-400 hover:text-mavora-blue p-2 rounded-lg hover:bg-gray-100 transition opacity-0 group-hover:opacity-100 focus:opacity-100">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Account Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mavora-blue"
            >
              <option value="Lead">Lead</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
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