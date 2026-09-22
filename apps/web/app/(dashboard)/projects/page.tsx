'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  MoreVertical, 
  Briefcase, 
  Calendar, 
  DollarSign, 
  X, 
  Loader2, 
  AlertCircle,
  ArrowRight,
  TrendingUp,
  LayoutGrid,
  List,
  CheckCircle2,
  ChevronRight,
  UserCheck
} from 'lucide-react';

interface Project {
  id?: string;
  _id?: string;
  name: string;
  description?: string;
  customerId?: string;
  customerName?: string;
  status: string;
  priority: string;
  budget?: number;
  startDate?: string;
  dueDate?: string;
}

const PROJECT_STATUSES = [
  { key: 'Planning', label: 'Planning', color: 'bg-blue-50 text-blue-700 border-blue-200', activeBg: 'bg-blue-600' },
  { key: 'In Progress', label: 'In Progress', color: 'bg-purple-50 text-purple-700 border-purple-200', activeBg: 'bg-purple-600' },
  { key: 'On Hold', label: 'On Hold', color: 'bg-amber-50 text-amber-700 border-amber-200', activeBg: 'bg-amber-600' },
  { key: 'Completed', label: 'Completed', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', activeBg: 'bg-emerald-600' },
  { key: 'Cancelled', label: 'Cancelled', color: 'bg-rose-50 text-rose-700 border-rose-200', activeBg: 'bg-rose-600' },
];

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'pipeline'>('table');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Drawer State for Creation
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    customerId: '',
    status: 'Planning',
    priority: 'Medium',
    budget: '',
    dueDate: ''
  });

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('mavora_token') || ''}`
  });

  const fetchProjects = async () => {
    try {
      setError(null);
      const res = await fetch(`${API_BASE_URL}/projects`, {
        headers: getAuthHeaders()
      });
      
      if (!res.ok) throw new Error('Failed to fetch projects');
      
      const data = await res.json();
      if (data.success) {
        setProjects(data.data);
      } else {
        throw new Error(data.message || 'Invalid data structure received');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Project fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      const res = await fetch(`${API_BASE_URL}/projects`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create project');
      
      if (data.success) {
        setProjects([data.data, ...projects]);
        setIsDrawerOpen(false);
        setFormData({
          name: '',
          description: '',
          customerId: '',
          status: 'Planning',
          priority: 'Medium',
          budget: '',
          dueDate: ''
        });
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Project creation error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (projectId: string, newStatus: string) => {
    setUpdatingId(projectId);
    setOpenMenuId(null);
    try {
      const res = await fetch(`${API_BASE_URL}/projects/${projectId}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update project status');

      if (data.success) {
        setProjects(prev => prev.map(p => {
          const id = p.id || p._id;
          if (id === projectId) {
            return { ...p, status: newStatus };
          }
          return p;
        }));
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Status update error:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const getProjectId = (project: Project) => project.id || project._id || 'N/A';

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = selectedStatusFilter === 'ALL' || p.status.toLowerCase() === selectedStatusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const getNextStatus = (currentStatus: string) => {
    const currentIndex = PROJECT_STATUSES.findIndex(s => s.key.toLowerCase() === currentStatus.toLowerCase());
    if (currentIndex >= 0 && currentIndex < PROJECT_STATUSES.length - 1) {
      return PROJECT_STATUSES[currentIndex + 1].key;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-mavora-navy tracking-tight flex items-center gap-2">
            <span>Project Management</span>
            <span className="text-xs bg-blue-100 text-mavora-blue font-semibold px-2.5 py-0.5 rounded-full border border-blue-200">
              Execution Module
            </span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">Track client deliverables, task pipelines, and milestones.</p>
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
            <span>New Project</span>
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

      {/* Status Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-gray-200/80 shadow-sm flex items-center gap-2 overflow-x-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-400 px-3 shrink-0 flex items-center gap-1">
          <TrendingUp className="w-3.5 h-3.5" /> Status:
        </span>
        <button
          onClick={() => setSelectedStatusFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
            selectedStatusFilter === 'ALL'
              ? 'bg-mavora-navy text-white shadow-sm'
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
          }`}
        >
          All Projects ({projects.length})
        </button>
        {PROJECT_STATUSES.map((s) => {
          const count = projects.filter(p => p.status.toLowerCase() === s.key.toLowerCase()).length;
          return (
            <button
              key={s.key}
              onClick={() => setSelectedStatusFilter(s.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 flex items-center gap-1.5 border ${
                selectedStatusFilter === s.key
                  ? `${s.activeBg} text-white border-transparent shadow-sm`
                  : `${s.color} hover:opacity-80`
              }`}
            >
              <span>{s.key}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                selectedStatusFilter === s.key ? 'bg-white/20 text-white' : 'bg-white/60 text-gray-700'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Bar Controls */}
      <div className="bg-white p-4 rounded-t-xl border-x border-t border-gray-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 flex items-center bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 focus-within:border-mavora-blue focus-within:bg-white transition max-w-md">
          <Search className="w-4 h-4 text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search projects by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-sm placeholder-gray-400 text-mavora-charcoal"
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-mavora-navy px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Table View */}
      {viewMode === 'table' ? (
        <div className="bg-white border border-gray-200/80 rounded-b-xl shadow-sm overflow-hidden -mt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-bold">
                  <th className="px-6 py-4">Project Name</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Budget</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      <p className="text-sm">Loading project records...</p>
                    </td>
                  </tr>
                ) : filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">
                      No projects found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map((project) => {
                    const projId = getProjectId(project);
                    const nextStatus = getNextStatus(project.status);
                    const statusConfig = PROJECT_STATUSES.find(s => s.key.toLowerCase() === project.status.toLowerCase()) || PROJECT_STATUSES[0];

                    return (
                      <tr key={projId} className="hover:bg-gray-50/50 transition group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 font-bold">
                              <Briefcase className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-mavora-navy">{project.name}</p>
                              <p className="text-xs text-gray-400 truncate max-w-xs">{project.description || 'No description provided'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                            project.priority === 'Urgent' ? 'bg-rose-100 text-rose-700' :
                            project.priority === 'High' ? 'bg-amber-100 text-amber-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {project.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-mavora-charcoal">
                            {project.budget ? `$${Number(project.budget).toLocaleString()}` : 'N/A'}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusConfig.color}`}>
                              {project.status}
                            </span>
                            {updatingId === projId && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : 'No deadline'}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="relative inline-block text-left">
                            <div className="flex items-center justify-end gap-2">
                              {nextStatus && (
                                <button
                                  onClick={() => handleUpdateStatus(projId, nextStatus)}
                                  disabled={updatingId === projId}
                                  className="text-xs font-semibold text-mavora-blue hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 border border-blue-200 disabled:opacity-50"
                                >
                                  <span>Move to {nextStatus}</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              )}
                              <button 
                                onClick={() => setOpenMenuId(openMenuId === projId ? null : projId)}
                                className="text-gray-400 hover:text-mavora-blue p-2 rounded-lg hover:bg-gray-100 transition"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </div>

                            {openMenuId === projId && (
                              <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-xl shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20 border border-gray-100 py-1">
                                <div className="px-3 py-1.5 border-b border-gray-100">
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Set Status</p>
                                </div>
                                {PROJECT_STATUSES.map((s) => (
                                  <button
                                    key={s.key}
                                    onClick={() => handleUpdateStatus(projId, s.key)}
                                    className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between hover:bg-gray-50 transition ${
                                      project.status.toLowerCase() === s.key.toLowerCase() ? 'font-bold text-mavora-blue' : 'text-gray-700'
                                    }`}
                                  >
                                    <span>{s.label}</span>
                                    {project.status.toLowerCase() === s.key.toLowerCase() && <CheckCircle2 className="w-3.5 h-3.5 text-mavora-blue" />}
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
      ) : (
        /* Pipeline / Kanban View */
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {PROJECT_STATUSES.map((status) => {
            const statusProjects = filteredProjects.filter(p => p.status.toLowerCase() === status.key.toLowerCase());

            return (
              <div key={status.key} className="bg-gray-50/80 p-3 rounded-xl border border-gray-200/80 flex flex-col min-h-[500px]">
                <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${status.activeBg}`} />
                    <h3 className="text-xs font-bold text-mavora-navy uppercase tracking-wider">{status.key}</h3>
                  </div>
                  <span className="text-xs font-bold text-gray-500 bg-white px-2 py-0.5 rounded-md border border-gray-200">
                    {statusProjects.length}
                  </span>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto">
                  {statusProjects.length === 0 ? (
                    <div className="p-4 text-center border border-dashed border-gray-200 rounded-lg text-gray-400 text-xs">
                      No projects in {status.key}
                    </div>
                  ) : (
                    statusProjects.map((project) => {
                      const projId = getProjectId(project);
                      const nextStatus = getNextStatus(status.key);

                      return (
                        <div key={projId} className="bg-white p-3.5 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition">
                          <div className="flex items-start justify-between">
                            <h4 className="text-sm font-bold text-mavora-navy">{project.name}</h4>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              project.priority === 'Urgent' ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {project.priority}
                            </span>
                          </div>

                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{project.description || 'No description'}</p>

                          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                            <span>{project.budget ? `$${Number(project.budget).toLocaleString()}` : 'No Budget'}</span>
                            {nextStatus && (
                              <button
                                onClick={() => handleUpdateStatus(projId, nextStatus)}
                                disabled={updatingId === projId}
                                className="p-1 hover:bg-blue-50 text-mavora-blue rounded transition flex items-center gap-1 text-[11px] font-semibold"
                              >
                                <span>{nextStatus}</span>
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
        <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm transition-opacity" onClick={() => setIsDrawerOpen(false)} />
      )}

      {/* Slide-out Drawer Panel */}
      <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
        isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-mavora-navy">Create New Project</h2>
            <p className="text-xs text-gray-500">Initialize a client assignment or internal initiative.</p>
          </div>
          <button onClick={() => setIsDrawerOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCreateProject} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Project Name</label>
            <input
              type="text" required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mavora-blue"
              placeholder="e.g. Enterprise Cloud Migration"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mavora-blue"
              placeholder="Project objectives and deliverable scope..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mavora-blue"
              >
                {PROJECT_STATUSES.map(s => <option key={s.key} value={s.key}>{s.key}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mavora-blue"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Budget ($)</label>
            <input
              type="number" step="0.01"
              value={formData.budget}
              onChange={(e) => setFormData({...formData, budget: e.target.value})}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mavora-blue"
              placeholder="15000.00"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Due Date</label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mavora-blue"
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
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}