'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Package,
  Plus,
  AlertTriangle,
  Search,
  RefreshCw,
  Building2,
  Layers,
  ArrowDownLeft,
  Coins,
  AlertOctagon,
  PieChart,
  Boxes,
  Pencil,
  Trash2,
  X,
  FilterX,
} from 'lucide-react';

interface InternalAsset {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category: string;
  location: string;
  department: string;
  costPrice: number;
  stockQuantity: number;
  reorderLevel: number;
  createdAt: string;
}

// UUID regex to prevent raw database foreign keys from leaking into UI location/department labels
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (val: unknown): boolean => typeof val === 'string' && UUID_REGEX.test(val);

// Helper to recursively locate array records across diverse API wrapper formats
const extractArrayData = (json: any): any[] => {
  if (!json) return [];
  if (Array.isArray(json)) return json;
  if (typeof json === 'object') {
    if (Array.isArray(json.data)) return json.data;
    if (Array.isArray(json.items)) return json.items;
    if (Array.isArray(json.products)) return json.products;
    if (Array.isArray(json.records)) return json.records;
    if (Array.isArray(json.rows)) return json.rows;
    if (json.data && typeof json.data === 'object') {
      return extractArrayData(json.data);
    }
  }
  return [];
};

// Normalization parsers to map schema variations between legacy products & enterprise inventoryItems
const parseName = (item: any): string => {
  return String(item.name || item.itemName || item.title || 'Unnamed Asset');
};

const parseSku = (item: any): string => {
  return String(item.sku || item.itemCode || item.item_code || item.barcode || 'N/A');
};

const parseCategory = (item: any): string => {
  if (item.category && typeof item.category === 'object') {
    return item.category.name || item.category.title || 'General';
  }
  if (typeof item.category === 'string' && !isUuid(item.category)) {
    return item.category;
  }
  return item.categoryName || item.category_name || 'General';
};

const parseLocation = (item: any): string => {
  if (item.location && typeof item.location === 'object') {
    return item.location.name || item.location.title || 'Nairobi HQ';
  }
  if (item.inventoryLocation && typeof item.inventoryLocation === 'object') {
    return item.inventoryLocation.name || 'Nairobi HQ';
  }
  if (item.locationName) return item.locationName;
  if (typeof item.location === 'string' && !isUuid(item.location)) {
    return item.location;
  }
  return 'Nairobi HQ';
};

const parseDepartment = (item: any): string => {
  if (item.department && typeof item.department === 'object') {
    return item.department.name || item.department.title || 'Operations';
  }
  if (item.departmentName) return item.departmentName;
  if (typeof item.department === 'string' && !isUuid(item.department)) {
    return item.department;
  }
  return 'Operations';
};

