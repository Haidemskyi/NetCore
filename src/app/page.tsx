'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  UserPlus, 
  DollarSign, 
  Percent, 
  Briefcase, 
  MapPin, 
  Layers, 
  Car, 
  Wrench, 
  Phone, 
  Mail, 
  Calendar,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Info,
  Clock,
  Sparkles,
  Search,
  Bell,
  Building2,
  MessageSquare,
  Maximize2,
  ChevronDown,
  Plus,
  Edit,
  Trash2,
  X,
  FileSpreadsheet,
  RotateCcw,
  RefreshCw,
  AlertCircle,
  Upload,
  FileText,
  Download,
  File,
  Menu,
  CheckSquare,
  Paperclip,
  Eye,
  PenTool,
  LayoutGrid,
  List,
  ArrowLeft,
  CheckCircle2,
  UserCheck,
  XCircle,
  FolderOpen,
  Link,
  Copy,
  ExternalLink
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import USMap from '../components/USMap';
import BulkRateImportModal from '../components/BulkRateImportModal';
import BulkStateRateEditModal from '../components/BulkStateRateEditModal';
import { 
  states, 
  cities, 
  ratePlans, 
  technicians, 
  jobLogs, 
  vehicles,
  JobLog,
  Technician,
  TechDocument,
  RatePlan,
  State,
  City,
  Vehicle,
  TechStatus,
  WorkType,
  OwnershipType,
  VehicleStatus,
  PayoutType,
  Todo,
  Candidate
} from '../data/mockData';

const sanitizeDescription = (desc?: string): string => {
  if (!desc) return '';
  const trimmed = desc.trim();
  // Match numeric strings (optionally signed, containing spaces, commas, decimals)
  const isNumeric = /^[+-]?[\d,\s]*(\.\d+)?$/.test(trimmed);
  if (isNumeric) return '';
  // Check for common leaked header row titles
  const lower = trimmed.toLowerCase();
  if (lower === 'price' || lower === 'description' || lower === 'desc' || lower === 'rate' || lower === 'payout' || lower === 'company rate' || lower === 'employee rate' || lower === 'employee payout') {
    return '';
  }
  return trimmed;
};

const STATE_NAMES: { [key: string]: string } = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  DC: 'District of Columbia'
};

