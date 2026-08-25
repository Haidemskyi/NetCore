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
  UploadCloud,
  FileText,
  Download,
  Plus,
  Trash2,
  MessageSquare,
  ChevronRight,
  ExternalLink,
  Calendar,
  Menu,
  X
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
}

interface IssueTicket {
  id: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
  notes?: string;
}

interface JobLogItem {
  id: number;
  date: string;
  companyRevenue: number;
  techPayout: number;
  ratePlan: {
    code: string;
    description: string;
    provider: string;
  };
  city: {
    name: string;
  };
}

interface StatementDoc {
  id: string;
  name: string;
  fileType: string;
  size: number;
  uploadedAt: string;
  dataUrl: string;
  category: string;
}

type Lang = 'en' | 'ua' | 'ru';

const DICTIONARY: Record<Lang, Record<string, string>> = {
  en: {
    tabOverview: 'Profile & Paystubs',
    tabIssues: 'Work Issues & Support',
    tabPayroll: 'Earnings & Weekly Rates',
    tabKnowledge: 'Knowledge Base',
    region: 'Assigned Region',
    perDiem: 'Personal Per Diem',
    spec: 'Specialization',
    paystubsTitle: 'Paystubs & Weekly Statements',
    paystubsSubtitle: 'Official weekly CSV & PDF paystubs uploaded from CRM Admin',
    reportTitle: 'Report Work Issue / Problem',
    reportSubtitle: 'Submit field problems, site access issues, or equipment failures directly to CRM Tickets & Dispatch',
    jobNumLabel: 'Job Number / Work Order # (Optional)',
    categoryLabel: 'Issue Category',
    descLabel: 'Problem Description *',
    photosLabel: 'Attach Photos / Screenshots (1 Required, Up to 4 Max) *',
    submitIssue: 'Submit Issue to CRM Support',
    downloadPdf: 'Download PDF Paystub Report',
    myTicketsTitle: 'My Reported Issues in CRM',
    completedJobs: 'Completed Orders History',
    noPaystubs: 'No weekly statements uploaded yet. Your weekly paystub files from CRM will appear here automatically.',
    noJobs: 'No completed jobs recorded yet.',
    noTickets: 'No active work issues reported. Use the form above to submit any field problems.'
  },
  ua: {
    tabOverview: 'Профіль та Пейстаби',
    tabIssues: 'Проблеми з роботою та підтримка',
    tabPayroll: 'Доходи та розцінки',
    tabKnowledge: 'База знань',
    region: 'Призначений регіон',
    perDiem: 'Особистий Per Diem',
    spec: 'Спеціалізація',
    paystubsTitle: 'Зарплатні відомості (Paystubs)',
    paystubsSubtitle: 'Офіційні тижневі відомості CSV та PDF, завантажені з CRM',
    reportTitle: 'Повідомити про проблему з роботою',
    reportSubtitle: 'Надішліть проблему на об’єкті або з обладнанням прямо в тикети CRM',
    jobNumLabel: 'Номер замовлення / Work Order # (Опціонально)',
    categoryLabel: 'Категорія проблеми',
    descLabel: 'Опис проблеми *',
    photosLabel: 'Прикріпити фото / скріншоти (Мін. 1 обов’язково, макс. 4) *',
    submitIssue: 'Надіслати у підтримку CRM',
    downloadPdf: 'Завантажити PDF Paystub',
    myTicketsTitle: 'Мої повідомлення про проблеми в CRM',
    completedJobs: 'Історія виконаних замовлень',
    noPaystubs: 'Тижневі відомості ще не завантажені.',
    noJobs: 'Виконаних замовлень поки немає.',
    noTickets: 'Немає активних повідомлень про проблеми.'
  },
  ru: {
    tabOverview: 'Профиль и Пейстабы',
    tabIssues: 'Проблемы с работой и поддержка',
    tabPayroll: 'Доходы и расценки',
    tabKnowledge: 'База знаний',
    region: 'Назначенный регион',
    perDiem: 'Личный Per Diem',
    spec: 'Специализация',
    paystubsTitle: 'Зарплатные ведомости (Paystubs)',
    paystubsSubtitle: 'Официальные недельные ведомости CSV и PDF, загруженные из CRM',
    reportTitle: 'Сообщить о проблеме с работой',
    reportSubtitle: 'Отправьте проблему на объекте или с оборудованием напрямую в тикеты CRM',
    jobNumLabel: 'Номер заказа / Work Order # (Опционально)',
    categoryLabel: 'Категория проблемы',
    descLabel: 'Описание проблемы *',
    photosLabel: 'Прикрепить фото / скриншоты (Мин. 1 обязательно, макс. 4) *',
    submitIssue: 'Отправить в поддержку CRM',
    downloadPdf: 'Скачать PDF Paystub',
    myTicketsTitle: 'Мои сообщения о проблемах в CRM',
    completedJobs: 'История выполненных заказов',
    noPaystubs: 'Недельные ведомости еще не загружены.',
    noJobs: 'Выполненных заказов пока нет.',
    noTickets: 'Нет активных сообщений о проблемах.'
  }
};