export default function InventoryPage() {
  const [products, setProducts] = useState<InternalAsset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('ALL');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [receiveModalOpen, setReceiveModalOpen] = useState<boolean>(false);
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);

  const [selectedAssetForReceive, setSelectedAssetForReceive] = useState<InternalAsset | null>(null);
  const [selectedAssetForEdit, setSelectedAssetForEdit] = useState<InternalAsset | null>(null);

  const [receiveQty, setReceiveQty] = useState<string>('1');
  const [receivingSubmitting, setReceivingSubmitting] = useState<boolean>(false);

  // Registration Form State
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    category: 'IT Equipment',
    location: 'Nairobi HQ',
    department: 'Information Technology',
    costPrice: '',
    stockQuantity: '',
    reorderLevel: '5',
  });
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Edit Form State
  const [editFormData, setEditFormData] = useState({
    sku: '',
    name: '',
    description: '',
    category: '',
    location: '',
    department: '',
    costPrice: '',
    stockQuantity: 0,
    reorderLevel: 5,
  });
  const [editSubmitting, setEditSubmitting] = useState<boolean>(false);
  const [editFormError, setEditFormError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/inventory/products`);
      if (!res.ok) throw new Error('Failed to load internal inventory records');
      const json = await res.json();
      setProducts(json.data || []);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching inventory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Dynamically extract distinct locations present in loaded dataset
  const dynamicLocations = useMemo(() => {
    const locSet = new Set<string>();
    products.forEach((p) => {
      if (p.location) locSet.add(p.location);
    });
    // Guarantee defaults exist
    locSet.add('Nairobi HQ');
    locSet.add('Mombasa Branch');
    locSet.add('Kisumu Hub');

    return ['ALL', ...Array.from(locSet)];
  }, [products]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch(`${API_URL}/inventory/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: formData.sku,
          name: formData.name,
          description: formData.description,
          category: formData.category,
          location: formData.location,
          department: formData.department,
          costPrice: Number(formData.costPrice),
          quantityOnHand: formData.stockQuantity ? Number(formData.stockQuantity) : 0,
          reorderLevel: formData.reorderLevel ? Number(formData.reorderLevel) : 5,
          performedById: 'system-user',
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to register asset');

      setIsModalOpen(false);
      setFormData({
        sku: '',
        name: '',
        description: '',
        category: 'IT Equipment',
        location: 'Nairobi HQ',
        department: 'Information Technology',
        costPrice: '',
        stockQuantity: '',
        reorderLevel: '5',
      });
      fetchProducts();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetForEdit) return;
    setEditSubmitting(true);
    setEditFormError(null);

    try {
      const res = await fetch(`${API_URL}/inventory/items/${selectedAssetForEdit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editFormData,
          costPrice: Number(editFormData.costPrice),
          quantityOnHand: Number(editFormData.stockQuantity),
          reorderLevel: Number(editFormData.reorderLevel),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to update asset');

      setEditModalOpen(false);
      setSelectedAssetForEdit(null);
      fetchProducts();
    } catch (err: any) {
      setEditFormError(err.message);
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete asset "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/inventory/items/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || 'Failed to delete asset');
      }
      fetchProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to delete product record');
    }
  };

  const handleReceiveStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetForReceive) return;
    setReceivingSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/inventory/items/${selectedAssetForReceive.id}/adjust-stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantityChange: Number(receiveQty),
          reason: 'Stock reception log',
          performedById: 'system-user',
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to receive stock');

      setReceiveModalOpen(false);
      setSelectedAssetForReceive(null);
      setReceiveQty('1');
      fetchProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to update stock quantity');
    } finally {
      setReceivingSubmitting(false);
    }
  };

  // Resilient search and filtering
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const searchLower = searchQuery.toLowerCase().trim();

      const matchesSearch =
        !searchLower ||
        p.name.toLowerCase().includes(searchLower) ||
        p.sku.toLowerCase().includes(searchLower) ||
        p.category.toLowerCase().includes(searchLower) ||
        p.department.toLowerCase().includes(searchLower) ||
        p.location.toLowerCase().includes(searchLower) ||
        (p.description && p.description.toLowerCase().includes(searchLower));

      const matchesLocation =
        selectedLocation === 'ALL' ||
        p.location.toLowerCase() === selectedLocation.toLowerCase() ||
        p.location.toLowerCase().includes(selectedLocation.toLowerCase()) ||
        selectedLocation.toLowerCase().includes(p.location.toLowerCase());

      return matchesSearch && matchesLocation;
    });
  }, [products, searchQuery, selectedLocation]);

  // Executive Dashboard KPIs
  const kpiData = useMemo(() => {
    let totalValue = 0;
    let totalUnits = 0;
    let lowStockCount = 0;
    let depletedCount = 0;

    const departmentMap: Record<string, number> = {};

    filteredProducts.forEach((item) => {
      const cost = Number(item.costPrice) || 0;
      const qty = Number(item.stockQuantity) || 0;
      const val = cost * qty;

      totalValue += val;
      totalUnits += qty;

      if (qty === 0) {
        depletedCount += 1;
      } else if (qty <= item.reorderLevel) {
        lowStockCount += 1;
      }

      const dept = item.department || 'General';
      departmentMap[dept] = (departmentMap[dept] || 0) + val;
    });

    const topDepartment =
      Object.entries(departmentMap).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    return {
      totalValuation: totalValue,
      totalUnits,
      uniqueSkus: filteredProducts.length,
      lowStockCount,
      depletedCount,
      riskCount: lowStockCount + depletedCount,
      topDepartment,
    };
  }, [filteredProducts]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedLocation('ALL');
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Package className="h-7 w-7 text-blue-600" />
            Mavora Internal Assets & Inventory
          </h1>
          <p className="text-sm text-gray-500">
            Track company equipment, office reserves, department allocation, and procurement cost values.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm"
        >
          <Plus className="h-4 w-4" /> Register New Asset
        </button>
      </div>

      {/* KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Gross Portfolio Value</p>
            <p className="text-xl font-bold text-gray-900 mt-1">
              Ksh {kpiData.totalValuation.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Coins className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Total Units & SKUs</p>
            <p className="text-xl font-bold text-gray-900 mt-1">
              {kpiData.totalUnits.toLocaleString()} <span className="text-xs font-normal text-gray-500">Units</span>
            </p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Boxes className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Supply Chain Risk Alert</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xl font-bold ${kpiData.riskCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {kpiData.riskCount} Items
              </span>
            </div>
          </div>
          <div className={`p-3 rounded-xl ${kpiData.riskCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
            <AlertOctagon className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Top Asset Allocation</p>
            <p className="text-lg font-bold text-gray-900 mt-1 truncate max-w-[140px]" title={kpiData.topDepartment}>
              {kpiData.topDepartment}
            </p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <PieChart className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by asset name, SKU, department, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
            <Building2 className="h-4 w-4 text-gray-400" /> Location:
          </div>
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {dynamicLocations.map((loc) => (
              <option key={loc} value={loc}>
                {loc === 'ALL' ? 'All Locations' : loc}
              </option>
            ))}
          </select>

          {(searchQuery || selectedLocation !== 'ALL') && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-amber-200 bg-amber-50 rounded-lg text-sm font-medium text-amber-700 hover:bg-amber-100 transition"
              title="Reset Search and Filters"
            >
              <FilterX className="h-4 w-4" /> Clear
            </button>
          )}

          <button
            onClick={fetchProducts}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            title="Refresh database"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Data Table & Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchProducts} className="underline text-xs font-semibold hover:text-red-900">
            Retry Connection
          </button>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4">Asset / SKU</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Cost Price (KES)</th>
                <th className="py-3 px-4">Stock Level</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {loading && products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                      <span>Loading enterprise inventory database...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <Package className="h-10 w-10 text-gray-300" />
                      <p className="text-base font-semibold text-gray-700">No matching internal items found</p>
                      <p className="text-xs text-gray-500">
                        {products.length > 0
                          ? 'No items matched your current search filters. Try clearing your filters or search terms.'
                          : 'No inventory records were found in the database. Get started by registering your first internal asset.'}
                      </p>
                      {products.length > 0 ? (
                        <button
                          onClick={clearFilters}
                          className="mt-2 inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          <FilterX className="h-3.5 w-3.5" /> Reset all filters
                        </button>
                      ) : (
                        <button
                          onClick={() => setIsModalOpen(true)}
                          className="mt-2 inline-flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700"
                        >
                          <Plus className="h-3.5 w-3.5" /> Register Asset
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const isLowStock = Number(product.stockQuantity) <= Number(product.reorderLevel);
                  return (
                    <tr key={product.id} className="hover:bg-gray-50/50 transition">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{product.name}</div>
                        <div className="text-xs font-mono text-gray-500">{product.sku}</div>
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700">
                          {product.department}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        <div className="text-xs font-medium text-gray-800">{product.location}</div>
                        <div className="text-xs text-gray-400">{product.category}</div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-900">
                        Ksh {Number(product.costPrice).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${isLowStock ? 'text-amber-600' : 'text-gray-900'}`}>
                            {product.stockQuantity}
                          </span>
                          {isLowStock && (
                            <span title="Stock level below reorder threshold">
                              <AlertTriangle className="h-4 w-4 text-amber-500" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {Number(product.stockQuantity) === 0 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                            Depleted
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                            Available
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => {
                            setSelectedAssetForReceive(product);
                            setReceiveQty('1');
                            setReceiveModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1.5 bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-blue-600 rounded-lg text-xs font-medium transition"
                          title="Receive incoming items"
                        >
                          <ArrowDownLeft className="h-3.5 w-3.5" /> Receive
                        </button>
                        <button
                          onClick={() => {
                            setSelectedAssetForEdit(product);
                            setEditFormData({
                              sku: product.sku,
                              name: product.name,
                              description: product.description || '',
                              category: product.category,
                              location: product.location,
                              department: product.department,
                              costPrice: String(product.costPrice),
                              stockQuantity: Number(product.stockQuantity),
                              reorderLevel: Number(product.reorderLevel),
                            });
                            setEditModalOpen(true);
                          }}
                          className="inline-flex items-center p-1.5 bg-gray-100 hover:bg-indigo-50 text-gray-700 hover:text-indigo-600 rounded-lg text-xs font-medium transition"
                          title="Edit Asset"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id, product.name)}
                          className="inline-flex items-center p-1.5 bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-600 rounded-lg text-xs font-medium transition"
                          title="Delete Asset"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receive Stock Modal */}
      {receiveModalOpen && selectedAssetForReceive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <ArrowDownLeft className="h-5 w-5 text-blue-600" /> Receive Stock Quantity
              </h3>
              <button
                onClick={() => setReceiveModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>
            <div className="text-sm text-gray-600">
              Adding received shipment quantity to <span className="font-semibold text-gray-900">{selectedAssetForReceive.name}</span> (<span className="font-mono">{selectedAssetForReceive.sku}</span>). Current stock: <span className="font-bold text-blue-600">{selectedAssetForReceive.stockQuantity}</span>
            </div>
            <form onSubmit={handleReceiveStockSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Quantity Received *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={receiveQty}
                  onChange={(e) => setReceiveQty(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setReceiveModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={receivingSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {receivingSubmitting ? 'Updating Stock...' : 'Confirm Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Asset Modal */}
      {editModalOpen && selectedAssetForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Pencil className="h-5 w-5 text-indigo-600" /> Edit Asset Record
              </h3>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            {editFormError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs">
                {editFormError}
              </div>
            )}

            <form onSubmit={handleEditProductSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Asset SKU / Code *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.sku}
                    onChange={(e) => setEditFormData({ ...editFormData, sku: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Category</label>
                  <input
                    type="text"
                    value={editFormData.category}
                    onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Asset Name *</label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Location</label>
                  <select
                    value={editFormData.location}
                    onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Nairobi HQ">Nairobi HQ</option>
                    <option value="Mombasa Branch">Mombasa Branch</option>
                    <option value="Kisumu Hub">Kisumu Hub</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Department</label>
                  <select
                    value={editFormData.department}
                    onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Information Technology">Information Technology</option>
                    <option value="Operations">Operations</option>
                    <option value="Finance">Finance</option>
                    <option value="Administration">Administration</option>
                    <option value="Sales & Marketing">Sales & Marketing</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Cost Price (Ksh) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editFormData.costPrice}
                    onChange={(e) => setEditFormData({ ...editFormData, costPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Stock Qty</label>
                  <input
                    type="number"
                    value={editFormData.stockQuantity}
                    onChange={(e) => setEditFormData({ ...editFormData, stockQuantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Reorder Level</label>
                  <input
                    type="number"
                    value={editFormData.reorderLevel}
                    onChange={(e) => setEditFormData({ ...editFormData, reorderLevel: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Description / Serial Number / Notes</label>
                <textarea
                  rows={2}
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {editSubmitting ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register Asset Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Layers className="h-5 w-5 text-blue-600" /> Register Internal Asset
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

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Asset SKU / Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AST-IT-001"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Hardware / Furniture"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Asset Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dell Latitude 5430 Laptop"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Location</label>
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
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Information Technology">Information Technology</option>
                    <option value="Operations">Operations</option>
                    <option value="Finance">Finance</option>
                    <option value="Administration">Administration</option>
                    <option value="Sales & Marketing">Sales & Marketing</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Cost Price (Ksh) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Initial Qty</label>
                  <input
                    type="number"
                    placeholder="1"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Reorder Level</label>
                  <input
                    type="number"
                    placeholder="5"
                    value={formData.reorderLevel}
                    onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Description / Serial Number / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Add asset notes or serial numbers..."
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
                  {submitting ? 'Registering...' : 'Save Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}