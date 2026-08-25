'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Shield,
  Briefcase,
  FileSpreadsheet,
  DollarSign,
  BookOpen,
  Camera,
  LogOut,
  MapPin,
  Truck,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Clock,
  ChevronRight,
  UploadCloud,
  FileText,
  Search,
  ExternalLink
} from 'lucide-react';

interface TechUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  username: string;
  role: string;
  workType: string;
  status: string;
  payoutType: string;
  payoutValue: number;
  carToolsDeduction: number;
  companyToolsCost: number;
  perDiemOverride: number | null;
  state: {
    code: string;
    name: string;
    employeePerDiem: number;
  };
  activeVehicle: {
    make: string;
    model: string;
    year: number;
    plateNumber: string;
    vin: string;
  } | null;
  contracts: Array<{ provider: string; payoutType: string; payoutValue: number }>;
  recentUploads: Array<{ id: string; jobNumber: string; imageUrl: string; payoutAmount: number; createdAt: string }>;
}

export default function EmployeePortalDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<TechUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'jobs' | 'payroll' | 'knowledge'>('overview');

  // Photo Report Upload state
  const [jobNumberInput, setJobNumberInput] = useState('');
  const [payoutInput, setPayoutInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState({ type: '', text: '' });

  // Knowledge Base state
  const [articles, setArticles] = useState<Array<{ id: string; title: string; category: string; content: string; author: string; createdAt: string }>>([]);

  useEffect(() => {
    fetchSession();
    fetchKnowledge();
  }, []);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/portal/auth/me');
      if (!res.ok) {
        router.push('/portal/login');
        return;
      }
      const data = await res.json();
      setUser(data);
    } catch (err) {
      router.push('/portal/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchKnowledge = async () => {
    try {
      const res = await fetch('/api/portal/knowledge');
      if (res.ok) {
        const data = await res.json();
        setArticles(data.articles || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/portal/auth/logout', { method: 'POST' });
    router.push('/portal/login');
  };

  const handleFieldReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobNumberInput || !imageFile || !user) return;

    setUploading(true);
    setUploadMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('technicianId', String(user.id));
      formData.append('jobNumber', jobNumberInput);
      formData.append('payoutAmount', payoutInput || '0.00');
      formData.append('file', imageFile);

      const res = await fetch('/api/v1/jobs/upload', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setUploadMessage({
        type: 'success',
        text: `Job #${jobNumberInput} field report uploaded successfully!`
      });

      setJobNumberInput('');
      setPayoutInput('');
      setImageFile(null);
      fetchSession();
    } catch (err: any) {
      setUploadMessage({
        type: 'error',
        text: err.message || 'Upload failed'
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center font-sans text-[#202124]">
        <div className="flex items-center space-x-3 bg-white p-6 rounded-2xl shadow-lg border border-[#dadce0]">
          <div className="w-6 h-6 rounded-full border-2 border-[#1a73e8] border-t-transparent animate-spin" />
          <span className="text-sm font-bold text-[#202124]">Loading NetCore Employee Portal...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const initials = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans text-[#202124]">
      
      {/* 1. Google Workspace Top Header Bar */}
      <header className="bg-white border-b border-[#dadce0] sticky top-0 z-30 px-4 sm:px-8 h-16 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-4">
          <div className="w-9 h-9 rounded-full bg-[#1a73e8] flex items-center justify-center font-extrabold text-white text-base shadow-sm">
            N
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-base tracking-tight text-[#202124]">NetCore Portal</span>
              <span className="px-2 py-0.5 text-[10px] font-extrabold bg-[#e8f0fe] text-[#1a73e8] rounded-full uppercase tracking-wider">
                {user.role}
              </span>
            </div>
            <p className="text-[11px] text-[#5f6368] font-medium hidden sm:block">
              Broadband & Field Operations • {user.state.name} ({user.state.code})
            </p>
          </div>
        </div>

        {/* User Badge & Logout */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2.5 px-3 py-1.5 rounded-full bg-[#f1f3f4] border border-[#dadce0]">
            <div className="w-7 h-7 rounded-full bg-[#1a73e8]/15 text-[#1a73e8] flex items-center justify-center font-bold text-xs">
              {initials}
            </div>
            <div className="text-left hidden md:block">
              <p className="text-xs font-bold leading-tight text-[#202124]">{user.name}</p>
              <p className="text-[9px] text-[#5f6368] font-medium capitalize">{user.workType.toLowerCase()} Specialist</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-2 rounded-full border border-[#dadce0] text-[#5f6368] hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. Navigation Tabs */}
      <div className="bg-white border-b border-[#dadce0] px-4 sm:px-8">
        <div className="flex space-x-2 max-w-6xl mx-auto overflow-x-auto custom-scrollbar py-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 text-xs font-bold rounded-full transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-[#e8f0fe] text-[#1a73e8] border border-[#1a73e8]/30 shadow-xs font-extrabold'
                : 'text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Overview & Fleet</span>
          </button>

          <button
            onClick={() => setActiveTab('jobs')}
            className={`px-4 py-2 text-xs font-bold rounded-full transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'jobs'
                ? 'bg-[#e8f0fe] text-[#1a73e8] border border-[#1a73e8]/30 shadow-xs font-extrabold'
                : 'text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4]'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Field Reports & Jobs</span>
          </button>

          <button
            onClick={() => setActiveTab('payroll')}
            className={`px-4 py-2 text-xs font-bold rounded-full transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'payroll'
                ? 'bg-[#e8f0fe] text-[#1a73e8] border border-[#1a73e8]/30 shadow-xs font-extrabold'
                : 'text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4]'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Earnings & Rates</span>
          </button>

          <button
            onClick={() => setActiveTab('knowledge')}
            className={`px-4 py-2 text-xs font-bold rounded-full transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'knowledge'
                ? 'bg-[#e8f0fe] text-[#1a73e8] border border-[#1a73e8]/30 shadow-xs font-extrabold'
                : 'text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Knowledge Base</span>
          </button>
        </div>
      </div>

      {/* 3. Main Dashboard Body Pane */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8 space-y-6">

        {/* TAB 1: OVERVIEW & FLEET */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Top Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white border border-[#dadce0] rounded-2xl p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-[#5f6368]">
                  <span className="text-xs font-bold uppercase tracking-wider">Assigned Region</span>
                  <MapPin className="w-4 h-4 text-[#1a73e8]" />
                </div>
                <p className="text-xl font-black text-[#202124]">{user.state.name}</p>
                <p className="text-[11px] text-[#5f6368] font-medium">Per Diem Rate: ${Number(user.perDiemOverride || user.state.employeePerDiem).toFixed(2)}/day</p>
              </div>

              <div className="bg-white border border-[#dadce0] rounded-2xl p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-[#5f6368]">
                  <span className="text-xs font-bold uppercase tracking-wider">Specialization</span>
                  <Briefcase className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-xl font-black text-[#202124] capitalize">{user.workType.toLowerCase()} Spec</p>
                <p className="text-[11px] text-[#5f6368] font-medium">Status: <span className="font-bold text-emerald-700">{user.status}</span></p>
              </div>

              <div className="bg-white border border-[#dadce0] rounded-2xl p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-[#5f6368]">
                  <span className="text-xs font-bold uppercase tracking-wider">Payout Structure</span>
                  <TrendingUp className="w-4 h-4 text-amber-600" />
                </div>
                <p className="text-xl font-black text-[#202124]">
                  {user.payoutType === 'PERCENTAGE' ? `${user.payoutValue}% Cut` : `$${user.payoutValue}/job`}
                </p>
                <p className="text-[11px] text-[#5f6368] font-medium">Contract Cut Ratio</p>
              </div>

              <div className="bg-white border border-[#dadce0] rounded-2xl p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-[#5f6368]">
                  <span className="text-xs font-bold uppercase tracking-wider">Active Vehicle</span>
                  <Truck className="w-4 h-4 text-[#1a73e8]" />
                </div>
                <p className="text-xl font-black text-[#202124]">
                  {user.activeVehicle ? `${user.activeVehicle.make} ${user.activeVehicle.model}` : 'Unassigned'}
                </p>
                <p className="text-[11px] text-[#5f6368] font-medium">
                  Plate: {user.activeVehicle ? user.activeVehicle.plateNumber : 'N/A'}
                </p>
              </div>
            </div>

            {/* Middle Section: Active Fleet & Contracts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Vehicle Profile Card */}
              <div className="bg-white border border-[#dadce0] rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center space-x-3 pb-3 border-b border-[#f1f3f4]">
                  <Truck className="w-5 h-5 text-[#1a73e8]" />
                  <h3 className="font-extrabold text-base text-[#202124]">Fleet Vehicle Inspection & Info</h3>
                </div>

                {user.activeVehicle ? (
                  <div className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-3 p-3 bg-[#f8f9fa] rounded-xl border border-[#dadce0]">
                      <div>
                        <span className="text-[#5f6368] font-medium block text-[10px]">Make & Model</span>
                        <span className="font-bold text-[#202124]">{user.activeVehicle.year} {user.activeVehicle.make} {user.activeVehicle.model}</span>
                      </div>
                      <div>
                        <span className="text-[#5f6368] font-medium block text-[10px]">License Plate</span>
                        <span className="font-bold text-[#202124]">{user.activeVehicle.plateNumber}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[#5f6368] font-medium block text-[10px]">VIN Number</span>
                        <span className="font-mono text-[11px] font-bold text-[#202124]">{user.activeVehicle.vin}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                      <span>Vehicle Status: <strong>Verified Active</strong> for daily field dispatch.</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-[#5f6368] bg-[#f8f9fa] rounded-xl border border-[#dadce0] italic">
                    No active company vehicle assigned. If using personal truck, contact fleet manager.
                  </div>
                )}
              </div>

              {/* Provider Rate Contracts Summary */}
              <div className="bg-white border border-[#dadce0] rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center space-x-3 pb-3 border-b border-[#f1f3f4]">
                  <FileSpreadsheet className="w-5 h-5 text-[#1a73e8]" />
                  <h3 className="font-extrabold text-base text-[#202124]">Provider Payout Rates</h3>
                </div>

                <div className="space-y-2">
                  {user.contracts && user.contracts.length > 0 ? (
                    user.contracts.map((c, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-[#f8f9fa] rounded-xl border border-[#dadce0] text-xs">
                        <span className="font-bold text-[#202124]">{c.provider}</span>
                        <span className="font-extrabold text-[#1a73e8]">
                          {c.payoutType === 'PERCENTAGE' ? `${c.payoutValue}% of Gross` : `$${c.payoutValue}/job`}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-[#f8f9fa] rounded-xl border border-[#dadce0] text-xs">
                      <span className="font-bold text-[#202124]">Default State Payout ({user.state.code})</span>
                      <span className="font-extrabold text-[#1a73e8]">{user.payoutValue}% Cut</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: FIELD REPORTS & JOBS */}
        {activeTab === 'jobs' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Upload Field Photo Report Form Card */}
            <div className="bg-white border border-[#dadce0] rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center space-x-3 pb-3 border-b border-[#f1f3f4]">
                <Camera className="w-5 h-5 text-[#1a73e8]" />
                <div>
                  <h3 className="font-extrabold text-base text-[#202124]">Submit Field Work Photo Report</h3>
                  <p className="text-xs text-[#5f6368]">Upload daily job screenshot or work completion tag for automated OCR extraction</p>
                </div>
              </div>

              {uploadMessage.text && (
                <div className={`p-3.5 rounded-xl text-xs font-semibold flex items-center space-x-2 ${
                  uploadMessage.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-800'
                }`}>
                  {uploadMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />}
                  <span>{uploadMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleFieldReportSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#5f6368] uppercase tracking-wider mb-1">
                    Job Number / Work Order #
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 709995"
                    value={jobNumberInput}
                    onChange={(e) => setJobNumberInput(e.target.value)}
                    className="w-full bg-[#f8f9fa] border border-[#dadce0] rounded-xl px-3.5 py-2.5 text-xs text-[#202124] font-medium focus:outline-none focus:border-[#1a73e8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#5f6368] uppercase tracking-wider mb-1">
                    Est. Payout Amount ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 45.00"
                    value={payoutInput}
                    onChange={(e) => setPayoutInput(e.target.value)}
                    className="w-full bg-[#f8f9fa] border border-[#dadce0] rounded-xl px-3.5 py-2.5 text-xs text-[#202124] font-medium focus:outline-none focus:border-[#1a73e8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#5f6368] uppercase tracking-wider mb-1">
                    Photo / Screenshot
                  </label>
                  <input
                    type="file"
                    required
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-[#5f6368] file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#e8f0fe] file:text-[#1a73e8] hover:file:bg-blue-100 cursor-pointer"
                  />
                </div>

                <div className="sm:col-span-3 pt-2">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="py-3 px-6 bg-[#1a73e8] hover:bg-[#1557b0] disabled:bg-[#80868b] text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center space-x-2"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>{uploading ? 'Uploading & Processing OCR...' : 'Submit Field Photo Report'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Recent Uploads Table */}
            <div className="bg-white border border-[#dadce0] rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="font-extrabold text-base text-[#202124]">Recent Submitted Reports ({user.recentUploads.length})</h3>

              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#dadce0] text-[#5f6368] uppercase text-[10px] font-bold tracking-wider">
                      <th className="py-2.5 px-3">Job Number</th>
                      <th className="py-2.5 px-3">Date Submitted</th>
                      <th className="py-2.5 px-3">Est. Amount</th>
                      <th className="py-2.5 px-3">Photo Attachment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1f3f4]">
                    {user.recentUploads && user.recentUploads.length > 0 ? (
                      user.recentUploads.map((up) => (
                        <tr key={up.id} className="hover:bg-[#f8f9fa] transition-colors">
                          <td className="py-3 px-3 font-bold text-[#1a73e8]">#{up.jobNumber}</td>
                          <td className="py-3 px-3 text-[#5f6368]">{new Date(up.createdAt).toLocaleDateString()}</td>
                          <td className="py-3 px-3 font-extrabold text-[#202124]">${Number(up.payoutAmount).toFixed(2)}</td>
                          <td className="py-3 px-3">
                            <a
                              href={up.imageUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#1a73e8] font-bold hover:underline inline-flex items-center space-x-1"
                            >
                              <span>View Image</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-[#5f6368] italic">
                          No recent field photo reports submitted. Use the upload box above to submit field photos.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: PAYROLL & RATES */}
        {activeTab === 'payroll' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Payroll Breakdown Summary Card */}
            <div className="bg-white border border-[#dadce0] rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center space-x-3 pb-3 border-b border-[#f1f3f4]">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-base text-[#202124]">Pay Ledger & Deductions Summary</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 bg-[#f8f9fa] rounded-xl border border-[#dadce0] space-y-1">
                  <span className="text-[#5f6368] font-semibold block text-[10px] uppercase">Base Technician Cut</span>
                  <span className="text-lg font-black text-[#1a73e8]">{user.payoutValue}%</span>
                  <p className="text-[10px] text-[#5f6368]">Applied per gross job revenue</p>
                </div>

                <div className="p-4 bg-[#f8f9fa] rounded-xl border border-[#dadce0] space-y-1">
                  <span className="text-[#5f6368] font-semibold block text-[10px] uppercase">Per Diem Allowance</span>
                  <span className="text-lg font-black text-emerald-700">
                    ${Number(user.perDiemOverride || user.state.employeePerDiem).toFixed(2)}/day
                  </span>
                  <p className="text-[10px] text-[#5f6368]">State standard ({user.state.code})</p>
                </div>

                <div className="p-4 bg-[#f8f9fa] rounded-xl border border-[#dadce0] space-y-1">
                  <span className="text-[#5f6368] font-semibold block text-[10px] uppercase">Monthly Tool / Vehicle Deductions</span>
                  <span className="text-lg font-black text-red-600">
                    -${(Number(user.carToolsDeduction) + Number(user.companyToolsCost)).toFixed(2)}
                  </span>
                  <p className="text-[10px] text-[#5f6368]">Car & company tool lease</p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: KNOWLEDGE BASE */}
        {activeTab === 'knowledge' && (
          <div className="space-y-6 animate-fadeIn">
            
            <div className="bg-white border border-[#dadce0] rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center space-x-3 pb-3 border-b border-[#f1f3f4]">
                <BookOpen className="w-5 h-5 text-[#1a73e8]" />
                <div>
                  <h3 className="font-extrabold text-base text-[#202124]">Technical Documentation & Safety Library</h3>
                  <p className="text-xs text-[#5f6368]">Official guidelines for fiber splicing, trenching, safety protocols, and fleet standards</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {articles.map((art) => (
                  <div key={art.id} className="p-5 bg-[#f8f9fa] border border-[#dadce0] rounded-xl space-y-2 hover:border-[#1a73e8] transition-all">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 text-[9px] font-extrabold bg-[#e8f0fe] text-[#1a73e8] rounded-full uppercase">
                        {art.category}
                      </span>
                      <span className="text-[10px] text-[#5f6368]">By {art.author}</span>
                    </div>

                    <h4 className="font-bold text-sm text-[#202124]">{art.title}</h4>
                    <p className="text-xs text-[#5f6368] line-clamp-3 whitespace-pre-line leading-relaxed">{art.content}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
