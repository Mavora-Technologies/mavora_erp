'use client';

import { useState, useEffect } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export default function HrmDashboardPage() {
  const [activeTab, setActiveTab] = useState<'employees' | 'departments' | 'leaves'>('employees');
  
  // Data States
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal / Form States
  const [showEmpModal, setShowEmpModal] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  // Form Inputs
  const [empForm, setEmpForm] = useState({ 
    userId: '', 
    departmentId: '', 
    employeeNumber: '', 
    jobTitle: '', 
    employmentType: 'Full-Time', 
    hireDate: '', 
    salary: '' 
  });
  const [deptForm, setDeptForm] = useState({ name: '', description: '' });
  const [leaveForm, setLeaveForm] = useState({ employeeId: '', leaveType: 'Annual', startDate: '', endDate: '', reason: '' });

  // Fetch Data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [empRes, deptRes, leaveRes, userRes] = await Promise.all([
        fetch(`${API_BASE_URL}/hrm/employees`),
        fetch(`${API_BASE_URL}/hrm/departments`),
        fetch(`${API_BASE_URL}/hrm/leave-requests`),
        fetch(`${API_BASE_URL}/users`).catch(() => null),
      ]);

      const empData = await empRes.json();
      const deptData = await deptRes.json();
      const leaveData = await leaveRes.json();
      
      if (empData.success) setEmployees(empData.data);
      if (deptData.success) setDepartments(deptData.data);
      if (leaveData.success) setLeaveRequests(leaveData.data);

      if (userRes && userRes.ok) {
        const userData = await userRes.json();
        if (userData.success || Array.isArray(userData.data)) {
          setUsers(userData.data || userData);
        }
      }
    } catch (err: any) {
      setError('Failed to load HRM data. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handlers for creation
  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...empForm,
        salary: empForm.salary ? parseFloat(empForm.salary) : null,
      };

      const res = await fetch(`${API_BASE_URL}/hrm/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setShowEmpModal(false);
        setEmpForm({ userId: '', departmentId: '', employeeNumber: '', jobTitle: '', employmentType: 'Full-Time', hireDate: '', salary: '' });
        fetchData();
      } else {
        alert(data.message || data.error || 'Failed to create employee');
      }
    } catch (err) {
      alert('Error creating employee. Check console for details.');
      console.error(err);
    }
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/hrm/departments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deptForm),
      });
      const data = await res.json();
      if (data.success) {
        setShowDeptModal(false);
        setDeptForm({ name: '', description: '' });
        fetchData();
      } else {
        alert(data.message || 'Error creating department');
      }
    } catch (err) {
      alert('Error creating department');
    }
  };

  const handleCreateLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/hrm/leave-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leaveForm),
      });
      const data = await res.json();
      if (data.success) {
        setShowLeaveModal(false);
        setLeaveForm({ employeeId: '', leaveType: 'Annual', startDate: '', endDate: '', reason: '' });
        fetchData();
      } else {
        alert(data.message || 'Error submitting leave request');
      }
    } catch (err) {
      alert('Error submitting leave request');
    }
  };

  const handleUpdateLeaveStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/hrm/leave-requests/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, approvedBy: 'system-admin' }),
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (err) {
      alert('Failed to update leave status');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Human Resources (HRM)</h1>
          <p className="text-sm text-gray-500">Manage company staff, corporate departments, and time-off tracking.</p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'employees' && (
            <button onClick={() => setShowEmpModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm transition">
              + Add Employee
            </button>
          )}
          {activeTab === 'departments' && (
            <button onClick={() => setShowDeptModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm transition">
              + Add Department
            </button>
          )}
          {activeTab === 'leaves' && (
            <button onClick={() => setShowLeaveModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm transition">
              + Request Leave
            </button>
          )}
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('employees')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'employees' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Employees ({employees.length})
          </button>
          <button
            onClick={() => setActiveTab('departments')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'departments' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Departments ({departments.length})
          </button>
          <button
            onClick={() => setActiveTab('leaves')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'leaves' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Leave Requests ({leaveRequests.length})
          </button>
        </nav>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      {loading ? (
        <div className="py-20 text-center text-gray-500 text-sm">Loading HRM records...</div>
      ) : (
        <div>
          {/* EMPLOYEES TAB */}
          {activeTab === 'employees' && (
            <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase font-semibold text-xs">
                  <tr>
                    <th className="px-6 py-3">Employee Name</th>
                    <th className="px-6 py-3">ID / Number</th>
                    <th className="px-6 py-3">Job Title</th>
                    <th className="px-6 py-3">Department</th>
                    <th className="px-6 py-3">Employment Type</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-gray-700">
                  {employees.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">No employees recorded yet.</td></tr>
                  ) : (
                    employees.map((emp) => (
                      <tr key={emp.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 font-medium text-gray-900">{emp.firstName} {emp.lastName} <div className="text-xs text-gray-400 font-normal">{emp.email}</div></td>
                        <td className="px-6 py-4 text-gray-500">{emp.employeeNumber}</td>
                        <td className="px-6 py-4">{emp.jobTitle}</td>
                        <td className="px-6 py-4">{emp.departmentName || 'Unassigned'}</td>
                        <td className="px-6 py-4">{emp.employmentType}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${emp.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {emp.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* DEPARTMENTS TAB */}
          {activeTab === 'departments' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {departments.length === 0 ? (
                <div className="col-span-3 text-center py-12 text-gray-400 bg-white border rounded-xl">No departments configured.</div>
              ) : (
                departments.map((dept) => (
                  <div key={dept.id} className="bg-white p-5 border border-gray-200 rounded-xl shadow-sm space-y-2">
                    <h3 className="font-semibold text-gray-900 text-base">{dept.name}</h3>
                    <p className="text-sm text-gray-500">{dept.description || 'No description provided.'}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* LEAVE REQUESTS TAB */}
          {activeTab === 'leaves' && (
            <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase font-semibold text-xs">
                  <tr>
                    <th className="px-6 py-3">Leave Type</th>
                    <th className="px-6 py-3">Start Date</th>
                    <th className="px-6 py-3">End Date</th>
                    <th className="px-6 py-3">Reason</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-gray-700">
                  {leaveRequests.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">No leave requests found.</td></tr>
                  ) : (
                    leaveRequests.map((leave) => (
                      <tr key={leave.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 font-medium text-gray-900">{leave.leaveType}</td>
                        <td className="px-6 py-4">{new Date(leave.startDate).toLocaleDateString()}</td>
                        <td className="px-6 py-4">{new Date(leave.endDate).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-gray-500 max-w-xs truncate">{leave.reason || 'N/A'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            leave.status === 'Approved' ? 'bg-green-100 text-green-700' :
                            leave.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {leave.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          {leave.status === 'Pending' && (
                            <>
                              <button onClick={() => handleUpdateLeaveStatus(leave.id, 'Approved')} className="text-xs bg-green-600 text-white px-2.5 py-1 rounded shadow-sm hover:bg-green-700">Approve</button>
                              <button onClick={() => handleUpdateLeaveStatus(leave.id, 'Rejected')} className="text-xs bg-red-600 text-white px-2.5 py-1 rounded shadow-sm hover:bg-red-700">Reject</button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODALS */}
      {/* Add Employee Modal */}
      {showEmpModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900">Add New Employee</h2>
            <form onSubmit={handleCreateEmployee} className="space-y-3">
              
              {/* User UUID Dropdown (or text fallback if list is empty) */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">User Account</label>
                {users.length > 0 ? (
                  <select 
                    required 
                    value={empForm.userId} 
                    onChange={(e) => setEmpForm({...empForm, userId: e.target.value})} 
                    className="w-full border rounded-lg p-2 text-sm bg-white"
                  >
                    <option value="">Select a user account...</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.firstName && u.lastName ? `${u.firstName} ${u.lastName} (${u.email})` : u.email || u.id}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input 
                    type="text" 
                    required 
                    value={empForm.userId} 
                    onChange={(e) => setEmpForm({...empForm, userId: e.target.value})} 
                    className="w-full border rounded-lg p-2 text-sm" 
                    placeholder="e.g., c0000000-0000-0000-0000-000000000001" 
                  />
                )}
              </div>
              
              {/* Department Dropdown */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
                <select 
                  required 
                  value={empForm.departmentId} 
                  onChange={(e) => setEmpForm({...empForm, departmentId: e.target.value})} 
                  className="w-full border rounded-lg p-2 text-sm bg-white"
                >
                  <option value="">Select a department...</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Employee Number</label>
                <input type="text" required value={empForm.employeeNumber} onChange={(e) => setEmpForm({...empForm, employeeNumber: e.target.value})} className="w-full border rounded-lg p-2 text-sm" placeholder="EMP-001" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Job Title</label>
                <input type="text" required value={empForm.jobTitle} onChange={(e) => setEmpForm({...empForm, jobTitle: e.target.value})} className="w-full border rounded-lg p-2 text-sm" placeholder="Software Developer" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Hire Date</label>
                  <input type="date" required value={empForm.hireDate} onChange={(e) => setEmpForm({...empForm, hireDate: e.target.value})} className="w-full border rounded-lg p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Salary</label>
                  <input type="number" step="0.01" required value={empForm.salary} onChange={(e) => setEmpForm({...empForm, salary: e.target.value})} className="w-full border rounded-lg p-2 text-sm" placeholder="145000" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowEmpModal(false)} className="px-4 py-2 border rounded-lg text-sm text-gray-600">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">Save Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Department Modal */}
      {showDeptModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900">Add Department</h2>
            <form onSubmit={handleCreateDepartment} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Department Name</label>
                <input type="text" required value={deptForm.name} onChange={(e) => setDeptForm({...deptForm, name: e.target.value})} className="w-full border rounded-lg p-2 text-sm" placeholder="Engineering" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <textarea value={deptForm.description} onChange={(e) => setDeptForm({...deptForm, description: e.target.value})} className="w-full border rounded-lg p-2 text-sm" placeholder="Software design and development division..." />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowDeptModal(false)} className="px-4 py-2 border rounded-lg text-sm text-gray-600">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">Save Department</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Leave Request Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900">Submit Leave Request</h2>
            <form onSubmit={handleCreateLeave} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Employee</label>
                <select 
                  required 
                  value={leaveForm.employeeId} 
                  onChange={(e) => setLeaveForm({...leaveForm, employeeId: e.target.value})} 
                  className="w-full border rounded-lg p-2 text-sm bg-white"
                >
                  <option value="">Select an employee...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Leave Type</label>
                <select value={leaveForm.leaveType} onChange={(e) => setLeaveForm({...leaveForm, leaveType: e.target.value})} className="w-full border rounded-lg p-2 text-sm">
                  <option value="Annual">Annual</option>
                  <option value="Sick">Sick</option>
                  <option value="Maternity">Maternity</option>
                  <option value="Unpaid">Unpaid</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                  <input type="date" required value={leaveForm.startDate} onChange={(e) => setLeaveForm({...leaveForm, startDate: e.target.value})} className="w-full border rounded-lg p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                  <input type="date" required value={leaveForm.endDate} onChange={(e) => setLeaveForm({...leaveForm, endDate: e.target.value})} className="w-full border rounded-lg p-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Reason</label>
                <textarea value={leaveForm.reason} onChange={(e) => setLeaveForm({...leaveForm, reason: e.target.value})} className="w-full border rounded-lg p-2 text-sm" placeholder="Family vacation / medical checkup..." />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowLeaveModal(false)} className="px-4 py-2 border rounded-lg text-sm text-gray-600">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}