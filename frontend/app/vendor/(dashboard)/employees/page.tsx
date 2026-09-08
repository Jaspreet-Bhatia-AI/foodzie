'use client';

import { useEffect, useState } from 'react';
import { useCurrency } from '@/context/CurrencyContext';
import { 
  Users, 
  Plus, 
  Key, 
  CreditCard, 
  Coffee, 
  Briefcase, 
  Calendar, 
  UserCheck, 
  UserX, 
  Loader2, 
  X, 
  DollarSign, 
  AlertTriangle,
  Mail,
  Phone,
  Check,
  Trash2
} from 'lucide-react';
import { api, getToken, decodeToken } from '@/lib/api';

interface EmployeePerformance {
  completedDeliveries: number;
  activeDeliveries: number;
}

interface EmployeeRecord {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  workStatus: 'Active' | 'Break' | 'Leave' | 'Resigned';
  leaveReason: string | null;
  resignRequest: boolean;
  upi: string | null;
  createdAt: string;
  performance: EmployeePerformance;
}

export default function VendorEmployeesPage() {
  const { formatCurrency, getCurrencySymbol } = useCurrency();
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal controls
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<EmployeeRecord | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [payAmount, setPayAmount] = useState('');

  // Job Openings & Applications states
  const [activeTab, setActiveTab] = useState<'employees' | 'vacancies' | 'applications' | 'deposits'>('employees');
  const [vacancies, setVacancies] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [cashDeposits, setCashDeposits] = useState<any[]>([]);
  const [showVacancyModal, setShowVacancyModal] = useState(false);
  const [vacTitle, setVacTitle] = useState('');
  const [vacDescription, setVacDescription] = useState('');
  const [vacSalary, setVacSalary] = useState('');
  const [jobsLoading, setJobsLoading] = useState(false);

  useEffect(() => {
    fetchEmployees();
    fetchJobsAndApps();
    fetchCashDeposits();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await api.get<EmployeeRecord[]>('/api/vendor/employees');
      setEmployees(data || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch employee lists.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCashDeposits = async () => {
    try {
      const data = await api.get<any[]>('/api/vendor/cash-deposits');
      setCashDeposits(data || []);
    } catch (err) {
      console.error("Failed to load cash deposits", err);
    }
  };

  const handleVerifyDeposit = async (id: string) => {
    if (!confirm("Are you sure you want to verify this rider cash deposit? This will credit the rider and reduce their COD cash balance.")) return;
    try {
      await api.patch(`/api/vendor/cash-deposits/${id}/verify`, {});
      fetchCashDeposits();
      fetchEmployees();
      alert("Cash deposit verified successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to verify deposit");
    }
  };

  const fetchJobsAndApps = async () => {
    const token = getToken();
    if (!token) return;
    const payload = decodeToken<any>(token);
    const vendorId = payload?.sub;
    if (!vendorId) return;

    try {
      const [vacsData, appsData] = await Promise.all([
        api.get<any[]>(`/api/jobs/vacancies?vendorId=${vendorId}`),
        api.get<any[]>('/api/jobs/applications')
      ]);
      setVacancies(vacsData || []);
      setApplications(appsData || []);
    } catch (err) {
      console.error("Failed to load jobs/applications", err);
    }
  };

  const handleCreateVacancy = async (e: React.FormEvent) => {
    e.preventDefault();
    setJobsLoading(true);
    try {
      await api.post('/api/jobs/vacancies', {
        title: vacTitle.trim(),
        description: vacDescription.trim(),
        salary: vacSalary.trim()
      });
      setShowVacancyModal(false);
      setVacTitle('');
      setVacDescription('');
      setVacSalary('');
      fetchJobsAndApps();
    } catch (err: any) {
      alert(err.message || "Failed to post vacancy");
    } finally {
      setJobsLoading(false);
    }
  };

  const handleDeleteVacancy = async (id: string) => {
    if (!confirm("Are you sure you want to remove this job vacancy?")) return;
    try {
      await api.delete(`/api/jobs/vacancies/${id}`);
      fetchJobsAndApps();
    } catch (err: any) {
      alert(err.message || "Failed to remove vacancy");
    }
  };

  const handleApplicationAction = async (id: string, status: 'Accepted' | 'Rejected') => {
    if (!confirm(`Are you sure you want to set this application status to ${status}?`)) return;
    try {
      await api.patch(`/api/jobs/applications/${id}`, { status });
      fetchJobsAndApps();
      fetchEmployees();
    } catch (err: any) {
      alert(err.message || "Failed to update application status");
    }
  };

  const handleDismissEmployee = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to dismiss ${name}? This will permanently delete their delivery rider account and cancel any pending assignments.`)) return;
    try {
      await api.delete(`/api/jobs/employee/${id}`);
      fetchEmployees();
    } catch (err: any) {
      alert(err.message || "Failed to dismiss employee");
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    try {
      await api.post('/api/vendor/employees', {
        name: formName.trim(),
        email: formEmail.trim(),
        phone: formPhone.trim() || null,
        password: formPassword
      });
      setShowCreateModal(false);
      setFormName('');
      setFormEmail('');
      setFormPhone('');
      setFormPassword('');
      fetchEmployees();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create employee account.');
    } finally {
      setFormLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp || !newPassword) return;
    setFormLoading(true);
    try {
      await api.patch(`/api/vendor/employees/${selectedEmp.id}/password`, {
        password: newPassword
      });
      setShowPasswordModal(false);
      setNewPassword('');
      alert("Password updated successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to update password.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateStatus = async (empId: string, status: string) => {
    try {
      await api.patch(`/api/vendor/employees/${empId}/status`, { workStatus: status });
      fetchEmployees();
    } catch (err: any) {
      alert(err.message || "Failed to update employee status.");
    }
  };

  const handleDeclineResign = async (empId: string) => {
    try {
      await api.patch(`/api/vendor/employees/${empId}/status`, { clearResign: true });
      fetchEmployees();
    } catch (err: any) {
      alert(err.message || "Failed to decline resignation.");
    }
  };

  const handlePayoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp || !selectedEmp.upi || !payAmount) return;
    
    // Generate standard GPay deep link for UPI transfer
    const upiLink = `upi://pay?pa=${selectedEmp.upi}&pn=${encodeURIComponent(selectedEmp.name)}&am=${payAmount}&cu=INR`;
    
    // Redirect to UPI deep link
    window.location.href = upiLink;
    
    setShowPayModal(false);
    setPayAmount('');
  };

  const pendingAppsCount = applications.filter(a => a.status === 'Pending').length;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full space-y-8 text-gray-300">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-2">
            <Users className="w-8 h-8 text-orange-500" /> Employee Manager
          </h1>
          <p className="text-sm text-gray-500 mt-1">Hire delivery staff, manage leaves, audit workloads, and pay wages.</p>
        </div>

        {activeTab === 'employees' ? (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-5 py-3 rounded-2xl flex items-center gap-1.5 shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Delivery Person
          </button>
        ) : activeTab === 'vacancies' ? (
          <button
            onClick={() => setShowVacancyModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-3 rounded-2xl flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" /> Post Job Vacancy
          </button>
        ) : null}
      </div>

      {/* TABS */}
      <div className="flex border-b border-gray-805 gap-6">
        <button
          onClick={() => setActiveTab('employees')}
          className={`pb-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'employees' ? 'border-orange-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-350'
          }`}
        >
          Active Staff ({employees.length})
        </button>
        <button
          onClick={() => setActiveTab('vacancies')}
          className={`pb-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'vacancies' ? 'border-orange-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-350'
          }`}
        >
          Job Openings ({vacancies.length})
        </button>
        <button
          onClick={() => setActiveTab('applications')}
          className={`pb-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-all relative ${
            activeTab === 'applications' ? 'border-orange-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-350'
          }`}
        >
          Applications
          {pendingAppsCount > 0 && (
            <span className="ml-1.5 bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
              {pendingAppsCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('deposits')}
          className={`pb-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-all relative ${
            activeTab === 'deposits' ? 'border-orange-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-350'
          }`}
        >
          Rider COD Audits
          {cashDeposits.filter(d => d.status === 'Pending').length > 0 && (
            <span className="ml-1.5 bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
              {cashDeposits.filter(d => d.status === 'Pending').length}
            </span>
          )}
        </button>
      </div>

      {/* ERROR MESSAGE BAR */}
      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-xs text-red-400 font-bold">
          {errorMsg}
        </div>
      )}

      {/* ACTIVE EMPLOYEES TAB CONTENT */}
      {activeTab === 'employees' && (
        <>
          {loading ? (
            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-12 flex flex-col items-center justify-center text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-2" />
              <p className="text-xs font-bold uppercase tracking-wider">Syncing employee records...</p>
            </div>
          ) : employees.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-12 text-center text-gray-500 space-y-2">
              <Briefcase className="w-12 h-12 text-gray-700 mx-auto" />
              <h3 className="font-bold text-white text-sm">No Delivery Staff Yet</h3>
              <p className="text-xs max-w-sm mx-auto">Create employee accounts or accept application entries to start dispatching orders.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              
              <div className="overflow-x-auto border border-gray-850 rounded-2xl bg-gray-900 shadow-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-850 text-[10px] text-gray-550 uppercase tracking-widest font-black bg-gray-955">
                      <th className="p-4">Staff Member</th>
                      <th className="p-4">Contact</th>
                      <th className="p-4">Salary UPI</th>
                      <th className="p-4">Delivery Performance</th>
                      <th className="p-4">Work Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-850 text-xs font-semibold">
                    {employees.map(emp => (
                      <tr key={emp.id} className="hover:bg-gray-955/50 transition-colors">
                        
                        <td className="p-4">
                          <p className="font-bold text-white text-sm">{emp.name}</p>
                          <span className="text-[9px] font-mono text-gray-500">#{emp.id.slice(-8).toUpperCase()}</span>
                        </td>

                        <td className="p-4">
                          <div className="flex flex-col space-y-0.5">
                            <span className="text-gray-400 flex items-center gap-1"><Mail className="w-3 h-3 text-gray-600" /> {emp.email}</span>
                            {emp.phone && <span className="text-gray-550 flex items-center gap-1"><Phone className="w-3 h-3 text-gray-600" /> {emp.phone}</span>}
                          </div>
                        </td>

                        <td className="p-4">
                          {emp.upi ? (
                            <span className="font-mono bg-gray-955 border border-gray-855 px-2.5 py-1 rounded-lg text-gray-300 select-all">{emp.upi}</span>
                          ) : (
                            <span className="text-orange-400 font-bold text-[10px] uppercase bg-orange-500/10 px-2 py-0.5 rounded-full">Not Set Up</span>
                          )}
                        </td>

                        <td className="p-4">
                          <div className="flex gap-4">
                            <div className="text-left">
                              <p className="text-white text-sm font-black">{emp.performance.completedDeliveries}</p>
                              <span className="text-[9px] text-gray-550 uppercase">Delivered</span>
                            </div>
                            <div className="text-left">
                              <p className="text-blue-400 text-sm font-black">{emp.performance.activeDeliveries}</p>
                              <span className="text-[9px] text-gray-555 uppercase">Active</span>
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className={`w-2.5 h-2.5 rounded-full ${
                                emp.workStatus === 'Active' ? 'bg-green-500' :
                                emp.workStatus === 'Break' ? 'bg-amber-400' :
                                emp.workStatus === 'Leave' ? 'bg-blue-500' :
                                'bg-red-500'
                              }`} />
                              <span className="text-xs uppercase font-bold text-white">{emp.workStatus}</span>
                            </div>
                            
                            {emp.resignRequest && (
                              <div className="text-[8px] bg-red-500/10 border border-red-500/20 text-red-400 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit animate-pulse">
                                <AlertTriangle className="w-2.5 h-2.5 shrink-0" /> Resign Requested
                              </div>
                            )}
                            
                            {emp.workStatus === 'Leave' && emp.leaveReason && (
                              <p className="text-[9px] text-blue-400 font-normal bg-blue-500/5 p-1 rounded max-w-[150px] truncate" title={emp.leaveReason}>
                                Reason: {emp.leaveReason}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex justify-end items-center gap-2.5 flex-wrap">
                            
                            {emp.resignRequest && (
                              <div className="flex gap-1.5 border border-red-500/20 bg-red-500/5 p-1 rounded-xl">
                                <button
                                  onClick={() => handleUpdateStatus(emp.id, 'Resigned')}
                                  className="bg-red-600 hover:bg-red-700 text-white font-bold px-2.5 py-1 rounded-lg text-[10px] uppercase flex items-center gap-0.5"
                                  title="Approve Resignation"
                                >
                                  <UserX className="w-3 h-3" /> Approve
                                </button>
                                <button
                                  onClick={() => handleDeclineResign(emp.id)}
                                  className="bg-gray-800 hover:bg-gray-750 text-gray-400 hover:text-white font-bold px-2 py-1 rounded-lg text-[10px] uppercase"
                                  title="Decline Resignation"
                                >
                                  Decline
                                </button>
                              </div>
                            )}

                            {emp.workStatus === 'Leave' && (
                              <button
                                onClick={() => handleUpdateStatus(emp.id, 'Active')}
                                className="bg-green-600/10 hover:bg-green-600 text-green-400 hover:text-white font-bold px-3 py-1.5 rounded-xl border border-green-500/20 text-[10px] uppercase flex items-center gap-1 transition-all"
                              >
                                <UserCheck className="w-3 h-3" /> Dismiss Leave
                              </button>
                            )}

                            <button
                              onClick={() => { setSelectedEmp(emp); setShowPayModal(true); }}
                              disabled={!emp.upi || emp.workStatus === 'Resigned'}
                              className="bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-bold px-3.5 py-1.5 rounded-xl text-[10px] uppercase flex items-center gap-1 shadow-md hover:scale-103 transition-all"
                              title={emp.upi ? "Pay Salary directly to GPay" : "Configure UPI address first"}
                            >
                              <DollarSign className="w-3 h-3" /> Pay Salary
                            </button>

                            <button
                              onClick={() => { setSelectedEmp(emp); setShowPasswordModal(true); }}
                              className="p-1.5 text-gray-400 hover:text-white bg-gray-855 hover:bg-gray-800 border border-gray-800 rounded-xl transition-all"
                              title="Reset Password"
                            >
                              <Key className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDismissEmployee(emp.id, emp.name)}
                              className="p-1.5 text-gray-450 hover:text-red-500 bg-gray-855 hover:bg-gray-800 border border-gray-800 rounded-xl transition-all"
                              title="Dismiss Employee"
                            >
                              <UserX className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* JOB OPENINGS TAB CONTENT */}
      {activeTab === 'vacancies' && (
        <div className="space-y-6">
          {vacancies.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-12 text-center text-gray-500 space-y-2">
              <Briefcase className="w-12 h-12 text-gray-700 mx-auto" />
              <h3 className="font-bold text-white text-sm">No Active Openings</h3>
              <p className="text-xs max-w-sm mx-auto">Create a job vacancy posting to invite students from your university campus to apply.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vacancies.map(vac => (
                <div key={vac.id} className="bg-gray-900 border border-gray-800 p-6 rounded-3xl relative flex flex-col justify-between shadow-lg">
                  <button
                    onClick={() => handleDeleteVacancy(vac.id)}
                    className="absolute top-4 right-4 text-gray-500 hover:text-red-500 p-1.5 rounded-lg hover:bg-gray-850 transition-all"
                    title="Delete Job Opening"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="space-y-3">
                    <div>
                      <span className="text-[9px] uppercase tracking-widest text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/10 px-2 py-0.5 rounded-full">
                        Salary: {vac.salary}
                      </span>
                      <h3 className="text-lg font-black text-white mt-1.5">{vac.title}</h3>
                    </div>
                    <p className="text-xs text-gray-400 font-normal leading-relaxed">{vac.description || 'No description provided.'}</p>
                  </div>
                  <div className="border-t border-gray-850 mt-6 pt-4 flex justify-between items-center text-[10px] text-gray-550 font-bold">
                    <span>Posted {new Date(vac.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* JOB APPLICATIONS TAB CONTENT */}
      {activeTab === 'applications' && (
        <div className="space-y-6">
          <p className="text-xs text-orange-400/80 bg-orange-500/5 border border-orange-500/10 px-4 py-3 rounded-2xl">
            💡 <strong>Hiring Workflow</strong>: Accepting an application automatically provisions their Delivery Rider login credentials and notifies them via email.
          </p>

          {applications.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-12 text-center text-gray-500 space-y-2">
              <Briefcase className="w-12 h-12 text-gray-700 mx-auto" />
              <h3 className="font-bold text-white text-sm">No Applications Yet</h3>
              <p className="text-xs max-w-sm mx-auto">Applications submitted by university students will appear here in real-time.</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-850 rounded-2xl bg-gray-900 shadow-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-850 text-[10px] text-gray-550 uppercase tracking-widest font-black bg-gray-955">
                    <th className="p-4">Applicant</th>
                    <th className="p-4">Job Applied</th>
                    <th className="p-4">City / Campus</th>
                    <th className="p-4">Beneficiary UPI ID</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-850 text-xs font-semibold">
                  {applications.map(app => (
                    <tr key={app.id} className="hover:bg-gray-955/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {app.picUrl ? (
                            <img src={app.picUrl} alt={app.name} className="w-8 h-8 rounded-full object-cover border border-gray-800" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center font-bold text-white uppercase">{app.name.charAt(0)}</div>
                          )}
                          <div>
                            <p className="font-bold text-white text-sm">{app.name}</p>
                            <span className="text-[10px] text-gray-550 font-normal">Age: {app.age}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-white font-bold">{app.jobTitle}</p>
                        <span className="text-[9px] text-emerald-400 uppercase">{app.jobSalary}</span>
                      </td>
                      <td className="p-4">
                        <p className="text-gray-400">{app.collegeName}</p>
                        <span className="text-[9px] text-gray-500">{app.city}</span>
                      </td>
                      <td className="p-4 font-mono text-gray-300 select-all">{app.upiId}</td>
                      <td className="p-4">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          app.status === 'Accepted' ? 'bg-green-500/10 text-green-500' :
                          app.status === 'Rejected' ? 'bg-red-500/10 text-red-500' :
                          'bg-amber-500/10 text-amber-500'
                        }`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {app.status === 'Pending' ? (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleApplicationAction(app.id, 'Accepted')}
                              className="bg-green-600 hover:bg-green-700 text-white font-bold p-1.5 rounded-xl text-[10px] uppercase flex items-center gap-1 shadow-md"
                              title="Hire Rider"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleApplicationAction(app.id, 'Rejected')}
                              className="bg-gray-800 hover:bg-gray-750 text-red-400 hover:text-red-500 font-bold p-1.5 rounded-xl text-[10px] uppercase flex items-center gap-1"
                              title="Reject Application"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-600 text-[10px] italic">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* RIDER COD DEPOSITS AUDITING TAB */}
      {activeTab === 'deposits' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <p className="text-xs text-orange-400/80 bg-orange-500/5 border border-orange-500/10 px-4 py-3 rounded-2xl">
            💡 <strong>COD Audit Workflow</strong>: Verify cash dropped off by riders. Once verified, it resets the rider's outstanding COD cash balance on their performance log.
          </p>

          {cashDeposits.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-12 text-center text-gray-550 space-y-2">
              <CreditCard className="w-12 h-12 text-gray-700 mx-auto" />
              <h3 className="font-bold text-white text-sm">No Cash Deposit Logs</h3>
              <p className="text-xs max-w-sm mx-auto">Submitted rider cash drops will appear here for audit verification.</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-850 rounded-2xl bg-gray-900 shadow-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-850 text-[10px] text-gray-550 uppercase tracking-widest font-black bg-gray-955">
                    <th className="p-4">Deposit ID</th>
                    <th className="p-4">Delivery Staff</th>
                    <th className="p-4">Amount Dropped</th>
                    <th className="p-4">Submission Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-855 text-gray-300 font-semibold">
                  {cashDeposits.map(dep => (
                    <tr key={dep.id} className="hover:bg-gray-955/50 transition-colors">
                      <td className="p-4 font-mono text-white">#D-{dep.id.slice(-6).toUpperCase()}</td>
                      <td className="p-4">
                        <p className="font-bold text-white text-sm">{dep.riderName}</p>
                        <span className="text-[10px] text-gray-550 font-normal">{dep.riderEmail}</span>
                      </td>
                      <td className="p-4 text-orange-400 font-black text-sm">{formatCurrency(parseFloat(dep.amount))}</td>
                      <td className="p-4 text-gray-400">{new Date(dep.createdAt).toLocaleString()}</td>
                      <td className="p-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          dep.status === 'Verified' ? 'bg-green-500/10 text-green-400 border border-green-500/15' : 'bg-amber-500/10 text-amber-400 border border-amber-500/15'
                        }`}>
                          {dep.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {dep.status === 'Pending' ? (
                          <button
                            onClick={() => handleVerifyDeposit(dep.id)}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-1.5 rounded-lg text-[9px] uppercase shadow-md active:scale-95 transition-all"
                          >
                            Verify & Approve
                          </button>
                        ) : (
                          <span className="text-gray-500 italic text-[10px]">Settled</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CREATE EMPLOYEE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[99] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 max-w-md w-full space-y-5 text-left shadow-2xl relative">
            <button 
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-gray-450 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-gray-800 pb-3">
              <h3 className="text-lg font-bold text-white">Hire Delivery Employee</h3>
              <p className="text-xs text-gray-500 mt-1">Create login credentials for your rider to assign and deliver orders.</p>
            </div>

            {formError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-xs text-red-400 font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateEmployee} className="space-y-4 text-xs font-bold">
              <div className="space-y-1.5">
                <label className="text-gray-455 uppercase text-[9px] tracking-wider block">Rider Full Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Jaswant Singh"
                  className="w-full bg-gray-950 border border-gray-850 rounded-xl p-3 outline-none text-white focus:ring-2 focus:ring-orange-500 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-gray-455 uppercase text-[9px] tracking-wider block">Email Address (Login ID)</label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="e.g. jaswant@canteen.com"
                  className="w-full bg-gray-950 border border-gray-850 rounded-xl p-3 outline-none text-white focus:ring-2 focus:ring-orange-500 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-gray-455 uppercase text-[9px] tracking-wider block">Phone Number</label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="e.g. +91 99999 99999"
                  className="w-full bg-gray-950 border border-gray-850 rounded-xl p-3 outline-none text-white focus:ring-2 focus:ring-orange-500 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-gray-455 uppercase text-[9px] tracking-wider block">Login Password</label>
                <input
                  type="password"
                  required
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full bg-gray-950 border border-gray-850 rounded-xl p-3 outline-none text-white focus:ring-2 focus:ring-orange-500 font-semibold"
                />
              </div>

              <div className="pt-4 flex gap-4 uppercase font-bold text-xs">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-955 hover:bg-gray-850 text-white py-3 rounded-xl border border-gray-850 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                >
                  {formLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Hire Rider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PASSWORD RESET MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[99] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 max-w-sm w-full space-y-5 text-left shadow-2xl relative">
            <button 
              onClick={() => setShowPasswordModal(false)}
              className="absolute top-4 right-4 text-gray-455 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-gray-800 pb-3">
              <h3 className="text-lg font-bold text-white">Reset Password</h3>
              <p className="text-xs text-gray-500 mt-1">Configure a new secure login password for {selectedEmp?.name}.</p>
            </div>

            <form onSubmit={handlePasswordReset} className="space-y-4 text-xs font-bold">
              <div className="space-y-1.5">
                <label className="text-gray-455 uppercase text-[9px] tracking-wider block">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full bg-gray-950 border border-gray-855 rounded-xl p-3 outline-none text-white focus:ring-2 focus:ring-orange-500 font-semibold"
                />
              </div>

              <div className="pt-2 flex gap-4 uppercase font-bold text-xs">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 bg-gray-955 hover:bg-gray-850 text-white py-3 rounded-xl border border-gray-850 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                >
                  {formLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* PAY MODAL */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[99] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 max-w-sm w-full space-y-5 text-left shadow-2xl relative">
            <button 
              onClick={() => setShowPayModal(false)}
              className="absolute top-4 right-4 text-gray-455 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-gray-800 pb-3">
              <h3 className="text-lg font-bold text-white">Pay Salary / Wages</h3>
              <p className="text-xs text-gray-500 mt-1">Initiate a direct UPI GPay transaction to {selectedEmp?.name}'s personal account.</p>
            </div>

            <form onSubmit={handlePayoutSubmit} className="space-y-4 text-xs font-bold">
              <div className="bg-gray-950 border border-gray-855 p-3 rounded-xl space-y-1">
                <span className="text-[9px] text-gray-500 uppercase">Beneficiary UPI ID</span>
                <p className="font-mono text-white text-xs">{selectedEmp?.upi}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-gray-455 uppercase text-[9px] tracking-wider block">Payment Amount (INR)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-orange-500 font-black">{getCurrencySymbol()}</span>
                  <input
                    type="number"
                    required
                    min={1}
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder="e.g. 500"
                    className="w-full bg-gray-955 border border-gray-855 rounded-xl pl-8 pr-4 py-3 outline-none text-white focus:ring-2 focus:ring-orange-500 font-semibold"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-4 uppercase font-bold text-xs">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="flex-1 bg-gray-955 hover:bg-gray-850 text-white py-3 rounded-xl border border-gray-855 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 active:scale-95"
                >
                  Confirm & Pay via GPay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VACANCY POSTING MODAL */}
      {showVacancyModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[99] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 max-w-md w-full space-y-5 text-left shadow-2xl relative">
            <button 
              onClick={() => setShowVacancyModal(false)}
              className="absolute top-4 right-4 text-gray-450 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-gray-800 pb-3">
              <h3 className="text-lg font-bold text-white">Post Job Vacancy</h3>
              <p className="text-xs text-gray-500 mt-1">Attract campus students to deliver orders for your canteen.</p>
            </div>

            <form onSubmit={handleCreateVacancy} className="space-y-4 text-xs font-bold">
              <div className="space-y-1.5">
                <label className="text-gray-455 uppercase text-[9px] tracking-wider block">Job Title</label>
                <input
                  type="text"
                  required
                  value={vacTitle}
                  onChange={(e) => setVacTitle(e.target.value)}
                  placeholder="e.g. Delivery Executive"
                  className="w-full bg-gray-955 border border-gray-855 rounded-xl p-3 outline-none text-white focus:ring-2 focus:ring-orange-500 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-gray-455 uppercase text-[9px] tracking-wider block">Description / Requirements</label>
                <textarea
                  required
                  value={vacDescription}
                  onChange={(e) => setVacDescription(e.target.value)}
                  placeholder="e.g. Must have a bicycle, active between 1 PM and 6 PM."
                  rows={3}
                  className="w-full bg-gray-955 border border-gray-855 rounded-xl p-3 outline-none text-white focus:ring-2 focus:ring-orange-500 font-semibold resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-gray-455 uppercase text-[9px] tracking-wider block">Salary / Wages</label>
                <input
                  type="text"
                  required
                  value={vacSalary}
                  onChange={(e) => setVacSalary(e.target.value)}
                  placeholder={`e.g. ${getCurrencySymbol()}20 per delivery or ${getCurrencySymbol()}3000/month`}
                  className="w-full bg-gray-955 border border-gray-855 rounded-xl p-3 outline-none text-white focus:ring-2 focus:ring-orange-500 font-semibold"
                />
              </div>

              <div className="pt-4 flex gap-4 uppercase font-bold text-xs">
                <button
                  type="button"
                  onClick={() => setShowVacancyModal(false)}
                  className="flex-1 bg-gray-955 hover:bg-gray-855 text-white py-3 rounded-xl border border-gray-855 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={jobsLoading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                >
                  {jobsLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Post Opening
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