export default function Home() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [selectedStateCode, setSelectedStateCode] = useState<string | null>(null);
  const [selectedTechId, setSelectedTechId] = useState<number | null>(null);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  // Theme state (dark / light mode matching site aesthetics)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('netcore_theme') as 'dark' | 'light' | null;
    if (saved === 'light' || saved === 'dark') {
      setTheme(saved);
      document.documentElement.setAttribute('data-theme', saved);
      if (saved === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark');
    }
  }, []);

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('netcore_theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Custom Dialog Modal states
  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isConfirm: boolean;
    resolve: ((value: boolean) => void) | null;
  }>({
    isOpen: false,
    title: '',
    message: '',
    isConfirm: false,
    resolve: null,
  });

  const customAlert = (message: string, title = 'Notification'): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialog({
        isOpen: true,
        title,
        message,
        isConfirm: false,
        resolve,
      });
    });
  };

  const customConfirm = (message: string, title = 'Confirmation'): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialog({
        isOpen: true,
        title,
        message,
        isConfirm: true,
        resolve,
      });
    });
  };

  // Admin Login & Session states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [admins, setAdmins] = useState<{username: string}[]>([]);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Invite Admin states
  const [inviteForm, setInviteForm] = useState({ username: '', password: '' });
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteError, setInviteError] = useState('');

  const handleLoginSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }
    setLoginError('');
    setIsLoggingIn(true);

    const u = (loginUsername || '').trim().toLowerCase();
    const p = (loginPassword || '').trim();

    if (!u || !p) {
      setLoginError('Please enter both username and password.');
      setIsLoggingIn(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && (data.success || data.username)) {
        const activeUser = data.username || u;
        if (typeof window !== 'undefined') {
          localStorage.setItem('netcore_session', activeUser);
        }
        setCurrentUser(activeUser);
        setIsLoggedIn(true);

        // Fetch bootstrap data in background
        fetch('/api/bootstrap')
          .then(r => r.json())
          .then(bootData => {
            if (bootData) {
              if (bootData.states) setCustomStates(bootData.states);
              if (bootData.cities) setCustomCities(bootData.cities);
              if (bootData.ratePlans) setCustomRatePlans(bootData.ratePlans);
              if (bootData.technicians) setCustomTechnicians(bootData.technicians);
              if (bootData.vehicles) setCustomVehicles(bootData.vehicles);
              if (bootData.jobLogs) setCustomJobLogs(bootData.jobLogs);
              if (bootData.documents) setCustomDocuments(bootData.documents);
              if (bootData.todos) setCustomTodos(bootData.todos);
              if (bootData.admins) setAdmins(bootData.admins);
              if (bootData.candidates) setCustomCandidates(bootData.candidates);
              if (bootData.tickets) setCustomTickets(bootData.tickets);
            }
          })
          .catch(console.error);
      } else {
        setLoginError(data.error || 'Invalid login or password.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setLoginError('An error occurred during login. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout failed:', e);
    }
    setIsLoggedIn(false);
    setCurrentUser(null);
    setLoginUsername('');
    setLoginPassword('');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('netcore_session');
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const newUsername = inviteForm.username.trim().toLowerCase();
    const newPassword = inviteForm.password;

    if (!newUsername || !newPassword) {
      setInviteError('Please fill out both fields.');
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername, password: newPassword }),
      });

      if (res.ok) {
        setAdmins([...admins, { username: newUsername }]);
        setInviteForm({ username: '', password: '' });
        setInviteError('');
        setIsInviteModalOpen(false);
        await customAlert(`Success: Admin account "${newUsername}" has been created!`, 'Success');
      } else {
        const errData = await res.json();
        setInviteError(errData.error || 'Failed to create admin account.');
      }
    } catch (err) {
      setInviteError('An error occurred during admin registration.');
    }
  };

  
  // Custom Calendar state
  const [currentDay, setCurrentDay] = useState(5);

  // Task Manager states
  const [customTodos, setCustomTodos] = useState<Todo[]>([]);
  const [inlineTodoText, setInlineTodoText] = useState('');
  const [inlineTodoDesc, setInlineTodoDesc] = useState('');
  const [inlineTodoPriority, setInlineTodoPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('LOW');
  const [taskFormText, setTaskFormText] = useState('');
  const [taskFormDesc, setTaskFormDesc] = useState('');
  const [taskFormPriority, setTaskFormPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM');
  const [taskFormDate, setTaskFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [todoSearchQuery, setTodoSearchQuery] = useState('');
  const [todoCreatorFilter, setTodoCreatorFilter] = useState('ALL');
  const [todoDateFilter, setTodoDateFilter] = useState('');

  // Priority scoring helper
  const getPriorityScore = (priority?: 'HIGH' | 'MEDIUM' | 'LOW'): number => {
    if (priority === 'HIGH') return 3;
    if (priority === 'MEDIUM') return 2;
    return 1;
  };

  // Selected Day Todos helper, sorted by priority (HIGH > MEDIUM > LOW)
  const selectedDayTodos = useMemo(() => {
    const dateStr = `2026-06-${currentDay.toString().padStart(2, '0')}`;
    return customTodos
      .filter(t => t.date === dateStr)
      .sort((a, b) => {
        const scoreA = getPriorityScore(a.priority);
        const scoreB = getPriorityScore(b.priority);
        return scoreB - scoreA;
      });
  }, [customTodos, currentDay]);

  const handleToggleTodo = async (id: string) => {
    const todo = customTodos.find(t => t.id === id);
    if (!todo) return;

    try {
      const res = await fetch('/api/todos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, completed: !todo.completed }),
      });

      if (res.ok) {
        setCustomTodos(prev => prev.map(todo => 
          todo.id === id ? { ...todo, completed: !todo.completed } : todo
        ));
      }
    } catch (err) {
      console.error('Error toggling todo:', err);
    }
  };

  const handleAddInlineTodo = async () => {
    if (!inlineTodoText.trim()) return;
    const dateStr = `2026-06-${currentDay.toString().padStart(2, '0')}`;
    
    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inlineTodoText.trim(),
          description: inlineTodoDesc.trim() || undefined,
          priority: inlineTodoPriority,
          date: dateStr,
          creator: currentUser || 'admin',
        }),
      });

      if (res.ok) {
        const newTodo = await res.json();
        setCustomTodos(prev => [...prev, newTodo]);
        setInlineTodoText('');
        setInlineTodoDesc('');
        setInlineTodoPriority('LOW');
      }
    } catch (err) {
      console.error('Error adding inline todo:', err);
    }
  };

  const todoStats = useMemo(() => {
    const total = customTodos.length;
    const completed = customTodos.filter(t => t.completed).length;
    const pending = total - completed;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;
    return { total, completed, pending, completionRate };
  }, [customTodos]);

  const filteredTodos = useMemo(() => {
    return customTodos.filter(todo => {
      const matchesSearch = todo.text.toLowerCase().includes(todoSearchQuery.toLowerCase()) || 
        (todo.description || '').toLowerCase().includes(todoSearchQuery.toLowerCase());
      const matchesCreator = todoCreatorFilter === 'ALL' || todo.creator === todoCreatorFilter;
      const matchesDate = !todoDateFilter || todo.date === todoDateFilter;
      return matchesSearch && matchesCreator && matchesDate;
    });
  }, [customTodos, todoSearchQuery, todoCreatorFilter, todoDateFilter]);

  const filteredPendingTodos = useMemo(() => {
    return filteredTodos
      .filter(t => !t.completed)
      .sort((a, b) => {
        const scoreA = getPriorityScore(a.priority);
        const scoreB = getPriorityScore(b.priority);
        if (scoreB !== scoreA) {
          return scoreB - scoreA;
        }
        return a.date.localeCompare(b.date);
      });
  }, [filteredTodos]);

  const filteredCompletedTodos = useMemo(() => {
    return filteredTodos
      .filter(t => t.completed)
      .sort((a, b) => {
        const scoreA = getPriorityScore(a.priority);
        const scoreB = getPriorityScore(b.priority);
        if (scoreB !== scoreA) {
          return scoreB - scoreA;
        }
        return a.date.localeCompare(b.date);
      });
  }, [filteredTodos]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskFormText.trim()) return;

    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: taskFormText.trim(),
          description: taskFormDesc.trim() || undefined,
          priority: taskFormPriority,
          date: taskFormDate,
          creator: currentUser || 'admin',
        }),
      });

      if (res.ok) {
        const newTodo = await res.json();
        setCustomTodos(prev => [...prev, newTodo]);
        setTaskFormText('');
        setTaskFormDesc('');
        setTaskFormPriority('MEDIUM');
        setTaskFormDate(new Date().toISOString().split('T')[0]);
        await customAlert('Task successfully created!', 'Success');
      }
    } catch (err) {
      console.error('Error creating task:', err);
    }
  };

  const handleDeleteTodo = async (id: string) => {
    if (await customConfirm('Are you sure you want to delete this task?', 'Delete Task')) {
      try {
        const res = await fetch(`/api/todos?id=${id}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          setCustomTodos(prev => prev.filter(t => t.id !== id));
        }
      } catch (err) {
        console.error('Error deleting task:', err);
      }
    }
  };

  // Rate Plans & Operations state to make everything dynamic
  const [customRatePlans, setCustomRatePlans] = useState<RatePlan[]>(ratePlans);
  const [customStates, setCustomStates] = useState<State[]>(states);
  const [customCities, setCustomCities] = useState<City[]>(cities);
  const [customTechnicians, setCustomTechnicians] = useState<Technician[]>(technicians);
  const [customVehicles, setCustomVehicles] = useState<Vehicle[]>(vehicles);
  const [customJobLogs, setCustomJobLogs] = useState<JobLog[]>(jobLogs);
  const [customDocuments, setCustomDocuments] = useState<TechDocument[]>([]);

  const [isInitialized, setIsInitialized] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isBulkStateEditOpen, setIsBulkStateEditOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // State details inline edit form states
  const [isEditingStateDetails, setIsEditingStateDetails] = useState(false);
  const [editRequiredTechs, setEditRequiredTechs] = useState('0');
  const [editRequirements, setEditRequirements] = useState('');
  const [editCompanyPerDiem, setEditCompanyPerDiem] = useState('0.00');
  const [editEmployeePerDiem, setEditEmployeePerDiem] = useState('0.00');
  const [editOnboardingWaitTime, setEditOnboardingWaitTime] = useState('');
  const [editMonthlySalary, setEditMonthlySalary] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editVacancyCities, setEditVacancyCities] = useState('');
  const [editDefaultCut, setEditDefaultCut] = useState('8.00');
  const [recruitingTab, setRecruitingTab] = useState<'assistant' | 'pipeline'>('assistant');

  // Candidates states
  const [customCandidates, setCustomCandidates] = useState<Candidate[]>([]);
  const [candidateSearchQuery, setCandidateSearchQuery] = useState('');
  const [candidateStatusFilter, setCandidateStatusFilter] = useState('ALL');
  const [candidateStateFilter, setCandidateStateFilter] = useState('ALL');
  const [candidateViewMode, setCandidateViewMode] = useState<'list' | 'kanban'>('list');

  // Candidate edit form states
  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [candidateForm, setCandidateForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    stateCode: 'TN',
    status: 'NEW',
    notes: '',
  });

  // Tickets & Inquiries states
  const [customTickets, setCustomTickets] = useState<any[]>([]);
  const [ticketSearchQuery, setTicketSearchQuery] = useState('');
  const [ticketStatusFilter, setTicketStatusFilter] = useState('ALL');
  const [ticketCategoryFilter, setTicketCategoryFilter] = useState('ALL');
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [ticketNotes, setTicketNotes] = useState('');

  const unreadTicketsCount = useMemo(() => {
    return customTickets.filter(t => t.status === 'NEW').length;
  }, [customTickets]);

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/tickets');
      if (res.ok) {
        const data = await res.json();
        if (data.tickets) {
          setCustomTickets(data.tickets);
        }
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ticketId, status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setCustomTickets(prev => prev.map(t => t.id === ticketId ? updated : t));
        if (selectedTicket && selectedTicket.id === ticketId) {
          setSelectedTicket(updated);
        }
      }
    } catch (err) {
      console.error('Error updating ticket status:', err);
    }
  };

  const handleSaveTicketNotes = async () => {
    if (!selectedTicket) return;
    try {
      const res = await fetch('/api/tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedTicket.id, notes: ticketNotes }),
      });
      if (res.ok) {
        const updated = await res.json();
        setCustomTickets(prev => prev.map(t => t.id === selectedTicket.id ? updated : t));
        setSelectedTicket(updated);
        await customAlert('Notes saved successfully.', 'Success');
      }
    } catch (err) {
      console.error('Error saving ticket notes:', err);
    }
  };

  const handleDeleteTicket = async (id: string) => {
    if (await customConfirm('Are you sure you want to delete this ticket?', 'Delete Ticket')) {
      try {
        const res = await fetch(`/api/tickets?id=${id}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          setCustomTickets(prev => prev.filter(t => t.id !== id));
          if (selectedTicket && selectedTicket.id === id) {
            setIsTicketModalOpen(false);
            setSelectedTicket(null);
          }
        }
      } catch (err) {
        console.error('Error deleting ticket:', err);
      }
    }
  };

  // Email Preview Modal states
  const [isEmailPreviewOpen, setIsEmailPreviewOpen] = useState(false);
  const [emailPreviewData, setEmailPreviewData] = useState<{
    candidateId: number;
    templateType: string;
    to: string;
    subject: string;
    bodyHtml: string;
    bodyText: string;
    attachments?: string[];
    stateCode?: string;
    availableProviders?: string[];
    selectedProviders?: string[];
    companyCutPercent?: number | string;
    perDiemOverride?: number | string;
  } | null>(null);
  const [emailPreviewTab, setEmailPreviewTab] = useState<'preview' | 'html'>('preview');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [isUpdatingRates, setIsUpdatingRates] = useState(false);

  // Send Rates Config Modal states
  const [isSendRatesConfigOpen, setIsSendRatesConfigOpen] = useState(false);
  const [sendRatesCandidate, setSendRatesCandidate] = useState<Candidate | null>(null);
  const [sendRatesStateCode, setSendRatesStateCode] = useState<string>('TN');
  const [sendRatesCompanyCut, setSendRatesCompanyCut] = useState<string>('8.00');
  const [sendRatesPerDiem, setSendRatesPerDiem] = useState<string>('0.00');
  const [sendRatesSelectedProviders, setSendRatesSelectedProviders] = useState<string[]>([]);

  // Candidate Documents Viewer Modal states
  const [isCandidateDocsOpen, setIsCandidateDocsOpen] = useState(false);
  const [selectedCandForDocs, setSelectedCandForDocs] = useState<Candidate | null>(null);
  const [candidateDocsList, setCandidateDocsList] = useState<any[]>([]);
  const [candidateDocsLoading, setCandidateDocsLoading] = useState(false);
  const [candidateUploadLink, setCandidateUploadLink] = useState<string | null>(null);

  // HR Module Google Material Theme ('dark' | 'light')
  const [hrTheme, setHrTheme] = useState<'dark' | 'light'>('dark');

  // Tech modal tab: 'profile' | 'documents' | 'payments' | 'mobile_jobs'
  const [techModalTab, setTechModalTab] = useState<'profile' | 'documents' | 'payments' | 'mobile_jobs'>('profile');
  const [techUploads, setTechUploads] = useState<Array<{ id: string; jobNumber: string; imageUrl?: string | null; rawText?: string | null; createdAt: string; payoutAmount?: number; sourceLabel?: string }>>([]);
  const [techUploadStats, setTechUploadStats] = useState({ totalCount: 0, todayCount: 0, monthCount: 0, avgPerDay: 0 });
  const [loadingUploads, setLoadingUploads] = useState(false);
  const [previewScreenshotUrl, setPreviewScreenshotUrl] = useState<string | null>(null);
  const [mobileJobsDateFilter, setMobileJobsDateFilter] = useState<string>('ALL');
  const [customSelectedDate, setCustomSelectedDate] = useState<string>('');

  // Weekly spreadsheet importer states
  const [importRawText, setImportRawText] = useState('');
  const [parsedJobs, setParsedJobs] = useState<any[]>([]);
  const [importerTechFilter, setImporterTechFilter] = useState<string>('ALL');
  
  // Track adjustments per technician
  const [techAdjustments, setTechAdjustments] = useState<Record<number, { perDiem: string, companyPerDiem: string, car: string, companyToolsCost: string, hotel: string }>>({});
  
  const [perDiem, setPerDiem] = useState('0.00');
  const [companyPerDiem, setCompanyPerDiem] = useState('0.00');
  const [carDeduction, setCarDeduction] = useState('0.00');
  const [companyToolsCost, setCompanyToolsCost] = useState('0.00');
  const [hotelDeduction, setHotelDeduction] = useState('0.00');
  
  const prevTechFilterRef = React.useRef('ALL');

  const calculateTechnicianPerDiem = (techId: number, techJobs: any[]) => {
    const tech = customTechnicians.find(technician => technician.id === techId);
    if (!tech) return 0;

    const stateOfTech = customStates.find(state => state.id === tech.stateId);
    const dailyRate = tech.perDiemOverride != null
      ? Number(tech.perDiemOverride)
      : Number(stateOfTech?.employeePerDiem) || 0;
    const uniqueDays = new Set(techJobs.map(job => job.date)).size;

    return dailyRate * uniqueDays;
  };

  const calculateCompanyPerDiem = (techId: number, techJobs: any[]) => {
    const tech = customTechnicians.find(technician => technician.id === techId);
    if (!tech) return 0;

    const stateOfTech = customStates.find(state => state.id === tech.stateId);
    const dailyRate = Number(stateOfTech?.companyPerDiem) || 0;
    const uniqueDays = new Set(techJobs.map(job => job.date)).size;

    return dailyRate * uniqueDays;
  };

  useEffect(() => {
    const prevFilter = prevTechFilterRef.current;
    
    if (prevFilter !== 'ALL' && prevFilter !== 'UNMATCHED') {
      const prevTechId = parseInt(prevFilter);
      if (!isNaN(prevTechId)) {
        setTechAdjustments(prev => ({
          ...prev,
          [prevTechId]: { perDiem, companyPerDiem, car: carDeduction, companyToolsCost, hotel: hotelDeduction }
        }));
      }
    }

    if (importerTechFilter !== 'ALL' && importerTechFilter !== 'UNMATCHED') {
      const nextTechId = parseInt(importerTechFilter);
      if (!isNaN(nextTechId)) {
        const adj = techAdjustments[nextTechId];
        if (adj) {
          setPerDiem(adj.perDiem);
          setCompanyPerDiem(adj.companyPerDiem || '0.00');
          setCarDeduction(adj.car);
          setCompanyToolsCost(adj.companyToolsCost || '0.00');
          setHotelDeduction(adj.hotel);
        } else {
          const techJobs = parsedJobs.filter(j => j.matchedTechId === nextTechId);
          const tech = customTechnicians.find(t => t.id === nextTechId);
          
          setPerDiem(calculateTechnicianPerDiem(nextTechId, techJobs).toFixed(2));
          setCompanyPerDiem(calculateCompanyPerDiem(nextTechId, techJobs).toFixed(2));
          setCarDeduction((Number(tech?.carToolsDeduction) || 0).toFixed(2));
          setCompanyToolsCost((Number(tech?.companyToolsCost) || 0).toFixed(2));
          setHotelDeduction('0.00');
        }
      }
    }
    
    prevTechFilterRef.current = importerTechFilter;
  }, [importerTechFilter, parsedJobs]);

  const filteredParsedJobs = useMemo(() => {
    if (importerTechFilter === 'ALL') return parsedJobs;
    if (importerTechFilter === 'UNMATCHED') return parsedJobs.filter(j => !j.matchedTechId);
    return parsedJobs.filter(j => j.matchedTechId === parseInt(importerTechFilter));
  }, [parsedJobs, importerTechFilter]);

  // Employee Manager section states
  const [activeEmployeeTab, setActiveEmployeeTab] = useState<'techs' | 'fleet'>('techs');
  const [employeesSearchQuery, setEmployeesSearchQuery] = useState('');
  const [employeesStateFilter, setEmployeesStateFilter] = useState('ALL');
  const [employeesStatusFilter, setEmployeesStatusFilter] = useState('ALL');

  // Technician Edit/Add Modal states
  const [isTechModalOpen, setIsTechModalOpen] = useState(false);
  const [editingTech, setEditingTech] = useState<Technician | null>(null);
  const [previewStatement, setPreviewStatement] = useState<TechDocument | null>(null);
  const [techForm, setTechForm] = useState({
    name: '',
    phone: '',
    email: '',
    username: '',
    password: '',
    status: 'ACTIVE' as TechStatus,
    workType: 'BURY' as WorkType,
    stateCode: 'TN',
    vehicleId: '',
    payoutType: 'PERCENTAGE' as PayoutType,
    payoutValue: '8',
    perDiemOverride: '',
    carToolsDeduction: '0.00',
    companyToolsCost: '0.00',
    defaultProvider: '',
    notes: ''
  });

  // Vehicle Edit/Add Modal states
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [vehicleForm, setVehicleForm] = useState({
    make: '',
    model: '',
    year: '',
    vin: '',
    plateNumber: '',
    ownershipType: 'COMPANY' as OwnershipType,
    status: 'ACTIVE' as VehicleStatus
  });

  // Job Dispatch Modal states
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [jobForm, setJobForm] = useState({
    date: '',
    technicianId: '',
    provider: 'Xfinity',
    ratePlanCode: '',
    cityId: ''
  });

  // Job Dispatch Handlers
  const handleAddJobClick = () => {
    const activeTechs = customTechnicians.filter(t => t.status === 'ACTIVE');
    const firstTech = activeTechs[0];
    const techId = firstTech ? firstTech.id.toString() : '';
    
    let techState = 'TN';
    if (firstTech) {
      techState = firstTech.stateCode;
    }
    const stateRates = customRatePlans.filter(r => r.stateCode === techState);
    const defaultRate = stateRates[0] ? stateRates[0].code : '';
    const defaultProvider = stateRates[0] ? stateRates[0].provider : 'Xfinity';

    const stateObj = customStates.find(s => s.code === techState);
    const stateCities = stateObj ? customCities.filter(c => c.stateId === stateObj.id) : [];
    const defaultCityId = stateCities[0] ? stateCities[0].id.toString() : '';

    setJobForm({
      date: new Date().toISOString().split('T')[0],
      technicianId: techId,
      provider: defaultProvider,
      ratePlanCode: defaultRate,
      cityId: defaultCityId
    });
    setIsJobModalOpen(true);
  };

  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobForm.technicianId || !jobForm.ratePlanCode || !jobForm.cityId) {
      await customAlert('Please ensure Technician, Job Code, and City are selected.', 'Validation Error');
      return;
    }

    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobForm),
      });

      if (res.ok) {
        const newJob = await res.json();
        setCustomJobLogs(prev => [newJob, ...prev]);
        setIsJobModalOpen(false);
      } else {
        const errData = await res.json();
        await customAlert(errData.error || 'Failed to dispatch job log.', 'Error');
      }
    } catch (err) {
      console.error('Error saving job:', err);
    }
  };

  // Technician handlers
  const handleAddTechClick = () => {
    setEditingTech(null);
    setTechForm({
      name: '',
      phone: '',
      email: '',
      username: '',
      password: '',
      status: 'ACTIVE',
      workType: 'BURY',
      stateCode: selectedStateCode || 'TN',
      vehicleId: '',
      payoutType: 'PERCENTAGE',
      payoutValue: '8',
      perDiemOverride: '',
      carToolsDeduction: '0.00',
      companyToolsCost: '0.00',
      defaultProvider: '',
      notes: ''
    });
    setTechModalTab('profile');
    setIsTechModalOpen(true);
  };

  const fetchTechUploads = async (techId: number) => {
    setLoadingUploads(true);
    setTechUploads([]);
    setTechUploadStats({ totalCount: 0, todayCount: 0, monthCount: 0, avgPerDay: 0 });
    try {
      const res = await fetch(`/api/v1/uploads?technicianId=${techId}`);
      if (res.ok) {
        const data = await res.json();
        setTechUploads(data.uploads || []);
        setTechUploadStats({
          totalCount: data.totalCount || 0,
          todayCount: data.todayCount || 0,
          monthCount: data.monthCount || 0,
          avgPerDay: data.avgPerDay || 0,
        });
      }
    } catch (err) {
      console.error('Failed to fetch tech uploads:', err);
    } finally {
      setLoadingUploads(false);
    }
  };

  useEffect(() => {
    if (editingTech?.id && isTechModalOpen) {
      fetchTechUploads(editingTech.id);
    }
  }, [editingTech?.id, isTechModalOpen]);

  const handleEditTechClick = (tech: Technician) => {
    setEditingTech(tech);
    fetchTechUploads(tech.id);
    const techVehicle = customVehicles.find(v => v.technicianId === tech.id);
    const vehicleId = techVehicle ? techVehicle.id.toString() : '';

    setTechForm({
      name: tech.name,
      phone: tech.phone,
      email: tech.email,
      username: tech.username ?? '',
      password: tech.password ?? '',
      status: tech.status,
      workType: tech.workType,
      stateCode: tech.stateCode,
      vehicleId,
      payoutType: tech.payoutType ?? 'PERCENTAGE',
      payoutValue: (tech.payoutValue ?? 8).toString(),
      perDiemOverride: tech.perDiemOverride != null ? tech.perDiemOverride.toString() : '',
      carToolsDeduction: (tech.carToolsDeduction ?? 0).toString(),
      companyToolsCost: (tech.companyToolsCost ?? 0).toString(),
      defaultProvider: tech.defaultProvider ?? '',
      notes: tech.notes ?? ''
    });
    setTechModalTab('profile');
    setIsTechModalOpen(true);
  };

  // ─── Document Handlers ────────────────────────────────────────────────────
  const handleUploadDocument = (
    techId: number,
    file: File,
    category: TechDocument['category']
  ) => {
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      
      try {
        const res = await fetch('/api/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            technicianId: techId,
            name: file.name,
            fileType: file.type || 'application/octet-stream',
            size: file.size,
            dataUrl,
            category,
          }),
        });

        if (res.ok) {
          const doc = await res.json();
          setCustomDocuments(prev => [...prev, doc]);
        }
      } catch (err) {
        console.error('Error uploading document:', err);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteDocument = async (docId: string) => {
    if (await customConfirm('Delete this document? This cannot be undone.', 'Delete Document')) {
      try {
        const res = await fetch(`/api/documents?id=${docId}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          const result = await res.json();
          setCustomDocuments(prev => prev.filter(d => d.id !== docId));
          if (result.batchId) {
            setCustomJobLogs(prev => prev.filter(job => !(
              job.batchId === result.batchId && job.technicianId === result.technicianId
            )));
          }
        }
      } catch (err) {
        console.error('Error deleting document:', err);
      }
    }
  };

  const handleDownloadDocument = (doc: TechDocument) => {
    const a = document.createElement('a');
    a.href = doc.dataUrl;
    a.download = doc.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  // ──────────────────────────────────────────────────────────────────────────

  const handleSaveTech = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!techForm.name.trim() || !techForm.email.trim() || !techForm.phone.trim()) {
      await customAlert('Please fill in Name, Email, and Phone.', 'Validation Error');
      return;
    }

    try {
      const isEdit = !!editingTech;
      const url = '/api/techs';
      const method = isEdit ? 'PUT' : 'POST';
      const body = {
        ...techForm,
        id: isEdit ? editingTech.id : undefined,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const savedTech = await res.json();
        
        if (isEdit) {
          setCustomTechnicians(prev => prev.map(t => t.id === editingTech.id ? savedTech : t));
        } else {
          setCustomTechnicians(prev => [...prev, savedTech]);
        }

        // Update local vehicles to match new assignment
        setCustomVehicles(prev => {
          let updated = prev.map(v => {
            if (v.technicianId === savedTech.id) {
              return { ...v, technicianId: undefined };
            }
            return v;
          });

          if (techForm.vehicleId) {
            const vId = parseInt(techForm.vehicleId);
            updated = updated.map(v => {
              if (v.id === vId) {
                return { ...v, technicianId: savedTech.id };
              }
              return v;
            });
          }
          return updated;
        });

        setIsTechModalOpen(false);
        setEditingTech(null);
      } else {
        const errData = await res.json();
        await customAlert(errData.error || 'Failed to save technician.', 'Error');
      }
    } catch (err) {
      console.error('Error saving technician:', err);
    }
  };

  const handleDeleteTech = async (techId: number) => {
    if (await customConfirm('Are you sure you want to delete this field technician? Any vehicles assigned to them will be unassigned.', 'Delete Technician')) {
      try {
        const res = await fetch(`/api/techs?id=${techId}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          setCustomTechnicians(prev => prev.filter(t => t.id !== techId));
          setCustomVehicles(prev => prev.map(v => v.technicianId === techId ? { ...v, technicianId: undefined } : v));
          if (selectedTechId === techId) {
            setSelectedTechId(null);
          }
        }
      } catch (err) {
        console.error('Error deleting technician:', err);
      }
    }
  };

  // Weekly spreadsheet parsing and matching helpers
  const matchTechnician = (techString: string) => {
    if (!techString) return null;
    
    // Clean string by removing parentheses, brackets, numbers, and noise
    const cleanTokens = techString
      .replace(/[\(\)\[\]\:\,\.\_]/g, ' ')
      .replace(/\b\d{3,}\b/g, '') // remove 3+ digit IDs like 4171, 0967
      .replace(/[\d]/g, '')
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter(t => t.length >= 2);

    if (cleanTokens.length > 0) {
      // 1. Try exact or multi-token match against technicians
      for (const t of customTechnicians) {
        const tNameLower = t.name.toLowerCase();
        const tTokens = tNameLower.split(/\s+/);
        
        // Check if all tokens of tech's name appear in techString or cleanTokens
        const matchesAllTechTokens = tTokens.every(token => 
          cleanTokens.some(ct => ct.includes(token) || token.includes(ct))
        );
        
        if (matchesAllTechTokens) {
          return t.id;
        }

        // Check if any significant token matches if tech has multi-word name
        const matchesAnyTechToken = tTokens.some(token => token.length > 3 && cleanTokens.includes(token));
        if (matchesAnyTechToken) {
          return t.id;
        }
      }
    }

    // 2. Fallback: Match by DB id number if technician ID is explicitly passed
    const digitsMatch = techString.match(/\b\d+\b/);
    if (digitsMatch) {
      const idNum = parseInt(digitsMatch[0]);
      const foundById = customTechnicians.find(t => t.id === idNum);
      if (foundById) return foundById.id;
    }

    return null;
  };

  const calculateJobPayout = (
    grossAmount: number,
    quantity: number,
    matchedTechId: number | null,
    jobStateCode: string,
    jobCode?: string,
    jobProvider?: string
  ) => {
    const gross = grossAmount * quantity;
    let cutPct = 8.00;
    let profit = 0;
    let payout = 0;
    let isCustom = false;

    const stateCode = matchedTechId
      ? (customTechnicians.find(t => t.id === matchedTechId)?.stateCode || jobStateCode)
      : jobStateCode;
    const stateObj = customStates.find(s => s.code === stateCode);
    const stateCut = stateObj ? Number(stateObj.defaultCut ?? 8.00) : 8.00;

    if (matchedTechId) {
      const tech = customTechnicians.find(t => t.id === matchedTechId);
      if (tech) {
        // Step 1: Check Employee Profile Payout % / Value
        const hasCustomPayout = Number(tech.payoutValue) > 0;
        if (hasCustomPayout) {
          isCustom = true;
          cutPct = Number(tech.payoutValue);
          if (tech.payoutType === 'PERCENTAGE') {
            profit = gross * (cutPct / 100);
          } else {
            profit = cutPct * quantity;
          }
          payout = Math.max(0, gross - profit);
          return { companyCutPct: cutPct, companyProfit: profit, techPayout: payout, isCustom };
        }

        // Step 2: Check Assigned Provider Rate Plans
        const targetProvider = tech.defaultProvider || jobProvider;
        if (targetProvider && jobCode) {
          const matchingPlan = customRatePlans.find(rp =>
            rp.stateCode === stateCode &&
            rp.provider.toLowerCase() === targetProvider.toLowerCase() &&
            rp.code.toLowerCase() === jobCode.toLowerCase()
          );

          if (matchingPlan) {
            isCustom = true;
            const companyRate = Number(matchingPlan.grossPrice) || 0;
            const employeeRate = Number(matchingPlan.employeePrice) || 0;
            
            payout = employeeRate * quantity;
            profit = (companyRate - employeeRate) * quantity;
            cutPct = companyRate > 0 ? Math.max(0, ((companyRate - employeeRate) / companyRate) * 100) : stateCut;
            return { companyCutPct: cutPct, companyProfit: profit, techPayout: payout, isCustom };
          }
        }

        // Step 3: Fallback: Check Average Rate for Job Code in State across providers
        if (jobCode) {
          const stateJobPlans = customRatePlans.filter(rp =>
            rp.stateCode === stateCode &&
            rp.code.toLowerCase() === jobCode.toLowerCase()
          );

          if (stateJobPlans.length > 0) {
            isCustom = true;
            const avgCompRate = stateJobPlans.reduce((acc, p) => acc + Number(p.grossPrice), 0) / stateJobPlans.length;
            const avgEmpRate = stateJobPlans.reduce((acc, p) => acc + Number(p.employeePrice), 0) / stateJobPlans.length;

            payout = avgEmpRate * quantity;
            profit = (avgCompRate - avgEmpRate) * quantity;
            cutPct = avgCompRate > 0 ? Math.max(0, ((avgCompRate - avgEmpRate) / avgCompRate) * 100) : stateCut;
            return { companyCutPct: cutPct, companyProfit: profit, techPayout: payout, isCustom };
          }
        }

        // Fallback to State Cut
        cutPct = stateCut;
        profit = gross * (stateCut / 100);
        payout = Math.max(0, gross - profit);
        return { companyCutPct: cutPct, companyProfit: profit, techPayout: payout, isCustom };
      }
    }

    // Unmatched tech fallback
    cutPct = stateCut;
    profit = gross * (cutPct / 100);
    payout = Math.max(0, gross - profit);
    return { companyCutPct: cutPct, companyProfit: profit, techPayout: payout, isCustom };
  };

  const decodeCsvContent = (dataUrl: string): string => {
    if (!dataUrl) return '';
    try {
      if (dataUrl.includes(';base64,')) {
        const parts = dataUrl.split(';base64,');
        if (parts.length > 1) {
          return decodeURIComponent(escape(atob(parts[1])));
        }
      }
      return dataUrl;
    } catch (e) {
      console.error('Error decoding CSV:', e);
      return '';
    }
  };

  const handleParseSheet = async () => {
    if (!importRawText.trim()) {
      await customAlert('Please paste some Excel or CSV data first.', 'Empty Input');
      return;
    }

    const parseLocaleFloat = (val: string): number => {
      if (!val) return 0;
      let clean = val.trim();
      if (clean.includes(',') && clean.includes('.')) {
        const commaIdx = clean.indexOf(',');
        const dotIdx = clean.indexOf('.');
        if (commaIdx < dotIdx) {
          clean = clean.replace(/,/g, '');
        } else {
          clean = clean.replace(/\./g, '').replace(/,/g, '.');
        }
      } else if (clean.includes(',')) {
        clean = clean.replace(/,/g, '.');
      }
      clean = clean.replace(/\s/g, '').replace(/[^\d\.\-]/g, '');
      const parsed = parseFloat(clean);
      return isNaN(parsed) ? 0 : parsed;
    };

    const formatParsedDate = (dStr: string): string => {
      if (!dStr) return new Date().toISOString().split('T')[0];
      const trimmed = dStr.trim();
      const parts = trimmed.split(/[\/\.\-]/);
      if (parts.length === 3) {
        let [p1, p2, p3] = parts;
        if (p3.length === 4) {
          let num1 = parseInt(p1);
          let year = p3;
          if (num1 > 12) {
            return `${year}-${p2.padStart(2, '0')}-${p1.padStart(2, '0')}`;
          } else {
            return `${year}-${p1.padStart(2, '0')}-${p2.padStart(2, '0')}`;
          }
        } else if (p1.length === 4) {
          return `${p1}-${p2.padStart(2, '0')}-${p3.padStart(2, '0')}`;
        }
      }
      return trimmed;
    };
    
    const lines = importRawText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return;
    
    // Delimiter detection (TSV vs CSV)
    let tabsCount = 0;
    let commasCount = 0;
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      tabsCount += (lines[i].match(/\t/g) || []).length;
      commasCount += (lines[i].match(/,/g) || []).length;
    }
    const delimiter = tabsCount >= commasCount && tabsCount > 0 ? '\t' : ',';
    
    const tempParsedJobs: any[] = [];
    let headers: string[] = [];
    let hasHeaderRow = false;
    
    const cleanCell = (val: string) => {
      if (!val) return '';
      return val.replace(/^["']|["']$/g, '').trim();
    };

    // Analyze first line for header row
    const firstRowCells = lines[0].split(delimiter).map(cleanCell);
    const isHeader = firstRowCells.some(cell => 
      /date|tech|employee|client|provider|job|city|state|zip|code|description|quantity|total|amount|столбец/i.test(cell)
    );

    let dateIdx = -1;
    let techIdx = -1;
    let clientIdx = -1;
    let regionIdx = -1;
    let jobIdx = -1;
    let cityIdx = -1;
    let stateIdx = -1;
    let zipIdx = -1;
    let jobCodeIdx = -1;
    let descIdx = -1;
    let qtyIdx = -1;
    let amountIdx = -1;

    if (isHeader) {
      hasHeaderRow = true;
      headers = firstRowCells.map(h => h.toLowerCase());
      
      const findHeader = (regex: RegExp, excludeRegex?: RegExp) => {
        return headers.findIndex(h => regex.test(h) && !(excludeRegex && excludeRegex.test(h)));
      };

      dateIdx = findHeader(/date|дата/i);
      techIdx = findHeader(/tech|employee|contractor|техник|сотрудник/i);
      clientIdx = findHeader(/client|provider|vendor|провайдер/i);
      regionIdx = findHeader(/region|регион/i);
      jobIdx = findHeader(/job\s*#|job\s*id|work\s*order|order|заказ/i, /job\s*code/i);
      if (jobIdx === -1) jobIdx = findHeader(/job/i, /job\s*code/i);
      cityIdx = findHeader(/city|город/i);
      stateIdx = findHeader(/state|штат/i);
      zipIdx = findHeader(/zip|postal/i);
      jobCodeIdx = findHeader(/job\s*code|^code$|код/i, /zip/i);
      descIdx = findHeader(/description|desc|описание/i);
      qtyIdx = findHeader(/quantity|qty|units|кол-во/i);
      amountIdx = findHeader(/total|amount|price|gross|sum|сумма|рейт/i);
    }

    // Determine row format if header row was absent or incomplete
    const sampleDataRow = (hasHeaderRow && lines.length > 1 ? lines[1] : lines[0]).split(delimiter).map(cleanCell);
    const colCount = sampleDataRow.length;

    if (colCount <= 6 && (amountIdx === -1 || jobCodeIdx === -1)) {
      // 4-5 column compact format (e.g. Date | Employee | Job # | Code | Amount)
      if (dateIdx === -1) dateIdx = 0;
      if (techIdx === -1) techIdx = 1;
      if (jobIdx === -1) jobIdx = colCount >= 5 ? 2 : -1;
      if (jobCodeIdx === -1) jobCodeIdx = colCount >= 5 ? 3 : 2;
      if (amountIdx === -1) amountIdx = colCount >= 5 ? 4 : 3;
    } else if (colCount >= 10 && (amountIdx === -1 || jobCodeIdx === -1)) {
      // 14-column full format (Date, Tech, Client, Region, Job, Account, Address, City, State, Zip, Job Code, Description, Quantity, Total)
      if (dateIdx === -1) dateIdx = 0;
      if (techIdx === -1) techIdx = 1;
      if (clientIdx === -1) clientIdx = 2;
      if (regionIdx === -1) regionIdx = 3;
      if (jobIdx === -1) jobIdx = 4;
      if (cityIdx === -1) cityIdx = 7;
      if (stateIdx === -1) stateIdx = 8;
      if (zipIdx === -1) zipIdx = 9;
      if (jobCodeIdx === -1) jobCodeIdx = 10;
      if (descIdx === -1) descIdx = 11;
      if (qtyIdx === -1) qtyIdx = 12;
      if (amountIdx === -1) amountIdx = 13;
    } else {
      if (dateIdx === -1) dateIdx = 0;
      if (techIdx === -1) techIdx = 1;
      if (jobCodeIdx === -1) jobCodeIdx = Math.min(2, colCount - 1);
      if (amountIdx === -1) amountIdx = colCount - 1;
    }
    
    const startRow = hasHeaderRow ? 1 : 0;
    
    for (let i = startRow; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const cells = lines[i].split(delimiter).map(cleanCell);
      if (cells.length < 2) continue;
      
      const dateRaw = dateIdx !== -1 ? (cells[dateIdx] || '') : '';
      const techName = techIdx !== -1 ? (cells[techIdx] || '') : '';
      const descVal = descIdx !== -1 ? (cells[descIdx] || '') : '';
      const descClean = descVal.trim().toLowerCase();
      
      // Skip empty rows, summary rows, or rows without date/tech/code
      if (
        (!dateRaw.trim() && !techName.trim()) ||
        descClean === 'per diem' ||
        descClean === 'car' ||
        descClean === 'hotel' ||
        descClean === 'total' ||
        descClean === 'subtotal' ||
        techName.toLowerCase() === 'total' ||
        dateRaw.toLowerCase() === 'total' ||
        cells.every(c => !c.trim())
      ) {
        continue;
      }
      
      const finalDateVal = formatParsedDate(dateRaw);
      const clientVal = clientIdx !== -1 ? (cells[clientIdx] || 'Spectrum') : 'Spectrum';
      const mappedProvider = clientVal.toLowerCase().includes('charter') ? 'Spectrum' : clientVal;
      
      const regionVal = regionIdx !== -1 ? (cells[regionIdx] || '') : '';
      const jobRef = jobIdx !== -1 ? (cells[jobIdx] || `WO-${Math.floor(Math.random() * 900000 + 100000)}`) : `WO-${Math.floor(Math.random() * 900000 + 100000)}`;
      const cityVal = cityIdx !== -1 ? (cells[cityIdx] || '') : '';
      let stateVal = stateIdx !== -1 ? (cells[stateIdx] || '') : '';
      const zipVal = zipIdx !== -1 ? (cells[zipIdx] || '') : '';
      const jobCodeVal = jobCodeIdx !== -1 ? (cells[jobCodeIdx] || 'RDP') : 'RDP';
      
      const qtyStr = qtyIdx !== -1 && cells[qtyIdx] ? cells[qtyIdx].replace(/[^\d]/g, '') : '1';
      const qtyVal = parseInt(qtyStr) || 1;
      
      const priceRaw = amountIdx !== -1 ? (cells[amountIdx] || '') : '';
      let priceVal = parseLocaleFloat(priceRaw);
      
      const techId = matchTechnician(techName);
      
      // If state is missing from row, resolve state from matched technician
      if (!stateVal && techId) {
        const matchedTech = customTechnicians.find(t => t.id === techId);
        if (matchedTech) {
          const techState = customStates.find(s => s.id === matchedTech.stateId);
          if (techState) {
            stateVal = techState.code;
          }
        }
      }

      // If price/amount is missing from row, lookup RatePlan by code
      if (priceVal === 0 && jobCodeVal) {
        const rp = customRatePlans.find(r => r.code.toUpperCase() === jobCodeVal.trim().toUpperCase());
        if (rp) {
          priceVal = rp.grossPrice;
        }
      }

      const stateCodeVal = stateVal || 'TN';
      const calc = calculateJobPayout(priceVal, qtyVal, techId, stateCodeVal, jobCodeVal, mappedProvider);
      
      tempParsedJobs.push({
        tempId: Math.random().toString(36).substring(2, 9),
        date: finalDateVal,
        techNameRaw: techName,
        matchedTechId: techId,
        provider: mappedProvider,
        regionCode: regionVal,
        jobRef,
        city: cityVal,
        stateCode: stateCodeVal,
        zipCode: zipVal,
        jobCode: jobCodeVal,
        description: descVal || 'Residential Installation',
        quantity: qtyVal,
        grossAmount: priceVal,
        companyCutPct: calc.companyCutPct,
        companyProfit: calc.companyProfit,
        techPayout: calc.techPayout,
        isValid: techId !== null,
        rawCells: cells
      });
    }
    
    if (tempParsedJobs.length === 0) {
      await customAlert('Could not parse any valid jobs from the pasted text.', 'Parsing Error');
      return;
    }
    
    setParsedJobs(tempParsedJobs);
  };

  const handleUpdateRowTech = (rowTempId: string, techId: number) => {
    setParsedJobs(prev => prev.map(job => {
      if (job.tempId === rowTempId) {
        const calc = calculateJobPayout(job.grossAmount, job.quantity, techId, job.stateCode, job.jobCode, job.provider);
        return {
          ...job,
          matchedTechId: techId,
          companyCutPct: calc.companyCutPct,
          companyProfit: calc.companyProfit,
          techPayout: calc.techPayout,
          isValid: true
        };
      }
      return job;
    }));
  };

  const handleUpdateRowValue = (rowTempId: string, field: string, value: any) => {
    setParsedJobs(prev => prev.map(job => {
      if (job.tempId === rowTempId) {
        const updated = { ...job, [field]: value };
        const calc = calculateJobPayout(updated.grossAmount, updated.quantity, updated.matchedTechId, updated.stateCode, updated.jobCode, updated.provider);
        updated.companyCutPct = calc.companyCutPct;
        updated.companyProfit = calc.companyProfit;
        updated.techPayout = calc.techPayout;
        return updated;
      }
      return job;
    }));
  };

  const handleBulkSetState = (newStateCode: string) => {
    if (!newStateCode) return;
    setParsedJobs(prev => prev.map(job => {
      const updated = { ...job, stateCode: newStateCode };
      const calc = calculateJobPayout(updated.grossAmount, updated.quantity, updated.matchedTechId, updated.stateCode, updated.jobCode, updated.provider);
      updated.companyCutPct = calc.companyCutPct;
      updated.companyProfit = calc.companyProfit;
      updated.techPayout = calc.techPayout;
      return updated;
    }));
  };

  const handleBulkSetEmployee = (techIdStr: string) => {
    if (!techIdStr) return;
    const techId = parseInt(techIdStr);
    setParsedJobs(prev => prev.map(job => {
      const calc = calculateJobPayout(job.grossAmount, job.quantity, techId, job.stateCode, job.jobCode, job.provider);
      return {
        ...job,
        matchedTechId: techId,
        companyCutPct: calc.companyCutPct,
        companyProfit: calc.companyProfit,
        techPayout: calc.techPayout,
        isValid: true
      };
    }));
  };

  const handleQuickCreateTech = async (rawName: string, stateCode: string) => {
    const cleanName = rawName.replace(/[\d\-\_\#\.\,\s]+/g, ' ').trim();
    const finalName = cleanName || `Tech`;
    
    try {
      const res = await fetch('/api/techs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: finalName,
          phone: '+1 (555) 555-0100',
          email: `${finalName.toLowerCase().replace(/\\s+/g, '')}@netcore.com`,
          status: 'ACTIVE',
          workType: 'BURY',
          stateCode: stateCode || 'TN',
          payoutType: 'PERCENTAGE',
          payoutValue: '8'
        }),
      });

      if (res.ok) {
        const newTech = await res.json();
        
        setCustomTechnicians(prev => [...prev, newTech]);
        
        setParsedJobs(prev => prev.map(job => {
          if (job.techNameRaw === rawName) {
            const calc = calculateJobPayout(job.grossAmount, job.quantity, newTech.id, job.stateCode);
            return {
              ...job,
              matchedTechId: newTech.id,
              companyCutPct: calc.companyCutPct,
              companyProfit: calc.companyProfit,
              techPayout: calc.techPayout,
              isValid: true
            };
          }
          return job;
        }));
      } else {
        const errData = await res.json();
        await customAlert(errData.error || 'Failed to quick-create technician.', 'Error');
      }
    } catch (err) {
      console.error('Error quick-creating technician:', err);
    }
  };

  const handleExportProcessedCSV = async (techId: number | null) => {
    if (parsedJobs.length === 0) return;
    
    const jobsToExport = techId 
      ? parsedJobs.filter(j => j.matchedTechId === techId)
      : parsedJobs;
      
    if (jobsToExport.length === 0) {
      await customAlert('No parsed jobs for this selection.', 'Empty Export');
      return;
    }
    
    const tech = customTechnicians.find(t => t.id === techId);
    const techName = tech ? tech.name : 'Combined_Techs';
    
    let csvContent = 'Date,Tech,Client,Job ID,Address,City,State,Zip Code,Job Code,Description,Quantity,Gross Amount,Company Cut %,Company Profit,Tech Payout\n';
    
    let totalGross = 0;
    let totalProfit = 0;
    let totalTechPayout = 0;
    
    jobsToExport.forEach(job => {
      const gross = job.grossAmount * job.quantity;
      const profit = job.companyProfit;
      const payout = job.techPayout;
      
      totalGross += gross;
      totalProfit += profit;
      totalTechPayout += payout;
      
      const date = job.date;
      const tName = job.techNameRaw.replace(/"/g, '""');
      const client = job.provider.replace(/"/g, '""');
      const jobRef = job.jobRef;
      const addr = '';
      const city = job.city.replace(/"/g, '""');
      const state = job.stateCode;
      const zip = job.zipCode;
      const code = job.jobCode;
      const desc = job.description.replace(/"/g, '""');
      const qty = job.quantity;
      const rate = job.grossAmount;
      const cutVal = job.companyCutPct;
      
      csvContent += `"${date}","${tName}","${client}","${jobRef}","${addr}","${city}","${state}","${zip}","${code}","${desc}",${qty},${rate.toFixed(2)},${cutVal},${profit.toFixed(2)},${payout.toFixed(2)}\n`;
    });
    
    csvContent += '\n';
    csvContent += `,,,,,,,,,,Total Gross Amount,,${totalGross.toFixed(2)}\n`;
    csvContent += `,,,,,,,,,,Total Company Cut,,${totalProfit.toFixed(2)}\n`;
    csvContent += `,,,,,,,,,,Total Tech Payout Subtotal,,${totalTechPayout.toFixed(2)}\n`;
    
    if (techId) {
      const pd = parseFloat(perDiem) || 0;
      const car = parseFloat(carDeduction) || 0;
      const hotel = parseFloat(hotelDeduction) || 0;
      const netPayout = totalTechPayout + pd - car - hotel;
      
      csvContent += `,,,,,,,,,,Per Diem,,${pd.toFixed(2)}\n`;
      csvContent += `,,,,,,,,,,Tools and Car,,-${(car + hotel).toFixed(2)}\n`;
      csvContent += `,,,,,,,,,,Net Technician Payout,,${netPayout.toFixed(2)}\n`;
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `NETCORE_Payout_${techName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };



  const handleCommitParsedJobs = async () => {
    const hasUnmatched = parsedJobs.some(j => !j.matchedTechId);
    if (hasUnmatched) {
      await customAlert('There are unmatched technicians in the list. Please match or create technicians for all rows before proceeding.', 'Unmatched Technicians');
      return;
    }
    
    try {
      // 1. Commit all jobs to the database
      const res = await fetch('/api/jobs/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobs: parsedJobs }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to import bulk jobs.');
      }

      const data = await res.json();
      setCustomJobLogs(prev => [...data.jobs, ...prev]);
      const batchId = data.jobs[0]?.batchId;

      // 2. Group the parsed jobs by technician to generate statements
      const jobsByTech: Record<number, any[]> = {};
      parsedJobs.forEach(job => {
        const tId = job.matchedTechId;
        if (!jobsByTech[tId]) {
          jobsByTech[tId] = [];
        }
        jobsByTech[tId].push(job);
      });

      // 3. For each technician, compile a payout statement CSV and upload it
      const savedDocuments: TechDocument[] = [];
      for (const [techIdStr, techJobs] of Object.entries(jobsByTech)) {
        const techId = parseInt(techIdStr);
        const tech = customTechnicians.find(t => t.id === techId);
        if (!tech) continue;

        // Determine date range for filename and header
        const dates = techJobs.map(j => new Date(j.date)).filter(d => !isNaN(d.getTime()));
        const maxDateObj = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : new Date();
        const minDateObj = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : new Date();
        
        const formatDateString = (d: Date) => {
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const year = d.getFullYear();
          return `${month}.${day}.${year}`;
        };

        const fileDateStr = formatDateString(maxDateObj); // e.g. "06.27.2026"
        const fileName = `${fileDateStr} ${tech.name}.csv`;

        // Calculate adjustments
        const currentTechAdjustment = importerTechFilter === techId.toString()
          ? { perDiem, car: carDeduction, hotel: hotelDeduction }
          : techAdjustments[techId];
        const adj = currentTechAdjustment || {
          perDiem: calculateTechnicianPerDiem(techId, techJobs).toFixed(2),
          car: (Number(tech.carToolsDeduction) || 0).toFixed(2),
          hotel: '0.00',
        };
        const pdVal = parseFloat(adj.perDiem) || 0;
        const carVal = parseFloat(adj.car) || 0;
        const hotelVal = parseFloat(adj.hotel) || 0;

        const formatStatementDate = (value: string) => {
          const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value);
          if (isNaN(date.getTime())) return value;

          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${month}/${day}/${date.getFullYear()}`;
        };

        const cleanStatementCell = (value: unknown) => String(value ?? '')
          .replace(/[\t\r\n]+/g, ' ')
          .trim();

        const createStatementRow = (values: unknown[]) => values
          .map(cleanStatementCell)
          .join('\t');

        let csv = '';
        let payoutTotal = 0;

        techJobs.forEach(job => {
          payoutTotal += job.techPayout;
          const rawCells = job.rawCells || [];
          csv += createStatementRow([
            formatStatementDate(job.date),
            tech.name,
            job.provider,
            job.regionCode,
            job.jobRef,
            rawCells[5],
            rawCells[6],
            job.city,
            job.stateCode,
            job.zipCode,
            job.jobCode,
            job.description,
            job.quantity,
            job.techPayout.toFixed(2).replace('.', ','),
          ]) + '\n';
        });

        const toolsAndCar = carVal + hotelVal;
        const netPayout = payoutTotal + pdVal - toolsAndCar;
        const summaryRow = (label: string, amount?: number) => createStatementRow([
          '', '', '', '', '', '', '', '', '', '', '', label, '',
          amount === undefined ? '' : amount.toFixed(2).replace('.', ','),
        ]);

        csv += '\n\n\n';
        csv += summaryRow('Per diem', pdVal) + '\n';
        csv += summaryRow('Tools and Car', -toolsAndCar) + '\n';
        csv += '\n';
        csv += summaryRow('Total', netPayout) + '\n';

        // Upload document
        const uploadRes = await fetch('/api/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            technicianId: techId,
            name: fileName,
            fileType: 'text/csv',
            size: csv.length,
            dataUrl: 'data:text/csv;base64,' + btoa(unescape(encodeURIComponent(csv))),
            category: 'PAYMENT',
            batchId,
          })
        });

        if (uploadRes.ok) {
          const newDoc = await uploadRes.json();
          savedDocuments.push(newDoc);
        }
      }

      setCustomDocuments(prev => [...savedDocuments, ...prev]);

      await customAlert(`Imported ${data.count} jobs successfully! Generated ${savedDocuments.length} weekly statements in the Payments tab of employee profiles.`, 'Payroll Processed');
      
      // Reset importer state
      setParsedJobs([]);
      setImportRawText('');
      setTechAdjustments({});
      setPerDiem('0.00');
      setCarDeduction('0.00');
      setHotelDeduction('0.00');
      setImporterTechFilter('ALL');
    } catch (err: any) {
      console.error('Error committing bulk jobs:', err);
      await customAlert(err.message || 'Error processing payroll', 'Error');
    }
  };

  // Vehicle handlers
  const handleAddVehicleClick = () => {
    setEditingVehicle(null);
    setVehicleForm({
      make: '',
      model: '',
      year: new Date().getFullYear().toString(),
      vin: '',
      plateNumber: '',
      ownershipType: 'COMPANY',
      status: 'ACTIVE'
    });
    setIsVehicleModalOpen(true);
  };

  const handleEditVehicleClick = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setVehicleForm({
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year.toString(),
      vin: vehicle.vin,
      plateNumber: vehicle.plateNumber,
      ownershipType: vehicle.ownershipType,
      status: vehicle.status
    });
    setIsVehicleModalOpen(true);
  };

  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleForm.make.trim() || !vehicleForm.model.trim() || !vehicleForm.vin.trim() || !vehicleForm.plateNumber.trim()) {
      await customAlert('Please fill in all vehicle details.', 'Validation Error');
      return;
    }

    try {
      const isEdit = !!editingVehicle;
      const url = '/api/vehicles';
      const method = isEdit ? 'PUT' : 'POST';
      const body = {
        ...vehicleForm,
        id: isEdit ? editingVehicle.id : undefined,
        technicianId: isEdit ? editingVehicle.technicianId : undefined,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const savedVehicle = await res.json();
        if (isEdit) {
          setCustomVehicles(prev => prev.map(v => v.id === editingVehicle.id ? savedVehicle : v));
        } else {
          setCustomVehicles(prev => [...prev, savedVehicle]);
        }
        setIsVehicleModalOpen(false);
        setEditingVehicle(null);
      } else {
        const errData = await res.json();
        await customAlert(errData.error || 'Failed to save vehicle.', 'Error');
      }
    } catch (err) {
      console.error('Error saving vehicle:', err);
    }
  };

  const handleDeleteVehicle = async (vehicleId: number) => {
    if (await customConfirm('Are you sure you want to delete this vehicle from the fleet registry?', 'Delete Vehicle')) {
      try {
        const res = await fetch(`/api/vehicles?id=${vehicleId}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          setCustomVehicles(prev => prev.filter(v => v.id !== vehicleId));
        }
      } catch (err) {
        console.error('Error deleting vehicle:', err);
      }
    }
  };

  // Candidates & Recruiting helper methods
  const handleAddCandidateClick = () => {
    setEditingCandidate(null);
    setCandidateForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      stateCode: selectedStateCode || 'TN',
      status: 'NEW',
      notes: '',
    });
    setIsCandidateModalOpen(true);
  };

  const handleEditCandidateClick = (candidate: Candidate) => {
    setEditingCandidate(candidate);
    setCandidateForm({
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      email: candidate.email,
      phone: candidate.phone || '',
      stateCode: candidate.stateCode,
      status: candidate.status || 'NEW',
      notes: candidate.notes || '',
    });
    setIsCandidateModalOpen(true);
  };

  const handleSaveCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateForm.firstName.trim() || !candidateForm.lastName.trim() || !candidateForm.email.trim() || !candidateForm.stateCode) {
      await customAlert('First Name, Last Name, Email, and State are required.', 'Validation Error');
      return;
    }

    try {
      const isEdit = !!editingCandidate;
      const url = '/api/candidates';
      const method = isEdit ? 'PUT' : 'POST';
      const body = {
        ...candidateForm,
        id: isEdit ? editingCandidate.id : undefined,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const saved = await res.json();
        if (isEdit) {
          setCustomCandidates(prev => prev.map(c => c.id === editingCandidate.id ? saved : c));
          await customAlert('Candidate updated successfully!', 'Success');
        } else {
          setCustomCandidates(prev => [saved, ...prev]);
          await customAlert('Candidate registered successfully!', 'Success');
        }
        setIsCandidateModalOpen(false);
        setEditingCandidate(null);
      } else {
        const err = await res.json();
        await customAlert(err.error || 'Failed to save candidate.', 'Error');
      }
    } catch (err) {
      console.error('Error saving candidate:', err);
    }
  };

  const handleUpdateCandidateStatus = async (candidateId: number, newStatus: string) => {
    try {
      const res = await fetch('/api/candidates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: candidateId, status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setCustomCandidates(prev => prev.map(c => c.id === candidateId ? updated : c));
      } else {
        const err = await res.json();
        await customAlert(err.error || 'Failed to update candidate status.', 'Error');
      }
    } catch (err) {
      console.error('Error updating candidate status:', err);
    }
  };

  const handleDeleteCandidate = async (id: number) => {
    if (await customConfirm('Are you sure you want to delete this candidate?', 'Delete Candidate')) {
      try {
        const res = await fetch(`/api/candidates?id=${id}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          setCustomCandidates(prev => prev.filter(c => c.id !== id));
          await customAlert('Candidate deleted successfully.', 'Success');
        } else {
          const err = await res.json();
          await customAlert(err.error || 'Failed to delete candidate.', 'Error');
        }
      } catch (err) {
        console.error('Error deleting candidate:', err);
      }
    }
  };

  const handleCopySigningLink = async (candidateId: number) => {
    try {
      const res = await fetch('/api/candidates/signing-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.signingLink) {
          if (navigator.clipboard) {
            await navigator.clipboard.writeText(data.signingLink);
          }
          await customAlert(`Online signing link generated!\n\nLink: ${data.signingLink}`, 'Success');
        }
      } else {
        const err = await res.json();
        await customAlert(err.error || 'Failed to generate signing link.', 'Error');
      }
    } catch (err) {
      console.error('Error generating signing link:', err);
      await customAlert('Failed to generate signing link.', 'Error');
    }
  };

  const handleOpenRatesConfig = (cand: Candidate) => {
    setSendRatesCandidate(cand);
    const defaultState = (cand.stateCode && cand.stateCode !== 'ANY' && customStates.some(s => s.code === cand.stateCode))
      ? cand.stateCode
      : (customStates[0]?.code || 'TN');
    setSendRatesStateCode(defaultState);
    const stObj = customStates.find(s => s.code === defaultState);
    setSendRatesCompanyCut(stObj ? (stObj.defaultCut ? Number(stObj.defaultCut).toFixed(2) : '8.00') : '8.00');
    setSendRatesPerDiem(stObj ? (stObj.employeePerDiem ? Number(stObj.employeePerDiem).toFixed(2) : '0.00') : '0.00');
    setSendRatesSelectedProviders([]);
    setIsSendRatesConfigOpen(true);
  };

  const handleSendRatesStateChange = (newCode: string) => {
    setSendRatesStateCode(newCode);
    setSendRatesSelectedProviders([]);
    const stObj = customStates.find(s => s.code === newCode);
    if (stObj) {
      setSendRatesCompanyCut(stObj.defaultCut ? Number(stObj.defaultCut).toFixed(2) : '8.00');
      setSendRatesPerDiem(stObj.employeePerDiem ? Number(stObj.employeePerDiem).toFixed(2) : '0.00');
    }
  };

  const handleConfirmSendRates = () => {
    if (!sendRatesCandidate) return;
    setIsSendRatesConfigOpen(false);
    handleOpenEmailPreview(
      sendRatesCandidate.id,
      'RATES',
      sendRatesStateCode,
      sendRatesSelectedProviders,
      sendRatesCompanyCut,
      sendRatesPerDiem
    );
  };

  const handleViewCandidateDocs = async (cand: Candidate) => {
    setSelectedCandForDocs(cand);
    setCandidateDocsList([]);
    setCandidateUploadLink(null);
    setCandidateDocsLoading(true);
    setIsCandidateDocsOpen(true);
    try {
      const res = await fetch(`/api/candidates/documents?candidateId=${cand.id}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setCandidateDocsList(data.documents || []);
      }
      const linkRes = await fetch('/api/candidates/upload-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId: cand.id }),
      });
      const linkData = await linkRes.json();
      if (linkRes.ok && linkData.uploadLink) {
        setCandidateUploadLink(linkData.uploadLink);
      }
    } catch (err) {
      console.error('Error fetching candidate documents:', err);
    } finally {
      setCandidateDocsLoading(false);
    }
  };

  const handleOpenEmailPreview = async (
    candidateId: number,
    templateType: string,
    stateCode?: string,
    selectedProviders?: string[],
    companyCutPercent?: number | string,
    perDiemOverride?: number | string
  ) => {
    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId,
          templateType,
          stateCode,
          selectedProviders,
          companyCutPercent,
          perDiemOverride,
          previewOnly: true,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.emailDetails) {
          setEmailPreviewData({
            candidateId,
            templateType,
            to: data.emailDetails.to,
            subject: data.emailDetails.subject,
            bodyHtml: data.emailDetails.bodyHtml,
            bodyText: data.emailDetails.bodyText,
            attachments: data.emailDetails.attachments || [],
            stateCode,
            companyCutPercent,
            perDiemOverride,
            availableProviders: data.emailDetails.availableProviders || [],
            selectedProviders: data.emailDetails.selectedProviders || data.emailDetails.availableProviders || [],
          });
          setEmailPreviewTab('preview');
          setIsEmailPreviewOpen(true);
        }
      } else {
        const err = await res.json();
        await customAlert(err.error || 'Failed to generate email preview.', 'Error');
      }
    } catch (err) {
      console.error('Error generating preview:', err);
    }
  };

  const handleToggleProviderFilter = async (provider: string) => {
    if (!emailPreviewData) return;
    const avail = emailPreviewData.availableProviders || [];
    if (avail.length === 0) return;

    const currentSelected = emailPreviewData.selectedProviders || avail;

    let newSelected: string[] = [];
    if (provider === 'ALL') {
      newSelected = [...avail];
    } else {
      if (currentSelected.length === avail.length || !currentSelected.includes(provider) || currentSelected.length > 1) {
        newSelected = [provider];
      } else {
        newSelected = [...avail];
      }
    }

    // Instantly update selectedProviders in local state for 0ms visual button feedback
    setEmailPreviewData(prev => prev ? {
      ...prev,
      selectedProviders: newSelected
    } : null);

    setIsUpdatingRates(true);

    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: emailPreviewData.candidateId,
          templateType: emailPreviewData.templateType,
          stateCode: emailPreviewData.stateCode,
          selectedProviders: newSelected,
          companyCutPercent: emailPreviewData.companyCutPercent,
          perDiemOverride: emailPreviewData.perDiemOverride,
          previewOnly: true,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.emailDetails) {
          setEmailPreviewData(prev => prev ? {
            ...prev,
            subject: data.emailDetails.subject,
            bodyHtml: data.emailDetails.bodyHtml,
            bodyText: data.emailDetails.bodyText,
            selectedProviders: data.emailDetails.selectedProviders || newSelected,
            availableProviders: data.emailDetails.availableProviders || avail,
          } : null);
        }
      }
    } catch (err) {
      console.error('Error updating provider filter preview:', err);
    } finally {
      setIsUpdatingRates(false);
    }
  };

  const handleSendEmail = async () => {
    if (!emailPreviewData) return;
    setSendingEmail(true);

    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: emailPreviewData.candidateId,
          templateType: emailPreviewData.templateType,
          stateCode: emailPreviewData.stateCode,
          selectedProviders: emailPreviewData.selectedProviders,
          companyCutPercent: emailPreviewData.companyCutPercent,
          perDiemOverride: emailPreviewData.perDiemOverride,
          customSubject: emailPreviewData.subject,
          customBody: emailPreviewData.bodyHtml,
          previewOnly: false,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          await customAlert(data.logMessage || 'Email sent successfully!', 'Email Status');
          // Update local candidate status
          if (data.candidate) {
            setCustomCandidates(prev => prev.map(c => c.id === data.candidate.id ? data.candidate : c));
          }
          setIsEmailPreviewOpen(false);
          setEmailPreviewData(null);
        }
      } else {
        const err = await res.json();
        await customAlert(err.error || 'Failed to send email.', 'Error');
      }
    } catch (err) {
      console.error('Error sending email:', err);
      await customAlert('Failed to dispatch email.', 'Error');
    } finally {
      setSendingEmail(false);
    }
  };

  // Load from localStorage on mount
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/bootstrap');
        const data = await res.json();
        if (data) {
          setCustomStates(data.states || []);
          setCustomCities(data.cities || []);
          setCustomRatePlans(data.ratePlans || []);
          setCustomTechnicians(data.technicians || []);
          setCustomVehicles(data.vehicles || []);
          setCustomJobLogs(data.jobLogs || []);
          setCustomDocuments(data.documents || []);
          setCustomTodos(data.todos || []);
          setAdmins(data.admins || []);
          setCustomCandidates(data.candidates || []);
        }
      } catch (e) {
        console.error('Failed to bootstrap data:', e);
      } finally {
        setIsInitialized(true);
      }
    }
    loadData();

    if (typeof window !== 'undefined') {
      const session = localStorage.getItem('netcore_session');
      if (session) {
        setIsLoggedIn(true);
        setCurrentUser(session);
      }
    }
  }, []);

  const handleResetRates = async () => {
    if (await customConfirm('Are you sure you want to reset all rate plans, states, cities, technicians, vehicles, job logs, and tasks to default values? Any custom or imported data will be lost.', 'Reset Database')) {
      try {
        const res = await fetch('/api/rateplans/reset', {
          method: 'POST',
        });

        if (res.ok) {
          window.location.reload();
        } else {
          await customAlert('Failed to reset database.', 'Error');
        }
      } catch (err) {
        console.error('Error resetting database:', err);
      }
    }
  };

  const handleAddState = (code: string, name: string) => {
    setCustomStates(prev => {
      if (prev.some(s => s.code.toUpperCase() === code.toUpperCase())) return prev;
      const newId = Math.max(0, ...prev.map(s => s.id)) + 1;
      return [...prev, { id: newId, code: code.toUpperCase(), name }];
    });
  };



  const handleDeleteState = async () => {
    if (!selectedStateCode) return;
    const confirmDelete = await customConfirm(
      `WARNING: This will permanently delete the state ${selectedStateCode}, including all associated cities, technicians, rates, and dispatches. This action cannot be undone. Are you sure you want to proceed?`,
      'Deactivate State'
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/states?code=${selectedStateCode}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        // Trigger a bootstrap reload to keep the entire local state in sync
        const bootRes = await fetch('/api/bootstrap');
        const data = await bootRes.json();
        if (data) {
          setCustomStates(data.states || []);
          setCustomCities(data.cities || []);
          setCustomRatePlans(data.ratePlans || []);
          setCustomTechnicians(data.technicians || []);
          setCustomVehicles(data.vehicles || []);
          setCustomJobLogs(data.jobLogs || []);
          setCustomDocuments(data.documents || []);
          setCustomTodos(data.todos || []);
          setCustomCandidates(data.candidates || []);
        }
        setSelectedStateCode(null);
        setSelectedTechId(null);
        await customAlert(`State ${selectedStateCode} deleted successfully.`, 'Success');
      } else {
        const data = await res.json();
        await customAlert(`Failed to delete state: ${data.error}`, 'Error');
      }
    } catch (err) {
      console.error('Error deleting state:', err);
      await customAlert('An error occurred while deleting the state.', 'Error');
    }
  };

  const handleUpdateState = async (
    requiredTechs: number,
    requirements: string,
    companyPerDiem: number,
    employeePerDiem: number,
    onboardingWaitTime?: string,
    monthlySalary?: string,
    description?: string,
    vacancyCities?: string,
    defaultCut?: number
  ) => {
    if (!selectedStateCode) return;
    try {
      const res = await fetch('/api/states', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: selectedStateCode,
          requiredTechs,
          requirements,
          companyPerDiem,
          employeePerDiem,
          onboardingWaitTime,
          monthlySalary,
          description,
          vacancyCities,
          defaultCut
        })
      });
      if (res.ok) {
        const bootRes = await fetch('/api/bootstrap');
        const data = await bootRes.json();
        if (data) {
          setCustomStates(data.states || []);
          setCustomCities(data.cities || []);
          setCustomRatePlans(data.ratePlans || []);
          setCustomTechnicians(data.technicians || []);
          setCustomVehicles(data.vehicles || []);
          setCustomJobLogs(data.jobLogs || []);
          setCustomDocuments(data.documents || []);
          setCustomTodos(data.todos || []);
          setCustomCandidates(data.candidates || []);
        }
        setIsEditingStateDetails(false);
      } else {
        const data = await res.json();
        await customAlert(data.error || 'Failed to update state details.', 'Error');
      }
    } catch (err) {
      console.error('Error updating state details:', err);
    }
  };

  const handleDeleteStateRates = async () => {
    if (!selectedStateCode) return;
    const confirmDelete = await customConfirm(
      `Are you sure you want to delete all regional rates for ${selectedStateCode}? This will also delete any job logs referencing these rates.`,
      'Delete Regional Rates'
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/rateplans?stateCode=${selectedStateCode}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        // Trigger a bootstrap reload to keep the entire local state in sync
        const bootRes = await fetch('/api/bootstrap');
        const data = await bootRes.json();
        if (data) {
          setCustomRatePlans(data.ratePlans || []);
          setCustomJobLogs(data.jobLogs || []);
        }
        await customAlert(`All rates for ${selectedStateCode} have been deleted.`, 'Success');
      } else {
        const data = await res.json();
        await customAlert(`Failed to delete rates: ${data.error}`, 'Error');
      }
    } catch (err) {
      console.error('Error deleting rates:', err);
      await customAlert('An error occurred while deleting rates.', 'Error');
    }
  };

  const handleAddCity = (name: string, stateCode: string) => {
    const stateObj = customStates.find(s => s.code.toUpperCase() === stateCode.toUpperCase());
    if (!stateObj) return;

    setCustomCities(prev => {
      if (prev.some(c => c.name.toLowerCase() === name.toLowerCase() && c.stateId === stateObj.id)) return prev;
      const newId = Math.max(0, ...prev.map(c => c.id)) + 1;
      return [...prev, { id: newId, name, stateId: stateObj.id }];
    });
  };

  const handleBulkImport = async (newRates: Omit<RatePlan, 'id'>[], overwriteDuplicates: boolean) => {
    try {
      const res = await fetch('/api/rateplans/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rates: newRates, overwriteDuplicates }),
      });

      if (res.ok) {
        const data = await res.json();
        
        setCustomRatePlans(prev => {
          const updated = [...prev];
          data.rates.forEach((newRate: RatePlan) => {
            const idx = updated.findIndex(r => r.id === newRate.id);
            if (idx !== -1) {
              updated[idx] = newRate;
            } else {
              updated.push(newRate);
            }
          });
          return updated;
        });

        const uniqueStates = Array.from(new Set(data.rates.map((r: RatePlan) => r.stateCode))) as string[];
        for (const stCode of uniqueStates) {
          if (!customStates.some(s => s.code === stCode)) {
            setCustomStates(prev => [...prev, { id: Math.max(0, ...prev.map(s => s.id)) + 1, code: stCode, name: stCode }]);
          }
        }

        await customAlert(`Successfully imported/updated ${data.count} rate plans!`, 'Import Success');
      } else {
        const errData = await res.json();
        await customAlert(errData.error || 'Failed to import bulk rates.', 'Error');
      }
    } catch (err) {
      console.error('Error bulk importing rate plans:', err);
    }
  };
  
  // Rate Manager State for adding/editing rates
  const [editingRate, setEditingRate] = useState<RatePlan | null>(null);
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [ratesStateFilter, setRatesStateFilter] = useState<string>('ALL');
  const [ratesProviderFilter, setRatesProviderFilter] = useState<string>('ALL');

  // Quick State Recalculator states
  const [quickRateState, setQuickRateState] = useState('TN');
  const [quickRateCut, setQuickRateCut] = useState('8');
  const [quickTechState, setQuickTechState] = useState('TN');
  const [quickTechCut, setQuickTechCut] = useState('8');
  const [rateForm, setRateForm] = useState({
    provider: 'Xfinity',
    stateCode: 'TN',
    cityName: '',
    code: '',
    description: '',
    grossPrice: '',
    employeePrice: '',
    autoCalc: false,
    retentionPercent: '35'
  });

  // Sync quick rate/tech states when filter is selected
  useEffect(() => {
    if (ratesStateFilter !== 'ALL') {
      setQuickRateState(ratesStateFilter);
    }
  }, [ratesStateFilter]);

  useEffect(() => {
    if (employeesStateFilter !== 'ALL') {
      setQuickTechState(employeesStateFilter);
    }
  }, [employeesStateFilter]);

  const handleQuickRateRecalc = async () => {
    const cutVal = parseFloat(quickRateCut);
    if (isNaN(cutVal) || cutVal < 0 || cutVal > 100) {
      await customAlert('Please enter a valid company cut percentage between 0 and 100.', 'Validation Error');
      return;
    }
    
    const count = customRatePlans.filter(r => r.stateCode === quickRateState).length;
    if (count === 0) {
      await customAlert(`No rate plans found for state ${quickRateState}.`, 'No Rates');
      return;
    }

    if (await customConfirm(`Are you sure you want to recalculate tech payouts for all ${count} rate plans in ${quickRateState} to represent a ${cutVal}% company cut?`, 'Recalculate Tech Payouts')) {
      try {
        const res = await fetch('/api/rateplans/recalc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stateCode: quickRateState, cutVal }),
        });

        if (res.ok) {
          setCustomRatePlans(prev => prev.map(rp => {
            if (rp.stateCode !== quickRateState) return rp;
            const newEmpPrice = rp.grossPrice * (1 - cutVal / 100);
            return {
              ...rp,
              employeePrice: Math.max(0, Math.round(newEmpPrice * 100) / 100)
            };
          }));
          await customAlert(`Successfully updated employee payouts for ${count} rates in ${quickRateState}.`, 'Success');
        }
      } catch (err) {
        console.error('Error recalculating rates:', err);
      }
    }
  };

  const handleQuickTechRecalc = async () => {
    const cutVal = parseFloat(quickTechCut);
    if (isNaN(cutVal) || cutVal < 0 || cutVal > 100) {
      await customAlert('Please enter a valid company cut percentage between 0 and 100.', 'Validation Error');
      return;
    }

    const count = customTechnicians.filter(t => t.stateCode === quickTechState).length;
    if (count === 0) {
      await customAlert(`No field technicians found in ${quickTechState}.`, 'No Technicians');
      return;
    }

    if (await customConfirm(`Are you sure you want to recalculate payout parameters for all ${count} field technicians in ${quickTechState} to represent a default ${cutVal}% company cut?`, 'Recalculate Technician Cuts')) {
      try {
        const res = await fetch('/api/techs/recalc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stateCode: quickTechState, cutVal }),
        });

        if (res.ok) {
          setCustomTechnicians(prev => prev.map(t => {
            if (t.stateCode !== quickTechState) return t;
            return {
              ...t,
              payoutType: 'PERCENTAGE',
              payoutValue: cutVal
            };
          }));
          await customAlert(`Successfully updated payout parameters for all ${count} technicians in ${quickTechState}.`, 'Success');
        }
      } catch (err) {
        console.error('Error recalculating techs:', err);
      }
    }
  };

  const handleAddRateClick = () => {
    setEditingRate(null);
    setRateForm({
      provider: 'Xfinity',
      stateCode: selectedStateCode || 'TN',
      cityName: '',
      code: '',
      description: '',
      grossPrice: '',
      employeePrice: '',
      autoCalc: false,
      retentionPercent: '35'
    });
    setIsRateModalOpen(true);
  };

  const handleEditRateClick = (rate: RatePlan) => {
    setEditingRate(rate);
    const companyRate = rate.grossPrice;
    const employeeRate = rate.employeePrice;
    const impliedMargin = companyRate > 0 ? ((companyRate - employeeRate) / companyRate) * 100 : 0;

    setRateForm({
      provider: rate.provider,
      stateCode: rate.stateCode,
      cityName: rate.cityName || '',
      code: rate.code,
      description: rate.description,
      grossPrice: rate.grossPrice.toString(),
      employeePrice: rate.employeePrice.toString(),
      autoCalc: false,
      retentionPercent: impliedMargin > 0 ? impliedMargin.toFixed(0) : '35'
    });
    setIsRateModalOpen(true);
  };

  const handleSaveRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rateForm.provider.trim() || !rateForm.code.trim() || !rateForm.grossPrice) {
      await customAlert('Please fill in all required fields', 'Validation Error');
      return;
    }

    const companyPriceNum = parseFloat(rateForm.grossPrice);
    let employeePriceNum = parseFloat(rateForm.employeePrice);

    if (rateForm.autoCalc) {
      const margin = parseFloat(rateForm.retentionPercent) || 0;
      employeePriceNum = companyPriceNum * (1 - margin / 100);
    }

    if (isNaN(companyPriceNum) || isNaN(employeePriceNum)) {
      await customAlert('Price must be a valid number', 'Validation Error');
      return;
    }

    try {
      const body = {
        id: editingRate ? editingRate.id : undefined,
        provider: rateForm.provider.trim(),
        stateCode: rateForm.stateCode,
        code: rateForm.code.trim().toUpperCase(),
        description: sanitizeDescription(rateForm.description),
        grossPrice: companyPriceNum,
        employeePrice: employeePriceNum
      };

      const res = await fetch('/api/rateplans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const savedRate = await res.json();
        if (editingRate) {
          setCustomRatePlans(prev => prev.map(rp => rp.id === editingRate.id ? savedRate : rp));
        } else {
          setCustomRatePlans(prev => [...prev, savedRate]);
        }
        setIsRateModalOpen(false);
        setEditingRate(null);
      } else {
        const errData = await res.json();
        await customAlert(errData.error || 'Failed to save rate plan.', 'Error');
      }
    } catch (err) {
      console.error('Error saving rate plan:', err);
    }
  };

  const handleDeleteRate = async (rateId: number) => {
    if (await customConfirm('Are you sure you want to delete this rate plan?', 'Delete Rate Plan')) {
      try {
        const res = await fetch(`/api/rateplans?id=${rateId}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          setCustomRatePlans(prev => prev.filter(rp => rp.id !== rateId));
        }
      } catch (err) {
        console.error('Error deleting rate plan:', err);
      }
    }
  };

  const uniqueProviders = useMemo(() => {
    const map = new Map<string, string>();
    const sourcePlans = ratesStateFilter === 'ALL'
      ? customRatePlans
      : customRatePlans.filter(rp => rp.stateCode === ratesStateFilter);

    sourcePlans.forEach(rp => {
      if (rp.provider && rp.provider.trim()) {
        const trimmed = rp.provider.trim();
        const key = trimmed.toLowerCase();
        if (!map.has(key)) {
          map.set(key, trimmed);
        }
      }
    });

    return Array.from(map.values());
  }, [customRatePlans, ratesStateFilter]);

  // Reset provider filter if current provider does not exist in selected state
  useEffect(() => {
    if (ratesProviderFilter !== 'ALL') {
      const match = uniqueProviders.some(p => p.toLowerCase() === ratesProviderFilter.toLowerCase());
      if (!match) {
        setRatesProviderFilter('ALL');
      }
    }
  }, [ratesStateFilter, uniqueProviders, ratesProviderFilter]);

  const techStateProviders = useMemo(() => {
    const map = new Map<string, string>();
    const sourcePlans = techForm.stateCode
      ? customRatePlans.filter(rp => rp.stateCode === techForm.stateCode)
      : customRatePlans;

    sourcePlans.forEach(rp => {
      if (rp.provider && rp.provider.trim()) {
        const trimmed = rp.provider.trim();
        const key = trimmed.toLowerCase();
        if (!map.has(key)) {
          map.set(key, trimmed);
        }
      }
    });

    return Array.from(map.values());
  }, [customRatePlans, techForm.stateCode]);



  // Filter rate plans by global search query and local filters
  const filteredRatePlans = useMemo(() => {
    let result = customRatePlans;
    
    if (globalSearchQuery) {
      const q = globalSearchQuery.toLowerCase();
      result = result.filter(rp => 
        rp.provider.toLowerCase().includes(q) ||
        rp.code.toLowerCase().includes(q) ||
        rp.description.toLowerCase().includes(q) ||
        rp.stateCode.toLowerCase().includes(q)
      );
    }
    
    if (ratesStateFilter !== 'ALL') {
      result = result.filter(rp => rp.stateCode === ratesStateFilter);
    }

    if (ratesProviderFilter !== 'ALL') {
      result = result.filter(rp => rp.provider.toLowerCase() === ratesProviderFilter.toLowerCase());
    }

    return result;
  }, [globalSearchQuery, customRatePlans, ratesStateFilter, ratesProviderFilter]);

  const activeStateName = useMemo(() => {
    if (ratesStateFilter === 'ALL') return 'National';
    const st = customStates.find(s => s.code === ratesStateFilter);
    return st ? `${st.name} (${st.code})` : ratesStateFilter;
  }, [ratesStateFilter, customStates]);

  const ratesStats = useMemo(() => {
    const plans = filteredRatePlans;
    if (plans.length === 0) {
      return {
        avgCompany: 0,
        avgEmployee: 0,
        avgRetentionVal: 0,
        avgRetentionPct: 0,
        totalCodes: 0
      };
    }
    
    let sumCompany = 0;
    let sumEmployee = 0;
    plans.forEach(p => {
      sumCompany += p.grossPrice;
      sumEmployee += p.employeePrice;
    });

    const avgCompany = sumCompany / plans.length;
    const avgEmployee = sumEmployee / plans.length;
    const avgRetentionVal = avgCompany - avgEmployee;
    const avgRetentionPct = avgCompany > 0 ? (avgRetentionVal / avgCompany) * 100 : 0;

    return {
      avgCompany,
      avgEmployee,
      avgRetentionVal,
      avgRetentionPct,
      totalCodes: plans.length
    };
  }, [filteredRatePlans]);

  const handleExportPDF = async (type: 'company' | 'employee', targetStateCode?: string, providerFilter?: string) => {
    // If targetStateCode is specified, filter customRatePlans by that state.
    // Otherwise, use filteredRatePlans.
    let basePlans = targetStateCode 
      ? customRatePlans.filter(rp => rp.stateCode === targetStateCode)
      : filteredRatePlans;

    if (providerFilter) {
      basePlans = basePlans.filter(rp => (rp.provider || '').toLowerCase() === providerFilter.toLowerCase());
    }

    // Filter out rows where code is empty, numeric, or just "CODE"
    const plans = basePlans.filter(rate => {
      const c = (rate.code || '').trim().toUpperCase();
      return c !== '' && c !== 'CODE';
    });

    if (plans.length === 0) {
      await customAlert('No rate plans to export.', 'Empty Export');
      return;
    }

    // Check if any rate has a valid description (not empty and not numeric)
    const hasAnyDescription = plans.some(rate => {
      const cleanDesc = sanitizeDescription(rate.description);
      return cleanDesc !== '';
    });

    let stateName = activeStateName;
    if (targetStateCode) {
      const st = customStates.find(s => s.code === targetStateCode);
      stateName = st ? `${st.name} (${st.code})` : targetStateCode;
    }

    const docTitle = type === 'company' 
      ? `NETCORE CRM - Company Master Rates (${providerFilter ? providerFilter + ' - ' : ''}${stateName})`
      : `Contractor Payout Rates (${providerFilter ? providerFilter + ' - ' : ''}${stateName})`;

    const headingText = type === 'company'
      ? `${providerFilter ? providerFilter + ' ' : ''}Company Master Rate Plan`
      : `${providerFilter ? providerFilter + ' ' : ''}Contractor Payout Rate Sheet`;

    const subtitleText = type === 'company'
      ? `Internal pricing grid containing company gross margins and technician payouts for provider: ${providerFilter || 'All'} in state/region: ${stateName}.`
      : `Active contractor payout rates and codes for provider: ${providerFilter || 'All'} in state/region: ${stateName}.`;

    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    let tableHeadersHtml = '';
    if (type === 'company') {
      tableHeadersHtml = `
        <tr>
          <th>Provider</th>
          <th>Code</th>
          <th>Region</th>
          ${hasAnyDescription ? '<th>Description</th>' : ''}
          <th class="text-right">Company Rate</th>
          <th class="text-right">Employee Payout</th>
          <th class="text-right">Margin ($)</th>
          <th class="text-right">Margin (%)</th>
        </tr>
      `;
    } else {
      tableHeadersHtml = `
        <tr>
          <th>Provider</th>
          <th>Code</th>
          <th>Region</th>
          ${hasAnyDescription ? '<th>Description</th>' : ''}
          <th class="text-right">Payout Rate</th>
        </tr>
      `;
    }

    const rowsHtml = plans.map(rate => {
      const region = rate.cityName ? `${rate.cityName}, ${rate.stateCode}` : rate.stateCode;
      const cleanDesc = sanitizeDescription(rate.description);
      const descCell = hasAnyDescription ? `<td>${cleanDesc || '-'}</td>` : '';
      
      if (type === 'company') {
        const marginVal = rate.grossPrice - rate.employeePrice;
        const marginPct = rate.grossPrice > 0 ? (marginVal / rate.grossPrice) * 100 : 0;
        return `
          <tr>
            <td><strong>${rate.provider}</strong></td>
            <td class="font-mono">${rate.code}</td>
            <td>${region}</td>
            ${descCell}
            <td class="text-right font-mono">$${rate.grossPrice.toFixed(2)}</td>
            <td class="text-right font-mono">$${rate.employeePrice.toFixed(2)}</td>
            <td class="text-right font-mono">$${marginVal.toFixed(2)}</td>
            <td class="text-right font-mono">${marginPct.toFixed(0)}%</td>
          </tr>
        `;
      } else {
        return `
          <tr>
            <td><strong>${rate.provider}</strong></td>
            <td class="font-mono">${rate.code}</td>
            <td>${region}</td>
            ${descCell}
            <td class="text-right font-mono font-bold">$${rate.employeePrice.toFixed(2)}</td>
          </tr>
        `;
      }
    }).join('');

    const footerText = type === 'company'
      ? `CONFIDENTIAL - INTERNAL USE ONLY - Generated on ${currentDate}`
      : `Confidential Contractor Rate Sheet. Generated on ${currentDate}. Rates subject to contract terms.`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${docTitle}</title>
        <style>
          body {
            font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #1e293b;
            margin: 40px;
            background: #ffffff;
            line-height: 1.5;
          }
          .header {
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 15px;
            margin-bottom: 25px;
          }
          .header h1 {
            font-size: 22px;
            margin: 0;
            color: #0f172a;
            letter-spacing: 0.5px;
          }
          .header p {
            font-size: 11px;
            color: #64748b;
            margin: 6px 0 0 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }
          th {
            background-color: #f8fafc;
            color: #475569;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            border-bottom: 2px solid #e2e8f0;
            padding: 8px 10px;
            text-align: left;
          }
          td {
            padding: 8px 10px;
            font-size: 11px;
            border-bottom: 1px solid #f1f5f9;
            color: #334155;
            vertical-align: top;
          }
          tr:nth-child(even) td {
            background-color: rgba(248, 250, 252, 0.5);
          }
          .text-right {
            text-align: right;
          }
          .font-mono {
            font-family: Consolas, Monaco, monospace;
          }
          .footer {
            margin-top: 50px;
            border-top: 1px solid #e2e8f0;
            padding-top: 15px;
            font-size: 9px;
            color: #94a3b8;
            text-align: center;
          }
          @media print {
            body {
              margin: 15mm;
            }
            .header {
              page-break-after: avoid;
            }
            tr {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${headingText}</h1>
          <p>${subtitleText}</p>
        </div>
        <table>
          <thead>
            ${tableHeadersHtml}
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        <div class="footer">
          ${footerText}
        </div>
        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.write(htmlContent);
      doc.close();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 5000);
    }
  };

  // Derive selection states
  const selectedState = useMemo(() => {
    if (!selectedStateCode) return null;
    return customStates.find(s => s.code === selectedStateCode) || null;
  }, [selectedStateCode, customStates]);

  useEffect(() => {
    if (selectedState) {
      setEditRequiredTechs((selectedState.requiredTechs ?? 0).toString());
      setEditRequirements(selectedState.requirements || '');
      setEditCompanyPerDiem((selectedState.companyPerDiem ?? 0).toFixed(2));
      setEditEmployeePerDiem((selectedState.employeePerDiem ?? 0).toFixed(2));
      setEditOnboardingWaitTime(selectedState.onboardingWaitTime || '');
      setEditMonthlySalary(selectedState.monthlySalary || '');
      setEditDescription(selectedState.description || '');
      setEditVacancyCities(selectedState.vacancyCities || '');
      setEditDefaultCut((selectedState.defaultCut ?? 8.00).toFixed(2));
      setIsEditingStateDetails(false);
    }
  }, [selectedState]);

  const selectedTechnician = useMemo(() => {
    if (!selectedTechId) return null;
    const tech = customTechnicians.find(t => t.id === selectedTechId);
    if (!tech) return null;
    const vehicle = customVehicles.find(v => v.technicianId === tech.id);
    return {
      ...tech,
      vehicle
    };
  }, [selectedTechId, customTechnicians, customVehicles]);

  const calculateBatchPerDiemTotals = (jobs: JobLog[]) => {
    const workDaysByTechAndBatch = new Map<string, { technicianId: number; stateCode: string; days: Set<string> }>();

    jobs.forEach(job => {
      if (!job.batchId) return;

      const key = `${job.batchId}:${job.technicianId}`;
      const entry = workDaysByTechAndBatch.get(key) || {
        technicianId: job.technicianId,
        stateCode: job.stateCode,
        days: new Set<string>(),
      };
      entry.days.add(job.date);
      workDaysByTechAndBatch.set(key, entry);
    });

    return Array.from(workDaysByTechAndBatch.values()).reduce((totals, entry) => {
      const technician = customTechnicians.find(tech => tech.id === entry.technicianId);
      const state = customStates.find(item => item.id === technician?.stateId)
        || customStates.find(item => item.code === entry.stateCode);
      const companyDailyRate = Number(state?.companyPerDiem) || 0;
      const employeeDailyRate = technician?.perDiemOverride != null
        ? Number(technician.perDiemOverride)
        : Number(state?.employeePerDiem) || 0;
      const workDayCount = entry.days.size;
      const companyPerDiem = companyDailyRate * workDayCount;
      const employeePerDiem = employeeDailyRate * workDayCount;

      totals.revenue += companyPerDiem;
      totals.payout += employeePerDiem;
      totals.profit += companyPerDiem - employeePerDiem;
      return totals;
    }, { revenue: 0, payout: 0, profit: 0 });
  };

  // Compute stats based on active state selection
  const stats = useMemo(() => {
    const filteredJobs = selectedStateCode 
      ? customJobLogs.filter(j => j.stateCode === selectedStateCode)
      : customJobLogs;

    const perDiemTotals = calculateBatchPerDiemTotals(filteredJobs);
    const totalRevenue = filteredJobs.reduce((acc, j) => acc + j.companyRevenue, 0) + perDiemTotals.revenue;
    const totalPayout = filteredJobs.reduce((acc, j) => acc + j.techPayout, 0) + perDiemTotals.payout;
    const totalProfit = filteredJobs.reduce((acc, j) => acc + j.companyProfit, 0) + perDiemTotals.profit;
    const margin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
      revenue: totalRevenue,
      payout: totalPayout,
      profit: totalProfit,
      margin: margin,
      jobCount: filteredJobs.length,
    };
  }, [customJobLogs, selectedStateCode, customStates, customTechnicians]);

  // Cities with active jobs in selected state
  const activeCitiesInState = useMemo(() => {
    if (!selectedStateCode) return [];
    const stateJobs = customJobLogs.filter(j => j.stateCode === selectedStateCode);
    const cityMap = new Map<number, { name: string; count: number; profit: number }>();
    
    stateJobs.forEach(job => {
      const existing = cityMap.get(job.cityId) || { name: job.cityName, count: 0, profit: 0 };
      existing.count += 1;
      existing.profit += job.companyProfit;
      cityMap.set(job.cityId, existing);
    });

    return Array.from(cityMap.entries()).map(([id, info]) => ({
      id,
      name: info.name,
      jobCount: info.count,
      profit: info.profit,
    }));
  }, [customJobLogs, selectedStateCode]);

  // Technicians registered in the selected state
  const stateTechs = useMemo(() => {
    if (!selectedStateCode) return [];
    return customTechnicians.filter(t => t.stateCode === selectedStateCode);
  }, [selectedStateCode, customTechnicians]);

  // Rate plans for selected state
  const stateRatePlans = useMemo(() => {
    if (!selectedStateCode) return [];
    return customRatePlans.filter(rp => rp.stateCode === selectedStateCode);
  }, [selectedStateCode, customRatePlans]);

  // Grouped rates by provider for regional rates display
  const providerRateSummaries = useMemo(() => {
    if (!selectedStateCode || stateRatePlans.length === 0) return [];
    
    const groups: { [provider: string]: RatePlan[] } = {};
    stateRatePlans.forEach(rp => {
      const p = rp.provider || 'Other';
      if (!groups[p]) {
        groups[p] = [];
      }
      groups[p].push(rp);
    });
    
    return Object.entries(groups).map(([provider, plans]) => {
      const totalCompany = plans.reduce((sum, p) => sum + p.grossPrice, 0);
      const totalEmployee = plans.reduce((sum, p) => sum + p.employeePrice, 0);
      const avgCompany = plans.length > 0 ? totalCompany / plans.length : 0;
      const avgEmployee = plans.length > 0 ? totalEmployee / plans.length : 0;
      const avgCut = avgCompany > 0 ? ((avgCompany - avgEmployee) / avgCompany) * 100 : 0;
      
      return {
        provider,
        avgCut,
        plans
      };
    });
  }, [stateRatePlans, selectedStateCode]);


  const kpiTrends = useMemo(() => {
    const filteredJobs = selectedStateCode 
      ? customJobLogs.filter(j => j.stateCode === selectedStateCode)
      : customJobLogs;

    // Partition dates to calculate trend change.
    // June 3 & 4 (plus newer dispatches) are Current period, June 1 & 2 are Previous period.
    const currentJobs = filteredJobs.filter(j => j.date >= '2026-06-03');
    const previousJobs = filteredJobs.filter(j => j.date < '2026-06-03');

    // Job Count Trend
    const curJobCount = currentJobs.length;
    const prevJobCount = previousJobs.length;
    let jobTrend = 0;
    if (prevJobCount > 0) {
      jobTrend = ((curJobCount - prevJobCount) / prevJobCount) * 100;
    } else if (curJobCount > 0) {
      jobTrend = 100;
    } else {
      jobTrend = 0;
    }

    // Gross Revenue Trend
    const currentPerDiem = calculateBatchPerDiemTotals(currentJobs);
    const previousPerDiem = calculateBatchPerDiemTotals(previousJobs);
    const curRevenue = currentJobs.reduce((acc, j) => acc + j.companyRevenue, 0) + currentPerDiem.revenue;
    const prevRevenue = previousJobs.reduce((acc, j) => acc + j.companyRevenue, 0) + previousPerDiem.revenue;
    let revenueTrend = 0;
    if (prevRevenue > 0) {
      revenueTrend = ((curRevenue - prevRevenue) / prevRevenue) * 100;
    } else if (curRevenue > 0) {
      revenueTrend = 100;
    } else {
      revenueTrend = 0;
    }

    // Net Profit Trend
    const curProfit = currentJobs.reduce((acc, j) => acc + j.companyProfit, 0) + currentPerDiem.profit;
    const prevProfit = previousJobs.reduce((acc, j) => acc + j.companyProfit, 0) + previousPerDiem.profit;
    let profitTrend = 0;
    if (prevProfit > 0) {
      profitTrend = ((curProfit - prevProfit) / prevProfit) * 100;
    } else if (curProfit > 0) {
      profitTrend = 100;
    } else {
      profitTrend = 0;
    }

    // Active Employees Trend
    const filteredTechs = selectedStateCode
      ? customTechnicians.filter(t => t.stateCode === selectedStateCode)
      : customTechnicians;
    
    const maxTechId = customTechnicians.length > 0 ? Math.max(...customTechnicians.map(t => t.id)) : 0;
    const curTechsCount = filteredTechs.filter(t => t.status === 'ACTIVE').length;
    const prevTechsCount = filteredTechs.filter(t => t.status === 'ACTIVE' && t.id < maxTechId).length;
    let techTrend = 0;
    if (prevTechsCount > 0) {
      techTrend = ((curTechsCount - prevTechsCount) / prevTechsCount) * 100;
    } else if (curTechsCount > 0) {
      techTrend = 100;
    } else {
      techTrend = 0;
    }

    return {
      jobTrend,
      revenueTrend,
      profitTrend,
      techTrend
    };
  }, [customJobLogs, customTechnicians, customStates, selectedStateCode]);

  // Handler for state selection from map
  const handleSelectState = (stateCode: string | null) => {
    setSelectedStateCode(stateCode);
    setSelectedTechId(null);
  };

  const handleActivateStateDirect = async (code: string) => {
    const name = STATE_NAMES[code] || code;
    try {
      const res = await fetch('/api/states', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, name }),
      });

      if (res.ok) {
        const newState = await res.json();
        setCustomStates(prev => {
          if (prev.some(s => s.code.toUpperCase() === code.toUpperCase())) return prev;
          return [...prev, newState];
        });
        setSelectedStateCode(code);
        setSelectedTechId(null);
        await customAlert(`State ${name} (${code}) has been activated successfully!`, 'Success');
      } else {
        const errData = await res.json();
        await customAlert(errData.error || 'Failed to activate state.', 'Error');
      }
    } catch (err) {
      console.error('Error activating state:', err);
      await customAlert('An error occurred while activating the state.', 'Error');
    }
  };

  // Handler for technician selection from sidebar
  const handleSelectTechnician = (techId: number) => {
    setSelectedTechId(techId);
    const tech = customTechnicians.find(t => t.id === techId);
    if (tech) {
      setSelectedStateCode(tech.stateCode);
    }
    setActiveSection('dashboard');
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4 text-zinc-100 font-sans animate-fadeIn">
        <div className="w-full max-w-sm bg-[#18181b] border border-zinc-800 rounded-xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-1.5">
            <h1 className="text-2xl font-black tracking-tight text-white">NETCORE CRM</h1>
            <p className="text-xs text-zinc-400 font-semibold">Admin Sign-In Portal</p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleLoginSubmit(e); }} className="space-y-4">
            {loginError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-3 py-2 rounded">
                {loginError}
              </div>
            )}
            
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Login / Username</label>
              <input
                type="text"
                required
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="Username"
                className="w-full bg-[#09090b] border border-zinc-800 rounded-md px-3.5 py-2 text-xs text-zinc-200 focus:outline-none focus:border-white placeholder-zinc-700 font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Password</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-[#09090b] border border-zinc-800 rounded-md px-3.5 py-2 text-xs text-zinc-200 focus:outline-none focus:border-white placeholder-zinc-700 font-medium"
              />
            </div>
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-white text-zinc-950 text-xs font-bold py-2.5 rounded-md hover:bg-zinc-200 disabled:opacity-50 transition-all shadow-md shadow-white/5 cursor-pointer font-semibold flex items-center justify-center space-x-2"
            >
              {isLoggingIn ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen font-sans overflow-hidden relative transition-colors duration-200 ${
      theme === 'light' ? 'bg-[#f8f9fa] text-[#202124]' : 'bg-[#09090b] text-slate-100'
    }`}>
      {/* Sidebar Navigation */}
      <Sidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection} 
        selectedTechId={selectedTechId}
        onSelectTechnician={handleSelectTechnician}
        technicians={customTechnicians}
        currentUser={currentUser}
        ticketsCount={unreadTicketsCount}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onInviteClick={() => setIsInviteModalOpen(true)}
        onLogoutClick={handleLogout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Backdrop overlay for mobile drawer */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content Pane */}
      <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Mobile Header Bar */}
        <header className="h-14 bg-[#18181b] border-b border-zinc-800 flex items-center justify-between px-4 md:hidden shrink-0 z-20">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="text-zinc-400 hover:text-white p-1.5 rounded hover:bg-zinc-800/80 transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-white font-extrabold text-sm tracking-wide">NETCORE CRM</span>
          <div className="w-8" /> {/* Spacer to center title */}
        </header>

        {/* Scrollable Main Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-5 md:space-y-7 custom-scrollbar">
          
          {/* Section 1: Dashboards View */}
          {activeSection === 'dashboard' && (
            <>
              {/* Header Title Block */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
                <div>
                  <h1 className="text-xl font-bold text-slate-100 tracking-wide">
                    Analytics Dashboard
                  </h1>
                  <p className="text-xs text-zinc-400 mt-1">
                    {selectedStateCode ? `${STATE_NAMES[selectedStateCode] || selectedStateCode} (${selectedStateCode}) ${selectedState ? '' : '[Inactive]'}` : 'National Operations & Contractor Payout Ledger'}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button className="bg-[#18181b] text-zinc-400 border border-[#27272a] text-xs font-semibold px-4 py-2 rounded-md hover:bg-slate-800 transition-colors">
                    Invite a Friend
                  </button>
                  <button 
                    onClick={() => {
                      setActiveSection('jobs');
                    }}
                    className="bg-[#3b82f6] hover:bg-[#2563eb] text-white text-xs font-bold px-4 py-2 rounded-md shadow-lg shadow-blue-500/10 transition-all cursor-pointer flex items-center space-x-1"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Import Weekly Sheet</span>
                  </button>
                </div>
              </div>

              {/* Four Small KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                
                {/* Sales (Completed Jobs count) */}
                <div className="bg-[#18181b] rounded-xl p-5 shadow-sm relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                        Total Jobs Logged
                      </span>
                      <h3 className="text-2xl font-black text-slate-100 font-mono tracking-tight mt-1">
                        {stats.jobCount}
                      </h3>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-zinc-800/30 text-zinc-300 flex items-center justify-center shrink-0">
                      <Briefcase className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center space-x-1">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${
                      kpiTrends.jobTrend >= 0
                        ? 'bg-zinc-800/30 text-zinc-300 border-emerald-500/25'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                    }`}>
                      {kpiTrends.jobTrend >= 0 ? '+' : ''}{kpiTrends.jobTrend.toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-zinc-500 font-medium">Since last period</span>
                  </div>
                </div>

                {/* Earnings (Gross Revenue) */}
                <div className="bg-[#18181b] rounded-xl p-5 shadow-sm relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                        Gross Revenue
                      </span>
                      <h3 className="text-2xl font-black text-slate-100 font-mono tracking-tight mt-1">
                        ${stats.revenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </h3>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-cyan-500/10 text-zinc-100 flex items-center justify-center shrink-0">
                      <DollarSign className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center space-x-1">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${
                      kpiTrends.revenueTrend >= 0
                        ? 'bg-zinc-800/30 text-zinc-300 border-emerald-500/25'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                    }`}>
                      {kpiTrends.revenueTrend >= 0 ? '+' : ''}{kpiTrends.revenueTrend.toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-zinc-500 font-medium">Since last period</span>
                  </div>
                </div>

                {/* Technicians (Active count) */}
                <div className="bg-[#18181b] rounded-xl p-5 shadow-sm relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                        Active Employees
                      </span>
                      <h3 className="text-2xl font-black text-slate-100 font-mono tracking-tight mt-1">
                        {selectedStateCode ? stateTechs.length : customTechnicians.length}
                      </h3>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-zinc-400 flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center space-x-1">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${
                      kpiTrends.techTrend >= 0
                        ? 'bg-zinc-800/30 text-zinc-300 border-emerald-500/25'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                    }`}>
                      {kpiTrends.techTrend >= 0 ? '+' : ''}{kpiTrends.techTrend.toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-zinc-500 font-medium">Since last period</span>
                  </div>
                </div>

                {/* Profit (Retained profit margin) */}
                <div className="bg-[#18181b] rounded-xl p-5 shadow-sm relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                        Net profit
                      </span>
                      <h3 className="text-2xl font-black text-[#10b981] font-mono tracking-tight mt-1">
                        ${stats.profit.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </h3>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-zinc-800/30 text-zinc-300 flex items-center justify-center shrink-0">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center space-x-1">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${
                      kpiTrends.profitTrend >= 0
                        ? 'bg-zinc-800/30 text-zinc-300 border-emerald-500/25'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                    }`}>
                      {kpiTrends.profitTrend >= 0 ? '+' : ''}{kpiTrends.profitTrend.toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-zinc-500 font-medium">Since last period</span>
                  </div>
                </div>

              </div>

              {/* Top Row: US Map Coverage (Main Dashboard Target) & Sidebar Details Context Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                
                {/* USA Interactive SVG Map (Left - Spans 3 columns) */}
                <div className="lg:col-span-3 flex flex-col space-y-6">
                  <USMap 
                    selectedState={selectedStateCode} 
                    onSelectState={handleSelectState} 
                    states={customStates}
                    jobLogs={customJobLogs}
                    technicians={customTechnicians}
                  />
                </div>

                {/* Custom Sidebar Details: Calendar, State Info, or Tech Profiles (Right - Spans 2 columns) */}
                <div className="lg:col-span-2 flex flex-col space-y-6">
                  
                  {/* Context Panel Rendering */}
                  {selectedTechnician ? (
                    /* Tech Profile View */
                    <div className="bg-[#18181b] rounded-xl p-6 shadow-sm space-y-5 border border-zinc-800 animate-fadeIn">
                      <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-zinc-500 block">Technician Profile</span>
                          <h4 className="text-base font-bold text-slate-100">{selectedTechnician.name}</h4>
                        </div>
                        <button 
                          onClick={() => setSelectedTechId(null)}
                          className="text-[10px] text-zinc-100 hover:underline"
                        >
                          Close Profile
                        </button>
                      </div>

                      {/* Tech Credentials */}
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Contact Email:</span>
                          <a href={`mailto:${selectedTechnician.email}`} className="text-slate-300 hover:underline truncate max-w-[150px]">
                            {selectedTechnician.email}
                          </a>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Phone Number:</span>
                          <a href={`tel:${selectedTechnician.phone}`} className="text-slate-300 hover:underline">
                            {selectedTechnician.phone}
                          </a>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Specialization:</span>
                          <span className="text-zinc-300 font-semibold">
                            {selectedTechnician.workType === 'BURY' ? 'Bury' : selectedTechnician.workType === 'COAX' ? 'Coax' : 'Fiber'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Base Location:</span>
                          <span className="bg-[#09090b] px-2 py-0.5 rounded font-bold text-slate-300">{selectedTechnician.stateCode}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Per Diem Rate:</span>
                          {selectedTechnician.perDiemOverride != null ? (
                            <span className="font-mono font-semibold text-emerald-400">
                              ${selectedTechnician.perDiemOverride.toFixed(2)} override
                            </span>
                          ) : (
                            <span className="font-mono text-slate-300">
                              State default (${(customStates.find(state => state.id === selectedTechnician.stateId)?.employeePerDiem ?? 0).toFixed(2)})
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Car / Tools Deduction:</span>
                          <span className="font-mono text-slate-300">
                            ${(selectedTechnician.carToolsDeduction ?? 0).toFixed(2)}
                          </span>
                        </div>
                        {selectedTechnician.username && (
                          <div className="flex justify-between">
                            <span className="text-zinc-500">App Login Username:</span>
                            <span className="font-semibold text-slate-300">{selectedTechnician.username}</span>
                          </div>
                        )}
                        {selectedTechnician.password && (
                          <div className="flex justify-between">
                            <span className="text-zinc-500">App Login Password:</span>
                            <span className="font-semibold text-slate-300">{selectedTechnician.password}</span>
                          </div>
                        )}
                      </div>

                      {/* Assigned Vehicle */}
                      <div className="bg-[#09090b]/50 p-3.5 rounded-lg border border-zinc-800 space-y-2">
                        <span className="text-[9px] uppercase font-bold text-zinc-500 block">Vehicle Tracker</span>
                        {selectedTechnician.vehicle ? (
                          <div className="text-xs space-y-1">
                            <div className="flex justify-between">
                              <span className="text-zinc-500">Truck:</span>
                              <span className="font-semibold text-slate-300">{selectedTechnician.vehicle.year} {selectedTechnician.vehicle.make} {selectedTechnician.vehicle.model}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-zinc-500">Plate Number:</span>
                              <span className="font-mono text-slate-300">{selectedTechnician.vehicle.plateNumber}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-zinc-500">Fleet Class:</span>
                              <span className={selectedTechnician.vehicle.ownershipType === 'COMPANY' ? 'text-zinc-100 font-semibold' : 'text-orange-400 font-semibold'}>
                                {selectedTechnician.vehicle.ownershipType === 'COMPANY' ? 'Company Fleet' : 'Personal Carrier'}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-500 italic block">No dispatch vehicle linked</span>
                        )}
                      </div>

                      {/* Custom Payout Contracts */}
                      <div className="space-y-2">
                        <span className="text-[9px] uppercase font-bold text-zinc-500 block">
                          сколько мы забираем с его чека, например страндартная ставка 8%
                        </span>
                        <div className="flex justify-between items-center bg-[#09090b] px-3 py-2 rounded border border-zinc-800 text-xs">
                          <span className="font-bold text-slate-300">
                            Company Cut
                          </span>
                          <span className="text-[#10b981] font-mono font-bold">
                            {selectedTechnician.payoutType === 'PERCENTAGE' 
                              ? `${selectedTechnician.payoutValue}% Cut` 
                              : `$${selectedTechnician.payoutValue} Fee`
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : selectedState ? (
                    /* State Details View (Minimalist Redesign) */
                    <div className="bg-[#18181b] rounded-xl p-6 shadow-sm space-y-5 animate-fadeIn border border-zinc-800">
                      
                      {/* Header */}
                      <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-zinc-500 block tracking-wider">Coverage State</span>
                          <h4 className="text-base font-bold text-slate-100">{selectedState.name}</h4>
                        </div>
                        <div className="flex items-center space-x-3 text-[10px]">
                          {!isEditingStateDetails ? (
                            <button 
                              type="button"
                              onClick={() => setIsEditingStateDetails(true)}
                              className="text-zinc-400 hover:text-white transition-colors bg-transparent border-0 cursor-pointer p-0"
                            >
                              Edit Details
                            </button>
                          ) : null}
                          <button 
                            type="button"
                            onClick={() => setSelectedStateCode(null)}
                            className="text-zinc-400 hover:text-white transition-colors bg-transparent border-0 cursor-pointer p-0"
                          >
                            Clear Filter
                          </button>
                        </div>
                      </div>

                      {isEditingStateDetails ? (
                        /* Inline Edit Form */
                        <form 
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleUpdateState(
                              parseInt(editRequiredTechs) || 0,
                              editRequirements,
                              parseFloat(editCompanyPerDiem) || 0,
                              parseFloat(editEmployeePerDiem) || 0,
                              editOnboardingWaitTime,
                              editMonthlySalary,
                              undefined, // description
                              undefined, // vacancyCities
                              parseFloat(editDefaultCut) || 8.00
                            );
                          }}
                          className="space-y-4 text-xs"
                        >
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-zinc-500 block">Needed Employees</label>
                            <input 
                              type="number"
                              min="0"
                              value={editRequiredTechs}
                              onChange={(e) => setEditRequiredTechs(e.target.value)}
                              className="w-full bg-[#09090b] border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-zinc-500 block">Requirements / Qualifications</label>
                            <textarea 
                              rows={2}
                              value={editRequirements}
                              onChange={(e) => setEditRequirements(e.target.value)}
                              placeholder="No specific requirements defined"
                              className="w-full bg-[#09090b] border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 custom-scrollbar resize-none"
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-bold text-zinc-500 block">Co. Per Diem ($)</label>
                              <input 
                                type="number"
                                step="0.01"
                                min="0"
                                value={editCompanyPerDiem}
                                onChange={(e) => setEditCompanyPerDiem(e.target.value)}
                                className="w-full bg-[#09090b] border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-mono"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-bold text-zinc-500 block">Tech Payout ($)</label>
                              <input 
                                type="number"
                                step="0.01"
                                min="0"
                                value={editEmployeePerDiem}
                                onChange={(e) => setEditEmployeePerDiem(e.target.value)}
                                className="w-full bg-[#09090b] border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-mono"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-bold text-zinc-500 block">Default Cut (%)</label>
                              <input 
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={editDefaultCut}
                                onChange={(e) => setEditDefaultCut(e.target.value)}
                                className="w-full bg-[#09090b] border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-mono font-bold"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end space-x-2 pt-2">
                            <button
                              type="button"
                              onClick={() => setIsEditingStateDetails(false)}
                              className="px-3 py-1.5 bg-transparent border border-zinc-800 text-zinc-400 font-semibold rounded hover:bg-zinc-800 transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-4 py-1.5 bg-zinc-100 text-zinc-950 font-bold rounded hover:bg-zinc-200 transition-colors cursor-pointer"
                            >
                              Save
                            </button>
                          </div>
                        </form>
                      ) : (
                        /* Read-only Info list */
                        <div className="space-y-4 text-xs">
                          {/* Operations & Per Diem stats list */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center py-1 border-b border-zinc-800/40">
                              <span className="text-zinc-500">Needed Employees:</span>
                              <span className="font-semibold text-slate-300">
                                {(() => {
                                  const needed = selectedState.requiredTechs || 0;
                                  const activeCount = stateTechs.filter(t => t.status === 'ACTIVE').length;
                                  const difference = needed - activeCount;
                                  return (
                                    <>
                                      {activeCount} / {needed} Active{' '}
                                      {difference > 0 ? (
                                        <span className="text-rose-400 font-bold ml-1">(Need {difference} more)</span>
                                      ) : (
                                        <span className="text-emerald-400 font-bold ml-1">(Fully Staffed)</span>
                                      )}
                                    </>
                                  );
                                })()}
                              </span>
                            </div>

                            <div className="flex justify-between items-start py-1 border-b border-zinc-800/40">
                              <span className="text-zinc-500">Requirements:</span>
                              <span className="font-medium text-slate-300 max-w-[200px] text-right break-words">
                                {selectedState.requirements || 'None defined'}
                              </span>
                            </div>

                            {(() => {
                              const coPerDiem = selectedState.companyPerDiem || 0;
                              const techPerDiem = selectedState.employeePerDiem || 0;
                              const retention = coPerDiem - techPerDiem;
                              const retentionPct = coPerDiem > 0 ? (retention / coPerDiem) * 100 : 0;
                              return (
                                <>
                                  <div className="flex justify-between items-center py-1 border-b border-zinc-800/40">
                                    <span className="text-zinc-500">Per Diem Company Rate:</span>
                                    <span className="font-mono font-semibold text-slate-300">${coPerDiem.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between items-center py-1 border-b border-zinc-800/40">
                                    <span className="text-zinc-500">Per Diem Tech Payout:</span>
                                    <span className="font-mono font-semibold text-slate-300">${techPerDiem.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between items-center py-1 border-b border-zinc-800/40">
                                    <span className="text-zinc-500">Per Diem Company Cut:</span>
                                    <span className={`font-mono font-bold ${retention >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                      ${retention.toFixed(2)} ({retentionPct.toFixed(0)}%)
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center py-1 border-b border-zinc-800/40">
                                    <span className="text-zinc-500">Default State Cut:</span>
                                    <span className="font-mono font-bold text-slate-300">
                                      {(selectedState.defaultCut ?? 8.00).toFixed(2)}%
                                    </span>
                                  </div>
                                </>
                              );
                            })()}
                          </div>

                          {/* Active Cities & Earnings */}
                          <div className="space-y-1.5">
                            <span className="text-[9px] uppercase font-bold text-zinc-500 block">Active Cities & Earnings</span>
                            <div className="space-y-1 max-h-24 overflow-y-auto pr-1 custom-scrollbar">
                              {activeCitiesInState.length === 0 ? (
                                <span className="text-zinc-500 italic block py-0.5">No active cities</span>
                              ) : (
                                activeCitiesInState.map(city => (
                                  <div key={city.id} className="flex justify-between items-center bg-[#09090b] p-1.5 rounded text-[11px] border border-zinc-800/40">
                                    <span className="font-semibold text-slate-300">{city.name}</span>
                                    <span className="font-mono text-[#10b981] font-bold">+${city.profit.toFixed(0)}</span>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                          {/* Local Technicians list */}
                          <div className="space-y-1.5">
                            <span className="text-[9px] uppercase font-bold text-zinc-500 block">State Field Techs ({stateTechs.length})</span>
                            <div className="space-y-1 max-h-24 overflow-y-auto pr-1 custom-scrollbar">
                              {stateTechs.length === 0 ? (
                                <span className="text-zinc-500 italic block py-0.5">No technicians in state</span>
                              ) : (
                                stateTechs.map(tech => (
                                  <div 
                                    key={tech.id}
                                    onClick={() => handleSelectTechnician(tech.id)}
                                    className="flex justify-between items-center bg-[#09090b] hover:bg-[#18181b]/40 px-2 py-1.5 rounded text-[11px] cursor-pointer border border-zinc-800 transition-colors"
                                  >
                                    <span className="text-slate-300 font-medium">
                                      {tech.name} <span className="text-[10px] text-zinc-500 font-normal">({tech.workType === 'BURY' ? 'Bury' : tech.workType === 'COAX' ? 'Coax' : 'Fiber'})</span>
                                    </span>
                                    <span className={`w-1.5 h-1.5 rounded-full ${tech.status === 'ACTIVE' ? 'bg-[#a1a1aa]' : 'bg-[#eab308]'}`} />
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                          {/* Local Regional Rates (Provider Specific) */}
                          <div className="space-y-1.5">
                            <span className="text-[9px] uppercase font-bold text-zinc-500 block">Regional Rates by Client Company</span>
                            <div className="space-y-1 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                              {providerRateSummaries.length === 0 ? (
                                <span className="text-xs text-zinc-500 italic block py-0.5">No regional rates defined</span>
                              ) : (
                                providerRateSummaries.map(summary => (
                                  <div key={summary.provider} className="flex justify-between items-center border-b border-zinc-800/40 py-1.5 text-[11px]">
                                    <span className="font-semibold text-slate-300">
                                      {summary.provider} <span className="text-[10px] text-zinc-500 font-normal">({summary.avgCut.toFixed(0)}% avg cut)</span>
                                    </span>
                                    <div className="flex items-center space-x-2">
                                      <button
                                        type="button"
                                        onClick={() => handleExportPDF('company', selectedStateCode || undefined, summary.provider)}
                                        className="text-[10px] text-[#3b82f6] hover:underline bg-transparent border-0 cursor-pointer p-0 font-medium"
                                      >
                                        Company PDF
                                      </button>
                                      <span className="text-zinc-700">|</span>
                                      <button
                                        type="button"
                                        onClick={() => handleExportPDF('employee', selectedStateCode || undefined, summary.provider)}
                                        className="text-[10px] text-[#10b981] hover:underline bg-transparent border-0 cursor-pointer p-0 font-medium"
                                      >
                                        Employee PDF
                                      </button>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                          {/* Danger Zone */}
                          <div className="border-t border-zinc-800/60 pt-3 flex justify-between text-[10px] text-zinc-500">
                            <button
                              type="button"
                              onClick={handleDeleteStateRates}
                              className="hover:text-rose-500 bg-transparent border-0 cursor-pointer p-0 transition-colors"
                            >
                              Delete All Rates
                            </button>
                            <button
                              type="button"
                              onClick={handleDeleteState}
                              className="hover:text-rose-500 bg-transparent border-0 cursor-pointer p-0 transition-colors"
                            >
                              Delete State
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : selectedStateCode ? (
                    /* Inactive State Details View */
                    <div className="bg-[#18181b] rounded-xl p-6 shadow-sm space-y-5 animate-fadeIn border border-zinc-800">
                      <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-zinc-500 block">Inactive Hub</span>
                          <h4 className="text-base font-bold text-slate-100">
                            {STATE_NAMES[selectedStateCode] || selectedStateCode}
                          </h4>
                        </div>
                        <button 
                          onClick={() => setSelectedStateCode(null)}
                          className="text-[10px] text-zinc-400 hover:text-zinc-100 transition-colors"
                        >
                          Clear Selection
                        </button>
                      </div>

                      <div className="space-y-2 py-2 text-center">
                        <div className="mx-auto w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800/80 flex items-center justify-center text-zinc-500 mb-2">
                          <MapPin className="w-6 h-6 animate-pulse text-zinc-400" />
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto">
                          This state is currently inactive. You can activate it to add dispatch hubs or upload regional contractor rates.
                        </p>
                      </div>

                      <div className="flex flex-col gap-2.5 pt-2">
                        <button
                          onClick={() => handleActivateStateDirect(selectedStateCode)}
                          className="w-full bg-[#10b981]/10 text-[#10b981] hover:text-white border border-[#10b981]/30 hover:bg-[#10b981]/40 text-xs font-bold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center cursor-pointer shadow-sm hover:shadow-[#10b981]/5"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Activate State
                        </button>
                        
                        <button
                          onClick={() => setIsBulkImportOpen(true)}
                          className="w-full bg-[#3b82f6]/10 text-[#3b82f6] hover:text-white border border-[#3b82f6]/30 hover:bg-[#3b82f6]/40 text-xs font-bold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center cursor-pointer shadow-sm hover:shadow-[#3b82f6]/5"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Import Rates
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Default: Calendar Widget */
                    <div className="bg-[#18181b] rounded-xl p-6 shadow-sm flex flex-col justify-between animate-fadeIn">
                      <div className="flex justify-between items-center mb-4 border-b border-zinc-800 pb-3">
                        <h3 className="text-sm font-bold text-slate-100 tracking-wide">
                          Calendar
                        </h3>
                        <span className="text-[10px] text-zinc-500 font-semibold font-mono">June 2026</span>
                      </div>

                      {/* Calendar days mapping */}
                      <div className="grid grid-cols-7 gap-1 text-center text-xs text-zinc-400 font-medium mb-3">
                        <span className="text-rose-500 font-bold">Su</span>
                        <span>Mo</span>
                        <span>Tu</span>
                        <span>We</span>
                        <span>Th</span>
                        <span>Fr</span>
                        <span>Sa</span>
                      </div>

                      <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
                        {/* Month starts on Mon (1st) -> 1 blank cell for Sun */}
                        <span className="py-1.5 text-slate-700">31</span>
                        
                        {Array.from({ length: 30 }).map((_, idx) => {
                          const dayNum = idx + 1;
                          const isCurrent = currentDay === dayNum;
                          const dateString = `2026-06-${dayNum.toString().padStart(2, '0')}`;
                          const dayTodos = customTodos.filter(t => t.date === dateString);

                          return (
                            <button 
                              key={dayNum}
                              onClick={() => setCurrentDay(dayNum)}
                              className={`py-1 rounded-md font-bold transition-all flex flex-col items-center justify-between min-h-[40px] relative ${
                                isCurrent 
                                  ? 'bg-[#3b82f6] text-white shadow-md' 
                                  : 'text-slate-300 hover:bg-[#09090b] hover:text-white'
                              }`}
                            >
                              <span>{dayNum}</span>
                              {/* Dots container */}
                              <div className="flex gap-0.5 mt-0.5 justify-center h-1">
                                {dayTodos.length > 0 && (
                                  <>
                                    {dayTodos.some(t => !t.completed) && (
                                      <span className="w-1 h-1 rounded-full bg-blue-400" />
                                    )}
                                    {dayTodos.some(t => t.completed) && (
                                      <span className="w-1 h-1 rounded-full bg-emerald-400" />
                                    )}
                                  </>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>


                    </div>
                  )}

                </div>

              </div>


              {/* State Profitability Leaderboard */}
              <div className="bg-[#18181b] rounded-xl p-6 shadow-sm border border-zinc-800/40 mt-6 animate-fadeIn">
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-slate-100 tracking-wide">
                    Profitability & Revenue by State Leaderboard
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    State-by-state weekly performance summary. Click on a state card to filter the map and coverage metrics.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {customStates.map(state => {
                    const stateJobs = customJobLogs.filter(j => j.stateCode === state.code);
                    const perDiemTotals = calculateBatchPerDiemTotals(stateJobs);
                    const revenue = stateJobs.reduce((sum, j) => sum + j.companyRevenue, 0) + perDiemTotals.revenue;
                    const profit = stateJobs.reduce((sum, j) => sum + j.companyProfit, 0) + perDiemTotals.profit;
                    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
                    
                    return (
                      <div 
                        key={state.code}
                        onClick={() => setSelectedStateCode(selectedStateCode === state.code ? null : state.code)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer select-none ${
                          selectedStateCode === state.code
                            ? 'bg-gradient-to-br from-emerald-950/20 to-emerald-900/10 border-emerald-500/50 shadow-md shadow-zinc-500/5'
                            : 'bg-[#09090b] border-zinc-800/60 hover:border-zinc-700/60 hover:bg-[#09090b]/80'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-extrabold text-xs text-zinc-200">{state.name}</span>
                          <span className="text-[9px] bg-zinc-800/30 text-zinc-300 font-extrabold px-1.5 py-0.5 rounded border border-blue-500/20 font-mono">
                            {state.code}
                          </span>
                        </div>
                        
                        <div className="space-y-1 text-[11px]">
                          <div className="flex justify-between">
                            <span className="text-zinc-500">Gross Rev:</span>
                            <span className="font-bold text-slate-300 font-mono">${revenue.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-500">Co Profit:</span>
                            <span className="font-bold text-zinc-300 font-mono">${profit.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between border-t border-zinc-800/40 pt-1 mt-1">
                            <span className="text-zinc-500">Margin:</span>
                            <span className="font-extrabold text-zinc-100 font-mono">{margin.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </>
          )}

          {/* Section 2: Jobs Ledger & Weekly Sheet Importer */}
          {activeSection === 'jobs' && (
            <div className="bg-[#18181b] rounded-xl p-6 shadow-sm animate-fadeIn border border-zinc-800/40">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-zinc-800">
                <div>
                  <h3 className="text-base font-bold text-slate-100 tracking-wide flex items-center gap-2">
                    <span className="text-[#3b82f6]">💰</span> Jobs & Payroll Processor
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Paste weekly spreadsheet logs to calculate payouts, customize technician per diems/deductions, and generate statements.
                  </p>
                </div>
              </div>

              {parsedJobs.length === 0 ? (
                /* Paste input state */
                <div className="space-y-4">
                  <div className="bg-[#09090b] rounded-xl p-5 border border-zinc-800 space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-300">
                        Paste Weekly Spreadsheet Payout Rows (Tab-separated)
                      </label>
                      {importRawText.trim() && (
                        <button
                          onClick={() => setImportRawText('')}
                          className="text-[10px] text-red-400 hover:underline cursor-pointer bg-transparent border-0"
                        >
                          Clear Text
                        </button>
                      )}
                    </div>
                    <textarea
                      rows={12}
                      value={importRawText}
                      onChange={(e) => setImportRawText(e.target.value)}
                      placeholder="06/25/2026&#9;0967 Usmon Salaev&#9;Charter&#9;TWI CHARTER MI&#9;706596&#9;8284131440090820&#9;654 FRANKFORT AVE LOT 13&#9;ELBERTA&#9;MI&#9;496289800&#9;RRTCDP&#9;Residential Rescue Double Play Trouble Call&#9;1&#9;55,20 $"
                      className="w-full bg-[#09090b] border border-zinc-800 rounded-xl p-4 text-[11px] font-mono text-slate-300 focus:outline-none focus:border-[#3b82f6] placeholder-zinc-700 custom-scrollbar resize-none"
                    />
                    <div className="flex justify-between items-center text-[10px] text-zinc-500">
                      <p>
                        * Paste rows directly from Excel/Google Sheets. Delimiter is automatically detected.
                      </p>
                      <button
                        onClick={handleParseSheet}
                        disabled={!importRawText.trim()}
                        className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200 disabled:opacity-40 disabled:hover:bg-zinc-100 text-xs font-bold px-6 py-2.5 rounded-lg shadow-lg shadow-zinc-500/5 transition-all cursor-pointer border-0"
                      >
                        Parse & Validate Payouts
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Review & process layout */
                <div className="space-y-6">
                  {/* Summary Bar */}
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-[#09090b] p-4 rounded-xl border border-zinc-800">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center space-x-2 bg-[#18181b] border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-slate-300">
                        <span className="text-[10px] uppercase font-bold text-zinc-500">Filter Employee:</span>
                        <select
                          value={importerTechFilter}
                          onChange={(e) => setImporterTechFilter(e.target.value)}
                          className="bg-transparent border-none text-zinc-200 focus:outline-none cursor-pointer text-xs font-semibold"
                        >
                          <option value="ALL" className="bg-[#18181b]">All Employees ({parsedJobs.length} rows)</option>
                          <option value="UNMATCHED" className="bg-[#18181b]">Unmatched Techs ({parsedJobs.filter(j => !j.matchedTechId).length} rows)</option>
                          {Array.from(new Set(parsedJobs.map(j => j.matchedTechId).filter(Boolean))).map(id => {
                            const t = customTechnicians.find(tech => tech.id === id);
                            const count = parsedJobs.filter(j => j.matchedTechId === id).length;
                            return (
                              <option key={id} value={id?.toString()} className="bg-[#18181b]">{t?.name || 'Unknown'} ({count} rows)</option>
                            );
                          })}
                        </select>
                      </div>

                      <div className="flex items-center space-x-2 bg-[#18181b] border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-slate-300">
                        <span className="text-[10px] uppercase font-bold text-zinc-500">Set All States:</span>
                        <select
                          value=""
                          onChange={(e) => {
                            handleBulkSetState(e.target.value);
                            e.target.value = "";
                          }}
                          className="bg-transparent border-none text-zinc-200 focus:outline-none cursor-pointer text-xs font-semibold"
                        >
                          <option value="" className="bg-[#18181b]">-- Choose State --</option>
                          {customStates.map(s => (
                            <option key={s.code} value={s.code} className="bg-[#18181b]">{s.name} ({s.code})</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          setParsedJobs([]);
                          setImportRawText('');
                          setImporterTechFilter('ALL');
                          setTechAdjustments({});
                          setPerDiem('0.00');
                          setCarDeduction('0.00');
                          setHotelDeduction('0.00');
                        }}
                        className="bg-[#1e293b] border border-[#27272a] text-slate-300 hover:bg-[#28354b] text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center"
                      >
                        <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reset Importer
                      </button>
                    </div>
                  </div>

                  {/* Main Grid: Left is parsed list, Right is selected tech summary / adjustments */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                    
                    {/* Left: parsed table */}
                    <div className="lg:col-span-2 flex flex-col h-full">
                      <div className="bg-[#18181b] border border-zinc-800/60 rounded-xl overflow-hidden shadow-inner flex-1 flex flex-col h-full min-h-[520px]">
                        <div className="overflow-x-auto overflow-y-auto custom-scrollbar flex-1 h-full max-h-[535px]">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead className="bg-[#09090b] sticky top-0 z-10 border-b border-zinc-800">
                              <tr className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                                <th className="py-3 px-3">Date</th>
                                <th className="py-3 px-3">Raw Name</th>
                                <th className="py-3 px-3">Matched Employee</th>
                                <th className="py-3 px-3">Job ID</th>
                                <th className="py-3 px-3 text-center">Code</th>
                                <th className="py-3 px-3 text-center">Qty</th>
                                <th className="py-3 px-3 text-right">Gross</th>
                                <th className="py-3 px-3 text-center">Cut</th>
                                <th className="py-3 px-3 text-right text-zinc-300 font-bold">Tech Pay</th>
                                <th className="py-3 px-3 text-center"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/40 text-slate-300 font-medium">
                              {filteredParsedJobs.map((job) => (
                                <tr key={job.tempId} className="hover:bg-slate-800/10 transition-colors">
                                  {/* Date Input */}
                                  <td className="py-2.5 px-3 font-mono">
                                    <input
                                      type="text"
                                      value={job.date}
                                      onChange={(e) => handleUpdateRowValue(job.tempId, 'date', e.target.value)}
                                      className="bg-[#09090b] border border-[#27272a] rounded px-1.5 py-0.5 text-xs text-zinc-200 focus:outline-none w-20 font-mono"
                                    />
                                  </td>
                                  
                                  {/* Raw Name */}
                                  <td className="py-2.5 px-3 text-zinc-400 font-semibold truncate max-w-[100px]" title={job.techNameRaw}>
                                    {job.techNameRaw}
                                  </td>
                                  
                                  {/* Matched Employee Select */}
                                  <td className="py-2.5 px-3">
                                    <div className="flex items-center space-x-1.5">
                                      <select
                                        value={job.matchedTechId || ''}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          if (val) {
                                            handleUpdateRowTech(job.tempId, parseInt(val));
                                          } else {
                                            setParsedJobs(prev => prev.map(p => p.tempId === job.tempId ? { ...p, matchedTechId: null, isValid: false } : p));
                                          }
                                        }}
                                        className={`bg-[#09090b] border rounded px-1.5 py-0.5 text-xs text-zinc-200 focus:outline-none w-36 ${
                                          job.matchedTechId ? 'border-[#27272a]' : 'border-red-500/50 bg-red-950/20'
                                        }`}
                                      >
                                        <option value="">-- Unmatched --</option>
                                        {customTechnicians.map(t => (
                                          <option key={t.id} value={t.id}>{t.name} ({t.payoutType === 'PERCENTAGE' ? `${t.payoutValue}%` : `$${t.payoutValue}`})</option>
                                        ))}
                                      </select>
                                      {!job.matchedTechId && (
                                        <button
                                          onClick={() => handleQuickCreateTech(job.techNameRaw, job.stateCode)}
                                          title="Quick Create Technician"
                                          className="bg-zinc-800/30 hover:bg-zinc-800/80 text-zinc-300 font-bold px-1.5 py-0.5 rounded border border-zinc-700/60 text-[9px] shrink-0 cursor-pointer"
                                        >
                                          + Create
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                  
                                  {/* Job ID */}
                                  <td className="py-2.5 px-3 font-mono font-bold text-zinc-400">
                                    {job.jobRef}
                                  </td>

                                  {/* Job Code */}
                                  <td className="py-2.5 px-3 text-center">
                                    <input
                                      type="text"
                                      value={job.jobCode}
                                      onChange={(e) => handleUpdateRowValue(job.tempId, 'jobCode', e.target.value)}
                                      className="bg-[#09090b] border border-[#27272a] rounded px-1.5 py-0.5 text-xs text-zinc-200 focus:outline-none w-14 font-mono text-center font-bold"
                                    />
                                  </td>

                                  {/* Qty */}
                                  <td className="py-2.5 px-3 text-center">
                                    <input
                                      type="number"
                                      value={job.quantity}
                                      onChange={(e) => handleUpdateRowValue(job.tempId, 'quantity', parseInt(e.target.value) || 1)}
                                      min={1}
                                      className="bg-[#09090b] border border-[#27272a] rounded px-1.5 py-0.5 text-xs text-zinc-200 focus:outline-none w-10 text-center font-mono"
                                    />
                                  </td>

                                  {/* Gross Amount */}
                                  <td className="py-2.5 px-3 text-right">
                                    <div className="relative inline-block">
                                      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-zinc-500 font-mono">$</span>
                                      <input
                                        type="number"
                                        value={job.grossAmount}
                                        step="0.01"
                                        onChange={(e) => handleUpdateRowValue(job.tempId, 'grossAmount', parseFloat(e.target.value) || 0)}
                                        className="bg-[#09090b] border border-[#27272a] rounded pl-4 pr-1.5 py-0.5 text-xs text-zinc-200 focus:outline-none w-16 text-right font-mono"
                                      />
                                    </div>
                                  </td>

                                  {/* Company Cut % */}
                                  <td className="py-2.5 px-3 text-center font-mono font-bold text-zinc-400">
                                    {job.companyCutPct.toFixed(1)}%
                                  </td>

                                  {/* Tech Payout */}
                                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                                    ${job.techPayout.toFixed(2)}
                                  </td>

                                  {/* Delete */}
                                  <td className="py-2.5 px-3 text-center">
                                    <button
                                      onClick={() => setParsedJobs(prev => prev.filter(p => p.tempId !== job.tempId))}
                                      className="text-red-500 hover:text-red-400 cursor-pointer p-1 bg-transparent border-0"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* Right: Selected Tech Invoice calculations / Adjustments */}
                    <div className="flex flex-col h-full">
                      {(() => {
                        const selectedTechId = importerTechFilter === 'ALL' || importerTechFilter === 'UNMATCHED' ? null : parseInt(importerTechFilter);
                        
                        if (!selectedTechId) {
                          return (
                            <div className="bg-[#09090b] rounded-xl p-5 border border-zinc-800 flex flex-col justify-center items-center text-center text-zinc-500 text-xs h-full min-h-[250px]">
                              <Info className="w-6 h-6 mb-2 text-zinc-600 animate-pulse" />
                              <p className="font-semibold text-zinc-400">Manage Technician Adjustments</p>
                              <p className="text-[11px] text-zinc-600 mt-1 max-w-[200px]">
                                Select a technician in the dropdown to set Per Diem, deductions, and preview their payout statement.
                              </p>
                            </div>
                          );
                        }

                        const tech = customTechnicians.find(t => t.id === selectedTechId);
                        const techJobs = parsedJobs.filter(j => j.matchedTechId === selectedTechId);
                        const uniqueDays = new Set(techJobs.map(j => j.date)).size;
                        
                        const totalJobsGross = techJobs.reduce((acc, j) => acc + (j.grossAmount * j.quantity), 0);
                        const baseJobsProfit = techJobs.reduce((acc, j) => acc + j.companyProfit, 0);
                        const totalTechSub = techJobs.reduce((acc, j) => acc + j.techPayout, 0);
                        
                        const companyPDVal = parseFloat(companyPerDiem) || 0;
                        const techPDVal = parseFloat(perDiem) || 0;
                        const perDiemMargin = companyPDVal - techPDVal;

                        const techCarVal = parseFloat(carDeduction) || 0;
                        const companyToolsVal = parseFloat(companyToolsCost) || 0;
                        const toolsMargin = techCarVal - companyToolsVal;

                        const hotelVal = parseFloat(hotelDeduction) || 0;

                        const totalInvoiceRevenue = totalJobsGross + companyPDVal;
                        const totalNetCompanyProfit = baseJobsProfit + perDiemMargin + toolsMargin;
                        const netTechPayout = totalTechSub + techPDVal - techCarVal - hotelVal;

                        return (
                          <div className="bg-[#09090b] rounded-xl p-5 border border-zinc-800 space-y-4 animate-fadeIn">
                            <div>
                              <span className="text-[9px] uppercase font-bold text-zinc-500 block">Tech Adjustments & Margins</span>
                              <h4 className="text-sm font-bold text-slate-100 truncate">{tech?.name}</h4>
                              <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{uniqueDays} work day{uniqueDays !== 1 ? 's' : ''} detected</p>
                            </div>

                            {/* Per Diem Section */}
                            <div className="bg-[#18181b]/60 border border-zinc-800/60 rounded-lg p-3 space-y-2">
                              <div className="flex items-center justify-between text-[10px] uppercase font-bold text-zinc-400">
                                <span>Per Diem Breakdown</span>
                                <span className={`font-mono ${perDiemMargin >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                  Margin: {perDiemMargin >= 0 ? '+' : ''}${perDiemMargin.toFixed(2)}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <label className="text-[9px] uppercase font-semibold text-zinc-500 block">Company Recv (+)</label>
                                  <div className="relative mt-0.5">
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-600 font-mono">$</span>
                                    <input
                                      type="number"
                                      value={companyPerDiem}
                                      onChange={(e) => setCompanyPerDiem(e.target.value)}
                                      className="w-full bg-[#09090b] border border-zinc-800 rounded pl-5 pr-1.5 py-1 text-xs text-zinc-200 focus:outline-none font-mono"
                                      placeholder="0.00"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="text-[9px] uppercase font-semibold text-zinc-500 block">Tech Paid (+)</label>
                                  <div className="relative mt-0.5">
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-600 font-mono">$</span>
                                    <input
                                      type="number"
                                      value={perDiem}
                                      onChange={(e) => setPerDiem(e.target.value)}
                                      className="w-full bg-[#09090b] border border-zinc-800 rounded pl-5 pr-1.5 py-1 text-xs text-zinc-200 focus:outline-none font-mono"
                                      placeholder="0.00"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Tools & Car Section */}
                            <div className="bg-[#18181b]/60 border border-zinc-800/60 rounded-lg p-3 space-y-2">
                              <div className="flex items-center justify-between text-[10px] uppercase font-bold text-zinc-400">
                                <span>Car & Tools Breakdown</span>
                                <span className={`font-mono ${toolsMargin >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                  Margin: {toolsMargin >= 0 ? '+' : ''}${toolsMargin.toFixed(2)}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <label className="text-[9px] uppercase font-semibold text-zinc-500 block">Tech Ded. (-)</label>
                                  <div className="relative mt-0.5">
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-600 font-mono">$</span>
                                    <input
                                      type="number"
                                      value={carDeduction}
                                      onChange={(e) => setCarDeduction(e.target.value)}
                                      className="w-full bg-[#09090b] border border-zinc-800 rounded pl-5 pr-1.5 py-1 text-xs text-zinc-200 focus:outline-none font-mono"
                                      placeholder="0.00"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="text-[9px] uppercase font-semibold text-zinc-500 block">Company Cost (-)</label>
                                  <div className="relative mt-0.5">
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-600 font-mono">$</span>
                                    <input
                                      type="number"
                                      value={companyToolsCost}
                                      onChange={(e) => setCompanyToolsCost(e.target.value)}
                                      className="w-full bg-[#09090b] border border-zinc-800 rounded pl-5 pr-1.5 py-1 text-xs text-zinc-200 focus:outline-none font-mono"
                                      placeholder="0.00"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Hotel Deduction */}
                            <div className="space-y-1">
                              <label className="text-[9px] uppercase font-bold text-zinc-500 block">Hotel Deduction (-)</label>
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-600 font-mono">$</span>
                                <input
                                  type="number"
                                  value={hotelDeduction}
                                  onChange={(e) => setHotelDeduction(e.target.value)}
                                  className="w-full bg-[#18181b] border border-zinc-800 rounded pl-5 pr-1.5 py-1 text-xs text-zinc-200 focus:outline-none font-mono"
                                  placeholder="0.00"
                                />
                              </div>
                            </div>

                            {/* Summary Invoice calculation */}
                            <div className="border-t border-zinc-800 pt-3 space-y-1.5 text-[11px]">
                              <div className="flex justify-between">
                                <span className="text-zinc-500">Gross Invoice Rev:</span>
                                <span className="font-bold text-zinc-200 font-mono">${totalInvoiceRevenue.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-zinc-400">
                                <span>Jobs Base Profit:</span>
                                <span className="font-semibold font-mono">${baseJobsProfit.toFixed(2)}</span>
                              </div>
                              {perDiemMargin !== 0 && (
                                <div className="flex justify-between text-zinc-400">
                                  <span>Per Diem Profit Margin:</span>
                                  <span className={`font-semibold font-mono ${perDiemMargin >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                    {perDiemMargin >= 0 ? '+' : ''}${perDiemMargin.toFixed(2)}
                                  </span>
                                </div>
                              )}
                              {toolsMargin !== 0 && (
                                <div className="flex justify-between text-zinc-400">
                                  <span>Tools Profit Margin:</span>
                                  <span className={`font-semibold font-mono ${toolsMargin >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                    {toolsMargin >= 0 ? '+' : ''}${toolsMargin.toFixed(2)}
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between border-t border-zinc-800/60 pt-1.5 pb-1">
                                <span className="font-bold text-slate-200">Total Net Company Profit:</span>
                                <span className="font-black text-amber-400 font-mono text-sm">${totalNetCompanyProfit.toFixed(2)}</span>
                              </div>

                              <div className="flex justify-between border-t border-zinc-800/60 pt-1.5 text-zinc-400">
                                <span>Payout Subtotal:</span>
                                <span className="font-bold text-zinc-300 font-mono">${totalTechSub.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-zinc-400">
                                <span>Tech Adjustments (Per Diem - Ded):</span>
                                <span className={`font-semibold font-mono ${(techPDVal - techCarVal - hotelVal) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  ${(techPDVal - techCarVal - hotelVal).toFixed(2)}
                                </span>
                              </div>

                              <div className="flex justify-between border-t border-zinc-800 pt-2 text-xs">
                                <span className="font-extrabold text-slate-100">Net Tech Payout:</span>
                                <span className="font-black text-emerald-400 font-mono text-sm">${netTechPayout.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Commit Section */}
                  <div className="flex justify-between items-center pt-4 border-t border-zinc-800 bg-[#09090b]/10">
                    <p className="text-xs text-zinc-500">
                      Please confirm all technician mappings. Committing generates payroll statement files.
                    </p>
                    <button
                      onClick={handleCommitParsedJobs}
                      className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200 font-extrabold text-xs px-6 py-3 rounded-lg shadow-lg shadow-zinc-500/20 transition-all cursor-pointer border-0"
                    >
                      Approve & Generate Statements
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Section 3: Rate Plans Master Grid */}
          {activeSection === 'rates' && (
            <div className="bg-[#18181b] rounded-xl p-6 shadow-sm animate-fadeIn relative">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 border-b border-zinc-800 pb-4 space-y-3 md:space-y-0">
                <div>
                  <h3 className="text-base font-bold text-slate-100 tracking-wide">
                    Provider Master Rates & Rate Manager
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Manage master price grids, including Company Rates and Employee payout rates per state.
                  </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                  {/* State Filter */}
                  <div className="flex items-center space-x-1.5 bg-[#09090b] border border-[#27272a] rounded px-2.5 py-1.5 text-xs text-slate-300">
                    <span className="text-[10px] uppercase font-bold text-zinc-500">State:</span>
                    <select 
                      value={ratesStateFilter} 
                      onChange={(e) => setRatesStateFilter(e.target.value)}
                      className="bg-transparent border-none text-zinc-200 focus:outline-none cursor-pointer text-xs"
                    >
                      <option value="ALL" className="bg-[#18181b]">All States</option>
                      {customStates.map(s => (
                        <option key={s.code} value={s.code} className="bg-[#18181b]">{s.code} - {s.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Provider Filter */}
                  <div className="flex items-center space-x-1.5 bg-[#09090b] border border-[#27272a] rounded px-2.5 py-1.5 text-xs text-slate-300">
                    <span className="text-[10px] uppercase font-bold text-zinc-500">Provider:</span>
                    <select 
                      value={ratesProviderFilter} 
                      onChange={(e) => setRatesProviderFilter(e.target.value)}
                      className="bg-transparent border-none text-zinc-200 focus:outline-none cursor-pointer text-xs"
                    >
                      <option value="ALL" className="bg-[#18181b]">All Providers</option>
                      {uniqueProviders.map(prov => (
                        <option key={prov} value={prov} className="bg-[#18181b]">{prov}</option>
                      ))}
                    </select>
                  </div>

                  {/* Reset Defaults */}
                  <button 
                    onClick={handleResetRates}
                    className="bg-[#18181b] text-zinc-400 border border-[#27272a] text-xs font-semibold px-3 py-2 rounded-md hover:bg-slate-800 hover:text-zinc-200 transition-colors flex items-center"
                    title="Reset all rate plans to default values"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset Defaults
                  </button>

                  {/* Bulk Import */}
                  <button 
                    onClick={() => setIsBulkImportOpen(true)}
                    className="bg-zinc-800 text-white text-xs font-bold px-3.5 py-2 rounded-md hover:bg-zinc-700 shadow-lg shadow-zinc-500/5 transition-all flex items-center font-semibold"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 mr-1" /> Bulk Import
                  </button>
                </div>
              </div>

              {/* Regional Stats & Export Actions Block */}
              <div className="bg-[#09090b] border border-zinc-800/60 rounded-xl p-5 mb-6 space-y-5 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h4 className="text-xs uppercase font-bold text-zinc-400 tracking-wider">
                      {activeStateName} Rate Sheet Performance Summary
                    </h4>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Aggregated averages and payout metrics for currently filtered codes.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Total Codes */}
                  <div className="bg-[#18181b]/50 border border-zinc-800/40 rounded-lg p-3.5 flex flex-col justify-between">
                    <span className="text-[9px] uppercase font-bold text-zinc-500">Active Codes</span>
                    <span className="text-lg font-black text-zinc-200 mt-1 font-mono">{ratesStats.totalCodes}</span>
                  </div>

                  {/* Avg Company Price */}
                  <div className="bg-[#18181b]/50 border border-zinc-800/40 rounded-lg p-3.5 flex flex-col justify-between">
                    <span className="text-[9px] uppercase font-bold text-zinc-500">Avg Company Rate</span>
                    <span className="text-lg font-black text-zinc-100 mt-1 font-mono">${ratesStats.avgCompany.toFixed(2)}</span>
                  </div>

                  {/* Avg Employee Payout */}
                  <div className="bg-[#18181b]/50 border border-zinc-800/40 rounded-lg p-3.5 flex flex-col justify-between">
                    <span className="text-[9px] uppercase font-bold text-zinc-500">Avg Tech Payout</span>
                    <span className="text-lg font-black text-zinc-300 mt-1 font-mono">${ratesStats.avgEmployee.toFixed(2)}</span>
                  </div>

                  {/* Avg Margin */}
                  <div className="bg-[#18181b]/50 border border-zinc-800/40 rounded-lg p-3.5 flex flex-col justify-between">
                    <span className="text-[9px] uppercase font-bold text-zinc-500">Avg Retention</span>
                    <span className="text-lg font-black text-zinc-400 mt-1 font-mono">
                      ${ratesStats.avgRetentionVal.toFixed(2)} 
                      <span className="text-xs text-zinc-400 font-semibold ml-1.5">({ratesStats.avgRetentionPct.toFixed(0)}%)</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick State Payout Recalculator */}
              <div className="bg-[#09090b] border border-zinc-800/80 rounded-xl p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fadeIn">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-zinc-200 flex items-center">
                    <Percent className="w-3.5 h-3.5 text-zinc-400 mr-1.5 shrink-0" />
                    Quick State Payout Recalculator (Company Cut)
                  </h4>
                  <p className="text-[10px] text-zinc-500">
                    Recalculate employee payouts for all rate plans in a state by setting a standard company cut percentage.
                  </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center space-x-1.5 bg-[#18181b] border border-zinc-800 rounded px-2 py-1.5 text-xs text-slate-300">
                    <span className="text-[9px] uppercase font-bold text-zinc-500">State:</span>
                    <select 
                      value={quickRateState} 
                      onChange={(e) => setQuickRateState(e.target.value)}
                      className="bg-transparent border-none text-zinc-200 focus:outline-none cursor-pointer text-xs font-semibold"
                    >
                      {customStates.map(s => (
                        <option key={s.code} value={s.code} className="bg-[#18181b]">{s.code}</option>
                      ))}
                    </select>
                  </div>

                  <div className="relative w-28 flex items-center">
                    <input 
                      type="number"
                      step="0.1"
                      placeholder="Company Cut %"
                      value={quickRateCut}
                      onChange={(e) => setQuickRateCut(e.target.value)}
                      className="w-full bg-[#18181b] border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 text-center font-mono font-bold"
                    />
                    <span className="absolute right-2 text-[10px] text-zinc-500 font-semibold pointer-events-none">%</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleQuickRateRecalc}
                    className="bg-[#6366f1] hover:bg-zinc-800 text-white text-xs font-bold px-4 py-1.5 rounded transition-colors shadow-md shadow-zinc-500/5 cursor-pointer font-semibold"
                  >
                    Apply Recalculation
                  </button>
                </div>
              </div>

              {filteredRatePlans.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredRatePlans.map((rate) => (
                    <div 
                      key={rate.id} 
                      className="bg-[#09090b] border border-zinc-800 hover:border-blue-500/40 rounded-xl p-5 shadow-sm transition-all space-y-4 flex flex-col justify-between group"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black ${
                              rate.provider === 'Xfinity' ? 'bg-red-500/10 text-red-400' : 'bg-zinc-800/30 text-zinc-300'
                            }`}>
                              {rate.provider}
                            </span>
                            <h4 className="text-base font-mono font-black text-slate-100 pt-1">
                              {rate.code}
                            </h4>
                          </div>
                          <span className="bg-[#18181b] px-2 py-1 rounded text-[10px] text-zinc-400 border border-zinc-800 font-mono">
                            ID: #{rate.id}
                          </span>
                        </div>

                        <p className="text-xs text-zinc-400 min-h-[32px] leading-relaxed">
                          {rate.description}
                        </p>
                      </div>

                      <div className="space-y-3.5 pt-3.5 border-t border-zinc-800/60">
                        {/* Company Rate & Employee Rate Details */}
                        <div className="grid grid-cols-2 gap-3.5 bg-[#18181b]/50 p-2.5 rounded border border-zinc-800/40">
                          <div className="space-y-0.5">
                            <span className="text-[9px] uppercase font-bold text-zinc-500 block">Company Rate</span>
                            <span className="text-base font-extrabold font-mono text-zinc-100">${rate.grossPrice.toFixed(2)}</span>
                          </div>
                          <div className="space-y-0.5 border-l border-zinc-800/60 pl-3">
                            <span className="text-[9px] uppercase font-bold text-zinc-500 block">Employee Rate</span>
                            <span className="text-base font-extrabold font-mono text-zinc-300">${rate.employeePrice.toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1">
                          <span className="flex items-center text-zinc-500 font-semibold">
                            <MapPin className="w-3.5 h-3.5 text-slate-600 mr-1 shrink-0" />
                            Region: <strong className="text-slate-300 ml-1 font-mono">{rate.cityName ? `${rate.cityName}, ${rate.stateCode}` : rate.stateCode}</strong>
                          </span>
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => handleEditRateClick(rate)}
                              className="p-1.5 text-zinc-100 hover:bg-zinc-800/40 rounded transition-colors"
                              title="Edit Rate"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDeleteRate(rate.id)}
                              className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded transition-colors"
                              title="Delete Rate"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-[#09090b] rounded-xl border border-zinc-800">
                  <span className="text-xs text-zinc-500 italic">No rate plans match the current filters.</span>
                </div>
              )}


            </div>
          )}

          {/* Section 4: Employee & Fleet Manager */}
          {activeSection === 'employees' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Header Title Block */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div>
                  <h1 className="text-xl font-bold text-slate-100 tracking-wide">
                    Field Operations & Fleet Control
                  </h1>
                  <p className="text-xs text-zinc-400 mt-1">
                    Manage field technician assignments, dynamic contract payout margins, and company vehicle allocation.
                  </p>
                </div>

                {/* Tab Selectors */}
                <div className="flex bg-[#09090b] p-0.5 rounded-lg border border-[#27272a]">
                  <button
                    onClick={() => setActiveEmployeeTab('techs')}
                    className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                      activeEmployeeTab === 'techs'
                        ? 'bg-[#3b82f6] text-white shadow-md shadow-zinc-500/5'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Field Technicians</span>
                  </button>
                  <button
                    onClick={() => setActiveEmployeeTab('fleet')}
                    className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                      activeEmployeeTab === 'fleet'
                        ? 'bg-[#3b82f6] text-white shadow-md shadow-zinc-500/5'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Car className="w-3.5 h-3.5" />
                    <span>Fleet Registry</span>
                  </button>
                </div>
              </div>

              {/* Filtering Controls Row */}
              <div className="bg-[#18181b] p-5 rounded-xl border border-zinc-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
                {activeEmployeeTab === 'techs' ? (
                  <>
                    <div className="flex flex-wrap items-center gap-3.5 flex-1">
                      {/* Name Search */}
                      <div className="relative w-full md:w-56">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                        <input
                          type="text"
                          placeholder="Search technician..."
                          value={employeesSearchQuery}
                          onChange={(e) => setEmployeesSearchQuery(e.target.value)}
                          className="w-full bg-[#09090b] border border-[#27272a] rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-[#3b82f6] placeholder-slate-500"
                        />
                      </div>

                      {/* State Filter */}
                      <div className="flex items-center space-x-1.5 bg-[#09090b] border border-[#27272a] rounded-md px-2.5 py-1.5 text-xs text-slate-300">
                        <span className="text-[9px] uppercase font-bold text-zinc-500">Base State:</span>
                        <select
                          value={employeesStateFilter}
                          onChange={(e) => setEmployeesStateFilter(e.target.value)}
                          className="bg-transparent border-none text-zinc-200 focus:outline-none cursor-pointer text-xs"
                        >
                          <option value="ALL" className="bg-[#18181b]">All States</option>
                          {customStates.map(s => (
                            <option key={s.code} value={s.code} className="bg-[#18181b]">{s.code} - {s.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Status Filter */}
                      <div className="flex items-center space-x-1.5 bg-[#09090b] border border-[#27272a] rounded-md px-2.5 py-1.5 text-xs text-slate-300">
                        <span className="text-[9px] uppercase font-bold text-zinc-500">Status:</span>
                        <select
                          value={employeesStatusFilter}
                          onChange={(e) => setEmployeesStatusFilter(e.target.value)}
                          className="bg-transparent border-none text-zinc-200 focus:outline-none cursor-pointer text-xs"
                        >
                          <option value="ALL" className="bg-[#18181b]">All Statuses</option>
                          <option value="ONBOARDING" className="bg-[#18181b]">Onboarding / Hiring</option>
                          <option value="TRAINING" className="bg-[#18181b]">Training</option>
                          <option value="ACTIVE" className="bg-[#18181b]">Active</option>
                          <option value="INACTIVE" className="bg-[#18181b]">Inactive</option>
                          <option value="SUSPENDED" className="bg-[#18181b]">Suspended</option>
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={handleAddTechClick}
                      className="bg-zinc-100 text-zinc-950 text-xs font-bold px-4 py-2 rounded-md hover:bg-zinc-200 shadow-lg shadow-zinc-500/5 transition-all flex items-center shrink-0 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Technician
                    </button>
                  </>
                ) : (
                  <>
                    <div className="text-xs text-zinc-400">
                      Fleet inventory contains <strong className="text-zinc-200">{customVehicles.length} vehicles</strong> registered under service.
                    </div>
                    <button
                      onClick={handleAddVehicleClick}
                      className="bg-zinc-100 text-zinc-950 text-xs font-bold px-4 py-2 rounded-md hover:bg-zinc-200 shadow-lg shadow-zinc-500/5 transition-all flex items-center shrink-0 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Vehicle
                    </button>
                  </>
                )}
              </div>



              {/* Tab Content Panels */}
              {activeEmployeeTab === 'techs' ? (
                /* Technicians List Card */
                <div className="space-y-4">
                  {/* Desktop View */}
                  <div className="hidden md:block bg-[#18181b] rounded-xl shadow-sm border border-zinc-800/60 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider text-[10px] bg-[#09090b]/20">
                            <th className="py-3 px-5">Technician</th>
                            <th className="py-3 px-5">Status</th>
                            <th className="py-3 px-5">Jobs Today</th>
                            <th className="py-3 px-5">Work Type</th>
                            <th className="py-3 px-5">Base State</th>
                            <th className="py-3 px-5">Assigned Vehicle</th>
                            <th className="py-3 px-5">Company Cut / Fee</th>
                            <th className="py-3 px-5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40 text-slate-300">
                          {(() => {
                            const filtered = customTechnicians.filter(t => {
                              const matchesSearch = t.name.toLowerCase().includes(employeesSearchQuery.toLowerCase()) || t.email.toLowerCase().includes(employeesSearchQuery.toLowerCase());
                              const matchesState = employeesStateFilter === 'ALL' || t.stateCode === employeesStateFilter;
                              const matchesStatus = employeesStatusFilter === 'ALL' || t.status === employeesStatusFilter;
                              return matchesSearch && matchesState && matchesStatus;
                            });

                            if (filtered.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={8} className="py-12 text-center text-zinc-500 italic">
                                    No field technicians match the search parameters.
                                  </td>
                                </tr>
                              );
                            }

                            return filtered.map((tech) => {
                              const vehicle = customVehicles.find(v => v.technicianId === tech.id);
                              return (
                                <tr key={tech.id} className="hover:bg-slate-800/25 transition-colors">
                                  <td className="py-3.5 px-5">
                                    <div className="flex items-center space-x-3">
                                      <div className="w-8 h-8 rounded-full bg-[#09090b] border border-zinc-800 flex items-center justify-center text-[10px] font-bold text-slate-300">
                                        {tech.name.split(' ').map(n => n[0]).join('')}
                                      </div>
                                      <div className="space-y-0.5">
                                        <p className="font-bold text-zinc-200 text-xs">{tech.name}</p>
                                        <p className="text-[10px] text-zinc-500 flex items-center">
                                          <Mail className="w-3 h-3 mr-1.5 shrink-0" /> 
                                          <a href={`mailto:${tech.email}`} className="text-zinc-500 hover:text-zinc-300 hover:underline">
                                            {tech.email}
                                          </a>
                                          <span className="mx-1.5">•</span>
                                          <Phone className="w-3 h-3 mr-1.5 shrink-0" /> 
                                          <a href={`tel:${tech.phone}`} className="text-zinc-500 hover:text-zinc-300 hover:underline">
                                            {tech.phone}
                                          </a>
                                        </p>
                                        {tech.username && (
                                          <div className="flex items-center space-x-1.5 text-[9.5px] mt-0.5 font-medium">
                                            <span className="bg-[#09090b] text-zinc-400 border border-zinc-800 px-1 py-0.2 rounded">User: {tech.username}</span>
                                            <span className="bg-[#09090b] text-zinc-400 border border-zinc-800 px-1 py-0.2 rounded">Pass: {tech.password || '—'}</span>
                                          </div>
                                        )}
                                        {tech.notes && tech.notes.trim() && (
                                          <p className="text-[9.5px] text-amber-400/80 italic mt-0.5 max-w-[260px] truncate">
                                            📝 {tech.notes}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-3.5 px-5">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wide border ${
                                      tech.status === 'ACTIVE' 
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                        : tech.status === 'TRAINING'
                                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                        : tech.status === 'ONBOARDING'
                                        ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                                        : tech.status === 'SUSPENDED'
                                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                        : 'bg-slate-500/10 text-zinc-400 border-slate-500/20'
                                    }`}>
                                      {tech.status}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-5">
                                    {tech.jobsToday && tech.jobsToday > 0 ? (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                                        ⚡ {tech.jobsToday} today
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-[#09090b] text-zinc-500 border border-zinc-800 font-mono">
                                        0 today
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3.5 px-5 font-semibold">
                                    <span className={`px-2 py-0.5 rounded text-[9.5px] border ${
                                      tech.workType === 'BURY'
                                        ? 'bg-cyan-500/10 text-zinc-100 border-cyan-500/20'
                                        : tech.workType === 'COAX'
                                        ? 'bg-zinc-800/30 text-zinc-300 border-blue-500/20'
                                        : 'bg-purple-500/10 text-zinc-400 border-purple-500/20'
                                    }`}>
                                      {tech.workType === 'BURY' ? 'Bury' : tech.workType === 'COAX' ? 'Coax' : 'Fiber'}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-5">
                                    <span className="bg-[#09090b] border border-zinc-800 px-2.5 py-0.5 rounded font-mono font-bold text-[10.5px] text-slate-300">
                                      {tech.stateCode}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-5 text-zinc-400">
                                    {vehicle ? (
                                      <div className="flex items-center space-x-1.5">
                                        <Car className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
                                        <div className="text-[10px]">
                                          <p className="font-bold text-slate-300 leading-tight">{vehicle.plateNumber}</p>
                                          <p className="text-zinc-500 text-[9px]">{vehicle.year} {vehicle.make}</p>
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="italic text-slate-600 text-[10.5px]">No vehicle linked</span>
                                    )}
                                  </td>
                                  <td className="py-3.5 px-5">
                                    <span className="bg-[#09090b] border border-zinc-800/80 px-2.5 py-0.5 rounded text-[10px] font-mono text-slate-300 font-bold">
                                      <span className="text-zinc-300">
                                        {tech.payoutType === 'PERCENTAGE' ? `${tech.payoutValue}% Cut` : `$${tech.payoutValue} Fee`}
                                      </span>
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-5 text-right">
                                    <div className="flex items-center justify-end space-x-1.5">
                                      {tech.notes && tech.notes.trim() && (
                                        <div
                                          title={tech.notes}
                                          className="p-1.5 text-amber-400 bg-amber-500/10 rounded border border-amber-500/20 cursor-help"
                                        >
                                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                          </svg>
                                        </div>
                                      )}
                                      {(() => {
                                        const docCount = customDocuments.filter(d => d.technicianId === tech.id).length;
                                        return docCount > 0 ? (
                                          <button
                                            onClick={() => { handleEditTechClick(tech); setTechModalTab('documents'); }}
                                            className="p-1.5 text-zinc-300 bg-zinc-800/30 rounded border border-blue-500/20 hover:bg-zinc-800/20 transition-colors cursor-pointer"
                                            title={`${docCount} document${docCount !== 1 ? 's' : ''}`}
                                          >
                                            <FileText className="w-3.5 h-3.5" />
                                          </button>
                                        ) : null;
                                      })()}
                                      <button 
                                        onClick={() => handleEditTechClick(tech)}
                                        className="p-1.5 text-zinc-100 hover:bg-zinc-800/40 rounded transition-colors cursor-pointer"
                                        title="Edit Tech Profile & Contracts"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteTech(tech.id)}
                                        className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded transition-colors cursor-pointer"
                                        title="Delete Technician"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3.5">
                    {(() => {
                      const filtered = customTechnicians.filter(t => {
                        const matchesSearch = t.name.toLowerCase().includes(employeesSearchQuery.toLowerCase()) || t.email.toLowerCase().includes(employeesSearchQuery.toLowerCase());
                        const matchesState = employeesStateFilter === 'ALL' || t.stateCode === employeesStateFilter;
                        const matchesStatus = employeesStatusFilter === 'ALL' || t.status === employeesStatusFilter;
                        return matchesSearch && matchesState && matchesStatus;
                      });

                      if (filtered.length === 0) {
                        return (
                          <div className="bg-[#18181b] border border-zinc-800/60 rounded-xl p-8 text-center text-zinc-500 italic text-xs">
                            No field technicians match the search parameters.
                          </div>
                        );
                      }

                      return filtered.map((tech) => {
                        const vehicle = customVehicles.find(v => v.technicianId === tech.id);
                        return (
                          <div key={tech.id} className="bg-[#18181b] rounded-xl border border-zinc-800/60 p-4 space-y-4">
                            {/* Top header: Avatar, Name & Status */}
                            <div className="flex items-start justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full bg-[#09090b] border border-zinc-800 flex items-center justify-center text-xs font-bold text-slate-300">
                                  {tech.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div>
                                  <h4 className="font-bold text-zinc-200 text-sm leading-snug">{tech.name}</h4>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <span className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wide border ${
                                      tech.status === 'ACTIVE' 
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                        : tech.status === 'TRAINING'
                                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                        : tech.status === 'ONBOARDING'
                                        ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                                        : tech.status === 'SUSPENDED'
                                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                        : 'bg-slate-500/10 text-zinc-400 border-slate-500/20'
                                    }`}>
                                      {tech.status}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded text-[8.5px] font-bold border ${
                                      tech.workType === 'BURY'
                                        ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                                        : tech.workType === 'COAX'
                                        ? 'bg-zinc-800/30 text-zinc-300 border-blue-500/20'
                                        : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                    }`}>
                                      {tech.workType === 'BURY' ? 'Bury' : tech.workType === 'COAX' ? 'Coax' : 'Fiber'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Contact info */}
                            <div className="bg-[#09090b]/40 rounded-lg p-2.5 space-y-1.5 text-xs border border-zinc-800/40">
                              <a href={`mailto:${tech.email}`} className="text-zinc-400 hover:text-zinc-200 flex items-center transition-colors">
                                <Mail className="w-3.5 h-3.5 mr-2 shrink-0 text-zinc-500" />
                                <span className="truncate">{tech.email}</span>
                              </a>
                              <a href={`tel:${tech.phone}`} className="text-zinc-400 hover:text-zinc-200 flex items-center transition-colors">
                                <Phone className="w-3.5 h-3.5 mr-2 shrink-0 text-zinc-500" />
                                <span>{tech.phone}</span>
                              </a>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div className="bg-[#09090b]/30 p-2.5 rounded-lg border border-zinc-800/30 flex flex-col justify-between">
                                <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Base State</span>
                                <span className="font-mono font-bold text-zinc-200 mt-1">{tech.stateCode}</span>
                              </div>
                              <div className="bg-[#09090b]/30 p-2.5 rounded-lg border border-zinc-800/30 flex flex-col justify-between">
                                <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Company Cut</span>
                                <span className="font-mono font-bold text-zinc-200 mt-1">
                                  {tech.payoutType === 'PERCENTAGE' ? `${tech.payoutValue}% Cut` : `$${tech.payoutValue} Fee`}
                                </span>
                              </div>
                              <div className="col-span-2 bg-[#09090b]/30 p-2.5 rounded-lg border border-zinc-800/30">
                                <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider block mb-1">Assigned Vehicle</span>
                                {vehicle ? (
                                  <div className="flex items-center space-x-2">
                                    <Car className="w-4 h-4 text-zinc-400 shrink-0" />
                                    <div>
                                      <p className="font-bold text-zinc-300 text-xs leading-none">{vehicle.plateNumber}</p>
                                      <p className="text-[10px] text-zinc-500 mt-0.5">{vehicle.year} {vehicle.make} {vehicle.model}</p>
                                    </div>
                                  </div>
                                ) : (
                                  <span className="italic text-zinc-600 text-xs">No vehicle linked</span>
                                )}
                              </div>
                            </div>

                            {/* Internal Notes */}
                            {tech.notes && tech.notes.trim() && (
                              <div className="bg-amber-500/5 border border-amber-500/15 rounded-lg p-2.5 text-xs text-amber-400/80">
                                <p className="font-semibold text-[10px] uppercase tracking-wider text-amber-500/70 mb-0.5">Notes</p>
                                <p className="italic">📝 {tech.notes}</p>
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800/40">
                              {(() => {
                                const docCount = customDocuments.filter(d => d.technicianId === tech.id).length;
                                return docCount > 0 ? (
                                  <button
                                    onClick={() => { handleEditTechClick(tech); setTechModalTab('documents'); }}
                                    className="px-3 py-1.5 text-zinc-300 bg-zinc-800/40 hover:bg-zinc-800/80 rounded border border-zinc-700/60 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                                  >
                                    <FileText className="w-3.5 h-3.5 text-zinc-400" />
                                    <span>Docs ({docCount})</span>
                                  </button>
                                ) : null;
                              })()}
                              <button 
                                onClick={() => handleEditTechClick(tech)}
                                className="px-3 py-1.5 text-zinc-200 bg-zinc-800/40 hover:bg-zinc-800/80 rounded border border-zinc-700/60 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5 text-zinc-400" />
                                <span>Edit</span>
                              </button>
                              <button 
                                onClick={() => handleDeleteTech(tech.id)}
                                className="px-3 py-1.5 text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 rounded border border-rose-500/20 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              ) : (
                /* Fleet Inventory Table Card */
                <div className="space-y-4">
                  {/* Desktop View */}
                  <div className="hidden md:block bg-[#18181b] rounded-xl shadow-sm border border-zinc-800/60 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider text-[10px] bg-[#09090b]/20">
                            <th className="py-3 px-5">Vehicle Details</th>
                            <th className="py-3 px-5">Plate Number</th>
                            <th className="py-3 px-5">VIN</th>
                            <th className="py-3 px-5">Ownership</th>
                            <th className="py-3 px-5">Status</th>
                            <th className="py-3 px-5">Assigned Operator</th>
                            <th className="py-3 px-5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40 text-slate-300">
                          {customVehicles.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="py-12 text-center text-zinc-500 italic">
                                No vehicles registered. Add a vehicle to begin tracking assets.
                              </td>
                            </tr>
                          ) : (
                            customVehicles.map((vehicle) => {
                              const assignedTech = customTechnicians.find(t => t.id === vehicle.technicianId);
                              return (
                                <tr key={vehicle.id} className="hover:bg-slate-800/25 transition-colors">
                                  <td className="py-3.5 px-5">
                                    <div className="flex items-center space-x-2.5">
                                      <div className="w-7 h-7 rounded bg-[#09090b] border border-zinc-800 flex items-center justify-center text-zinc-300">
                                        <Car className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <p className="font-bold text-zinc-200 text-xs">
                                          {vehicle.make} {vehicle.model}
                                        </p>
                                        <p className="text-[9px] text-zinc-500 font-medium">Model Year: {vehicle.year}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-3.5 px-5 font-mono font-bold text-slate-300">
                                    {vehicle.plateNumber}
                                  </td>
                                  <td className="py-3.5 px-5 font-mono text-zinc-500 tracking-tight text-[10.5px]">
                                    {vehicle.vin}
                                  </td>
                                  <td className="py-3.5 px-5">
                                    <span className={`px-2 py-0.5 rounded text-[8.5px] font-extrabold uppercase border ${
                                      vehicle.ownershipType === 'COMPANY' 
                                        ? 'bg-cyan-500/10 text-zinc-100 border-cyan-500/20'
                                        : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                    }`}>
                                      {vehicle.ownershipType}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-5">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wide border ${
                                      vehicle.status === 'ACTIVE' 
                                        ? 'bg-zinc-800/30 text-zinc-300 border-emerald-500/20'
                                        : vehicle.status === 'MAINTENANCE'
                                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                        : 'bg-slate-500/10 text-zinc-400 border-slate-500/20'
                                    }`}>
                                      {vehicle.status}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-5">
                                    {assignedTech ? (
                                      <div className="flex items-center space-x-1.5">
                                        <Users className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
                                        <span className="font-semibold text-zinc-200 text-xs">{assignedTech.name}</span>
                                      </div>
                                    ) : (
                                      <span className="italic text-slate-600 text-[10.5px]">Unassigned (Available)</span>
                                    )}
                                  </td>
                                  <td className="py-3.5 px-5 text-right">
                                    <div className="flex items-center justify-end space-x-1.5">
                                      <button 
                                        onClick={() => handleEditVehicleClick(vehicle)}
                                        className="p-1.5 text-zinc-100 hover:bg-zinc-800/40 rounded transition-colors cursor-pointer"
                                        title="Edit Vehicle Details"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteVehicle(vehicle.id)}
                                        className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded transition-colors cursor-pointer"
                                        title="Delete Vehicle"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
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

                  {/* Mobile View */}
                  <div className="md:hidden space-y-3.5">
                    {customVehicles.length === 0 ? (
                      <div className="bg-[#18181b] border border-zinc-800/60 rounded-xl p-8 text-center text-zinc-500 italic text-xs">
                        No vehicles registered. Add a vehicle to begin tracking assets.
                      </div>
                    ) : (
                      customVehicles.map((vehicle) => {
                        const assignedTech = customTechnicians.find(t => t.id === vehicle.technicianId);
                        return (
                          <div key={vehicle.id} className="bg-[#18181b] rounded-xl border border-zinc-800/60 p-4 space-y-4">
                            {/* Top header: Car Icon and Vehicle Details */}
                            <div className="flex items-start justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded bg-[#09090b] border border-zinc-800 flex items-center justify-center text-zinc-300 shrink-0">
                                  <Car className="w-5 h-5" />
                                </div>
                                <div>
                                  <h4 className="font-bold text-zinc-200 text-sm leading-snug">
                                    {vehicle.make} {vehicle.model}
                                  </h4>
                                  <p className="text-[10px] text-zinc-500 mt-0.5">Model Year: {vehicle.year}</p>
                                </div>
                              </div>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wide border ${
                                vehicle.status === 'ACTIVE' 
                                  ? 'bg-zinc-800/30 text-zinc-300 border-emerald-500/20'
                                  : vehicle.status === 'MAINTENANCE'
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                  : 'bg-slate-500/10 text-zinc-400 border-slate-500/20'
                              }`}>
                                {vehicle.status}
                              </span>
                            </div>

                            {/* Vehicle Stats Grid */}
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div className="bg-[#09090b]/30 p-2.5 rounded-lg border border-zinc-800/30 flex flex-col justify-between">
                                <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Plate Number</span>
                                <span className="font-mono font-bold text-zinc-200 mt-1">{vehicle.plateNumber}</span>
                              </div>
                              <div className="bg-[#09090b]/30 p-2.5 rounded-lg border border-zinc-800/30 flex flex-col justify-between">
                                <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Ownership</span>
                                <span className={`self-start mt-1 px-2 py-0.5 rounded text-[8.5px] font-extrabold uppercase border ${
                                  vehicle.ownershipType === 'COMPANY' 
                                    ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                                    : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                }`}>
                                  {vehicle.ownershipType}
                                </span>
                              </div>
                              <div className="col-span-2 bg-[#09090b]/30 p-2.5 rounded-lg border border-zinc-800/30">
                                <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider block mb-1">Assigned Operator</span>
                                {assignedTech ? (
                                  <div className="flex items-center space-x-2">
                                    <Users className="w-4 h-4 text-zinc-400 shrink-0" />
                                    <span className="font-semibold text-zinc-200 text-xs">{assignedTech.name}</span>
                                  </div>
                                ) : (
                                  <span className="italic text-zinc-600 text-xs">Unassigned (Available)</span>
                                )}
                              </div>
                              <div className="col-span-2 bg-[#09090b]/30 p-2.5 rounded-lg border border-zinc-800/30">
                                <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider block mb-1">VIN</span>
                                <span className="font-mono text-zinc-400 tracking-tight text-[11px] select-all">{vehicle.vin}</span>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800/40">
                              <button 
                                onClick={() => handleEditVehicleClick(vehicle)}
                                className="px-3 py-1.5 text-zinc-200 bg-zinc-800/40 hover:bg-zinc-800/80 rounded border border-zinc-700/60 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5 text-zinc-400" />
                                <span>Edit</span>
                              </button>
                              <button 
                                onClick={() => handleDeleteVehicle(vehicle.id)}
                                className="px-3 py-1.5 text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 rounded border border-rose-500/20 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}



          {/* Section 6: Recruiting & HR Panel */}
          {activeSection === 'recruiting' && (() => {
            // Recruiter Metrics calculations
            const totalCand = customCandidates.length;
            const pipelineNew = customCandidates.filter(c => c.status === 'NEW').length;
            const pipelineRates = customCandidates.filter(c => c.status === 'RATES_SENT').length;
            const pipelineDocs = customCandidates.filter(c => c.status === 'DOCS_REQUESTED').length;
            const pipelineSign = customCandidates.filter(c => c.status === 'SIGNING_SENT').length;
            const pipelineHired = customCandidates.filter(c => c.status === 'HIRED').length;
            
            const totalNeeded = customStates.reduce((acc, s) => acc + (s.requiredTechs || 0), 0);
            const activeStaff = customTechnicians.filter(t => t.status === 'ACTIVE').length;
            const staffingGap = Math.max(0, totalNeeded - activeStaff);

            // Filter candidates registered for selected state
            const stateCandidates = selectedState 
              ? customCandidates.filter(c => c.stateCode === selectedState.code)
              : [];

return (
              <div className={`space-y-6 animate-fadeIn transition-colors duration-200 p-1 rounded-2xl ${
                hrTheme === 'light' ? 'bg-slate-50 text-slate-800' : ''
              }`}>
                {/* Header Title Block with Theme Toggle */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                  <div>
                    <h1 className={`text-xl font-extrabold tracking-wide flex items-center gap-2 font-sans ${
                      hrTheme === 'light' ? 'text-slate-900' : 'text-white'
                    }`}>
                      <UserPlus className={`w-5 h-5 ${hrTheme === 'light' ? 'text-blue-600' : 'text-teal-400'}`} />
                      Recruiting & HR Module
                    </h1>
                    <p className={`text-xs mt-1 ${hrTheme === 'light' ? 'text-slate-500 font-medium' : 'text-zinc-400'}`}>
                      Onboard new technicians, track document signings, and check regional pay/vacancy sheets.
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    {/* Google Theme Switcher Toggle */}
                    <div className={`flex items-center p-1 rounded-xl border shadow-xs ${
                      hrTheme === 'light' ? 'bg-white border-slate-200' : 'bg-[#09090b] border-zinc-800'
                    }`}>
                      <button
                        type="button"
                        onClick={() => setHrTheme('light')}
                        className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          hrTheme === 'light'
                            ? 'bg-blue-600 text-white shadow-sm font-extrabold'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        <span>☀️ Google White-Blue</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setHrTheme('dark')}
                        className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          hrTheme === 'dark'
                            ? 'bg-zinc-800 text-white shadow-sm font-extrabold'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        <span>🌙 Dark Mode</span>
                      </button>
                    </div>

                    <button
                      onClick={handleAddCandidateClick}
                      className={`flex items-center space-x-2 text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer ${
                        hrTheme === 'light'
                          ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                          : 'bg-white hover:bg-zinc-200 text-zinc-950'
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                      <span>Register Candidate</span>
                    </button>
                  </div>
                </div>

                {/* Recruiting Metrics Bar */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className={`rounded-xl p-4 border flex items-center justify-between shadow-sm ${
                    hrTheme === 'light' ? 'bg-white border-slate-200' : 'bg-[#18181b] border-zinc-800/60'
                  }`}>
                    <div>
                      <span className={`text-[10px] uppercase font-bold tracking-wider block ${
                        hrTheme === 'light' ? 'text-slate-500' : 'text-zinc-400'
                      }`}>Total Candidates</span>
                      <h3 className={`text-2xl font-extrabold mt-0.5 ${
                        hrTheme === 'light' ? 'text-slate-900' : 'text-white'
                      }`}>{totalCand}</h3>
                    </div>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                      hrTheme === 'light' ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-[#09090b] text-zinc-400 border-zinc-800'
                    }`}>
                      <Users className="w-4 h-4" />
                    </div>
                  </div>

                  <div className={`rounded-xl p-4 border flex items-center justify-between shadow-sm ${
                    hrTheme === 'light' ? 'bg-white border-slate-200' : 'bg-[#18181b] border-zinc-800/60'
                  }`}>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider block">New Leads</span>
                      <h3 className="text-2xl font-extrabold text-blue-400 mt-0.5">{pipelineNew}</h3>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-blue-950/30 text-blue-400 flex items-center justify-center border border-blue-800/40">
                      <UserPlus className="w-4 h-4" />
                    </div>
                  </div>

                  <div className={`rounded-xl p-4 border flex items-center justify-between shadow-sm ${
                    hrTheme === 'light' ? 'bg-white border-slate-200' : 'bg-[#18181b] border-zinc-800/60'
                  }`}>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider block">Docs & Signing</span>
                      <h3 className="text-2xl font-extrabold text-indigo-300 mt-0.5">{pipelineDocs + pipelineSign}</h3>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-indigo-950/30 text-indigo-300 flex items-center justify-center border border-indigo-800/40">
                      <FileText className="w-4 h-4" />
                    </div>
                  </div>

                  <div className={`rounded-xl p-4 border flex items-center justify-between shadow-sm ${
                    hrTheme === 'light' ? 'bg-white border-slate-200' : 'bg-[#18181b] border-zinc-800/60'
                  }`}>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider block">Onboarded / Hired</span>
                      <h3 className="text-2xl font-extrabold text-emerald-300 mt-0.5">{pipelineHired}</h3>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-emerald-950/30 text-emerald-300 flex items-center justify-center border border-emerald-800/40">
                      <UserCheck className="w-4 h-4" />
                    </div>
                  </div>

                  <div className={`rounded-xl p-4 border flex items-center justify-between shadow-sm ${
                    hrTheme === 'light' ? 'bg-white border-slate-200' : 'bg-[#18181b] border-zinc-800/60'
                  }`}>
                    <div>
                      <span className={`text-[10px] uppercase font-bold tracking-wider block ${
                        hrTheme === 'light' ? 'text-slate-500' : 'text-zinc-400'
                      }`}>Staffing Gap</span>
                      <h3 className={`text-2xl font-extrabold mt-0.5 ${
                        hrTheme === 'light' ? 'text-slate-800' : 'text-zinc-200'
                      }`}>{staffingGap} Techs</h3>
                    </div>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                      hrTheme === 'light' ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-[#09090b] text-zinc-400 border-zinc-800'
                    }`}>
                      <Briefcase className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Main Candidates Toolbar: Title & View Mode Switcher */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/50 dark:border-zinc-800 pb-3">
                  <div>
                    <h3 className={`text-base font-extrabold flex items-center gap-2 font-sans ${
                      hrTheme === 'light' ? 'text-slate-900' : 'text-white'
                    }`}>
                      <span>Candidates Database</span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold border ${
                        hrTheme === 'light' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-blue-950/40 text-blue-300 border-blue-800/40'
                      }`}>
                        {totalCand}
                      </span>
                    </h3>
                  </div>

                  <div className={`flex items-center p-1 rounded-xl border shadow-xs ${
                    hrTheme === 'light' ? 'bg-white border-slate-200' : 'bg-[#09090b] border-zinc-800'
                  }`}>
                    <button
                      type="button"
                      onClick={() => setCandidateViewMode('list')}
                      className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        candidateViewMode === 'list'
                          ? hrTheme === 'light' ? 'bg-blue-600 text-white shadow-sm font-extrabold' : 'bg-zinc-800 text-white shadow-sm border border-zinc-700 font-extrabold'
                          : hrTheme === 'light' ? 'text-slate-600 hover:text-slate-900' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <List className="w-3.5 h-3.5" />
                      <span>List View</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCandidateViewMode('kanban')}
                      className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        candidateViewMode === 'kanban'
                          ? hrTheme === 'light' ? 'bg-blue-600 text-white shadow-sm font-extrabold' : 'bg-zinc-800 text-white shadow-sm border border-zinc-700 font-extrabold'
                          : hrTheme === 'light' ? 'text-slate-600 hover:text-slate-900' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span>Pipeline Board</span>
                    </button>
                  </div>
                </div>

                {/* Filters container */}
                <div className={`rounded-2xl p-5 border space-y-4 shadow-sm transition-colors ${
                  hrTheme === 'light' ? 'bg-white border-slate-200' : 'bg-[#18181b] border-zinc-800/60'
                }`}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Text Search */}
                    <div className="space-y-1">
                      <label className={`text-[10px] uppercase font-extrabold block tracking-wider ${
                        hrTheme === 'light' ? 'text-slate-500' : 'text-zinc-400'
                      }`}>Search Candidate</label>
                      <div className="relative">
                        <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${
                          hrTheme === 'light' ? 'text-slate-400' : 'text-zinc-500'
                        }`} />
                        <input
                          type="text"
                          placeholder="Search candidate name or email..."
                          value={candidateSearchQuery}
                          onChange={(e) => setCandidateSearchQuery(e.target.value)}
                          className={`w-full rounded-xl pl-10 pr-3.5 py-2.5 text-xs focus:outline-none font-medium transition-all ${
                            hrTheme === 'light'
                              ? 'bg-slate-50 border border-slate-200 text-slate-900 focus:border-blue-600 focus:bg-white placeholder-slate-400'
                              : 'bg-[#09090b] border border-zinc-800 text-zinc-200 focus:border-zinc-600 placeholder-zinc-600'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Status Filter */}
                    <div className="space-y-1">
                      <label className={`text-[10px] uppercase font-extrabold block tracking-wider ${
                        hrTheme === 'light' ? 'text-slate-500' : 'text-zinc-400'
                      }`}>Status Filter</label>
                      <select
                        value={candidateStatusFilter}
                        onChange={(e) => setCandidateStatusFilter(e.target.value)}
                        className={`w-full rounded-xl px-3.5 py-2.5 text-xs focus:outline-none font-bold transition-all ${
                          hrTheme === 'light'
                            ? 'bg-slate-50 border border-slate-200 text-slate-900 focus:border-blue-600 focus:bg-white'
                            : 'bg-[#09090b] border border-zinc-800 text-zinc-200 focus:border-zinc-600'
                        }`}
                      >
                        <option value="ALL">All Statuses</option>
                        <option value="NEW">New Lead</option>
                        <option value="RATES_SENT">Rates Sent</option>
                        <option value="DOCS_REQUESTED">Docs Requested</option>
                        <option value="SIGNING_SENT">Signing Sent</option>
                        <option value="TRAINING">Training / Тренинг</option>
                        <option value="BACKGROUND_CHECK">Background Check</option>
                        <option value="ONBOARDING">Onboarding</option>
                        <option value="HIRED">Hired</option>
                        <option value="REJECTED">Rejected</option>
                      </select>
                    </div>

                    {/* State Filter */}
                    <div className="space-y-1">
                      <label className={`text-[10px] uppercase font-extrabold block tracking-wider ${
                        hrTheme === 'light' ? 'text-slate-500' : 'text-zinc-400'
                      }`}>State Filter</label>
                      <select
                        value={candidateStateFilter}
                        onChange={(e) => setCandidateStateFilter(e.target.value)}
                        className={`w-full rounded-xl px-3.5 py-2.5 text-xs focus:outline-none font-bold transition-all ${
                          hrTheme === 'light'
                            ? 'bg-slate-50 border border-slate-200 text-slate-900 focus:border-blue-600 focus:bg-white'
                            : 'bg-[#09090b] border border-zinc-800 text-zinc-200 focus:border-zinc-600'
                        }`}
                      >
                        <option value="ALL">All States</option>
                        <option value="ANY">Flexible / Multi-State</option>
                        {customStates.map(s => (
                          <option key={s.id} value={s.code}>{s.name} ({s.code})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* View Mode Router: List vs Kanban Board */}
                {candidateViewMode === 'list' ? (
                  /* LIST VIEW WITH INTERACTIVE STEPPER */
                  <div className="space-y-4 max-h-[650px] overflow-y-auto pr-1 custom-scrollbar">
                    {(() => {
                      const filtered = customCandidates.filter(cand => {
                        const matchesSearch = 
                          cand.firstName.toLowerCase().includes(candidateSearchQuery.toLowerCase()) || 
                          cand.lastName.toLowerCase().includes(candidateSearchQuery.toLowerCase()) ||
                          cand.email.toLowerCase().includes(candidateSearchQuery.toLowerCase());
                        const matchesStatus = candidateStatusFilter === 'ALL' || cand.status === candidateStatusFilter;
                        const matchesState = candidateStateFilter === 'ALL' || cand.stateCode === candidateStateFilter;
                        return matchesSearch && matchesStatus && matchesState;
                      });

                      if (filtered.length === 0) {
                        return (
                          <div className={`rounded-2xl p-8 border text-center italic text-xs font-medium ${
                            hrTheme === 'light' ? 'bg-white border-slate-200 text-slate-500' : 'bg-[#18181b] border-zinc-800/60 text-zinc-400'
                          }`}>
                            No candidates match your selected filters. Click "+ Register Candidate" to add one.
                          </div>
                        );
                      }

                      return filtered.map(cand => {
                        const initials = (cand.firstName[0] || '') + (cand.lastName[0] || '');

                        const getStatusBadge = (st: string) => {
                          switch (st) {
                            case 'NEW':
                              return { label: 'New Lead', cls: hrTheme === 'light' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-blue-950/40 text-blue-300 border-blue-800/40' };
                            case 'RATES_SENT':
                              return { label: 'Rates Sent', cls: hrTheme === 'light' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-indigo-950/40 text-indigo-300 border-indigo-800/40' };
                            case 'DOCS_REQUESTED':
                              return { label: 'Docs Requested', cls: hrTheme === 'light' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-amber-950/30 text-amber-300 border-amber-800/40' };
                            case 'SIGNING_SENT':
                              return { label: 'Signing Sent', cls: hrTheme === 'light' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-purple-950/40 text-purple-300 border-purple-800/40' };
                            case 'TRAINING':
                              return { label: 'Training / Тренинг', cls: hrTheme === 'light' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' : 'bg-sky-950/40 text-sky-300 border-sky-800/40' };
                            case 'BACKGROUND_CHECK':
                              return { label: 'Background Check', cls: hrTheme === 'light' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-900 text-slate-300 border-slate-700/60' };
                            case 'ONBOARDING':
                              return { label: 'Onboarding', cls: hrTheme === 'light' ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-teal-950/40 text-teal-300 border-teal-800/40' };
                            case 'HIRED':
                              return { label: 'Hired', cls: hrTheme === 'light' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40' };
                            default:
                              return { label: 'Rejected', cls: hrTheme === 'light' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-rose-950/40 text-rose-300 border-rose-800/40' };
                          }
                        };

                        const badge = getStatusBadge(cand.status);

                        return (
                          <div
                            key={cand.id}
                            className={`rounded-2xl p-4 border transition-all shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                              hrTheme === 'light'
                                ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 shadow-xs'
                                : 'bg-[#18181b] hover:bg-[#1c1c20] border-zinc-800/60 text-white'
                            }`}
                          >
                            {/* Left: Avatar + Name + Email + Status */}
                            <div className="flex items-center space-x-3.5 min-w-0">
                              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-xs font-mono border shrink-0 shadow-inner ${
                                hrTheme === 'light'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-gradient-to-br from-teal-500/20 to-blue-600/20 text-teal-300 border-teal-500/30'
                              }`}>
                                {initials.toUpperCase() || 'C'}
                              </div>
                              <div className="space-y-1 text-xs min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className={`text-sm font-extrabold ${
                                    hrTheme === 'light' ? 'text-slate-900' : 'text-white'
                                  }`}>
                                    {cand.firstName} {cand.lastName}
                                  </h4>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md font-mono border ${
                                    hrTheme === 'light'
                                      ? 'bg-slate-100 border-slate-200 text-slate-700'
                                      : 'bg-[#09090b] border-zinc-800 text-zinc-300'
                                  }`}>
                                    {cand.stateCode === 'ANY' || !cand.stateCode ? '🌐 ANY' : cand.stateCode}
                                  </span>
                                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${badge.cls}`}>
                                    ● {badge.label}
                                  </span>
                                </div>

                                <div className={`flex flex-wrap items-center gap-3 text-[11px] ${
                                  hrTheme === 'light' ? 'text-slate-500 font-medium' : 'text-zinc-400'
                                }`}>
                                  <span className="flex items-center gap-1">
                                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span>{cand.email}</span>
                                  </span>
                                  {cand.phone && (
                                    <span className="flex items-center gap-1">
                                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                      <span>{cand.phone}</span>
                                    </span>
                                  )}
                                </div>
                                {cand.notes && (
                                  <p className={`text-[11px] mt-1 italic truncate max-w-md ${
                                    hrTheme === 'light' ? 'text-slate-500' : 'text-zinc-400'
                                  }`}>
                                    "{cand.notes}"
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Right: Clean Actions with Send Rates Modal Config */}
                            <div className="flex items-center space-x-1.5 shrink-0">
                              <button
                                title="Send Custom Rates (Choose State & Cut)"
                                onClick={() => handleOpenRatesConfig(cand)}
                                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl transition-colors cursor-pointer text-xs font-extrabold shadow-sm border ${
                                  hrTheme === 'light'
                                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                                    : 'bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 border-emerald-800/50'
                                }`}
                              >
                                <DollarSign className="w-3.5 h-3.5" />
                                <span>Send Rates</span>
                              </button>

                              <button
                                title="Request Docs Email"
                                onClick={() => handleOpenEmailPreview(cand.id, 'DOCS_REQUEST')}
                                className={`p-2 rounded-xl transition-colors cursor-pointer border ${
                                  hrTheme === 'light'
                                    ? 'hover:bg-slate-100 text-slate-600 border-transparent'
                                    : 'hover:text-white hover:bg-[#09090b] border-transparent'
                                }`}
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </button>

                              <button
                                title="View Candidate Uploaded Documents & Link"
                                onClick={() => handleViewCandidateDocs(cand)}
                                className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer text-xs font-bold border ${
                                  hrTheme === 'light'
                                    ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                                    : 'bg-blue-950/50 hover:bg-blue-900/60 text-blue-300 border-blue-800/50'
                                }`}
                              >
                                <FolderOpen className="w-3.5 h-3.5" />
                                <span>Docs</span>
                              </button>

                              <button
                                title="Send Signing Email (4 PDFs from Documents)"
                                onClick={() => handleOpenEmailPreview(cand.id, 'DOCS_SIGNING')}
                                className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer text-xs font-extrabold border ${
                                  hrTheme === 'light'
                                    ? 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200'
                                    : 'bg-purple-950/50 hover:bg-purple-900/60 text-purple-300 border-purple-800/50'
                                }`}
                              >
                                <CheckSquare className="w-3.5 h-3.5" />
                                <span>Sign Docs</span>
                              </button>

                              <button
                                title="Copy Signing Link"
                                onClick={() => handleCopySigningLink(cand.id)}
                                className={`p-2 rounded-xl transition-colors cursor-pointer border ${
                                  hrTheme === 'light'
                                    ? 'text-slate-500 hover:text-blue-600 hover:bg-blue-50 border-transparent'
                                    : 'text-zinc-400 hover:text-blue-400 hover:bg-[#09090b] border-transparent'
                                }`}
                              >
                                <PenTool className="w-3.5 h-3.5" />
                              </button>

                              <div className={`h-4 w-px mx-1 ${
                                hrTheme === 'light' ? 'bg-slate-200' : 'bg-zinc-800'
                              }`} />

                              <button
                                title="Edit Candidate & Status Stage"
                                onClick={() => handleEditCandidateClick(cand)}
                                className={`p-2 rounded-xl transition-colors cursor-pointer border ${
                                  hrTheme === 'light'
                                    ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 border-transparent'
                                    : 'text-zinc-400 hover:text-white hover:bg-[#09090b] border-transparent'
                                }`}
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              <button
                                title="Delete Candidate"
                                onClick={() => handleDeleteCandidate(cand.id)}
                                className={`p-2 rounded-xl transition-colors cursor-pointer border ${
                                  hrTheme === 'light'
                                    ? 'text-rose-600 hover:bg-rose-50 border-transparent'
                                    : 'text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 border-transparent'
                                }`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                ) : (
                  /* KANBAN PIPELINE BOARD VIEW */
                  <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4 overflow-x-auto pb-4 custom-scrollbar">
                    {[
                      { key: 'NEW', title: 'New Leads' },
                      { key: 'RATES_SENT', title: 'Rates Sent' },
                      { key: 'DOCS_REQUESTED', title: 'Docs Requested' },
                      { key: 'SIGNING_SENT', title: 'Signing Sent' },
                      { key: 'TRAINING', title: 'Training' },
                      { key: 'ONBOARDING', title: 'Onboarding / BG' },
                      { key: 'HIRED', title: 'Hired' },
                    ].map((col) => {
                      const colCandidates = customCandidates.filter(c => {
                        const matchesSearch = 
                          c.firstName.toLowerCase().includes(candidateSearchQuery.toLowerCase()) || 
                          c.lastName.toLowerCase().includes(candidateSearchQuery.toLowerCase()) ||
                          c.email.toLowerCase().includes(candidateSearchQuery.toLowerCase());
                        const matchesState = candidateStateFilter === 'ALL' || c.stateCode === candidateStateFilter;
                        return c.status === col.key && matchesSearch && matchesState;
                      });

                      return (
                        <div key={col.key} className={`rounded-2xl p-4 border space-y-3 min-w-[240px] ${
                          hrTheme === 'light'
                            ? 'bg-white border-slate-200 shadow-xs'
                            : 'bg-[#18181b] border-zinc-800'
                        }`}>
                          <div className={`flex items-center justify-between pb-2 border-b ${
                            hrTheme === 'light' ? 'border-slate-200' : 'border-zinc-800'
                          }`}>
                            <h4 className={`text-xs font-extrabold ${
                              hrTheme === 'light' ? 'text-slate-800' : 'text-white'
                            }`}>{col.title}</h4>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              hrTheme === 'light'
                                ? 'bg-slate-100 text-slate-700 border-slate-200'
                                : 'bg-[#09090b] text-zinc-300 border-zinc-800'
                            }`}>
                              {colCandidates.length}
                            </span>
                          </div>

                          <div className="space-y-3 max-h-[550px] overflow-y-auto custom-scrollbar pr-1">
                            {colCandidates.length === 0 ? (
                              <div className={`p-4 text-center italic text-[11px] border border-dashed rounded-xl ${
                                hrTheme === 'light' ? 'border-slate-200 text-slate-400' : 'border-zinc-800 text-zinc-500'
                              }`}>
                                No candidates
                              </div>
                            ) : (
                              colCandidates.map(cand => (
                                <div key={cand.id} className={`border rounded-xl p-3 space-y-2 shadow-xs transition-all ${
                                  hrTheme === 'light'
                                    ? 'bg-slate-50 border-slate-200 hover:border-blue-400 text-slate-800'
                                    : 'bg-[#09090b] border-zinc-800 hover:border-zinc-700 text-white'
                                }`}>
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <h5 className={`font-extrabold text-xs ${
                                        hrTheme === 'light' ? 'text-slate-900' : 'text-white'
                                      }`}>{cand.firstName} {cand.lastName}</h5>
                                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-mono mt-1 inline-block border ${
                                        hrTheme === 'light' ? 'bg-slate-200 text-slate-700 border-slate-300' : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                                      }`}>
                                        {cand.stateCode}
                                      </span>
                                    </div>
                                  </div>
                                  <p className={`text-[10px] truncate ${
                                    hrTheme === 'light' ? 'text-slate-500' : 'text-zinc-400'
                                  }`}>{cand.email}</p>
                                  
                                  {/* Move Action Buttons */}
                                  <div className={`flex items-center justify-between pt-2 border-t text-[10px] ${
                                    hrTheme === 'light' ? 'border-slate-200' : 'border-zinc-800/80'
                                  }`}>
                                    {col.key !== 'NEW' && (
                                      <button
                                        onClick={() => {
                                          const order = ['NEW', 'RATES_SENT', 'DOCS_REQUESTED', 'SIGNING_SENT', 'TRAINING', 'ONBOARDING', 'HIRED'];
                                          const idx = order.indexOf(col.key);
                                          if (idx > 0) handleUpdateCandidateStatus(cand.id, order[idx - 1]);
                                        }}
                                        className={`flex items-center gap-0.5 font-bold cursor-pointer ${
                                          hrTheme === 'light' ? 'text-slate-600 hover:text-slate-900' : 'text-zinc-400 hover:text-white'
                                        }`}
                                      >
                                        <ArrowLeft className="w-3 h-3" />
                                        <span>Back</span>
                                      </button>
                                    )}
                                    {col.key !== 'HIRED' && (
                                      <button
                                        onClick={() => {
                                          const order = ['NEW', 'RATES_SENT', 'DOCS_REQUESTED', 'SIGNING_SENT', 'TRAINING', 'ONBOARDING', 'HIRED'];
                                          const idx = order.indexOf(col.key);
                                          if (idx < order.length - 1) handleUpdateCandidateStatus(cand.id, order[idx + 1]);
                                        }}
                                        className="ml-auto text-blue-600 hover:text-blue-700 flex items-center gap-0.5 font-extrabold cursor-pointer"
                                      >
                                        <span>Next</span>
                                        <ArrowRight className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Section: Tickets & Website Leads */}
          {activeSection === 'tickets' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Header Title Block */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-xl font-black text-slate-100 tracking-wide flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-[#1a73e8]" />
                    <span>Tickets & Website Leads</span>
                    {unreadTicketsCount > 0 && (
                      <span className="px-2.5 py-0.5 text-xs font-black bg-[#1a73e8] text-white rounded-full animate-pulse shadow-md">
                        {unreadTicketsCount} NEW
                      </span>
                    )}
                  </h1>
                  <p className="text-xs text-zinc-400 mt-1">
                    Live contact form requests and job applications submitted through netcoretelecom.com
                  </p>
                </div>

                <button
                  type="button"
                  onClick={fetchTickets}
                  className="netcore-btn-outline flex items-center space-x-2 shrink-0 self-start md:self-auto"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Tickets</span>
                </button>
              </div>

              {/* Top Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#1a1c23] border border-[#2c2f38] p-4 rounded-2xl flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Total Inquiries</span>
                    <h3 className="text-2xl font-black text-white mt-1">{customTickets.length}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#121316] border border-[#2c2f38] text-[#4285f4] flex items-center justify-center">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-[#1a1c23] border border-[#1a73e8]/40 p-4 rounded-2xl flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#4285f4] tracking-wider">New (Unread)</span>
                    <h3 className="text-2xl font-black text-[#4285f4] mt-1">{unreadTicketsCount}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#1a73e8]/15 border border-[#1a73e8]/30 text-[#4285f4] flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-[#1a1c23] border border-[#2c2f38] p-4 rounded-2xl flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">In Progress</span>
                    <h3 className="text-2xl font-black text-amber-400 mt-1">
                      {customTickets.filter(t => t.status === 'IN_PROGRESS').length}
                    </h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-[#1a1c23] border border-[#2c2f38] p-4 rounded-2xl flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Resolved</span>
                    <h3 className="text-2xl font-black text-emerald-400 mt-1">
                      {customTickets.filter(t => t.status === 'RESOLVED').length}
                    </h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Filters & Search Toolbar */}
              <div className="bg-[#1a1c23] border border-[#2c2f38] p-4 rounded-2xl space-y-4">
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                  {/* Search Bar */}
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Search name, email, phone, message..."
                      value={ticketSearchQuery}
                      onChange={(e) => setTicketSearchQuery(e.target.value)}
                      className="w-full bg-[#121316] border border-[#2c2f38] rounded-full pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#1a73e8]"
                    />
                  </div>

                  {/* Status Pills */}
                  <div className="flex items-center space-x-1 overflow-x-auto pb-1 md:pb-0 custom-scrollbar">
                    {['ALL', 'NEW', 'IN_PROGRESS', 'RESOLVED', 'ARCHIVED'].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setTicketStatusFilter(st)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                          ticketStatusFilter === st
                            ? 'bg-[#1a73e8] text-white shadow-sm'
                            : 'bg-[#121316] text-zinc-400 hover:text-white border border-[#2c2f38]'
                        }`}
                      >
                        {st.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category Pills */}
                <div className="flex items-center space-x-2 pt-2 border-t border-[#2c2f38]/60 overflow-x-auto custom-scrollbar">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 mr-2 shrink-0">Category:</span>
                  {[
                    { key: 'ALL', label: 'All Categories' },
                    { key: 'CONTACT_FORM', label: 'Contact Form' },
                    { key: 'JOB_APPLICATION', label: 'Job Applications' },
                    { key: 'GENERAL_INQUIRY', label: 'General Inquiries' },
                  ].map((cat) => (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setTicketCategoryFilter(cat.key)}
                      className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all whitespace-nowrap ${
                        ticketCategoryFilter === cat.key
                          ? 'bg-[#e8f0fe] text-[#1a73e8] font-extrabold'
                          : 'text-zinc-400 hover:text-white bg-[#121316] border border-[#2c2f38]'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tickets Table / List */}
              <div className="bg-[#1a1c23] border border-[#2c2f38] rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#121316] border-b border-[#2c2f38] text-[10px] uppercase font-extrabold text-zinc-400 tracking-wider">
                        <th className="py-3 px-4">Date / Time</th>
                        <th className="py-3 px-4">Sender Details</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Subject / Details</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2c2f38] text-xs">
                      {(() => {
                        const filtered = customTickets.filter(t => {
                          const matchesStatus = ticketStatusFilter === 'ALL' || t.status === ticketStatusFilter;
                          const matchesCat = ticketCategoryFilter === 'ALL' || t.category === ticketCategoryFilter;
                          const q = ticketSearchQuery.toLowerCase();
                          const matchesSearch = !q || (
                            t.name.toLowerCase().includes(q) ||
                            t.email.toLowerCase().includes(q) ||
                            (t.phone && t.phone.toLowerCase().includes(q)) ||
                            (t.subject && t.subject.toLowerCase().includes(q)) ||
                            t.message.toLowerCase().includes(q)
                          );
                          return matchesStatus && matchesCat && matchesSearch;
                        });

                        if (filtered.length === 0) {
                          return (
                            <tr>
                              <td colSpan={6} className="py-12 text-center text-zinc-500 font-medium">
                                No tickets or website inquiries found matching your filters.
                              </td>
                            </tr>
                          );
                        }

                        return filtered.map((t) => (
                          <tr key={t.id} className="hover:bg-[#1e2029] transition-colors">
                            <td className="py-3 px-4 font-mono text-zinc-400 whitespace-nowrap">
                              {new Date(t.createdAt).toLocaleDateString()} {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-white">{t.name}</div>
                              <div className="text-[11px] text-[#4285f4]">{t.email}</div>
                              {t.phone && <div className="text-[10px] text-zinc-400 font-mono">{t.phone}</div>}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                                t.category === 'JOB_APPLICATION'
                                  ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                                  : t.category === 'CONTACT_FORM'
                                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                  : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                              }`}>
                                {t.category === 'JOB_APPLICATION' ? 'Job Application' : t.category === 'CONTACT_FORM' ? 'Contact Form' : t.category}
                              </span>
                            </td>
                            <td className="py-3 px-4 max-w-xs">
                              <div className="font-bold text-zinc-200 truncate">{t.subject || 'Website Inquiry'}</div>
                              <div className="text-[11px] text-zinc-400 truncate">{t.message}</div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <select
                                value={t.status}
                                onChange={(e) => handleUpdateTicketStatus(t.id, e.target.value)}
                                className={`text-[11px] font-extrabold rounded-full px-2.5 py-1 focus:outline-none cursor-pointer border ${
                                  t.status === 'NEW'
                                    ? 'bg-[#1a73e8] text-white border-transparent'
                                    : t.status === 'IN_PROGRESS'
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                    : t.status === 'RESOLVED'
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                                }`}
                              >
                                <option value="NEW" className="bg-[#18181b] text-white">NEW</option>
                                <option value="IN_PROGRESS" className="bg-[#18181b] text-white">IN PROGRESS</option>
                                <option value="RESOLVED" className="bg-[#18181b] text-white">RESOLVED</option>
                                <option value="ARCHIVED" className="bg-[#18181b] text-white">ARCHIVED</option>
                              </select>
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedTicket(t);
                                  setTicketNotes(t.notes || '');
                                  setIsTicketModalOpen(true);
                                  if (t.status === 'NEW') {
                                    handleUpdateTicketStatus(t.id, 'IN_PROGRESS');
                                  }
                                }}
                                className="px-3 py-1 bg-[#1a73e8]/15 text-[#4285f4] hover:bg-[#1a73e8]/30 rounded-full font-bold text-xs mr-2 transition-colors"
                              >
                                View Details
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTicket(t.id)}
                                className="px-2 py-1 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-full transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5 inline" />
                              </button>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>


      {/* Add/Edit Modal */}
      {isRateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#09090b]/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#18181b] border border-zinc-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-slideUp">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-[#09090b]/10">
              <h4 className="text-sm font-bold text-slate-100 tracking-wide">
                {editingRate ? 'Edit Rate Plan' : 'Add New Rate Plan'}
              </h4>
              <button 
                onClick={() => setIsRateModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-full hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveRate} className="p-6 space-y-4">
              {/* Provider & State & City */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-400">Provider *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Xfinity, Spectrum"
                    value={rateForm.provider}
                    onChange={(e) => setRateForm({ ...rateForm, provider: e.target.value })}
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-md px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#3b82f6] placeholder-slate-600 font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-400">State *</label>
                  <select 
                    value={rateForm.stateCode}
                    onChange={(e) => setRateForm({ ...rateForm, stateCode: e.target.value, cityName: '' })}
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-md px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#3b82f6] font-semibold"
                  >
                    {customStates.map(s => (
                      <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-400">City (Optional)</label>
                  <select 
                    value={rateForm.cityName}
                    onChange={(e) => setRateForm({ ...rateForm, cityName: e.target.value })}
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-md px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#3b82f6] font-semibold"
                  >
                    <option value="">Statewide / All Cities</option>
                    {customCities
                      .filter(c => {
                        const stateObj = customStates.find(s => s.code === rateForm.stateCode);
                        return stateObj ? c.stateId === stateObj.id : false;
                      })
                      .map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Job Code */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-400">Job Code *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. RDP, CBI, NSAD1"
                  value={rateForm.code}
                  onChange={(e) => setRateForm({ ...rateForm, code: e.target.value })}
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-md px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#3b82f6] placeholder-slate-600 font-mono font-bold"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-400">Description</label>
                <textarea 
                  placeholder="Description of the job rate..."
                  value={rateForm.description}
                  onChange={(e) => setRateForm({ ...rateForm, description: e.target.value })}
                  rows={3}
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-md px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#3b82f6] placeholder-slate-600 resize-none leading-relaxed"
                />
              </div>

              {/* Calculator Options */}
              <div className="bg-[#09090b] p-3 rounded-lg border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <label className="flex items-center space-x-2 text-slate-300 font-semibold cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={rateForm.autoCalc}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      let updatedEmployeePrice = rateForm.employeePrice;
                      if (checked && rateForm.grossPrice) {
                        const gross = parseFloat(rateForm.grossPrice) || 0;
                        const retention = parseFloat(rateForm.retentionPercent) || 0;
                        updatedEmployeePrice = (gross * (1 - retention / 100)).toFixed(2);
                      }
                      setRateForm({ 
                        ...rateForm, 
                        autoCalc: checked,
                        employeePrice: updatedEmployeePrice
                      });
                    }}
                    className="w-3.5 h-3.5 bg-[#18181b] border-[#27272a] text-zinc-100 rounded"
                  />
                  <span>Auto-calculate Payout based on Margin</span>
                </label>
                
                {rateForm.autoCalc && (
                  <div className="flex items-center space-x-1.5 shrink-0 animate-fadeIn">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase">Company Margin %:</span>
                    <input 
                      type="number"
                      min="0"
                      max="100"
                      value={rateForm.retentionPercent}
                      onChange={(e) => {
                        const val = e.target.value;
                        const retention = parseFloat(val) || 0;
                        const gross = parseFloat(rateForm.grossPrice) || 0;
                        const calculatedEmployeePrice = (gross * (1 - retention / 100)).toFixed(2);
                        setRateForm({ 
                          ...rateForm, 
                          retentionPercent: val,
                          employeePrice: calculatedEmployeePrice
                        });
                      }}
                      className="w-16 bg-[#18181b] border border-zinc-800 rounded px-2 py-0.5 text-xs text-zinc-100 font-mono font-bold focus:outline-none"
                    />
                  </div>
                )}

                {!rateForm.autoCalc && rateForm.grossPrice && rateForm.employeePrice && (
                  <div className="text-[10px] text-zinc-500 font-semibold uppercase animate-fadeIn">
                    Implied Margin: <span className="text-zinc-100 font-bold font-mono">
                      {(() => {
                        const g = parseFloat(rateForm.grossPrice) || 0;
                        const emp = parseFloat(rateForm.employeePrice) || 0;
                        if (g <= 0) return '0%';
                        return `${((g - emp) / g * 100).toFixed(0)}%`;
                      })()}
                    </span>
                  </div>
                )}
              </div>

              {/* Prices */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-400">Company Rate ($) *</label>
                  <input 
                    type="number" 
                    required
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={rateForm.grossPrice}
                    onChange={(e) => {
                      const val = e.target.value;
                      const gross = parseFloat(val) || 0;
                      let empPrice = rateForm.employeePrice;
                      if (rateForm.autoCalc) {
                        const retention = parseFloat(rateForm.retentionPercent) || 0;
                        empPrice = (gross * (1 - retention / 100)).toFixed(2);
                      }
                      setRateForm({ ...rateForm, grossPrice: val, employeePrice: empPrice });
                    }}
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-md px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#3b82f6] placeholder-slate-600 font-mono font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase font-bold text-zinc-400">Employee Rate ($) *</label>
                    {rateForm.autoCalc && (
                      <span className="text-[9px] bg-zinc-800/30 text-zinc-300 border border-emerald-500/25 px-1 py-0.2 rounded font-black uppercase tracking-wider">
                        Calculated
                      </span>
                    )}
                  </div>
                  <input 
                    type="number" 
                    required
                    disabled={rateForm.autoCalc}
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={rateForm.employeePrice}
                    onChange={(e) => setRateForm({ ...rateForm, employeePrice: e.target.value })}
                    className={`w-full bg-[#09090b] border border-[#27272a] rounded-md px-3 py-2 text-xs focus:outline-none placeholder-slate-600 font-mono font-bold ${
                      rateForm.autoCalc ? 'text-zinc-300/50 bg-[#09090b]/50 cursor-not-allowed border-[#09090b]' : 'text-slate-300 focus:border-[#3b82f6]'
                    }`}
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-zinc-800">
                <button 
                  type="button"
                  onClick={() => setIsRateModalOpen(false)}
                  className="px-4 py-2 bg-[#09090b] border border-[#27272a] text-zinc-400 text-xs font-semibold rounded-md hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-zinc-100 text-zinc-950 text-xs font-bold rounded-md hover:bg-zinc-200 shadow-lg shadow-zinc-500/5 transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      <BulkRateImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        onImport={handleBulkImport}
        defaultStateCode={selectedStateCode || 'TN'}
        states={customStates}
        cities={customCities}
        onAddState={handleAddState}
        onAddCity={handleAddCity}
        customAlert={customAlert}
      />

      {/* Bulk State Rate Edit Modal */}
      <BulkStateRateEditModal
        isOpen={isBulkStateEditOpen}
        onClose={() => setIsBulkStateEditOpen(false)}
        states={customStates}
        cities={customCities}
        initialStateCode={ratesStateFilter}
        ratePlans={customRatePlans}
        onSave={(updatedPlans) => {
          setCustomRatePlans(updatedPlans);
          setIsBulkStateEditOpen(false);
        }}
      />

      {/* Invite Admin Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#09090b]/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#18181b] border border-zinc-800 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-slideUp">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/20">
              <h4 className="text-sm font-bold text-zinc-100 tracking-wide">
                Invite an Admin Friend
              </h4>
              <button 
                onClick={() => {
                  setIsInviteModalOpen(false);
                  setInviteForm({ username: '', password: '' });
                  setInviteError('');
                }}
                className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-full hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateAdmin} className="p-6 space-y-4">
              {inviteError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-3 py-2 rounded">
                  {inviteError}
                </div>
              )}
              
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-zinc-500">Login / Username</label>
                <input 
                  type="text"
                  required
                  value={inviteForm.username}
                  onChange={(e) => setInviteForm({ ...inviteForm, username: e.target.value })}
                  placeholder="e.g. jsmith"
                  className="w-full bg-[#09090b] border border-zinc-800 rounded-md px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-white placeholder-zinc-700 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-zinc-500">Password</label>
                <input 
                  type="password"
                  required
                  value={inviteForm.password}
                  onChange={(e) => setInviteForm({ ...inviteForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-[#09090b] border border-zinc-800 rounded-md px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-white placeholder-zinc-700 font-medium"
                />
              </div>

              <div className="pt-2">
                <button 
                  type="submit"
                  className="w-full bg-white text-zinc-950 text-xs font-bold py-2 rounded hover:bg-zinc-200 transition-all cursor-pointer"
                >
                  Create Admin Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Candidate Modal */}
      {isCandidateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#09090b]/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#18181b] border border-zinc-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-slideUp">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-850 flex items-center justify-between bg-[#09090b]/10">
              <h4 className="text-sm font-bold text-slate-100 tracking-wide">
                {editingCandidate ? 'Edit Candidate Profile' : 'Register New Candidate'}
              </h4>
              <button 
                onClick={() => setIsCandidateModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-350 transition-colors bg-transparent border-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveCandidate} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-500">First Name *</label>
                  <input 
                    type="text" 
                    required
                    value={candidateForm.firstName}
                    onChange={(e) => setCandidateForm({ ...candidateForm, firstName: e.target.value })}
                    placeholder="John"
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-md px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-teal-500 placeholder-slate-600 font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-500">Last Name *</label>
                  <input 
                    type="text" 
                    required
                    value={candidateForm.lastName}
                    onChange={(e) => setCandidateForm({ ...candidateForm, lastName: e.target.value })}
                    placeholder="Doe"
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-md px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-teal-500 placeholder-slate-600 font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-500">Email Address *</label>
                <input 
                  type="email" 
                  required
                  value={candidateForm.email}
                  onChange={(e) => setCandidateForm({ ...candidateForm, email: e.target.value })}
                  placeholder="john.doe@example.com"
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-md px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-teal-500 placeholder-slate-600 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-500">Phone Number</label>
                  <input 
                    type="text" 
                    value={candidateForm.phone}
                    onChange={(e) => setCandidateForm({ ...candidateForm, phone: e.target.value })}
                    placeholder="(555) 000-0000"
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-md px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-teal-500 placeholder-slate-600 font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-500">Target State *</label>
                  <select
                    value={candidateForm.stateCode}
                    onChange={(e) => setCandidateForm({ ...candidateForm, stateCode: e.target.value })}
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-md px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-teal-500 font-bold"
                  >
                    <option value="ANY">🌐 Flexible / Multi-State</option>
                    {customStates.map(s => (
                      <option key={s.id} value={s.code}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-500">Recruitment Stage / Status *</label>
                <select
                  value={candidateForm.status}
                  onChange={(e) => setCandidateForm({ ...candidateForm, status: e.target.value })}
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-md px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-teal-500 font-bold"
                >
                  <option value="NEW">1. New Lead</option>
                  <option value="RATES_SENT">2. Rates Sent</option>
                  <option value="DOCS_REQUESTED">3. Docs Requested</option>
                  <option value="SIGNING_SENT">4. Signing Sent</option>
                  <option value="TRAINING">5. Training / Тренинг</option>
                  <option value="BACKGROUND_CHECK">6. Background Check</option>
                  <option value="ONBOARDING">7. Onboarding</option>
                  <option value="HIRED">8. Hired / Employee Created</option>
                  <option value="REJECTED">❌ Rejected</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-500">Internal Recruiter Notes</label>
                <textarea 
                  rows={3}
                  value={candidateForm.notes}
                  onChange={(e) => setCandidateForm({ ...candidateForm, notes: e.target.value })}
                  placeholder="Notes from initial pre-screening call or document statuses..."
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-md px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-teal-500 placeholder-slate-600 custom-scrollbar resize-none font-bold"
                />
              </div>

              {/* Action footer */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-zinc-800">
                <button 
                  type="button"
                  onClick={() => setIsCandidateModalOpen(false)}
                  className="px-4 py-2 bg-[#09090b] border border-[#27272a] text-zinc-400 text-xs font-semibold rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-teal-500 text-zinc-950 text-xs font-bold rounded-md hover:bg-teal-400 shadow-lg shadow-teal-500/5 transition-all cursor-pointer"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Send Rates Config Modal */}
      {isSendRatesConfigOpen && sendRatesCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#09090b]/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#18181b] border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slideUp">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-[#09090b]/40">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white tracking-wide">
                    Configure Rates Email Dispatch
                  </h4>
                  <p className="text-[11px] text-zinc-400">
                    Candidate: <span className="text-zinc-200 font-semibold">{sendRatesCandidate.firstName} {sendRatesCandidate.lastName}</span> ({sendRatesCandidate.email})
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsSendRatesConfigOpen(false)}
                className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-full hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <div className="p-6 space-y-5 text-xs">
              {/* State Selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                  1. Select Target State for Rate Sheet *
                </label>
                <select
                  value={sendRatesStateCode}
                  onChange={(e) => handleSendRatesStateChange(e.target.value)}
                  className="w-full bg-[#09090b] border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold shadow-inner"
                >
                  {customStates.map(s => (
                    <option key={s.id} value={s.code}>
                      {s.name} ({s.code}) — Default Cut: {Number(s.defaultCut || 8).toFixed(1)}% | Per Diem: ${Number(s.employeePerDiem || 0).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Company Retention Cut Adjustment */}
              <div className="bg-[#09090b] p-4 rounded-xl border border-zinc-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                    2. Company Retention Cut (%)
                  </label>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                    AVG Profit: <span className="font-extrabold text-emerald-300">${(() => {
                      const cutPercent = parseFloat(sendRatesCompanyCut) || 0;
                      let ratesForState = customRatePlans.filter(r => r.stateCode === sendRatesStateCode);
                      if (sendRatesSelectedProviders.length > 0) {
                        const filtered = ratesForState.filter(r => sendRatesSelectedProviders.includes(r.provider));
                        if (filtered.length > 0) ratesForState = filtered;
                      }
                      if (ratesForState.length === 0) return (120 * (cutPercent / 100)).toFixed(2);
                      const totalProf = ratesForState.reduce((sum, r) => sum + (Number(r.grossPrice) * (cutPercent / 100)), 0);
                      return (totalProf / ratesForState.length).toFixed(2);
                    })()} / job</span>
                  </span>
                </div>
                <div className="grid grid-cols-[1fr_100px] gap-3 items-center">
                  <input
                    type="range"
                    min="0"
                    max="40"
                    step="0.5"
                    value={sendRatesCompanyCut}
                    onChange={(e) => setSendRatesCompanyCut(e.target.value)}
                    className="w-full accent-emerald-500 bg-zinc-800 h-2 rounded-lg cursor-pointer"
                  />
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={sendRatesCompanyCut}
                      onChange={(e) => setSendRatesCompanyCut(e.target.value)}
                      className="w-full bg-[#18181b] border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-right font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 text-[10px] pointer-events-none">%</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 pt-1">
                  {[5, 8, 10, 12, 15].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setSendRatesCompanyCut(val.toString())}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono transition-all cursor-pointer ${
                        parseFloat(sendRatesCompanyCut) === val
                          ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                          : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {val}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Per Diem Adjustment */}
              <div className="bg-[#09090b] p-4 rounded-xl border border-zinc-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">
                    3. Tech Daily Per Diem ($)
                  </label>
                  <span className="text-[10px] text-zinc-400 italic">Included in rate sheet banner</span>
                </div>
                <div className="grid grid-cols-2 gap-3 items-center">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-xs">$</span>
                    <input
                      type="number"
                      step="5"
                      min="0"
                      value={sendRatesPerDiem}
                      onChange={(e) => setSendRatesPerDiem(e.target.value)}
                      className="w-full bg-[#18181b] border border-zinc-700 rounded-lg pl-7 pr-3 py-1.5 text-xs font-mono font-bold text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {[0, 25, 35, 50].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setSendRatesPerDiem(amt.toString())}
                        className={`px-2 py-1 rounded text-[10px] font-bold font-mono transition-all cursor-pointer border ${
                          parseFloat(sendRatesPerDiem) === amt
                            ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                            : 'bg-zinc-800/60 text-zinc-400 border-transparent hover:text-zinc-200'
                        }`}
                      >
                        ${amt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Provider Selection (If state has 1+ providers) */}
              {(() => {
                const stateProviders = Array.from(
                  new Set(
                    customRatePlans
                      .filter(r => r.stateCode === sendRatesStateCode)
                      .map(r => r.provider)
                  )
                ).filter(Boolean);

                if (stateProviders.length === 0) return null;

                return (
                  <div className="bg-[#09090b] p-4 rounded-xl border border-zinc-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase font-bold text-teal-400 tracking-wider flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-teal-400" />
                        4. Select Provider(s) in State ({stateProviders.length} available)
                      </label>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {sendRatesSelectedProviders.length === 0 ? 'All Included' : `${sendRatesSelectedProviders.length} Selected`}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setSendRatesSelectedProviders([])}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                          sendRatesSelectedProviders.length === 0
                            ? 'bg-teal-500/20 text-teal-300 border-teal-500/40 shadow-sm shadow-teal-500/10 font-extrabold'
                            : 'bg-zinc-800/60 text-zinc-400 border-transparent hover:text-zinc-200'
                        }`}
                      >
                        All Providers ({stateProviders.length})
                      </button>
                      {stateProviders.map(p => {
                        const isSelected = sendRatesSelectedProviders.includes(p);
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setSendRatesSelectedProviders(sendRatesSelectedProviders.filter(item => item !== p));
                              } else {
                                setSendRatesSelectedProviders([...sendRatesSelectedProviders, p]);
                              }
                            }}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border flex items-center gap-1 ${
                              isSelected
                                ? 'bg-teal-500/20 text-teal-300 border-teal-500/40 shadow-sm shadow-teal-500/10 font-extrabold'
                                : 'bg-zinc-800/60 text-zinc-400 border-transparent hover:text-zinc-200'
                            }`}
                          >
                            <span>{p}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsSendRatesConfigOpen(false)}
                  className="px-4 py-2 bg-[#09090b] border border-zinc-800 text-zinc-400 text-xs font-semibold rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSendRates}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-extrabold rounded-xl shadow-lg shadow-emerald-500/10 transition-all cursor-pointer flex items-center space-x-2"
                >
                  <Mail className="w-4 h-4 text-zinc-950" />
                  <span>Preview & Generate Rates Email</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Preview Modal */}
      {isEmailPreviewOpen && emailPreviewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#09090b]/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#18181b] border border-zinc-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-slideUp flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-850 flex items-center justify-between bg-[#09090b]/10 shrink-0">
              <h4 className="text-sm font-bold text-slate-100 tracking-wide flex items-center gap-2">
                <Mail className="w-4 h-4 text-teal-400" />
                Email Templates Preview
              </h4>
              <button 
                onClick={() => {
                  setIsEmailPreviewOpen(false);
                  setEmailPreviewData(null);
                }}
                className="text-zinc-500 hover:text-zinc-350 transition-colors bg-transparent border-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1 text-xs">
              <div className="space-y-3 bg-[#09090b]/50 p-4 rounded-xl border border-zinc-800/80 font-mono">
                <div className="grid grid-cols-[60px_1fr] border-b border-zinc-800/40 pb-2">
                  <span className="text-zinc-500 font-bold">From:</span>
                  <span className="text-zinc-300">netcore.corporation@gmail.com (Company Mail)</span>
                </div>
                <div className="grid grid-cols-[60px_1fr] border-b border-zinc-800/40 pb-2">
                  <span className="text-zinc-500 font-bold">To:</span>
                  <span className="text-zinc-300 font-bold">{emailPreviewData.to}</span>
                </div>
                <div className="grid grid-cols-[60px_1fr] pb-1">
                  <span className="text-zinc-500 font-bold">Subject:</span>
                  <input
                    type="text"
                    value={emailPreviewData.subject}
                    onChange={(e) => setEmailPreviewData({ ...emailPreviewData, subject: e.target.value })}
                    className="bg-transparent border-none p-0 text-zinc-100 font-bold font-mono focus:outline-none w-full"
                  />
                </div>
                {emailPreviewData.attachments && emailPreviewData.attachments.length > 0 && (
                  <div className="grid grid-cols-[60px_1fr] border-t border-zinc-800/40 pt-2 flex items-start gap-1">
                    <span className="text-zinc-500 font-bold mt-0.5">Files:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {emailPreviewData.attachments.map((file, i) => (
                        <span key={i} className="text-[10px] bg-teal-500/10 text-teal-400 border border-teal-500/25 px-2 py-0.5 rounded-md flex items-center gap-1 font-sans font-bold">
                          <Paperclip className="w-3 h-3 text-teal-400 shrink-0" />
                          <span>{file}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Provider Selector for RATES template */}
                {emailPreviewData.templateType === 'RATES' && emailPreviewData.availableProviders && emailPreviewData.availableProviders.length > 0 && (
                  <div className="border-t border-zinc-800/40 pt-2.5 mt-2 space-y-1.5 font-sans">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-teal-400" />
                        Select Provider(s) to Include in Rate Sheet:
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1.5">
                        {isUpdatingRates && (
                          <span className="w-2.5 h-2.5 border-2 border-teal-400 border-t-transparent rounded-full animate-spin inline-block" />
                        )}
                        {emailPreviewData.selectedProviders?.length === emailPreviewData.availableProviders.length
                          ? 'Showing All Providers'
                          : `Active: ${emailPreviewData.selectedProviders?.join(', ')}`}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {(() => {
                        const isAllSelected = emailPreviewData.selectedProviders?.length === emailPreviewData.availableProviders.length;
                        return (
                          <button
                            type="button"
                            onClick={() => handleToggleProviderFilter('ALL')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                              isAllSelected
                                ? 'bg-teal-500/20 text-teal-300 border-teal-500/40 shadow-sm shadow-teal-500/10 font-extrabold'
                                : 'bg-[#09090b] text-zinc-400 border-zinc-800 hover:text-zinc-200'
                            }`}
                          >
                            All Providers
                          </button>
                        );
                      })()}

                      {emailPreviewData.availableProviders.map(p => {
                        const isAllSelected = emailPreviewData.selectedProviders?.length === emailPreviewData.availableProviders?.length;
                        const isThisSelected = emailPreviewData.selectedProviders?.includes(p) && !isAllSelected;
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() => handleToggleProviderFilter(p)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border flex items-center gap-1 ${
                              isThisSelected
                                ? 'bg-teal-500/20 text-teal-300 border-teal-500/40 shadow-sm shadow-teal-500/10 font-extrabold'
                                : 'bg-[#09090b] text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
                            }`}
                          >
                            <span>{p}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2.5 flex flex-col flex-1 min-h-[350px]">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-1">
                  <label className="text-[10px] uppercase font-bold text-zinc-500">Email Draft Body</label>
                  <div className="flex bg-[#09090b] rounded-lg p-0.5 border border-zinc-800 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setEmailPreviewTab('preview')}
                      className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                        emailPreviewTab === 'preview'
                          ? 'bg-zinc-850 text-white font-extrabold shadow-sm'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Visual Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => setEmailPreviewTab('html')}
                      className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                        emailPreviewTab === 'html'
                          ? 'bg-zinc-850 text-white font-extrabold shadow-sm'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Edit Source Code
                    </button>
                  </div>
                </div>

                <div className="flex-grow min-h-0 flex flex-col">
                  {emailPreviewTab === 'preview' ? (
                    <div className="flex-grow bg-white rounded-xl p-5 border border-zinc-350 overflow-y-auto custom-scrollbar h-[320px] text-zinc-800 font-sans shadow-inner">
                      <div dangerouslySetInnerHTML={{ __html: emailPreviewData.bodyHtml }} />
                    </div>
                  ) : (
                    <textarea
                      value={emailPreviewData.bodyHtml}
                      onChange={(e) => {
                        setEmailPreviewData({ 
                          ...emailPreviewData, 
                          bodyHtml: e.target.value,
                          bodyText: e.target.value.replace(/<[^>]*>/g, '\n').replace(/\n\s*\n/g, '\n')
                        });
                      }}
                      className="w-full bg-[#09090b] border border-zinc-800 rounded-xl p-3 font-mono text-[11px] text-zinc-300 focus:outline-none focus:border-teal-500 resize-none h-[320px] custom-scrollbar flex-grow"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 border-t border-zinc-850 flex items-center justify-between bg-[#09090b]/10 shrink-0">
              <p className="text-[10px] text-zinc-500 leading-normal max-w-[250px]">
                The email will be sent automatically through the company SMTP mail server.
              </p>
              <div className="flex items-center space-x-3">
                <button 
                  type="button"
                  onClick={() => {
                    setIsEmailPreviewOpen(false);
                    setEmailPreviewData(null);
                  }}
                  className="px-4 py-2 bg-[#09090b] border border-[#27272a] text-zinc-400 text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                
                {/* Server SMTP Send */}
                <button 
                  onClick={handleSendEmail}
                  disabled={sendingEmail}
                  className="px-4 py-2 bg-teal-500 text-zinc-950 text-xs font-bold rounded-lg hover:bg-teal-400 shadow-lg shadow-teal-500/5 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingEmail ? (
                    <span className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ArrowRight className="w-3.5 h-3.5" />
                  )}
                  <span>Send</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Candidate Documents Viewer Modal */}
      {isCandidateDocsOpen && selectedCandForDocs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#09090b]/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#18181b] border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-slideUp flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-[#09090b]/40 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <span>{selectedCandForDocs.firstName} {selectedCandForDocs.lastName}'s Onboarding Documents</span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-950/50 text-blue-300 border border-blue-800/40">
                      {candidateDocsList.length} / 6 Photos
                    </span>
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">{selectedCandForDocs.email} • State: {selectedCandForDocs.stateCode}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsCandidateDocsOpen(false);
                  setSelectedCandForDocs(null);
                }}
                className="text-zinc-500 hover:text-zinc-300 transition-colors bg-transparent border-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1 text-xs">
              {/* Candidate Upload Link Quick Copy Box */}
              <div className="bg-[#09090b] border border-zinc-800 p-4 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-1.5">
                    <Link className="w-3.5 h-3.5 text-blue-400" />
                    Candidate One-Time Upload Link (6 Required Photos):
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">
                    {candidateDocsList.length >= 6 ? '✅ Completed (6/6 Received)' : '⏳ Awaiting Upload'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={candidateUploadLink || 'Generating link...'}
                    className="w-full bg-[#18181b] border border-zinc-800 rounded-lg px-3 py-1.5 font-mono text-[11px] text-zinc-300 focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={!candidateUploadLink}
                    onClick={() => {
                      if (candidateUploadLink) {
                        navigator.clipboard.writeText(candidateUploadLink);
                        customAlert('Upload link copied to clipboard!', 'Success');
                      }
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-lg text-xs transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </button>
                </div>
              </div>

              {/* Documents Grid */}
              <div className="space-y-3">
                <h5 className="text-xs font-extrabold text-white flex items-center gap-2">
                  <span>Uploaded Onboarding Files</span>
                  {candidateDocsLoading && <span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />}
                </h5>

                {candidateDocsLoading ? (
                  <div className="p-8 text-center text-zinc-500 italic">Loading uploaded documents...</div>
                ) : candidateDocsList.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500 italic bg-[#09090b] border border-zinc-800 rounded-xl space-y-2">
                    <p className="text-xs text-zinc-400 font-bold">No documents uploaded yet.</p>
                    <p className="text-[11px]">Send the document request email or share the copy link above with the candidate to gather their 6 photos.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {candidateDocsList.map(doc => {
                      const docLabels: Record<string, string> = {
                        DL_FRONT: 'DL Front',
                        DL_BACK: 'DL Back',
                        SSN: 'Social (SSN)',
                        EAD_FRONT: 'EAD Front',
                        EAD_BACK: 'EAD Back',
                        BADGE_PHOTO: 'Photo for Badge',
                      };
                      const label = docLabels[doc.docType] || doc.docType || doc.name;

                      return (
                        <div key={doc.id} className="bg-[#09090b] border border-zinc-800 rounded-xl p-3 space-y-2.5 shadow-sm">
                          <div className="relative rounded-lg overflow-hidden border border-zinc-800 h-32 bg-[#18181b] flex items-center justify-center">
                            {doc.dataUrl?.startsWith('data:image') || doc.dataUrl?.endsWith('.png') || doc.dataUrl?.endsWith('.jpg') || doc.dataUrl?.endsWith('.jpeg') ? (
                              <img src={doc.dataUrl} alt={label} className="w-full h-full object-cover" />
                            ) : (
                              <FileText className="w-10 h-10 text-zinc-500" />
                            )}
                          </div>

                          <div className="space-y-1">
                            <h6 className="text-xs font-extrabold text-white truncate">{label}</h6>
                            <p className="text-[10px] text-zinc-500 font-mono">
                              {(doc.size / 1024).toFixed(0)} KB • {new Date(doc.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>

                          <a
                            href={doc.dataUrl}
                            download={doc.name || 'document'}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                            <span>View Full File</span>
                          </a>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add State Modal (Triggered by New Project) */}


      {/* Add/Edit Technician Modal */}
      {isTechModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#09090b]/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#18181b] border border-zinc-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-slideUp flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-[#09090b]/10 shrink-0">
              <div>
                <h4 className="text-sm font-bold text-slate-100 tracking-wide">
                  {editingTech ? 'Edit Technician Profile' : 'Add New Technician'}
                </h4>
                {editingTech && (
                  <p className="text-[10px] text-zinc-500 mt-0.5">ID #{editingTech.id} · {editingTech.stateCode}</p>
                )}
              </div>
              <button 
                onClick={() => setIsTechModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-full hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab switcher */}
            <div className="flex border-b border-zinc-800 bg-[#09090b]/30 shrink-0">
              <button
                type="button"
                onClick={() => setTechModalTab('profile')}
                className={`px-5 py-2.5 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-colors ${
                  techModalTab === 'profile'
                    ? 'border-[#3b82f6] text-zinc-100'
                    : 'border-transparent text-zinc-500 hover:text-slate-300'
                }`}
              >
                <Users className="w-3.5 h-3.5" /> Profile
              </button>
              <button
                type="button"
                onClick={() => setTechModalTab('documents')}
                className={`px-5 py-2.5 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-colors ${
                  techModalTab === 'documents'
                    ? 'border-[#3b82f6] text-zinc-100'
                    : 'border-transparent text-zinc-500 hover:text-slate-300'
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> Documents
                {editingTech && customDocuments.filter(d => d.technicianId === editingTech.id && d.category !== 'PAYMENT').length > 0 && (
                  <span className="bg-zinc-800 text-zinc-300 text-[9px] font-black px-1.5 py-0.5 rounded-full ml-0.5">
                    {customDocuments.filter(d => d.technicianId === editingTech.id && d.category !== 'PAYMENT').length}
                  </span>
                )}
              </button>
              {editingTech && (
                <>
                  <button
                    type="button"
                    onClick={() => setTechModalTab('payments')}
                    className={`px-5 py-2.5 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-colors ${
                      techModalTab === 'payments'
                        ? 'border-[#3b82f6] text-zinc-100'
                        : 'border-transparent text-zinc-500 hover:text-slate-300'
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5" /> Payments
                    {editingTech && customDocuments.filter(d => d.technicianId === editingTech.id && d.category === 'PAYMENT').length > 0 && (
                      <span className="bg-[#10b981] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full ml-0.5">
                        {customDocuments.filter(d => d.technicianId === editingTech.id && d.category === 'PAYMENT').length}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTechModalTab('mobile_jobs');
                      if (editingTech) fetchTechUploads(editingTech.id);
                    }}
                    className={`px-5 py-2.5 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-colors ${
                      techModalTab === 'mobile_jobs'
                        ? 'border-[#3b82f6] text-zinc-100'
                        : 'border-transparent text-zinc-500 hover:text-slate-300'
                    }`}
                  >
                    <Wrench className="w-3.5 h-3.5" /> App Submissions
                    {techUploads.length > 0 && (
                      <span className="bg-teal-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full ml-0.5">
                        {techUploads.length}
                      </span>
                    )}
                  </button>
                </>
              )}
            </div>

            {/* Form Container (Scrollable) — Profile Tab */}
            <form onSubmit={handleSaveTech} className={`flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar ${techModalTab !== 'profile' ? 'hidden' : ''}`}>
              {/* General details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-400">Full Name *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Aleksey Ivanov"
                    value={techForm.name}
                    onChange={(e) => setTechForm({ ...techForm, name: e.target.value })}
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-md px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#3b82f6] font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-400">Phone Number *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="+1 (555) 000-0000"
                    value={techForm.phone}
                    onChange={(e) => setTechForm({ ...techForm, phone: e.target.value })}
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-md px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#3b82f6] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-400">Email Address *</label>
                  <input 
                    type="email" 
                    required
                    placeholder="netcore.corporation@gmail.com"
                    value={techForm.email}
                    onChange={(e) => setTechForm({ ...techForm, email: e.target.value })}
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-md px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#3b82f6] font-medium"
                  />
                </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-400">App Login Username</label>
                  <input 
                    type="text" 
                    placeholder="Username for app login"
                    value={techForm.username || ""}
                    onChange={(e) => setTechForm({ ...techForm, username: e.target.value })}
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-md px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#3b82f6] font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-400">App Login Password</label>
                  <input 
                    type="text" 
                    placeholder="Password for app login"
                    value={techForm.password || ""}
                    onChange={(e) => setTechForm({ ...techForm, password: e.target.value })}
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-md px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#3b82f6] font-medium"
                  />
                </div>
              </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-400">Base Operating State *</label>
                  <select 
                    value={techForm.stateCode}
                    onChange={(e) => setTechForm({ ...techForm, stateCode: e.target.value })}
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-md px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#3b82f6] font-semibold"
                  >
                    {customStates.map(s => (
                      <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-400">Work Specialization</label>
                  <select 
                    value={techForm.workType}
                    onChange={(e) => setTechForm({ ...techForm, workType: e.target.value as WorkType })}
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-md px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#3b82f6] font-semibold"
                  >
                    <option value="BURY">Bury</option>
                    <option value="COAX">Coax</option>
                    <option value="FIBER">Fiber</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-400">Status</label>
                  <select 
                    value={techForm.status}
                    onChange={(e) => setTechForm({ ...techForm, status: e.target.value as TechStatus })}
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-md px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#3b82f6] font-semibold"
                  >
                    <option value="ONBOARDING">Onboarding / Hiring Stage</option>
                    <option value="TRAINING">Training Stage</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>
              </div>

              {/* Vehicle allocation */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-400">Assigned Fleet Vehicle</label>
                <select
                  value={techForm.vehicleId}
                  onChange={(e) => setTechForm({ ...techForm, vehicleId: e.target.value })}
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-md px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#3b82f6] font-semibold"
                >
                  <option value="">-- No vehicle assigned (Available) --</option>
                  {customVehicles
                    .filter(v => !v.technicianId || v.technicianId === (editingTech ? editingTech.id : -999))
                    .map(v => (
                      <option key={v.id} value={v.id.toString()}>
                        {v.plateNumber} - {v.year} {v.make} {v.model} ({v.ownershipType})
                      </option>
                    ))}
                </select>
              </div>

              {/* Custom Payout Contracts Section */}
              <div className="bg-[#09090b]/50 p-4 rounded-xl border border-zinc-800 space-y-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-300 tracking-wider block">
                    сколько мы забираем с его чека, например страндартная ставка 8%
                  </span>
                  <span className="text-[9px] text-zinc-500 block mt-0.5 font-normal normal-case">
                    Укажите процент (%) или фиксированную сумму ($), которую компания удерживает с каждого заказа.
                  </span>
                </div>

                <div className="flex items-center justify-between bg-[#09090b] p-2.5 rounded border border-zinc-800/80 gap-3">
                  <span className="text-xs font-bold text-slate-300">Ставка удержания</span>
                  <div className="flex items-center space-x-2 flex-1 justify-end animate-fadeIn">
                    {/* Type Selector */}
                    <select
                      value={techForm.payoutType}
                      onChange={(e) => {
                        setTechForm({ ...techForm, payoutType: e.target.value as PayoutType });
                      }}
                      className="bg-[#18181b] border border-zinc-800 rounded px-2 py-1 text-[10px] text-slate-300 focus:outline-none"
                    >
                      <option value="PERCENTAGE">Percentage Cut (%)</option>
                      <option value="FIXED">Flat Fee ($)</option>
                    </select>

                    {/* Value Input */}
                    <div className="relative w-20">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={techForm.payoutValue}
                        onChange={(e) => {
                          setTechForm({ ...techForm, payoutValue: e.target.value });
                        }}
                        className="w-full bg-[#18181b] border border-zinc-800 rounded pl-2.5 pr-6 py-1 text-[10px] text-zinc-300 font-mono font-bold focus:outline-none"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-zinc-500 font-bold">
                        {techForm.payoutType === 'PERCENTAGE' ? '%' : '$'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assigned Provider Binding */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-400">Assigned Provider (Привязанный Провайдер)</label>
                <select
                  value={techForm.defaultProvider}
                  onChange={(e) => setTechForm({ ...techForm, defaultProvider: e.target.value })}
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-md px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#3b82f6] cursor-pointer"
                >
                  <option value="">-- None (Use Job Provider or State Averages) --</option>
                  {techStateProviders.map(prov => (
                    <option key={prov} value={prov} className="bg-[#18181b]">{prov}</option>
                  ))}
                </select>
                <p className="text-[9px] text-slate-600">If no custom payout % is set, system checks rate plans for this provider first before state averages.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-400">Per Diem Override ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={`Uses state default ($${(customStates.find(state => state.code === techForm.stateCode)?.employeePerDiem ?? 0).toFixed(2)})`}
                  value={techForm.perDiemOverride}
                  onChange={(e) => setTechForm({ ...techForm, perDiemOverride: e.target.value })}
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-md px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#3b82f6] font-mono placeholder:text-slate-600"
                />
                <p className="text-[9px] text-slate-600">Leave empty to use this technician&apos;s state per diem rate.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-400">Car / Tools Ded. ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={techForm.carToolsDeduction}
                    onChange={(e) => setTechForm({ ...techForm, carToolsDeduction: e.target.value })}
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-md px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#3b82f6] font-mono"
                  />
                  <p className="text-[9px] text-slate-600">Deduction charged to tech on statement.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-400">Company Tools Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={techForm.companyToolsCost}
                    onChange={(e) => setTechForm({ ...techForm, companyToolsCost: e.target.value })}
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-md px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#3b82f6] font-mono"
                  />
                  <p className="text-[9px] text-slate-600">Actual cost paid by company.</p>
                </div>
              </div>

              {/* Internal Notes / Remarks */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-400 flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Internal Notes &amp; Remarks
                </label>
                <textarea
                  rows={4}
                  placeholder="Add private notes, remarks, warnings, or any relevant information about this employee..."
                  value={techForm.notes}
                  onChange={(e) => setTechForm({ ...techForm, notes: e.target.value })}
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-md px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500/60 font-medium resize-none leading-relaxed placeholder-slate-600"
                />
                <p className="text-[9px] text-slate-600 italic">Notes are internal only and not visible to the employee.</p>
              </div>

              {/* Form Action Footer */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-zinc-800 shrink-0">
                <button 
                  type="button"
                  onClick={() => setIsTechModalOpen(false)}
                  className="px-4 py-2 bg-[#09090b] border border-[#27272a] text-zinc-400 text-xs font-semibold rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-zinc-100 text-zinc-950 text-xs font-bold rounded-md hover:bg-zinc-200 shadow-lg shadow-zinc-500/5 transition-all cursor-pointer"
                >
                  Save Profile
                </button>
              </div>
            </form>

            {/* Documents Tab Panel */}
            {techModalTab === 'documents' && (
              <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                {!editingTech ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <FileText className="w-10 h-10 text-slate-600 mb-3" />
                    <p className="text-zinc-400 font-semibold text-sm">Save the profile first</p>
                    <p className="text-slate-600 text-xs mt-1">Documents can be added after creating the technician.</p>
                  </div>
                ) : (() => {
                  const techDocs = customDocuments.filter(d => d.technicianId === editingTech.id && d.category !== 'PAYMENT');
                  const formatSize = (b: number) => b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`;
                  const getDocIcon = (fileType: string) => {
                    if (fileType.includes('pdf')) return '📄';
                    if (fileType.includes('image')) return '🖼️';
                    if (fileType.includes('word') || fileType.includes('document')) return '📝';
                    if (fileType.includes('sheet') || fileType.includes('excel') || fileType.includes('csv')) return '📊';
                    return '📎';
                  };
                  const getCategoryColor = (cat: TechDocument['category']) => {
                    switch(cat) {
                      case 'CONTRACT': return 'bg-zinc-800/30 text-zinc-300 border-blue-500/20';
                      case 'ID': return 'bg-zinc-800/30 text-zinc-300 border-emerald-500/20';
                      case 'CERTIFICATION': return 'bg-purple-500/10 text-zinc-400 border-purple-500/20';
                      default: return 'bg-slate-500/10 text-zinc-400 border-slate-500/20';
                    }
                  };
                  return (
                    <>
                      {/* Upload area */}
                      <div className="p-5 border-b border-zinc-800/60 bg-[#09090b]/20">
                        <p className="text-[10px] uppercase font-bold text-zinc-400 mb-3 tracking-wider">Upload Document</p>
                        <div className="flex items-center gap-3">
                          <select
                            id="doc-category-select"
                            defaultValue="CONTRACT"
                            className="bg-[#09090b] border border-[#27272a] rounded-md px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#3b82f6] font-semibold"
                          >
                            <option value="CONTRACT">📋 Contract / Agreement</option>
                            <option value="ID">🪪 ID / Passport</option>
                            <option value="CERTIFICATION">🏅 Certification / License</option>
                            <option value="OTHER">📎 Other</option>
                          </select>
                          <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800/40 border border-[#3b82f6]/30 hover:border-[#3b82f6] text-zinc-100 text-xs font-bold rounded-md cursor-pointer transition-all group">
                            <Upload className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                            Choose File to Upload
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx,.csv,.txt"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                if (file.size > 10 * 1024 * 1024) {
                                  await customAlert('File too large. Maximum size is 10 MB.', 'File Size Limit');
                                  return;
                                }
                                const catEl = document.getElementById('doc-category-select') as HTMLSelectElement;
                                const cat = (catEl?.value || 'OTHER') as TechDocument['category'];
                                handleUploadDocument(editingTech.id, file, cat);
                                e.target.value = '';
                              }}
                            />
                          </label>
                        </div>
                        <p className="text-[9px] text-slate-600 italic mt-2">Supported: PDF, DOC, DOCX, JPG, PNG, XLS, CSV, TXT · Max 10 MB</p>
                      </div>

                      {/* Document list */}
                      <div className="flex-1 p-5">
                        {techDocs.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 text-center">
                            <File className="w-8 h-8 text-slate-700 mb-3" />
                            <p className="text-zinc-500 text-xs font-medium">No documents uploaded yet</p>
                            <p className="text-slate-600 text-[10px] mt-1">Upload contracts, IDs, certifications and more above</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {techDocs.map(doc => (
                              <div key={doc.id} className="flex items-center gap-3 p-3 bg-[#09090b]/60 border border-zinc-800/60 rounded-lg hover:border-zinc-700/60 transition-colors group">
                                <div className="text-xl shrink-0">{getDocIcon(doc.fileType)}</div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-zinc-200 truncate">{doc.name}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`text-[8.5px] font-bold uppercase px-1.5 py-0.5 rounded border ${getCategoryColor(doc.category)}`}>
                                      {doc.category}
                                    </span>
                                    <span className="text-[9px] text-slate-600">{formatSize(doc.size)}</span>
                                    <span className="text-[9px] text-slate-600">
                                      {new Date(doc.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadDocument(doc)}
                                    className="p-1.5 text-zinc-300 hover:bg-zinc-800/30 rounded transition-colors"
                                    title="Download"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteDocument(doc.id)}
                                    className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Documents tab footer */}
                      <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-800 bg-[#09090b]/20 shrink-0">
                        <p className="text-[9px] text-slate-600">{techDocs.length} document{techDocs.length !== 1 ? 's' : ''} total</p>
                        <button
                          type="button"
                          onClick={() => setIsTechModalOpen(false)}
                          className="px-4 py-2 bg-[#09090b] border border-[#27272a] text-zinc-400 text-xs font-semibold rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          Close
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* Payments Tab Panel */}
            {techModalTab === 'payments' && (
              <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                {!editingTech ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <DollarSign className="w-10 h-10 text-slate-600 mb-3" />
                    <p className="text-zinc-400 font-semibold text-sm">Save the profile first</p>
                  </div>
                ) : (() => {
                  const tech = editingTech;
                  if (!tech) return null;
                  const payments = customDocuments.filter(d => d.technicianId === tech.id && d.category === 'PAYMENT');
                  const formatSize = (b: number) => b < 1024 ? `${b} B` : `${(b / 1024).toFixed(0)} KB`;
                  return (
                    <>
                      {/* Statement list */}
                      <div className="flex-grow p-5 overflow-y-auto custom-scrollbar min-h-[300px]">
                        {payments.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 text-center">
                            <FileText className="w-8 h-8 text-zinc-700 mb-3" />
                            <p className="text-zinc-500 text-xs font-medium">No payroll statements generated yet</p>
                            <p className="text-slate-600 text-[10px] mt-1">Weekly statements will automatically generate here when you import payroll.</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {payments.map(doc => (
                              <div key={doc.id} className="flex items-center justify-between p-3 bg-[#09090b]/60 border border-zinc-800/60 rounded-lg hover:border-zinc-700/60 transition-colors group">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="text-xl shrink-0">📊</div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold text-zinc-200 truncate">{doc.name}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8.5px] font-bold uppercase px-1.5 py-0.5 rounded">
                                        STATEMENT
                                      </span>
                                      <span className="text-[9px] text-slate-600 font-mono">{formatSize(doc.size)}</span>
                                      <span className="text-[9px] text-slate-600">
                                        {new Date(doc.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => setPreviewStatement(doc)}
                                    className="p-1.5 text-zinc-300 hover:bg-zinc-800/30 rounded transition-colors cursor-pointer"
                                    title="View Statement Breakdown"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadDocument(doc)}
                                    className="p-1.5 text-zinc-300 hover:bg-zinc-800/30 rounded transition-colors cursor-pointer"
                                    title="Download CSV"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      const text = decodeCsvContent(doc.dataUrl);
                                      try {
                                        await navigator.clipboard.writeText(text);
                                        await customAlert('Statement rows copied to clipboard successfully!', 'Success');
                                      } catch (err) {
                                        console.error(err);
                                        await customAlert('Failed to copy rows to clipboard.', 'Error');
                                      }
                                    }}
                                    className="p-1.5 text-zinc-300 hover:bg-zinc-800/30 rounded transition-colors cursor-pointer"
                                    title="Copy TSV Rows to Clipboard"
                                  >
                                    <FileSpreadsheet className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteDocument(doc.id)}
                                    className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded transition-colors cursor-pointer"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-800 bg-[#09090b]/20 shrink-0">
                        <p className="text-[9px] text-slate-600">{payments.length} statement{payments.length !== 1 ? 's' : ''} total</p>
                        <button
                          type="button"
                          onClick={() => setIsTechModalOpen(false)}
                          className="px-4 py-2 bg-[#09090b] border border-[#27272a] text-zinc-400 text-xs font-semibold rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          Close
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* Mobile App Jobs Tab Panel */}
            {techModalTab === 'mobile_jobs' && (
              <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                {!editingTech ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <Wrench className="w-10 h-10 text-zinc-600 mb-3" />
                    <p className="text-zinc-400 font-semibold text-sm">Save profile first</p>
                  </div>
                ) : (() => {
                  const startOfToday = new Date();
                  startOfToday.setHours(0, 0, 0, 0);

                  const startOfMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1);

                  const filteredUploads = techUploads.filter(u => {
                    const uDate = new Date(u.createdAt);
                    if (mobileJobsDateFilter === 'TODAY') {
                      return uDate >= startOfToday;
                    } else if (mobileJobsDateFilter !== 'ALL' && mobileJobsDateFilter) {
                      const isoStr = uDate.toISOString().split('T')[0];
                      const localStr = `${uDate.getFullYear()}-${String(uDate.getMonth() + 1).padStart(2, '0')}-${String(uDate.getDate()).padStart(2, '0')}`;
                      return isoStr === mobileJobsDateFilter || localStr === mobileJobsDateFilter;
                    }
                    return true;
                  });

                  const todayCount = techUploadStats.todayCount || techUploads.filter(u => new Date(u.createdAt) >= startOfToday).length;
                  const monthCount = techUploadStats.monthCount || techUploads.filter(u => new Date(u.createdAt) >= startOfMonth).length;
                  
                  const uniqueDaysSet = new Set(techUploads.map(u => new Date(u.createdAt).toISOString().split('T')[0]));
                  const distinctDays = uniqueDaysSet.size;
                  const avgPerDay = techUploadStats.avgPerDay || (distinctDays > 0 ? (techUploads.length / distinctDays).toFixed(1) : '0');

                  return (
                    <>
                      {/* Daily Stats Summary Banner - 4 Key Stats */}
                      <div className="p-3.5 bg-[#09090b]/90 border-b border-zinc-800/80 grid grid-cols-2 md:grid-cols-4 gap-2.5 shrink-0">
                        {/* Today's Count */}
                        <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-3 flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider block">Today</span>
                            <div className="text-sm font-bold text-emerald-400 mt-0.5 font-mono">
                              {todayCount} today
                            </div>
                          </div>
                        </div>

                        {/* This Month */}
                        <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-3 flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-zinc-800/90 border border-zinc-700 flex items-center justify-center text-zinc-300 shrink-0">
                            <Calendar className="w-3.5 h-3.5 text-zinc-300" />
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider block">This Month</span>
                            <div className="text-sm font-bold text-zinc-100 mt-0.5 font-mono">
                              {monthCount} month
                            </div>
                          </div>
                        </div>

                        {/* Daily Average */}
                        <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-3 flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-zinc-800/90 border border-zinc-700 flex items-center justify-center text-zinc-300 shrink-0">
                            <TrendingUp className="w-3.5 h-3.5 text-zinc-300" />
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider block">Daily Avg</span>
                            <div className="text-sm font-bold text-zinc-100 mt-0.5 font-mono">
                              {avgPerDay} / day
                            </div>
                          </div>
                        </div>

                        {/* Total Submissions */}
                        <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-3 flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-zinc-800/90 border border-zinc-700 flex items-center justify-center text-zinc-300 shrink-0">
                            <Wrench className="w-3.5 h-3.5 text-zinc-300" />
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider block">Total Jobs</span>
                            <div className="text-sm font-bold text-zinc-100 mt-0.5 font-mono">
                              {filteredUploads.length} jobs
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Filter Bar & Controls */}
                      <div className="px-5 pt-3.5 pb-2 flex items-center justify-between border-b border-zinc-800/50 bg-[#09090b]/40 font-sans">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider flex items-center gap-1">
                            <Clock className="w-3 h-3 text-zinc-400" />
                            Filter by Date:
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setMobileJobsDateFilter('ALL');
                                setCustomSelectedDate('');
                              }}
                              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer border ${
                                mobileJobsDateFilter === 'ALL'
                                  ? 'bg-zinc-800 text-zinc-100 border-zinc-700 shadow-sm'
                                  : 'bg-[#09090b] text-zinc-400 border-zinc-800 hover:text-zinc-200'
                              }`}
                            >
                              All Time
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setMobileJobsDateFilter('TODAY');
                                setCustomSelectedDate('');
                              }}
                              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer border ${
                                mobileJobsDateFilter === 'TODAY'
                                  ? 'bg-zinc-800 text-zinc-100 border-zinc-700 shadow-sm'
                                  : 'bg-[#09090b] text-zinc-400 border-zinc-800 hover:text-zinc-200'
                              }`}
                            >
                              Today
                            </button>
                          </div>
                        </div>

                        {/* Custom Date Input */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-zinc-500 font-semibold">Select Date:</span>
                          <input
                            type="date"
                            value={customSelectedDate}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCustomSelectedDate(val);
                              setMobileJobsDateFilter(val || 'ALL');
                            }}
                            className="bg-[#09090b] border border-zinc-800 text-zinc-200 text-xs px-2 py-0.5 rounded-md focus:outline-none focus:border-zinc-600 font-mono cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Jobs Grid / Clean Card List without Screenshots */}
                      <div className="flex-grow p-5 overflow-y-auto custom-scrollbar min-h-[300px]">
                        {loadingUploads ? (
                          <div className="flex items-center justify-center py-12 text-zinc-500 text-xs font-semibold gap-2">
                            <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                            Loading submissions...
                          </div>
                        ) : filteredUploads.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Wrench className="w-8 h-8 text-zinc-700 mb-3" />
                            <p className="text-zinc-400 text-xs font-semibold">No submissions found for selected filter</p>
                            <p className="text-zinc-600 text-[10px] mt-1">Try selecting "All Time" or picking a different date.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            {filteredUploads.map(upload => {
                              const createdDate = new Date(upload.createdAt);
                              const isToday = createdDate >= startOfToday;
                              const payout = Number(upload.payoutAmount || 0);

                              return (
                                <div key={upload.id} className="p-3.5 bg-[#18181b] border border-zinc-800 rounded-xl hover:border-zinc-700 transition-all space-y-2 group">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-zinc-100 font-mono">
                                      {upload.jobNumber.startsWith('Job') ? upload.jobNumber : `Job #${upload.jobNumber}`}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                      {upload.sourceLabel && (
                                        <span className="bg-zinc-800/90 text-zinc-400 border border-zinc-700 text-[9px] font-medium px-1.5 py-0.5 rounded font-mono">
                                          {upload.sourceLabel}
                                        </span>
                                      )}
                                      {isToday && (
                                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded">
                                          Today
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                                    <div className="flex items-center gap-2">
                                      <span>{createdDate.toLocaleDateString()}</span>
                                      <span>{createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    {payout > 0 && (
                                      <span className="text-emerald-400 font-bold font-mono">${payout.toFixed(2)}</span>
                                    )}
                                  </div>

                                  {upload.rawText && (
                                    <p className="text-[9.5px] text-zinc-400 font-mono truncate bg-[#09090b] p-1.5 rounded border border-zinc-800/60">
                                      {upload.rawText}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-800 bg-[#09090b]/20 shrink-0">
                        <p className="text-[9px] text-slate-600">{techUploads.length} submission{techUploads.length !== 1 ? 's' : ''} recorded</p>
                        <button
                          type="button"
                          onClick={() => setIsTechModalOpen(false)}
                          className="px-4 py-2 bg-[#09090b] border border-[#27272a] text-zinc-400 text-xs font-semibold rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          Close
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

          </div>
        </div>
      )}


      {/* Screenshot Fullsize Preview Modal */}
      {previewScreenshotUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn" onClick={() => setPreviewScreenshotUrl(null)}>
          <div className="relative max-w-3xl max-h-[90vh] bg-[#18181b] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl p-2" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreviewScreenshotUrl(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/60 hover:bg-black/90 text-white rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img 
              src={previewScreenshotUrl} 
              alt="Screenshot Preview" 
              className="max-h-[82vh] w-auto object-contain rounded-lg mx-auto"
            />
          </div>
        </div>
      )}

      {/* Add/Edit Vehicle Modal */}
      {isVehicleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#09090b]/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#18181b] border border-zinc-800 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-slideUp">
            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-[#09090b]/10">
              <h4 className="text-sm font-bold text-slate-100 tracking-wide">
                {editingVehicle ? 'Edit Vehicle Registry' : 'Add Vehicle to Fleet'}
              </h4>
              <button 
                onClick={() => setIsVehicleModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-full hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveVehicle} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-400">Make *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Ford, Chevrolet"
                    value={vehicleForm.make}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, make: e.target.value })}
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-md px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#3b82f6] font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-400">Model *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Transit-250"
                    value={vehicleForm.model}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-md px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#3b82f6] font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-400">Year *</label>
                  <input 
                    type="number" 
                    required
                    placeholder="2022"
                    value={vehicleForm.year}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, year: e.target.value })}
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-md px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#3b82f6] font-mono font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-400">Plate Number *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. TN-9852A"
                    value={vehicleForm.plateNumber}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, plateNumber: e.target.value })}
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-md px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#3b82f6] font-mono font-bold uppercase"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-400">VIN (17 Characters) *</label>
                <input 
                  type="text" 
                  required
                  maxLength={17}
                  placeholder="Enter VIN code..."
                  value={vehicleForm.vin}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, vin: e.target.value })}
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-md px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#3b82f6] font-mono uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-400">Ownership Type</label>
                  <select 
                    value={vehicleForm.ownershipType}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, ownershipType: e.target.value as OwnershipType })}
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-md px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#3b82f6] font-semibold"
                  >
                    <option value="COMPANY">Company Fleet</option>
                    <option value="PERSONAL">Personal Vehicle</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-400">Fleet Status</label>
                  <select 
                    value={vehicleForm.status}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, status: e.target.value as VehicleStatus })}
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-md px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#3b82f6] font-semibold"
                  >
                    <option value="ACTIVE">Active service</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="RETIRED">Retired</option>
                  </select>
                </div>
              </div>

              {/* Action footer */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-zinc-800">
                <button 
                  type="button"
                  onClick={() => setIsVehicleModalOpen(false)}
                  className="px-4 py-2 bg-[#09090b] border border-[#27272a] text-zinc-400 text-xs font-semibold rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-zinc-100 text-zinc-950 text-xs font-bold rounded-md hover:bg-zinc-200 shadow-lg shadow-zinc-500/5 transition-all cursor-pointer"
                >
                  Save Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispatch New Job Modal */}
      {isJobModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#09090b]/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#18181b] border border-zinc-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-slideUp">
            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-[#09090b]/10">
              <h4 className="text-sm font-bold text-slate-100 tracking-wide">
                Log Job Details
              </h4>
              <button 
                onClick={() => setIsJobModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-full hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveJob} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Date */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-400">Job Date *</label>
                  <input 
                    type="date"
                    required
                    value={jobForm.date}
                    onChange={(e) => setJobForm({ ...jobForm, date: e.target.value })}
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-md px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#3b82f6] font-mono font-bold"
                  />
                </div>

                {/* Technician selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-400">Field Technician *</label>
                  <select
                    required
                    value={jobForm.technicianId}
                    onChange={(e) => {
                      const techIdVal = e.target.value;
                      const techObj = customTechnicians.find(t => t.id === parseInt(techIdVal));
                      if (techObj) {
                        const techState = techObj.stateCode;
                        const stateRates = customRatePlans.filter(r => r.stateCode === techState);
                        const defaultRate = stateRates[0] ? stateRates[0].code : '';
                        const defaultProvider = stateRates[0] ? stateRates[0].provider : 'Xfinity';
                        const stateObj = customStates.find(s => s.code === techState);
                        const stateCities = stateObj ? customCities.filter(c => c.stateId === stateObj.id) : [];
                        const defaultCityId = stateCities[0] ? stateCities[0].id.toString() : '';

                        setJobForm({
                          ...jobForm,
                          technicianId: techIdVal,
                          provider: defaultProvider,
                          ratePlanCode: defaultRate,
                          cityId: defaultCityId
                        });
                      } else {
                        setJobForm({ ...jobForm, technicianId: techIdVal });
                      }
                    }}
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-md px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#3b82f6] font-semibold"
                  >
                    <option value="">-- Choose Tech --</option>
                    {customTechnicians
                      .filter(t => t.status === 'ACTIVE')
                      .map(t => (
                        <option key={t.id} value={t.id.toString()}>{t.name} ({t.stateCode})</option>
                      ))}
                  </select>
                </div>
              </div>

              {/* State and City (Locked by technician state) */}
              <div className="grid grid-cols-2 gap-4">
                {/* State (Info only) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-400">Operating Region</label>
                  <div className="bg-[#09090b]/50 border border-[#27272a]/40 rounded-md px-3 py-2 text-xs text-zinc-400 font-bold">
                    {(() => {
                      const t = customTechnicians.find(tc => tc.id === parseInt(jobForm.technicianId));
                      return t ? `${t.stateCode} Regional Hub` : 'Select Technician first';
                    })()}
                  </div>
                </div>

                {/* City */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-400">City / Node *</label>
                  <select
                    required
                    disabled={!jobForm.technicianId}
                    value={jobForm.cityId}
                    onChange={(e) => setJobForm({ ...jobForm, cityId: e.target.value })}
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-md px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#3b82f6] font-semibold disabled:opacity-40"
                  >
                    <option value="">-- Select City --</option>
                    {(() => {
                      const t = customTechnicians.find(tc => tc.id === parseInt(jobForm.technicianId));
                      if (!t) return null;
                      const stateObj = customStates.find(s => s.code === t.stateCode);
                      if (!stateObj) return null;
                      return customCities
                        .filter(c => c.stateId === stateObj.id)
                        .map(c => (
                          <option key={c.id} value={c.id.toString()}>{c.name}</option>
                        ));
                    })()}
                  </select>
                </div>
              </div>

              {/* Provider and Job Code selection */}
              <div className="grid grid-cols-2 gap-4">
                {/* Provider */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-400">Telecom Provider *</label>
                  <select
                    required
                    disabled={!jobForm.technicianId}
                    value={jobForm.provider}
                    onChange={(e) => {
                      const provVal = e.target.value;
                      const techObj = customTechnicians.find(t => t.id === parseInt(jobForm.technicianId));
                      let defaultRate = '';
                      if (techObj) {
                        const matchingRates = customRatePlans.filter(r => r.stateCode === techObj.stateCode && r.provider === provVal);
                        defaultRate = matchingRates[0] ? matchingRates[0].code : '';
                      }
                      setJobForm({
                        ...jobForm,
                        provider: provVal,
                        ratePlanCode: defaultRate
                      });
                    }}
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-md px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#3b82f6] font-semibold disabled:opacity-40"
                  >
                    <option value="Xfinity">Xfinity</option>
                    <option value="Spectrum">Spectrum</option>
                    <option value="Cox">Cox</option>
                  </select>
                </div>

                {/* Job code */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-400">Order Job Code *</label>
                  <select
                    required
                    disabled={!jobForm.technicianId}
                    value={jobForm.ratePlanCode}
                    onChange={(e) => setJobForm({ ...jobForm, ratePlanCode: e.target.value })}
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-md px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#3b82f6] font-mono font-bold disabled:opacity-40"
                  >
                    <option value="">-- Choose Code --</option>
                    {(() => {
                      const t = customTechnicians.find(tc => tc.id === parseInt(jobForm.technicianId));
                      if (!t) return null;
                      return customRatePlans
                        .filter(rp => rp.stateCode === t.stateCode && rp.provider.toLowerCase() === jobForm.provider.toLowerCase())
                        .map(rp => (
                          <option key={rp.id} value={rp.code}>{rp.code} (${rp.grossPrice.toFixed(0)})</option>
                        ));
                    })()}
                  </select>
                </div>
              </div>

              {/* Dynamic Payout Calculator Panel */}
              {(() => {
                const tech = customTechnicians.find(t => t.id === parseInt(jobForm.technicianId));
                if (!tech || !jobForm.ratePlanCode) return null;

                const ratePlan = customRatePlans.find(r => 
                  r.stateCode === tech.stateCode && 
                  r.provider.toLowerCase() === jobForm.provider.toLowerCase() && 
                  r.code === jobForm.ratePlanCode
                );
                if (!ratePlan) return null;

                const gross = ratePlan.grossPrice;
                const defaultPayout = ratePlan.employeePrice;

                // Resolve Company Cut / Technician Payout based on contracts
                let payout = defaultPayout;
                let profit = gross - defaultPayout;
                let contractDescription = '';
                if (tech.payoutType === 'PERCENTAGE') {
                  profit = gross * (tech.payoutValue / 100);
                  payout = Math.max(0, gross - profit);
                  contractDescription = `company takes ${tech.payoutValue}% cut, technician receives ${100 - tech.payoutValue}%`;
                } else {
                  profit = tech.payoutValue;
                  payout = Math.max(0, gross - profit);
                  contractDescription = `company takes $${tech.payoutValue.toFixed(2)} flat fee, technician receives remainder`;
                }
                profit = Math.round(profit * 100) / 100;
                payout = Math.round(payout * 100) / 100;
                const profitPct = gross > 0 ? (profit / gross) * 100 : 0;

                return (
                  <div className="bg-[#09090b] p-4 rounded-xl border border-zinc-800/80 space-y-3 animate-fadeIn text-xs">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block border-b border-zinc-800 pb-1.5">
                      Profit & Contractor Payout Summary
                    </span>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Gross Invoice Price:</span>
                        <span className="font-mono text-zinc-100 font-bold">${gross.toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between items-start">
                        <div className="space-y-0.5">
                          <p className="text-zinc-500">Technician Payout:</p>
                          <p className="text-[9px] text-slate-600 italic">Resolved by {contractDescription}</p>
                        </div>
                        <span className="font-mono text-zinc-300 font-bold">${payout.toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between border-t border-zinc-800/80 pt-2 font-bold text-zinc-200">
                        <span>Retained Company Profit:</span>
                        <span className="font-mono text-zinc-400">
                          ${profit.toFixed(2)} <span className="text-[10px] text-zinc-500 font-semibold ml-1">({profitPct.toFixed(0)}%)</span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Action footer */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-zinc-800">
                <button 
                  type="button"
                  onClick={() => setIsJobModalOpen(false)}
                  className="px-4 py-2 bg-[#09090b] border border-[#27272a] text-zinc-400 text-xs font-semibold rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-zinc-100 text-zinc-950 text-xs font-bold rounded-md hover:bg-zinc-200 shadow-lg shadow-zinc-500/5 transition-all cursor-pointer"
                >
                  Save Job Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



  {/* Statement Preview Modal */}
  {previewStatement && (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#09090b]/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#18181b] border border-zinc-800 rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden animate-slideUp flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-[#09090b]/10 shrink-0">
          <div>
            <h4 className="text-sm font-bold text-slate-100 tracking-wide flex items-center gap-2">
              <span>📄 Payout Invoice Statement</span>
            </h4>
            <p className="text-[10px] text-zinc-500 mt-0.5">{previewStatement.name}</p>
          </div>
          <button 
            onClick={() => setPreviewStatement(null)}
            className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-xs">
          {(() => {
            const stmt = previewStatement;
            if (!stmt) return null;
            const csvText = decodeCsvContent(stmt.dataUrl);
            const lines = csvText.split('\n').map((l: string) => l.trim()).filter(Boolean);
            
            // Parse sections from flat layout
            let techName = '';
            let period = '';
            let date = '';
            const jobs: any[] = [];
            
            let payoutSubtotal = 0;
            let pdVal = 0;
            let carVal = 0;
            let hotelVal = 0;
            const dates: Date[] = [];

            const parseCsvLine = (lineStr: string): string[] => {
              if (lineStr.includes('\t')) {
                return lineStr.split('\t').map(c => c.replace(/^"|"$/g, '').trim());
              }
              const result: string[] = [];
              let cur = '';
              let inQuotes = false;
              for (let i = 0; i < lineStr.length; i++) {
                const char = lineStr[i];
                if (char === '"') {
                  inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                  result.push(cur.replace(/^"|"$/g, '').trim());
                  cur = '';
                } else {
                  cur += char;
                }
              }
              result.push(cur.replace(/^"|"$/g, '').trim());
              return result;
            };

            const extractLastNumber = (cells: string[]): number => {
              for (let i = cells.length - 1; i >= 0; i--) {
                const cell = cells[i];
                if (!cell) continue;
                const clean = cell.replace('$', '').replace(/[\s\t]/g, '').replace(',', '.');
                const num = parseFloat(clean);
                if (!isNaN(num)) return num;
              }
              return 0;
            };

            lines.forEach((line: string) => {
              const cells = parseCsvLine(line);
              if (cells.length === 0) return;

              const lineLower = line.toLowerCase();

              // Check summary rows
              if (lineLower.includes('per diem') || lineLower.includes('perdiem')) {
                pdVal = extractLastNumber(cells);
                return;
              }
              if (lineLower.includes('tools and car') || lineLower.includes('car / tools') || lineLower.includes('car tools') || lineLower.includes('tools & car')) {
                carVal = Math.abs(extractLastNumber(cells));
                return;
              }
              if (lineLower.includes('hotel deduction') || lineLower.includes('hotel')) {
                hotelVal = Math.abs(extractLastNumber(cells));
                return;
              }
              if (lineLower.includes('total') || lineLower.includes('net technician payout')) {
                return;
              }

              // Normal job row
              if (cells.length < 5) return;

              const rowDateStr = cells[0];
              const rowDateObj = new Date(/^\d{4}-\d{2}-\d{2}$/.test(rowDateStr) ? `${rowDateStr}T00:00:00` : rowDateStr);
              if (!isNaN(rowDateObj.getTime())) {
                dates.push(rowDateObj);
              }

              if (!techName && cells[1]) {
                let raw = cells[1].trim();
                raw = raw.replace(/^\d+\s+/, '');
                const matchedTech = customTechnicians.find(t => raw.toLowerCase().includes(t.name.toLowerCase()));
                techName = matchedTech ? matchedTech.name : raw;
              }

              const jobRef = cells[4] || cells[2] || '-';
              const provider = cells[2] || 'Spectrum';
              const city = cells[7] || '-';
              const state = cells[8] || '-';
              const code = cells[10] || cells[3] || '-';
              const desc = cells[11] || '-';
              const qty = parseInt(cells[12]) || 1;
              const payoutStr = (cells[13] || cells[cells.length - 1] || '0').replace('$', '').replace(/[\s\t]/g, '').replace(',', '.');
              const payoutVal = parseFloat(payoutStr) || 0;

              if (code !== 'PERDIEM' && code !== 'CARDED' && code !== 'HOTELDED') {
                payoutSubtotal += payoutVal * qty;
                jobs.push({
                  date: rowDateStr,
                  jobId: jobRef,
                  provider: provider,
                  city: city,
                  state: state,
                  code: code,
                  desc: desc,
                  qty: qty,
                  payout: payoutVal
                });
              }
            });

            if (!techName && stmt.name) {
              const fileTechName = stmt.name.replace(/^\d{2}\.\d{2}\.\d{4}\s+/, '').replace(/\.csv$/i, '');
              const matchedTech = customTechnicians.find(t => fileTechName.toLowerCase().includes(t.name.toLowerCase()));
              techName = matchedTech ? matchedTech.name : fileTechName;
            }

            if (dates.length > 0) {
              const maxDateObj = new Date(Math.max(...dates.map(d => d.getTime())));
              const minDateObj = new Date(Math.min(...dates.map(d => d.getTime())));
              
              const formatPreviewDateStr = (d: Date) => {
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                const year = d.getFullYear();
                return `${month}.${day}.${year}`;
              };
              period = `${formatPreviewDateStr(minDateObj)} - ${formatPreviewDateStr(maxDateObj)}`;
              date = formatPreviewDateStr(new Date(stmt.uploadedAt || new Date()));
            }

            const netPayout = payoutSubtotal + pdVal - carVal - hotelVal;

            return (
              <div className="space-y-6">
                {/* Header Summary */}
                <div className="grid grid-cols-3 gap-4 bg-[#09090b]/40 border border-zinc-800/60 p-4 rounded-xl">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-500 block">Technician Name</span>
                    <span className="text-sm font-bold text-zinc-100 mt-1 block">{techName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-500 block">Statement Period</span>
                    <span className="text-xs font-semibold text-zinc-300 mt-1 block">{period}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-500 block">Statement Date</span>
                    <span className="text-xs font-semibold text-zinc-300 mt-1 block">{date}</span>
                  </div>
                </div>

                {/* Jobs Table */}
                <div className="space-y-2">
                  <h5 className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Itemized Job Details</h5>
                  <div className="border border-zinc-800/80 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto max-h-[250px] custom-scrollbar">
                      <table className="w-full text-left border-collapse text-[11px]">
                        <thead className="bg-[#09090b] sticky top-0 border-b border-zinc-800">
                          <tr className="text-zinc-500 font-bold uppercase tracking-wider text-[9px]">
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Job ID</th>
                            <th className="py-2.5 px-3">Client</th>
                            <th className="py-2.5 px-3">Location</th>
                            <th className="py-2.5 px-3 text-center">Code</th>
                            <th className="py-2.5 px-3 text-center">Qty</th>
                            <th className="py-2.5 px-3 text-right text-zinc-300 font-bold">Tech Pay</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/40 text-slate-300">
                          {jobs.map((job, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/10 transition-colors">
                              <td className="py-2 px-3 font-mono">{job.date}</td>
                              <td className="py-2 px-3 font-mono text-zinc-500">#{job.jobId}</td>
                              <td className="py-2 px-3 font-semibold">{job.provider}</td>
                              <td className="py-2 px-3 text-zinc-400 truncate max-w-[120px]" title={job.desc}>{job.city}, {job.state}</td>
                              <td className="py-2 px-3 text-center font-mono font-bold text-zinc-400">{job.code}</td>
                              <td className="py-2 px-3 text-center font-mono">{job.qty}</td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400">${job.payout.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-zinc-800">
                  <div></div>
                  <div className="bg-[#09090b]/40 border border-zinc-800/80 p-5 rounded-xl space-y-2.5">
                    <h5 className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider border-b border-zinc-800 pb-2 mb-2">Statement Summary</h5>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-500 font-semibold">Technician Payout Subtotal:</span>
                      <span className="font-mono font-bold text-zinc-200">${payoutSubtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-500 font-semibold">Per Diem Payout:</span>
                      <span className="font-mono font-bold text-zinc-200">${pdVal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-500 font-semibold">Tools and Car:</span>
                      <span className="font-mono font-bold text-zinc-200">-${carVal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-500 font-semibold">Hotel Deduction:</span>
                      <span className="font-mono font-bold text-zinc-200">-${hotelVal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-t border-zinc-800 pt-2.5 mt-2.5">
                      <span className="font-black text-slate-100">NET TECHNICIAN PAYOUT:</span>
                      <span className="font-mono font-black text-emerald-400 text-base">${netPayout.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-800 bg-[#09090b]/20 flex justify-end shrink-0">
          <button 
            type="button"
            onClick={() => setPreviewStatement(null)}
            className="bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-extrabold text-xs px-5 py-2 rounded-lg cursor-pointer transition-all"
          >
            Close Statement
          </button>
        </div>
      </div>
    </div>
  )}

      {/* Ticket Details Modal */}
      {isTicketModalOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-[#1a1c23] border border-[#2c2f38] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#2c2f38] flex items-center justify-between bg-[#121316]">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-[#1a73e8]/15 border border-[#1a73e8]/30 text-[#4285f4] flex items-center justify-center">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{selectedTicket.subject || 'Ticket Details'}</h3>
                  <p className="text-xs text-zinc-400">
                    Received {new Date(selectedTicket.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTicketModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-full hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar text-xs">
              {/* Contact Information Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-[#121316] border border-[#2c2f38]">
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block">Sender Name</span>
                  <span className="font-bold text-white text-sm">{selectedTicket.name}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block">Email Address</span>
                  <a href={`mailto:${selectedTicket.email}`} className="font-bold text-[#4285f4] hover:underline">
                    {selectedTicket.email}
                  </a>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block">Phone Number</span>
                  {selectedTicket.phone ? (
                    <a href={`tel:${selectedTicket.phone}`} className="font-bold text-emerald-400 hover:underline">
                      {selectedTicket.phone}
                    </a>
                  ) : (
                    <span className="text-zinc-500 italic">Not Provided</span>
                  )}
                </div>
              </div>

              {/* Message Body */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Inquiry / Message Content</span>
                <div className="p-4 rounded-xl bg-[#121316] border border-[#2c2f38] text-zinc-200 whitespace-pre-wrap font-sans leading-relaxed text-xs">
                  {selectedTicket.message}
                </div>
              </div>

              {/* Status Selector */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-[#121316] border border-[#2c2f38]">
                <span className="font-bold text-white">Current Ticket Status:</span>
                <div className="flex items-center space-x-2">
                  {['NEW', 'IN_PROGRESS', 'RESOLVED', 'ARCHIVED'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleUpdateTicketStatus(selectedTicket.id, st)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                        selectedTicket.status === st
                          ? 'bg-[#1a73e8] text-white shadow-sm'
                          : 'bg-[#1e2029] text-zinc-400 hover:text-white border border-[#2c2f38]'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Internal CRM Admin Notes */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Internal Admin Notes</span>
                <textarea
                  rows={3}
                  value={ticketNotes}
                  onChange={(e) => setTicketNotes(e.target.value)}
                  placeholder="Add internal notes or response tracking details here..."
                  className="w-full bg-[#121316] border border-[#2c2f38] rounded-xl p-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#1a73e8]"
                />
                <button
                  type="button"
                  onClick={handleSaveTicketNotes}
                  className="netcore-btn-primary py-1.5 px-4 text-xs font-bold"
                >
                  Save Internal Notes
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-[#2c2f38] bg-[#121316] flex justify-between items-center">
              <button
                type="button"
                onClick={() => handleDeleteTicket(selectedTicket.id)}
                className="text-rose-400 hover:text-rose-300 font-bold text-xs flex items-center space-x-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Ticket</span>
              </button>
              <button
                type="button"
                onClick={() => setIsTicketModalOpen(false)}
                className="netcore-btn-outline py-1.5 px-5 text-xs"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Dialog Modal (Z-Index 100 - Always On Top of All Drawers) */}
      {dialog.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-[#18181b] border border-zinc-800 rounded-xl p-5 shadow-2xl space-y-5">
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-white tracking-wide">
                {dialog.title}
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                {dialog.message}
              </p>
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              {dialog.isConfirm && (
                <button
                  onClick={() => {
                    setDialog(prev => ({ ...prev, isOpen: false }));
                    if (dialog.resolve) dialog.resolve(false);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-zinc-400 bg-transparent border border-zinc-800 hover:bg-zinc-800/50 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={() => {
                  setDialog(prev => ({ ...prev, isOpen: false }));
                  if (dialog.resolve) dialog.resolve(true);
                }}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  dialog.isConfirm 
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/10 font-semibold' 
                    : 'bg-white hover:bg-zinc-200 text-zinc-950 font-semibold'
                }`}
              >
                {dialog.isConfirm ? 'Proceed' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
