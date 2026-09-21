'use client';

import React, { useState, useEffect } from 'react';
import {
  Package,
  DollarSign,
  Plus,
  Search,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Truck,
  FileText,
  Trash2,
  Printer
} from 'lucide-react';

interface Supplier {
  id: string;
  name: string;
  email: string;
  contactPerson?: string;
  phone?: string;
  address?: string;
}

interface Product {
  id: string;
  name: string;
  sku?: string;
  sellingPrice?: number;
  costPrice?: number;
  stockLevel?: number;
}

interface LPOItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  status: string;
  totalAmount: number;
  currency: string;
  expectedDate?: string;
  notes?: string;
  createdAt: string;
  supplier?: Supplier;
  items?: {
    id: string;
    quantity: number;
    unitPrice: number;
    product?: Product;
  }[];
}

const PO_STATUSES = [
  { key: 'Draft', label: 'Draft', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  { key: 'Sent', label: 'Sent', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { key: 'Approved', label: 'Approved', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { key: 'Received', label: 'Received', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { key: 'Cancelled', label: 'Cancelled', color: 'bg-rose-50 text-rose-700 border-rose-200' },
];

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export default function ProcurementPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [selectedPOForPrint, setSelectedPOForPrint] = useState<PurchaseOrder | null>(null);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    supplierId: '',
    poNumber: `PO-${Math.floor(100000 + Math.random() * 900000)}`,
    currency: 'KES',
    expectedDate: '',
    notes: '',
    createdById: '',
    items: [] as LPOItem[],
  });

  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isSubmittingSupplier, setIsSubmittingSupplier] = useState(false);
  const [supplierFormData, setSupplierFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
  });

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('mavora_token') || ''}`,
  });

  // Extract session userId from localStorage or decode it directly from the JWT token payload
  useEffect(() => {
    const resolveUserId = () => {
      const storedId = localStorage.getItem('mavora_user_id');
      if (storedId) return storedId;

      try {
        const token = localStorage.getItem('mavora_token');
        if (!token) return '';
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const payload = JSON.parse(jsonPayload);
        return payload.userId || '';
      } catch (err) {
        console.error('Failed to decode user session from token:', err);
        return '';
      }
    };

    const currentUserId = resolveUserId();
    if (currentUserId) {
      setFormData(prev => ({ ...prev, createdById: currentUserId }));
    }
  }, []);

  const fetchData = async () => {
    try {
      setError(null);
      const [poRes, suppliersRes, productsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/procurement/purchase-orders`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/procurement/suppliers`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/inventory/products`, { headers: getAuthHeaders() }),
      ]);

      if (!poRes.ok) throw new Error('Failed to load purchase orders');

      const poData = await poRes.json();
      if (poData.success) {
        setPurchaseOrders(poData.data);
      }

      if (suppliersRes.ok) {
        const supData = await suppliersRes.json();
        if (supData.success) {
          setSuppliers(supData.data);
          if (supData.data.length > 0 && !formData.supplierId) {
            setFormData(prev => ({ ...prev, supplierId: supData.data[0].id }));
          }
        }
      }

      if (productsRes.ok) {
        const prodData = await productsRes.json();
        const productList = prodData.success ? prodData.data : (Array.isArray(prodData) ? prodData : []);
        setProducts(productList);
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Procurement fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddLineItem = () => {
    if (products.length === 0) return;
    const defaultProduct = products[0];
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          productId: defaultProduct.id,
          quantity: 1,
          unitPrice: defaultProduct.costPrice || defaultProduct.sellingPrice || 0,
        }
      ]
    }));
  };

  const handleRemoveLineItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleLineItemChange = (index: number, field: keyof LPOItem, value: any) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    if (field === 'productId') {
      const selectedProd = products.find(p => p.id === value);
      if (selectedProd) {
        updatedItems[index].unitPrice = selectedProd.costPrice || selectedProd.sellingPrice || 0;
      }
    }

    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const calculatedTotalAmount = formData.items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    0
  );

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplierId) {
      setError('Please select a supplier.');
      return;
    }
    if (formData.items.length === 0) {
      setError('Please add at least one product line item to the LPO.');
      return;
    }

    let currentUserId = formData.createdById;
    if (!currentUserId) {
      try {
        const token = localStorage.getItem('mavora_token');
        if (token) {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(window.atob(base64));
          currentUserId = payload.userId || '';
        }
      } catch (err) {
        console.error(err);
      }
    }

    if (!currentUserId) {
      setError('User session ID not found. Please log in again.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Sanitize payload to prevent backend 500 errors
      const payloadData = {
        supplierId: formData.supplierId,
        poNumber: formData.poNumber,
        currency: formData.currency,
        // Send null instead of empty string '' so the backend DB driver doesn't crash on date parsing
        expectedDate: formData.expectedDate ? new Date(formData.expectedDate).toISOString() : null,
        notes: formData.notes || null,
        createdById: currentUserId,
        totalAmount: calculatedTotalAmount,
        items: formData.items.map(item => ({
          productId: item.productId,
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.unitPrice) || 0,
        })),
      };

      const res = await fetch(`${API_BASE_URL}/procurement/purchase-orders`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payloadData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create purchase order');

      if (data.success) {
        await fetchData();
        setIsDrawerOpen(false);
        setFormData({
          supplierId: suppliers[0]?.id || '',
          poNumber: `PO-${Math.floor(100000 + Math.random() * 900000)}`,
          currency: 'KES',
          expectedDate: '',
          notes: '',
          createdById: currentUserId,
          items: [],
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingSupplier(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/procurement/suppliers`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(supplierFormData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create supplier');

      if (data.success) {
        await fetchData();
        setIsSupplierModalOpen(false);
        setSupplierFormData({
          name: '',
          contactPerson: '',
          email: '',
          phone: '',
          address: '',
        });
        if (data.data?.id) {
          setFormData(prev => ({ ...prev, supplierId: data.data.id }));
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmittingSupplier(false);
    }
  };

  const handleUpdateStatus = async (poId: string, newStatus: string) => {
    setUpdatingId(poId);
    try {
      const res = await fetch(`${API_BASE_URL}/procurement/purchase-orders/${poId}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update PO status');

      if (data.success) {
        setPurchaseOrders(prev =>
          prev.map(po => (po.id === poId ? { ...po, status: newStatus } : po))
        );
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const formatCurrency = (val: number, curr = 'KES') => {
    if (curr === 'KES') {
      return `Ksh ${new Intl.NumberFormat('en-KE', {
        maximumFractionDigits: 0,
      }).format(val)}`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr,
      maximumFractionDigits: 0,
    }).format(val);
  };

  const filteredPOs = purchaseOrders.filter(po => {
    const matchesSearch =
      po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (po.supplier?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || po.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const totalSpend = purchaseOrders
    .filter(po => po.status !== 'Cancelled')
    .reduce((sum, po) => sum + Number(po.totalAmount), 0);

  const pendingDeliveryCount = purchaseOrders.filter(
    po => po.status === 'Sent' || po.status === 'Approved'
  ).length;

  const receivedTotal = purchaseOrders
    .filter(po => po.status === 'Received')
    .reduce((sum, po) => sum + Number(po.totalAmount), 0);

  const triggerPrint = () => {
    window.print();
  };

  return (
    <div className="w-full min-h-screen px-2 sm:px-4 md:px-6 py-4 space-y-6 max-w-[1600px] mx-auto">
      <style type="text/css">
        {`
          @media print {
            @page { margin: 1cm; }
            
            body { 
              background-color: white !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            header, nav, aside, footer { 
              display: none !important; 
            }

            #printable-modal-overlay {
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              right: 0 !important;
              background-color: white !important;
              z-index: 2147483647 !important;
              display: block !important;
              min-height: 100vh !important;
            }

            #printable-lpo {
              box-shadow: none !important;
              border: none !important;
              padding: 0 !important;
              margin: 0 !important;
              max-width: 100% !important;
              width: 100% !important;
            }
          }
        `}
      </style>

      {/* MAIN DASHBOARD */}
      <div className="print:hidden space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-mavora-navy tracking-tight flex items-center gap-2 flex-wrap">
              <span>Procurement & Supply Chain</span>
              <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2.5 py-0.5 rounded-full border border-blue-200">
                Vendor Hub
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Manage vendor relationships, local purchase orders (LPOs), inventory replenishment, and fulfillment tracking.
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={() => setIsSupplierModalOpen(true)}
              className="flex-1 sm:flex-initial bg-white border border-gray-200 hover:bg-gray-50 text-mavora-navy font-medium py-2.5 px-3 sm:px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2 text-xs sm:text-sm shadow-sm shrink-0"
            >
              <Building2 className="w-4 h-4 text-gray-500" />
              <span>Add Supplier</span>
            </button>

            <button
              onClick={() => setIsDrawerOpen(true)}
              className="flex-1 sm:flex-initial bg-mavora-blue hover:bg-blue-600 text-white font-medium py-2.5 px-3 sm:px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2 text-xs sm:text-sm shadow-md shadow-blue-500/20 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Create LPO</span>
            </button>
          </div>
        </div>

        {error && !isDrawerOpen && !isSupplierModalOpen && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center justify-between text-sm border border-red-100">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-gray-400">Total Committed Spend</p>
              <h3 className="text-xl sm:text-2xl font-black text-mavora-navy mt-1">{formatCurrency(totalSpend)}</h3>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <FileText className="w-3 h-3 text-blue-500" />
                {purchaseOrders.length} active purchase orders
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-50 flex items-center justify-center text-mavora-blue shrink-0">
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-gray-400">Pending Fulfillment</p>
              <h3 className="text-xl sm:text-2xl font-black text-purple-700 mt-1">{pendingDeliveryCount} POs</h3>
              <p className="text-xs text-purple-600 font-medium mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Awaiting delivery or sign-off
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
              <Truck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200/80 shadow-sm flex items-center justify-between sm:col-span-2 lg:col-span-1">
            <div>
              <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-gray-400">Completed & Received</p>
              <h3 className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">{formatCurrency(receivedTotal)}</h3>
              <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Fully processed inventory
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
              <Package className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-3 sm:p-4 rounded-xl border border-gray-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="w-full sm:max-w-md flex items-center bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 focus-within:border-mavora-blue focus-within:bg-white transition">
            <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Search PO number or supplier..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none w-full text-xs sm:text-sm placeholder-gray-400 text-mavora-charcoal"
            />
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {['ALL', 'Draft', 'Sent', 'Approved', 'Received', 'Cancelled'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-mavora-navy text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Purchase Orders Table */}
        <div className="bg-white border border-gray-200/80 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] sm:text-xs uppercase tracking-wider text-gray-500 font-bold">
                  <th className="px-4 sm:px-6 py-3.5">LPO Reference</th>
                  <th className="px-4 sm:px-6 py-3.5">Supplier / Vendor</th>
                  <th className="px-4 sm:px-6 py-3.5">Total Amount</th>
                  <th className="px-4 sm:px-6 py-3.5">Status</th>
                  <th className="px-4 sm:px-6 py-3.5">Expected Date</th>
                  <th className="px-4 sm:px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400 text-sm">
                      Loading purchase orders...
                    </td>
                  </tr>
                ) : filteredPOs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400 text-sm">
                      No purchase orders found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredPOs.map(po => {
                    const statusConfig = PO_STATUSES.find(s => s.key === po.status) || PO_STATUSES[0];

                    return (
                      <tr key={po.id} className="hover:bg-gray-50/50 transition">
                        <td className="px-4 sm:px-6 py-3.5">
                          <span className="text-xs sm:text-sm font-bold text-mavora-navy">{po.poNumber}</span>
                          <p className="text-[10px] sm:text-[11px] text-gray-400 mt-0.5">
                            Created {new Date(po.createdAt).toLocaleDateString()}
                          </p>
                        </td>
                        <td className="px-4 sm:px-6 py-3.5">
                          <p className="text-xs sm:text-sm font-bold text-mavora-navy flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span className="truncate max-w-[150px] sm:max-w-[200px]">
                              {po.supplier?.name || 'Unassigned Supplier'}
                            </span>
                          </p>
                          <p className="text-[11px] text-gray-400 mt-0.5 truncate max-w-[150px]">
                            {po.supplier?.email || 'N/A'}
                          </p>
                        </td>
                        <td className="px-4 sm:px-6 py-3.5 font-black text-xs sm:text-sm text-mavora-navy whitespace-nowrap">
                          {formatCurrency(po.totalAmount, po.currency)}
                        </td>
                        <td className="px-4 sm:px-6 py-3.5">
                          <span className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-bold border ${statusConfig.color}`}>
                            {po.status}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-3.5 text-xs text-gray-600 font-medium whitespace-nowrap">
                          {po.expectedDate ? new Date(po.expectedDate).toLocaleDateString() : 'Not specified'}
                        </td>
                        <td className="px-4 sm:px-6 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedPOForPrint(po)}
                              title="Print LPO Document"
                              className="p-1.5 text-gray-600 hover:text-mavora-blue bg-gray-100 hover:bg-blue-50 rounded-lg transition border border-gray-200"
                            >
                              <Printer className="w-4 h-4" />
                            </button>

                            <select
                              value={po.status}
                              disabled={updatingId === po.id}
                              onChange={e => handleUpdateStatus(po.id, e.target.value)}
                              className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-mavora-blue font-semibold text-mavora-navy disabled:opacity-50"
                            >
                              {PO_STATUSES.map(st => (
                                <option key={st.key} value={st.key}>
                                  {st.label}
                                </option>
                              ))}
                            </select>
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
      </div>

      {/* PRINTABLE LPO MODAL & DOCUMENT */}
      {selectedPOForPrint && (
        <div 
          id="printable-modal-overlay"
          className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
        >
          <div 
            id="printable-lpo"
            className="bg-white rounded-xl shadow-2xl max-w-3xl w-full p-4 sm:p-8 relative border border-gray-200"
          >
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-200 print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-mavora-blue" />
                <h3 className="font-bold text-gray-800 text-sm sm:text-base">Print LPO Document</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={triggerPrint}
                  className="bg-mavora-blue hover:bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition shadow flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print / Save PDF
                </button>
                <button
                  onClick={() => setSelectedPOForPrint(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-4 text-gray-800 font-sans text-xs">
              <div className="flex justify-between items-start border-b border-mavora-navy pb-3">
                <div>
                  <h1 className="text-base font-black text-mavora-navy tracking-wider">MAVORA TECHNOLOGIES LTD</h1>
                  <p className="text-[10px] text-gray-500 mt-1">Wood Garden Road, off Wood Avenue, Kilimani</p>
                  <p className="text-[10px] text-gray-500">Email: info@mavoratechnologies.com | Tel: 0799 985842</p>
                </div>
                <div className="text-right">
                  <span className="inline-block bg-gray-900 text-white font-black text-sm tracking-tight uppercase border border-gray-900 px-2 py-1 rounded">
                    LOCAL PURCHASE ORDER
                  </span>
                  <p className="text-xs font-bold text-gray-700 mt-1.5">LPO NO: {selectedPOForPrint.poNumber}</p>
                  <p className="text-[10px] text-gray-500">Date: {new Date(selectedPOForPrint.createdAt).toLocaleDateString('en-KE')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded border border-gray-200">
                <div>
                  <h4 className="font-bold text-gray-500 uppercase tracking-wider text-[9px] mb-1">VENDOR / SUPPLIER DETAILS</h4>
                  <p className="font-bold text-gray-900 text-xs">{selectedPOForPrint.supplier?.name || 'N/A'}</p>
                  {selectedPOForPrint.supplier?.contactPerson && (
                    <p className="text-gray-600 text-[11px]">Attn: {selectedPOForPrint.supplier.contactPerson}</p>
                  )}
                  <p className="text-gray-600 text-[11px]">{selectedPOForPrint.supplier?.email}</p>
                  <p className="text-gray-600 text-[11px]">{selectedPOForPrint.supplier?.phone || 'N/A'}</p>
                  <p className="text-gray-600 text-[11px] whitespace-pre-line">{selectedPOForPrint.supplier?.address || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="font-bold text-gray-500 uppercase tracking-wider text-[9px] mb-1">DELIVERY & FULFILLMENT</h4>
                  <p className="font-semibold text-gray-800 text-[11px]">Expected Delivery Date:</p>
                  <p className="text-gray-600 text-[11px] mb-1.5">
                    {selectedPOForPrint.expectedDate
                      ? new Date(selectedPOForPrint.expectedDate).toLocaleDateString('en-KE')
                      : 'Immediate Delivery Required'}
                  </p>
                  <p className="font-semibold text-gray-800 text-[11px]">Status:</p>
                  <p className="font-bold text-mavora-navy text-[11px]">{selectedPOForPrint.status}</p>
                </div>
              </div>

              <div className="border border-gray-200 rounded overflow-hidden">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-gray-100 border-b border-gray-200 font-bold text-gray-700 uppercase">
                    <tr>
                      <th className="p-2">Item / Description</th>
                      <th className="p-2 text-center">Qty</th>
                      <th className="p-2 text-right">Unit Price</th>
                      <th className="p-2 text-right">Total ({selectedPOForPrint.currency})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedPOForPrint.items && selectedPOForPrint.items.length > 0 ? (
                      selectedPOForPrint.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2 font-medium text-gray-800">
                            {item.product?.name || 'Inventory Product'}
                          </td>
                          <td className="p-2 text-center">{item.quantity}</td>
                          <td className="p-2 text-right">{formatCurrency(item.unitPrice, selectedPOForPrint.currency)}</td>
                          <td className="p-2 text-right font-bold text-gray-900">
                            {formatCurrency(item.quantity * item.unitPrice, selectedPOForPrint.currency)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-2">
                          <p className="font-bold text-gray-800">Supplies & Services Order Ref ({selectedPOForPrint.poNumber})</p>
                          <p className="text-gray-500 text-[10px] mt-0.5">{selectedPOForPrint.notes || 'Procurement items specified under standard terms.'}</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t border-gray-300">
                    <tr>
                      <td colSpan={3} className="p-2 font-black text-gray-800 text-right uppercase">Total Amount:</td>
                      <td className="p-2 font-black text-gray-900 text-right text-xs">
                        {formatCurrency(selectedPOForPrint.totalAmount, selectedPOForPrint.currency)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="text-[10px] text-gray-600 space-y-0.5 bg-gray-50 p-2 rounded border border-gray-200">
                <p className="font-bold text-gray-700">Terms & Conditions:</p>
                <ol className="list-decimal list-inside">
                  <li>Please quote the LPO number on all invoices and delivery notes.</li>
                  <li>Deliveries must match specifications outlined in agreement.</li>
                  <li>Invoices will be processed according to agreed credit terms.</li>
                </ol>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-6 text-[11px]">
                <div>
                  <p className="font-bold text-gray-700 mb-6">Authorized Procurement Officer Signature:</p>
                  <div className="border-b border-gray-400 w-full mb-1"></div>
                  <p className="text-gray-500">Date & Stamp</p>
                </div>
                <div>
                  <p className="font-bold text-gray-700 mb-6">Supplier Acceptance & Receipt:</p>
                  <div className="border-b border-gray-400 w-full mb-1"></div>
                  <p className="text-gray-500">Signature & Date</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Slide-out Drawer Overlay for PO */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm transition-opacity print:hidden"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}

      {/* Slide-out Drawer Panel for PO Creation */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full sm:max-w-lg bg-white shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-mavora-navy">Create Local Purchase Order</h2>
            <p className="text-xs text-gray-500 mt-0.5">Generate a new LPO for inventory replenishment.</p>
          </div>
          <button
            onClick={() => setIsDrawerOpen(false)}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCreatePO} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs flex items-center gap-2 border border-red-100">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Supplier / Vendor *</label>
            <div className="flex gap-2">
              <select
                value={formData.supplierId}
                onChange={e => setFormData(prev => ({ ...prev, supplierId: e.target.value }))}
                required
                className="w-full text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-mavora-blue font-medium text-mavora-navy"
              >
                <option value="" disabled>Select a supplier</option>
                {suppliers.map(sup => (
                  <option key={sup.id} value={sup.id}>
                    {sup.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setIsSupplierModalOpen(true)}
                className="bg-gray-100 hover:bg-gray-200 text-mavora-navy px-3 py-2.5 rounded-lg text-xs font-bold border border-gray-200 shrink-0 transition"
              >
                New
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">PO Number *</label>
              <input
                type="text"
                value={formData.poNumber}
                onChange={e => setFormData(prev => ({ ...prev, poNumber: e.target.value }))}
                required
                className="w-full text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-mavora-blue font-medium text-mavora-navy"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Currency</label>
              <select
                value={formData.currency}
                onChange={e => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                className="w-full text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-mavora-blue font-medium text-mavora-navy"
              >
                <option value="KES">KES</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Expected Delivery Date</label>
            <input
              type="date"
              value={formData.expectedDate}
              onChange={e => setFormData(prev => ({ ...prev, expectedDate: e.target.value }))}
              className="w-full text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-mavora-blue font-medium text-mavora-navy"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Notes / Terms</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Optional notes or payment instructions..."
              className="w-full text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-mavora-blue font-medium text-mavora-navy resize-none"
            />
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-gray-700 uppercase">Product Line Items *</label>
              <button
                type="button"
                onClick={handleAddLineItem}
                className="text-xs text-mavora-blue font-bold hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
            </div>

            {formData.items.length === 0 ? (
              <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-4 text-center text-xs text-gray-400">
                No line items added. Click &quot;Add Item&quot; to include products.
              </div>
            ) : (
              <div className="space-y-2">
                {formData.items.map((item, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-2 relative">
                    <div className="flex items-center justify-between gap-2">
                      <select
                        value={item.productId}
                        onChange={e => handleLineItemChange(index, 'productId', e.target.value)}
                        className="w-full text-xs bg-white border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-mavora-blue font-medium text-mavora-navy truncate"
                      >
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} {p.sku ? `(${p.sku})` : ''}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleRemoveLineItem(index)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition shrink-0"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={e => handleLineItemChange(index, 'quantity', Number(e.target.value))}
                          className="w-full text-xs bg-white border border-gray-200 rounded-lg p-1.5 focus:outline-none focus:ring-2 focus:ring-mavora-blue font-medium text-mavora-navy"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">Unit Price ({formData.currency})</label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.unitPrice}
                          onChange={e => handleLineItemChange(index, 'unitPrice', Number(e.target.value))}
                          className="w-full text-xs bg-white border border-gray-200 rounded-lg p-1.5 focus:outline-none focus:ring-2 focus:ring-mavora-blue font-medium text-mavora-navy"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-100 flex items-center justify-between text-xs">
            <span className="font-bold text-mavora-navy uppercase">Total Estimated Spend:</span>
            <span className="font-black text-sm text-mavora-blue">{formatCurrency(calculatedTotalAmount, formData.currency)}</span>
          </div>

          <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-mavora-blue hover:bg-blue-600 text-white text-xs font-bold rounded-lg transition shadow disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? 'Creating...' : 'Create Purchase Order'}
            </button>
          </div>
        </form>
      </div>

      {/* SUPPLIER MODAL */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <h3 className="font-bold text-mavora-navy text-sm sm:text-base flex items-center gap-2">
                <Building2 className="w-5 h-5 text-mavora-blue" />
                Add New Supplier
              </h3>
              <button
                onClick={() => setIsSupplierModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  value={supplierFormData.name}
                  onChange={e => setSupplierFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Acme Supplies Ltd"
                  className="w-full text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-mavora-blue font-medium text-mavora-navy"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Contact Person</label>
                <input
                  type="text"
                  value={supplierFormData.contactPerson}
                  onChange={e => setSupplierFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                  placeholder="e.g. Jane Doe"
                  className="w-full text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-mavora-blue font-medium text-mavora-navy"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email</label>
                  <input
                    type="email"
                    value={supplierFormData.email}
                    onChange={e => setSupplierFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="supplier@example.com"
                    className="w-full text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-mavora-blue font-medium text-mavora-navy"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Phone</label>
                  <input
                    type="text"
                    value={supplierFormData.phone}
                    onChange={e => setSupplierFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+254 700 000000"
                    className="w-full text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-mavora-blue font-medium text-mavora-navy"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Address</label>
                <textarea
                  rows={2}
                  value={supplierFormData.address}
                  onChange={e => setSupplierFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Physical address or location..."
                  className="w-full text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-mavora-blue font-medium text-mavora-navy resize-none"
                />
              </div>

              <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSupplier}
                  className="px-5 py-2 bg-mavora-blue hover:bg-blue-600 text-white text-xs font-bold rounded-lg transition shadow disabled:opacity-50"
                >
                  {isSubmittingSupplier ? 'Saving...' : 'Save Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}