export default function EmployeePortalDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<TechUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'issues' | 'payroll' | 'knowledge'>('overview');
  const [lang, setLang] = useState<Lang>('en');

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Work Issues & Support Form state (Field Issues)
  const [jobNumberInput, setJobNumberInput] = useState('');
  const [issueCategory, setIssueCategory] = useState('Access / Entry Problem');
  const [issueDescription, setIssueDescription] = useState('');
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [submittingIssue, setSubmittingIssue] = useState(false);
  const [issueMessage, setIssueMessage] = useState({ type: '', text: '' });
  const [myTickets, setMyTickets] = useState<IssueTicket[]>([]);
  const [myDocuments, setMyDocuments] = useState<StatementDoc[]>([]);

  // Jobs & Payroll state
  const [jobs, setJobs] = useState<JobLogItem[]>([]);
  const [articles, setArticles] = useState<Array<{ id: string; title: string; category: string; content: string; author: string; createdAt: string }>>([]);

  useEffect(() => {
    const savedLang = localStorage.getItem('portal_lang') as Lang;
    if (savedLang && (savedLang === 'en' || savedLang === 'ua' || savedLang === 'ru')) {
      setLang(savedLang);
    }
    fetchSession();
    fetchKnowledge();
  }, []);

  const changeLanguage = (newLang: Lang) => {
    setLang(newLang);
    localStorage.setItem('portal_lang', newLang);
  };

  const t = (key: string): string => {
    return DICTIONARY[lang]?.[key] || DICTIONARY['en'][key] || key;
  };

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/portal/auth/me');
      if (!res.ok) {
        router.push('/portal/login');
        return;
      }
      const data = await res.json();
      setUser(data);
      if (data.id) {
        fetchTickets(data.id);
        fetchJobs();
        fetchDocuments();
      }
    } catch (err) {
      router.push('/portal/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/portal/documents');
      if (res.ok) {
        const data = await res.json();
        setMyDocuments(data.documents || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTickets = async (techId: number) => {
    try {
      const res = await fetch(`/api/portal/reports/ticket?technicianId=${techId}`);
      if (res.ok) {
        const data = await res.json();
        setMyTickets(data.tickets || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/portal/jobs');
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      }
    } catch (err) {
      console.error(err);
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

  // Photo selection handler (1 to 4 photos max)
  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (photoFiles.length + files.length > 4) {
      setIssueMessage({
        type: 'error',
        text: 'Maximum 4 photos allowed per issue report.'
      });
      return;
    }

    const updatedFiles = [...photoFiles, ...files].slice(0, 4);
    setPhotoFiles(updatedFiles);

    // Create preview URLs
    const previews = updatedFiles.map(f => URL.createObjectURL(f));
    setPhotoPreviews(previews);
    setIssueMessage({ type: '', text: '' });
  };

  const handleRemovePhoto = (index: number) => {
    const updatedFiles = photoFiles.filter((_, i) => i !== index);
    setPhotoFiles(updatedFiles);
    setPhotoPreviews(updatedFiles.map(f => URL.createObjectURL(f)));
  };

  const handleWorkIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueDescription || photoFiles.length === 0 || !user) {
      setIssueMessage({
        type: 'error',
        text: 'Please provide a description and attach at least 1 photo of the issue.'
      });
      return;
    }

    setSubmittingIssue(true);
    setIssueMessage({ type: '', text: '' });

    try {
      // Read photos as base64 data URLs
      const base64Photos: string[] = await Promise.all(
        photoFiles.map(f => new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string || '');
          reader.readAsDataURL(f);
        }))
      );

      const res = await fetch('/api/portal/reports/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technicianId: user.id,
          jobNumber: jobNumberInput,
          category: issueCategory,
          description: issueDescription,
          photos: base64Photos
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Submission failed');
      }

      setIssueMessage({
        type: 'success',
        text: 'Work issue report submitted! CRM Dispatch team has been notified.'
      });

      setJobNumberInput('');
      setIssueDescription('');
      setPhotoFiles([]);
      setPhotoPreviews([]);

      if (user.id) fetchTickets(user.id);
    } catch (err: any) {
      setIssueMessage({
        type: 'error',
        text: err.message || 'Submission failed'
      });
    } finally {
      setSubmittingIssue(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!user) return;
    window.open(`/api/portal/payroll/pdf?technicianId=${user.id}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center font-sans text-[#202124]">
        <div className="flex items-center space-x-3 bg-white p-6 rounded-2xl shadow-lg border border-[#dadce0]">
          <div className="w-6 h-6 rounded-full border-2 border-[#1a73e8] border-t-transparent animate-spin" />
          <span className="text-sm font-bold text-[#202124]">Loading NetCore Portal...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const initials = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  // Personal Per Diem Rate (Strictly from Profile)
  const personalPerDiem = Number(user.perDiemOverride !== null && user.perDiemOverride !== undefined ? user.perDiemOverride : user.state.employeePerDiem);

  // Group jobs by week
  const totalEarnings = jobs.reduce((acc, j) => acc + Number(j.techPayout), 0);

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

        {/* User Badge, Language Switcher, Mobile Hamburger & Logout */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Language Switcher (Desktop) */}
          <div className="hidden sm:flex items-center bg-[#f1f3f4] border border-[#dadce0] rounded-full p-0.5 text-[11px] font-extrabold">
            <button
              onClick={() => changeLanguage('en')}
              className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                lang === 'en' ? 'bg-[#1a73e8] text-white shadow-xs' : 'text-[#5f6368] hover:text-[#202124]'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => changeLanguage('ua')}
              className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                lang === 'ua' ? 'bg-[#1a73e8] text-white shadow-xs' : 'text-[#5f6368] hover:text-[#202124]'
              }`}
            >
              UA
            </button>
            <button
              onClick={() => changeLanguage('ru')}
              className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                lang === 'ru' ? 'bg-[#1a73e8] text-white shadow-xs' : 'text-[#5f6368] hover:text-[#202124]'
              }`}
            >
              RU
            </button>
          </div>

          <div className="flex items-center space-x-2 px-2.5 sm:px-3 py-1.5 rounded-full bg-[#f1f3f4] border border-[#dadce0]">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#1a73e8]/15 text-[#1a73e8] flex items-center justify-center font-bold text-xs">
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
            className="p-2 rounded-full border border-[#dadce0] text-[#5f6368] hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-all cursor-pointer hidden sm:flex"
          >
            <LogOut className="w-4 h-4" />
          </button>

          {/* Mobile Hamburger Toggle Button (<640px) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden p-2 rounded-full border border-[#dadce0] text-[#5f6368] hover:bg-[#f1f3f4] transition-all cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-[#202124]" /> : <Menu className="w-5 h-5 text-[#202124]" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu (<640px) */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-white border-b border-[#dadce0] px-4 py-4 space-y-4 animate-fadeIn shadow-md">
          {/* Mobile Language Switcher */}
          <div className="flex items-center justify-between pb-3 border-b border-[#f1f3f4]">
            <span className="text-xs font-bold text-[#5f6368]">Language / Мова:</span>
            <div className="flex items-center bg-[#f1f3f4] border border-[#dadce0] rounded-full p-0.5 text-[11px] font-extrabold">
              <button
                onClick={() => { changeLanguage('en'); setMobileMenuOpen(false); }}
                className={`px-3 py-1 rounded-full transition-all ${lang === 'en' ? 'bg-[#1a73e8] text-white' : 'text-[#5f6368]'}`}
              >
                EN
              </button>
              <button
                onClick={() => { changeLanguage('ua'); setMobileMenuOpen(false); }}
                className={`px-3 py-1 rounded-full transition-all ${lang === 'ua' ? 'bg-[#1a73e8] text-white' : 'text-[#5f6368]'}`}
              >
                UA
              </button>
              <button
                onClick={() => { changeLanguage('ru'); setMobileMenuOpen(false); }}
                className={`px-3 py-1 rounded-full transition-all ${lang === 'ru' ? 'bg-[#1a73e8] text-white' : 'text-[#5f6368]'}`}
              >
                RU
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => { setActiveTab('overview'); setMobileMenuOpen(false); }}
              className={`w-full py-2.5 px-4 text-xs font-bold rounded-xl text-left flex items-center space-x-3 ${
                activeTab === 'overview' ? 'bg-[#e8f0fe] text-[#1a73e8]' : 'text-[#202124] bg-[#f8f9fa]'
              }`}
            >
              <User className="w-4 h-4" />
              <span>{t('tabOverview')}</span>
            </button>

            <button
              onClick={() => { setActiveTab('issues'); setMobileMenuOpen(false); }}
              className={`w-full py-2.5 px-4 text-xs font-bold rounded-xl text-left flex items-center space-x-3 ${
                activeTab === 'issues' ? 'bg-[#e8f0fe] text-[#1a73e8]' : 'text-[#202124] bg-[#f8f9fa]'
              }`}
            >
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>{t('tabIssues')}</span>
            </button>

            <button
              onClick={() => { setActiveTab('payroll'); setMobileMenuOpen(false); }}
              className={`w-full py-2.5 px-4 text-xs font-bold rounded-xl text-left flex items-center space-x-3 ${
                activeTab === 'payroll' ? 'bg-[#e8f0fe] text-[#1a73e8]' : 'text-[#202124] bg-[#f8f9fa]'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>{t('tabPayroll')}</span>
            </button>

            <button
              onClick={() => { setActiveTab('knowledge'); setMobileMenuOpen(false); }}
              className={`w-full py-2.5 px-4 text-xs font-bold rounded-xl text-left flex items-center space-x-3 ${
                activeTab === 'knowledge' ? 'bg-[#e8f0fe] text-[#1a73e8]' : 'text-[#202124] bg-[#f8f9fa]'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>{t('tabKnowledge')}</span>
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-2.5 px-4 bg-red-50 text-red-600 font-bold text-xs rounded-xl flex items-center justify-center space-x-2 border border-red-100"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      )}

      {/* 2. Desktop Navigation Tabs (Hidden on mobile) */}
      <div className="bg-white border-b border-[#dadce0] px-4 sm:px-8 hidden sm:block">
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
            <span>{t('tabOverview')}</span>
          </button>

          <button
            onClick={() => setActiveTab('issues')}
            className={`px-4 py-2 text-xs font-bold rounded-full transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'issues'
                ? 'bg-[#e8f0fe] text-[#1a73e8] border border-[#1a73e8]/30 shadow-xs font-extrabold'
                : 'text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4]'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>{t('tabIssues')}</span>
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
            <span>{t('tabPayroll')}</span>
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
            <span>{t('tabKnowledge')}</span>
          </button>
        </div>
      </div>

      {/* 3. Main Dashboard Body Pane */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-3.5 sm:p-8 space-y-6">

        {/* TAB 1: OVERVIEW & VEHICLE */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Stat Cards (2x2 Grid Tiles below 640px) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white border border-[#dadce0] rounded-2xl p-3.5 sm:p-5 shadow-sm space-y-1.5 sm:space-y-2">
                <div className="flex items-center justify-between text-[#5f6368]">
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">{t('region')}</span>
                  <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#1a73e8]" />
                </div>
                <p className="text-sm sm:text-xl font-black text-[#202124] truncate">{user.state.name}</p>
                <p className="text-[9px] sm:text-[11px] text-[#5f6368] font-medium">State: {user.state.code}</p>
              </div>

              <div className="bg-white border border-[#dadce0] rounded-2xl p-3.5 sm:p-5 shadow-sm space-y-1.5 sm:space-y-2">
                <div className="flex items-center justify-between text-[#5f6368]">
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">{t('perDiem')}</span>
                  <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                </div>
                <p className="text-sm sm:text-xl font-black text-emerald-700">${personalPerDiem.toFixed(2)}/day</p>
                <p className="text-[9px] sm:text-[11px] text-[#5f6368] font-medium">Daily Allowance</p>
              </div>

              <div className="bg-white border border-[#dadce0] rounded-2xl p-3.5 sm:p-5 shadow-sm space-y-1.5 sm:space-y-2">
                <div className="flex items-center justify-between text-[#5f6368]">
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">{t('spec')}</span>
                  <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" />
                </div>
                <p className="text-sm sm:text-xl font-black text-[#202124] capitalize truncate">{user.workType.toLowerCase()} Spec</p>
                <p className="text-[9px] sm:text-[11px] text-[#5f6368] font-medium">Status: <span className="font-bold text-emerald-700">{user.status}</span></p>
              </div>

              <div className="bg-white border border-[#dadce0] rounded-2xl p-3.5 sm:p-5 shadow-sm space-y-1.5 sm:space-y-2">
                <div className="flex items-center justify-between text-[#5f6368]">
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Active Vehicle</span>
                  <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#1a73e8]" />
                </div>
                <p className="text-sm sm:text-xl font-black text-[#202124] truncate">
                  {user.activeVehicle ? `${user.activeVehicle.make} ${user.activeVehicle.model}` : 'Unassigned'}
                </p>
                <p className="text-[9px] sm:text-[11px] text-[#5f6368] font-medium truncate">
                  Plate: {user.activeVehicle ? user.activeVehicle.plateNumber : 'N/A'}
                </p>
              </div>
            </div>

            {/* Middle Section: Paystubs & Weekly Statements (CRM Paystubs) */}
            <div className="bg-white border border-[#dadce0] rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center space-x-3 pb-3 border-b border-[#f1f3f4]">
                <FileSpreadsheet className="w-5 h-5 text-[#1a73e8]" />
                <div>
                  <h3 className="font-extrabold text-base text-[#202124]">{t('paystubsTitle')}</h3>
                  <p className="text-xs text-[#5f6368]">{t('paystubsSubtitle')}</p>
                </div>
              </div>

              <div className="space-y-2.5">
                {myDocuments && myDocuments.length > 0 ? (
                  myDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3.5 bg-slate-900 text-white rounded-xl border border-slate-800 flex items-center justify-between shadow-xs hover:border-[#1a73e8] transition-all"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                          📊
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-xs text-slate-100">{doc.name}</span>
                            <span className="px-2 py-0.5 text-[9px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-md uppercase tracking-wider">
                              STATEMENT
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : '2 KB'} • Uploaded {new Date(doc.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <a
                          href={doc.dataUrl.startsWith('data:') ? doc.dataUrl : `/api/documents/serve?id=${doc.id}`}
                          target="_blank"
                          rel="noreferrer"
                          title="Preview Statement"
                          className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all cursor-pointer"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <a
                          href={doc.dataUrl.startsWith('data:') ? doc.dataUrl : `/api/documents/serve?id=${doc.id}`}
                          download={doc.name}
                          title="Download Statement File"
                          className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-[#5f6368] bg-[#f8f9fa] rounded-xl border border-[#dadce0] italic">
                    No weekly statements uploaded yet. Your weekly paystub files from CRM will appear here automatically.
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: WORK ISSUES & SUPPORT (Проблемы с работой) */}
        {activeTab === 'issues' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Report Work Issue Form Card */}
            <div className="bg-white border border-[#dadce0] rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center space-x-3 pb-3 border-b border-[#f1f3f4]">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <div>
                  <h3 className="font-extrabold text-base text-[#202124]">Report Work Issue / Problem (Проблема с работой)</h3>
                  <p className="text-xs text-[#5f6368]">Submit field problems, site access issues, or equipment failures directly to CRM Tickets & Dispatch</p>
                </div>
              </div>

              {issueMessage.text && (
                <div className={`p-3.5 rounded-xl text-xs font-semibold flex items-center space-x-2 ${
                  issueMessage.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-800'
                }`}>
                  {issueMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />}
                  <span>{issueMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleWorkIssueSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#5f6368] uppercase tracking-wider mb-1">
                      Job Number / Work Order # (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 709995"
                      value={jobNumberInput}
                      onChange={(e) => setJobNumberInput(e.target.value)}
                      className="w-full bg-[#f8f9fa] border border-[#dadce0] rounded-xl px-3.5 py-2.5 text-xs text-[#202124] font-medium focus:outline-none focus:border-[#1a73e8]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#5f6368] uppercase tracking-wider mb-1">
                      Issue Category
                    </label>
                    <select
                      value={issueCategory}
                      onChange={(e) => setIssueCategory(e.target.value)}
                      className="w-full bg-[#f8f9fa] border border-[#dadce0] rounded-xl px-3.5 py-2.5 text-xs text-[#202124] font-bold focus:outline-none focus:border-[#1a73e8]"
                    >
                      <option value="Access / Entry Problem">Site Access / Property Gate Lock</option>
                      <option value="Equipment & Tool Failure">Equipment / Fusion Splicer Failure</option>
                      <option value="Rate / Code Dispute">Rate Code / Provider Price Dispute</option>
                      <option value="Dispatch / Address Error">Dispatch / Address Mapping Error</option>
                      <option value="Safety & Underground Utility">Safety / Call 811 Utility Line Hazard</option>
                      <option value="General Field Support">General Field Support</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#5f6368] uppercase tracking-wider mb-1">
                    Problem Description (Описание проблемы) *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe the problem in detail (what happened, address, assistance needed)..."
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                    className="w-full bg-[#f8f9fa] border border-[#dadce0] rounded-xl p-3.5 text-xs text-[#202124] font-medium focus:outline-none focus:border-[#1a73e8] leading-relaxed"
                  />
                </div>

                {/* Photo Attachments (1 Required, Max 4) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-[#5f6368] uppercase tracking-wider">
                      Attach Photos / Screenshots (1 Required, Up to 4 Max) *
                    </label>
                    <span className="text-[11px] font-bold text-[#1a73e8]">
                      {photoFiles.length} of 4 Attached
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {photoPreviews.map((preview, idx) => (
                      <div key={idx} className="relative rounded-xl border border-[#dadce0] overflow-hidden group h-24 bg-slate-100">
                        <img src={preview} alt={`Issue ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(idx)}
                          className="absolute top-1.5 right-1.5 p-1 bg-red-600 text-white rounded-full opacity-90 hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    {photoFiles.length < 4 && (
                      <label className="border-2 border-dashed border-[#dadce0] hover:border-[#1a73e8] rounded-xl h-24 flex flex-col items-center justify-center text-center cursor-pointer bg-[#f8f9fa] hover:bg-blue-50/50 transition-all p-2">
                        <Camera className="w-5 h-5 text-[#1a73e8] mb-1" />
                        <span className="text-[10px] font-bold text-[#1a73e8]">Add Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoAdd}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submittingIssue}
                    className="py-3 px-6 bg-[#1a73e8] hover:bg-[#1557b0] disabled:bg-[#80868b] text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center space-x-2"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>{submittingIssue ? 'Submitting to CRM Tickets...' : 'Submit Issue to CRM Support'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* List of Technician's Submitted CRM Tickets */}
            <div className="bg-white border border-[#dadce0] rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="font-extrabold text-base text-[#202124]">My Reported Issues in CRM ({myTickets.length})</h3>

              <div className="space-y-3">
                {myTickets && myTickets.length > 0 ? (
                  myTickets.map((t) => (
                    <div key={t.id} className="p-4 bg-[#f8f9fa] border border-[#dadce0] rounded-xl space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#202124]">{t.subject}</span>
                        <span className={`px-2.5 py-0.5 text-[9px] font-extrabold rounded-full uppercase ${
                          t.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {t.status}
                        </span>
                      </div>
                      <p className="text-[#5f6368] whitespace-pre-line">{t.message}</p>
                      <div className="flex items-center justify-between pt-1 border-t border-[#dadce0] text-[10px] text-[#80868b]">
                        <span>Reported: {new Date(t.createdAt).toLocaleDateString()}</span>
                        <span>Ticket ID: {t.id}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-[#5f6368] bg-[#f8f9fa] rounded-xl border border-[#dadce0] italic">
                    No active work issues reported. Use the form above to submit any field problems.
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: EARNINGS & RATES (With PDF Generator) */}
        {activeTab === 'payroll' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Header with Download PDF Button */}
            <div className="bg-white border border-[#dadce0] rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-lg text-[#202124]">Weekly Earnings & Completed Orders</h3>
                <p className="text-xs text-[#5f6368]">Full weekly pay ledger, job payouts, and personal per diem rate</p>
              </div>

              <button
                onClick={handleDownloadPDF}
                className="py-3 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF Paystub Report (Сделать PDF)</span>
              </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-[#dadce0] rounded-2xl p-5 shadow-sm space-y-1">
                <span className="text-[10px] font-extrabold text-[#5f6368] uppercase">Total Completed Jobs</span>
                <p className="text-2xl font-black text-[#202124]">{jobs.length} Orders</p>
              </div>

              <div className="bg-white border border-[#dadce0] rounded-2xl p-5 shadow-sm space-y-1">
                <span className="text-[10px] font-extrabold text-[#5f6368] uppercase">Total Technician Earnings</span>
                <p className="text-2xl font-black text-[#1a73e8]">${totalEarnings.toFixed(2)}</p>
              </div>

              <div className="bg-white border border-[#dadce0] rounded-2xl p-5 shadow-sm space-y-1">
                <span className="text-[10px] font-extrabold text-[#5f6368] uppercase">Personal Per Diem Rate</span>
                <p className="text-2xl font-black text-emerald-700">${personalPerDiem.toFixed(2)} / day</p>
              </div>
            </div>

            {/* Jobs Ledger Table */}
            <div className="bg-white border border-[#dadce0] rounded-2xl p-6 shadow-sm space-y-4">
              <h4 className="font-extrabold text-base text-[#202124]">Completed Orders History</h4>

              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#dadce0] text-[#5f6368] uppercase text-[10px] font-bold tracking-wider">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Job Code</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3">City</th>
                      <th className="py-2.5 px-3">Your Payout</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1f3f4]">
                    {jobs && jobs.length > 0 ? (
                      jobs.map((j) => (
                        <tr key={j.id} className="hover:bg-[#f8f9fa] transition-colors">
                          <td className="py-3 px-3 font-bold text-[#5f6368]">{new Date(j.date).toLocaleDateString()}</td>
                          <td className="py-3 px-3 font-bold text-[#1a73e8]">{j.ratePlan.code}</td>
                          <td className="py-3 px-3 text-[#202124] font-medium">{j.ratePlan.description}</td>
                          <td className="py-3 px-3 text-[#5f6368]">{j.city.name}</td>
                          <td className="py-3 px-3 font-extrabold text-emerald-700">${Number(j.techPayout).toFixed(2)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-[#5f6368] italic">
                          No completed jobs recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
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
