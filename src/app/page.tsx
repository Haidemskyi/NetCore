'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
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
  MessageSquare,
  Maximize2,
  ChevronDown,
  Plus,
  Edit,
  Trash2,
  X,
  FileSpreadsheet,
  RotateCcw,
  Upload,
  FileText,
  Download,
  File,
  Menu,
  CheckSquare
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
  Todo
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

  // Invite Admin states
  const [inviteForm, setInviteForm] = useState({ username: '', password: '' });
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteError, setInviteError] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const u = loginUsername.trim().toLowerCase();
    const p = loginPassword;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p }),
      });

      if (res.ok) {
        setIsLoggedIn(true);
        setCurrentUser(u);
        setLoginError('');
        if (typeof window !== 'undefined') {
          localStorage.setItem('netcore_session', u);
        }
      } else {
        const errData = await res.json();
        setLoginError(errData.error || 'Invalid login or password.');
      }
    } catch (err) {
      setLoginError('An error occurred during login.');
    }
  };

  const handleLogout = () => {
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

  // Tech modal tab: 'profile' | 'documents'
  const [techModalTab, setTechModalTab] = useState<'profile' | 'documents'>('profile');

  // Weekly spreadsheet importer states
  const [importRawText, setImportRawText] = useState('');
  const [parsedJobs, setParsedJobs] = useState<any[]>([]);
  const [perDiem, setPerDiem] = useState('0.00');
  const [carDeduction, setCarDeduction] = useState('0.00');
  const [hotelDeduction, setHotelDeduction] = useState('0.00');
  const [jobsTab, setJobsTab] = useState<'importer' | 'ledger'>('importer');
  const [importerTechFilter, setImporterTechFilter] = useState<string>('ALL');

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
  const [techForm, setTechForm] = useState({
    name: '',
    phone: '',
    email: '',
    status: 'ACTIVE' as TechStatus,
    workType: 'BURY' as WorkType,
    stateCode: 'TN',
    vehicleId: '',
    payoutType: 'PERCENTAGE' as PayoutType,
    payoutValue: '8',
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
      status: 'ACTIVE',
      workType: 'BURY',
      stateCode: selectedStateCode || 'TN',
      vehicleId: '',
      payoutType: 'PERCENTAGE',
      payoutValue: '8',
      notes: ''
    });
    setTechModalTab('profile');
    setIsTechModalOpen(true);
  };

  const handleEditTechClick = (tech: Technician) => {
    setEditingTech(tech);
    const techVehicle = customVehicles.find(v => v.technicianId === tech.id);
    const vehicleId = techVehicle ? techVehicle.id.toString() : '';

    setTechForm({
      name: tech.name,
      phone: tech.phone,
      email: tech.email,
      status: tech.status,
      workType: tech.workType,
      stateCode: tech.stateCode,
      vehicleId,
      payoutType: tech.payoutType ?? 'PERCENTAGE',
      payoutValue: (tech.payoutValue ?? 8).toString(),
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
          setCustomDocuments(prev => prev.filter(d => d.id !== docId));
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
    const lowerStr = techString.toLowerCase();
    
    // Match by ID digits (e.g. "6375 Dzmitry" -> 6375)
    const digitsMatch = techString.match(/\d+/);
    if (digitsMatch) {
      const idNum = parseInt(digitsMatch[0]);
      const foundById = customTechnicians.find(t => t.id === idNum);
      if (foundById) return foundById.id;
    }

    // Match by name substring (e.g., "Dzmitry" contains "Dzmitry" or vice-versa)
    const cleanName = techString.replace(/[\d\-\_\#\.\,\s]+/g, ' ').trim().toLowerCase();
    if (cleanName.length > 2) {
      const foundByName = customTechnicians.find(t => {
        const tName = t.name.toLowerCase();
        return tName.includes(cleanName) || cleanName.includes(tName);
      });
      if (foundByName) return foundByName.id;
    }
    
    return null;
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
    
    const lines = importRawText.split(/\r?\n/);
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
    
    // Default indices based on the user's check layout
    let dateIdx = 0;
    let techIdx = 1;
    let clientIdx = 2;
    let regionIdx = 3;
    let jobIdx = 4;
    let cityIdx = 7;
    let stateIdx = 8;
    let zipIdx = 9;
    let jobCodeIdx = 10;
    let descIdx = 11;
    let qtyIdx = 12;
    let amountIdx = 13;
    
    // Attempt to parse headers
    for (let rowIdx = 0; rowIdx < Math.min(2, lines.length); rowIdx++) {
      const rowCells = lines[rowIdx].split(delimiter).map(cleanCell);
      const isHeaderRow = rowCells.some(cell => 
        /date|tech|client|provider|job|city|state|zip|code|description|quantity|столбец/i.test(cell)
      );
      
      if (isHeaderRow) {
        headers = rowCells.map(h => h.toLowerCase());
        hasHeaderRow = true;
        
        const mapHeader = (regex: RegExp, defaultIdx: number, excludeRegex?: RegExp) => {
          const idx = headers.findIndex(h => regex.test(h) && !(excludeRegex && excludeRegex.test(h)));
          return idx !== -1 ? idx : defaultIdx;
        };
        
        const hasTechHeader = headers.some(h => /tech|employee|contractor/i.test(h));
        
        dateIdx = mapHeader(/date/i, dateIdx);
        techIdx = hasTechHeader ? mapHeader(/tech|employee|contractor/i, techIdx) : -1;
        clientIdx = mapHeader(/client|provider|vendor/i, clientIdx);
        regionIdx = mapHeader(/region/i, regionIdx);
        jobIdx = mapHeader(/job|work\s*order|order/i, jobIdx);
        cityIdx = mapHeader(/city/i, cityIdx);
        stateIdx = mapHeader(/state/i, stateIdx);
        zipIdx = mapHeader(/zip|postal/i, zipIdx);
        jobCodeIdx = mapHeader(/job\s*code|code/i, jobCodeIdx, /zip/i);
        descIdx = mapHeader(/description|desc/i, descIdx);
        qtyIdx = mapHeader(/quantity|qty|units/i, qtyIdx);
        amountIdx = mapHeader(/столбец|price|gross|amount|rate/i, amountIdx);
        break;
      }
    }
    
    const startRow = hasHeaderRow ? 1 : 0;
    
    for (let i = startRow; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const cells = lines[i].split(delimiter).map(cleanCell);
      if (cells.length < 2) continue;
      
      const dateVal = cells[dateIdx] || '';
      const techName = techIdx !== -1 ? (cells[techIdx] || '') : '';
      const descVal = cells[descIdx] || '';
      const descClean = descVal.trim().toLowerCase();
      
      // Skip empty rows, summary rows, or rows without date and tech
      if (
        (!dateVal.trim() && !techName.trim()) ||
        descClean === 'per diem' ||
        descClean === 'car' ||
        descClean === 'hotel' ||
        descClean === 'total' ||
        descClean === 'subtotal' ||
        cells.every(c => !c.trim())
      ) {
        continue;
      }
      
      // Regular Job row
      const finalDateVal = dateVal || new Date().toISOString().split('T')[0];
      const clientVal = cells[clientIdx] || 'Xfinity';
      const mappedProvider = clientVal.toLowerCase().includes('charter') ? 'Spectrum' : clientVal;
      
      const regionVal = cells[regionIdx] || '';
      const jobRef = cells[jobIdx] || `WO-${Math.floor(Math.random() * 900000 + 100000)}`;
      const cityVal = cells[cityIdx] || '';
      const stateVal = cells[stateIdx] || '';
      const zipVal = cells[zipIdx] || '';
      const jobCodeVal = cells[jobCodeIdx] || 'RDP';
      
      const qtyStr = cells[qtyIdx] ? cells[qtyIdx].replace(/[^\d]/g, '') : '';
      const qtyVal = parseInt(qtyStr) || 1;
      
      const priceRaw = cells[amountIdx] || '';
      const priceVal = parseLocaleFloat(priceRaw);
      
      const techId = matchTechnician(techName);
      let cutPct = 8;
      let profit = 0;
      let payout = 0;
      
      if (techId !== null) {
        const tech = customTechnicians.find(t => t.id === techId);
        if (tech) {
          cutPct = tech.payoutValue;
          if (tech.payoutType === 'PERCENTAGE') {
            profit = (priceVal * qtyVal) * (tech.payoutValue / 100);
          } else {
            profit = tech.payoutValue * qtyVal;
          }
          payout = Math.max(0, (priceVal * qtyVal) - profit);
        }
      } else {
        profit = (priceVal * qtyVal) * 0.08;
        payout = (priceVal * qtyVal) - profit;
      }
      
      tempParsedJobs.push({
        tempId: Math.random().toString(36).substring(2, 9),
        date: finalDateVal,
        techNameRaw: techName,
        matchedTechId: techId,
        provider: mappedProvider,
        regionCode: regionVal,
        jobRef,
        city: cityVal,
        stateCode: stateVal || 'TN',
        zipCode: zipVal,
        jobCode: jobCodeVal,
        description: descVal || 'Residential Installation',
        quantity: qtyVal,
        grossAmount: priceVal,
        companyCutPct: cutPct,
        companyProfit: Math.round(profit * 100) / 100,
        techPayout: Math.round(payout * 100) / 100,
        isValid: techId !== null
      });
    }
    
    if (tempParsedJobs.length === 0) {
      alert('Could not parse any valid jobs from the pasted text.');
      return;
    }
    
    setParsedJobs(tempParsedJobs);
  };

  const handleUpdateRowTech = (rowTempId: string, techId: number) => {
    const tech = customTechnicians.find(t => t.id === techId);
    if (!tech) return;
    
    setParsedJobs(prev => prev.map(job => {
      if (job.tempId === rowTempId) {
        const gross = job.grossAmount * job.quantity;
        let profit = 0;
        if (tech.payoutType === 'PERCENTAGE') {
          profit = gross * (tech.payoutValue / 100);
        } else {
          profit = tech.payoutValue * job.quantity;
        }
        const payout = Math.max(0, gross - profit);
        return {
          ...job,
          matchedTechId: techId,
          companyCutPct: tech.payoutValue,
          companyProfit: Math.round(profit * 100) / 100,
          techPayout: Math.round(payout * 100) / 100,
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
        const gross = updated.grossAmount * updated.quantity;
        let profit = 0;
        
        if (updated.matchedTechId) {
          const tech = customTechnicians.find(t => t.id === updated.matchedTechId);
          if (tech) {
            if (tech.payoutType === 'PERCENTAGE') {
              profit = gross * (tech.payoutValue / 100);
            } else {
              profit = tech.payoutValue * updated.quantity;
            }
          }
        } else {
          profit = gross * 0.08;
        }
        
        updated.companyProfit = Math.round(profit * 100) / 100;
        updated.techPayout = Math.max(0, Math.round((gross - profit) * 100) / 100);
        return updated;
      }
      return job;
    }));
  };

  const handleBulkSetState = (newStateCode: string) => {
    if (!newStateCode) return;
    setParsedJobs(prev => prev.map(job => {
      const updated = { ...job, stateCode: newStateCode };
      // Also update profit and payout in case technician rates vary or anything,
      // although changing state code only overrides the job's stateCode property.
      return updated;
    }));
  };

  const handleBulkSetEmployee = (techIdStr: string) => {
    if (!techIdStr) return;
    const techId = parseInt(techIdStr);
    const tech = customTechnicians.find(t => t.id === techId);
    if (!tech) return;

    setParsedJobs(prev => prev.map(job => {
      const gross = job.grossAmount * job.quantity;
      let profit = 0;
      if (tech.payoutType === 'PERCENTAGE') {
        profit = gross * (tech.payoutValue / 100);
      } else {
        profit = tech.payoutValue * job.quantity;
      }
      const payout = Math.max(0, gross - profit);
      return {
        ...job,
        matchedTechId: techId,
        companyCutPct: tech.payoutValue,
        companyProfit: Math.round(profit * 100) / 100,
        techPayout: Math.round(payout * 100) / 100,
        isValid: true
      };
    }));
  };

  const handleQuickCreateTech = (rawName: string, stateCode: string) => {
    const cleanName = rawName.replace(/[\d\-\_\#\.\,\s]+/g, ' ').trim();
    const newId = Math.max(0, ...customTechnicians.map(t => t.id)) + 1;
    const newTech: Technician = {
      id: newId,
      name: cleanName || `Tech #${newId}`,
      phone: '+1 (555) 555-0100',
      email: `${(cleanName || 'tech').toLowerCase().replace(/\s+/g, '')}@netcoretelecom.com`,
      status: 'ACTIVE',
      workType: 'BURY',
      stateId: 1, // TN
      stateCode: stateCode || 'TN',
      payoutType: 'PERCENTAGE',
      payoutValue: 8
    };
    
    const updatedTechs = [...customTechnicians, newTech];
    setCustomTechnicians(updatedTechs);
    localStorage.setItem('netcore_technicians', JSON.stringify(updatedTechs));
    
    setParsedJobs(prev => prev.map(job => {
      if (job.techNameRaw === rawName) {
        const gross = job.grossAmount * job.quantity;
        const profit = gross * 0.08;
        const payout = gross - profit;
        return {
          ...job,
          matchedTechId: newId,
          companyCutPct: 8,
          companyProfit: Math.round(profit * 100) / 100,
          techPayout: Math.round(payout * 100) / 100,
          isValid: true
        };
      }
      return job;
    }));
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
      const netPayout = totalTechPayout + pd + car + hotel;
      
      csvContent += `,,,,,,,,,,Per Diem,,${pd.toFixed(2)}\n`;
      csvContent += `,,,,,,,,,,Car Deduction,,${car.toFixed(2)}\n`;
      csvContent += `,,,,,,,,,,Hotel Deduction,,${hotel.toFixed(2)}\n`;
      csvContent += `,,,,,,,,,,Net Technician Payout,,${netPayout.toFixed(2)}\n`;
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `NetCore_Payout_${techName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCommitParsedJobs = async () => {
    const hasUnmatched = parsedJobs.some(j => !j.matchedTechId);
    if (hasUnmatched) {
      if (!await customConfirm('There are unmatched technicians in the list. They will import with a default 8% company cut. Do you want to proceed?', 'Unmatched Technicians')) {
        return;
      }
    }
    
    try {
      const res = await fetch('/api/jobs/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobs: parsedJobs }),
      });

      if (res.ok) {
        const data = await res.json();
        setCustomJobLogs(prev => [...data.jobs, ...prev]);
        await customAlert(`Successfully imported ${data.count} jobs to the ledger database!`, 'Import Success');
        setParsedJobs([]);
        setImportRawText('');
        setJobsTab('ledger');
      } else {
        const errData = await res.json();
        await customAlert(errData.error || 'Failed to import bulk jobs.', 'Error');
      }
    } catch (err) {
      console.error('Error committing bulk jobs:', err);
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

  const handleUpdateState = async (requiredTechs: number, requirements: string, companyPerDiem: number, employeePerDiem: number) => {
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
          employeePerDiem
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
    const providersSet = new Set<string>();
    customRatePlans.forEach(rp => providersSet.add(rp.provider));
    return Array.from(providersSet);
  }, [customRatePlans]);

  // Filter job logs by global search query
  const filteredJobLogs = useMemo(() => {
    if (!globalSearchQuery) return customJobLogs;
    const q = globalSearchQuery.toLowerCase();
    return customJobLogs.filter(j => 
      j.technicianName.toLowerCase().includes(q) ||
      j.cityName.toLowerCase().includes(q) ||
      j.provider.toLowerCase().includes(q) ||
      j.ratePlanCode.toLowerCase().includes(q) ||
      j.id.toString().includes(q)
    );
  }, [globalSearchQuery, customJobLogs]);

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
      ? `NetCore CRM - Company Master Rates (${providerFilter ? providerFilter + ' - ' : ''}${stateName})`
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

  // Compute stats based on active state selection
  const stats = useMemo(() => {
    const filteredJobs = selectedStateCode 
      ? customJobLogs.filter(j => j.stateCode === selectedStateCode)
      : customJobLogs;

    const totalRevenue = filteredJobs.reduce((acc, j) => acc + j.companyRevenue, 0);
    const totalPayout = filteredJobs.reduce((acc, j) => acc + j.techPayout, 0);
    const totalProfit = filteredJobs.reduce((acc, j) => acc + j.companyProfit, 0);
    const margin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
      revenue: totalRevenue,
      payout: totalPayout,
      profit: totalProfit,
      margin: margin,
      jobCount: filteredJobs.length,
    };
  }, [customJobLogs, selectedStateCode]);

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
    const curRevenue = currentJobs.reduce((acc, j) => acc + j.companyRevenue, 0);
    const prevRevenue = previousJobs.reduce((acc, j) => acc + j.companyRevenue, 0);
    let revenueTrend = 0;
    if (prevRevenue > 0) {
      revenueTrend = ((curRevenue - prevRevenue) / prevRevenue) * 100;
    } else if (curRevenue > 0) {
      revenueTrend = 100;
    } else {
      revenueTrend = 0;
    }

    // Net Profit Trend
    const curProfit = currentJobs.reduce((acc, j) => acc + j.companyProfit, 0);
    const prevProfit = previousJobs.reduce((acc, j) => acc + j.companyProfit, 0);
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
  }, [customJobLogs, customTechnicians, selectedStateCode]);

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
            <h1 className="text-2xl font-black tracking-tight text-white">NetCore CRM</h1>
            <p className="text-xs text-zinc-400 font-semibold">Admin Sign-In Portal</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
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
              className="w-full bg-white text-zinc-950 text-xs font-bold py-2.5 rounded-md hover:bg-zinc-200 transition-all shadow-md shadow-white/5 cursor-pointer font-semibold"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#09090b] text-slate-100 font-sans overflow-hidden relative">
      {/* Sidebar Navigation */}
      <Sidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection} 
        selectedTechId={selectedTechId}
        onSelectTechnician={handleSelectTechnician}
        technicians={customTechnicians}
        currentUser={currentUser}
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
          <span className="text-white font-extrabold text-sm tracking-wide">NetCore CRM</span>
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
                      setJobsTab('importer');
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
                              parseFloat(editEmployeePerDiem) || 0
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

                          <div className="grid grid-cols-2 gap-3">
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

                      {/* Daily Tasks for this day */}
                      <div className="bg-[#09090b] p-3 rounded-lg border border-zinc-800 mt-4 text-[11px]">
                        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2 mb-2 font-bold text-slate-200">
                          <div className="flex items-center space-x-1.5">
                            <CheckSquare className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                            <span>Daily Tasks (June {currentDay}, 2026)</span>
                          </div>
                          <span className="text-[9px] bg-zinc-800 text-zinc-400 px-1 py-0.2 rounded font-mono">
                            {selectedDayTodos.filter(t => !t.completed).length} pending
                          </span>
                        </div>

                        {selectedDayTodos.length === 0 ? (
                          <p className="text-zinc-500 italic text-[10px] py-1.5">No tasks scheduled for this day.</p>
                        ) : (
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-0.5 custom-scrollbar">
                            {selectedDayTodos.map(todo => (
                              <div key={todo.id} className="flex flex-col bg-zinc-900/60 p-2 rounded border border-zinc-800/40 gap-1 font-sans">
                                <div className="flex items-center justify-between">
                                  <label className="flex items-center space-x-2 flex-1 cursor-pointer select-none">
                                    <input 
                                      type="checkbox"
                                      checked={todo.completed}
                                      onChange={() => handleToggleTodo(todo.id)}
                                      className="w-3 h-3 rounded bg-[#09090b] border-zinc-700 text-blue-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                                    />
                                    <span className={`text-[10px] font-semibold ${todo.completed ? 'line-through text-zinc-500' : 'text-zinc-300'}`}>
                                      {todo.text}
                                    </span>
                                  </label>
                                  <div className="flex items-center space-x-1.5 shrink-0">
                                    {todo.priority && (
                                      <span className={`text-[8px] font-extrabold uppercase px-1 rounded-sm border ${
                                        todo.priority === 'HIGH' 
                                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/25' 
                                          : todo.priority === 'MEDIUM' 
                                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/25' 
                                            : 'bg-zinc-800 text-zinc-500 border-zinc-700/60'
                                      }`}>
                                        {todo.priority === 'HIGH' ? 'Важно' : todo.priority === 'MEDIUM' ? 'Средний' : 'Низкий'}
                                      </span>
                                    )}
                                    <span className="text-[8px] text-zinc-500 font-semibold uppercase tracking-wider bg-zinc-800/30 px-1 py-0.2 rounded border border-zinc-800">
                                      {todo.creator}
                                    </span>
                                  </div>
                                </div>
                                {todo.description && (
                                  <p className={`text-[9px] pl-5 leading-normal ${todo.completed ? 'line-through text-zinc-600' : 'text-zinc-400'}`}>
                                    {todo.description}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Inline Creator */}
                        <div className="flex flex-col gap-1.5 mt-3 pt-2.5 border-t border-zinc-800/60">
                          <input 
                            type="text"
                            placeholder="New task title..."
                            value={inlineTodoText}
                            onChange={(e) => setInlineTodoText(e.target.value)}
                            className="w-full bg-[#18181b] border border-zinc-800 rounded px-2.5 py-1 text-[10px] text-zinc-200 focus:outline-none focus:border-blue-500 placeholder-zinc-600 font-semibold"
                          />
                          <div className="flex gap-1.5">
                            <select
                              value={inlineTodoPriority}
                              onChange={(e) => setInlineTodoPriority(e.target.value as 'HIGH' | 'MEDIUM' | 'LOW')}
                              className="bg-[#18181b] border border-zinc-800 rounded px-1.5 py-1 text-[10px] text-zinc-300 focus:outline-none focus:border-blue-500 font-semibold shrink-0 cursor-pointer"
                            >
                              <option value="LOW">Низкий</option>
                              <option value="MEDIUM">Средний</option>
                              <option value="HIGH">Важно</option>
                            </select>
                            <input 
                              type="text"
                              placeholder="Task description (optional)..."
                              value={inlineTodoDesc}
                              onChange={(e) => setInlineTodoDesc(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleAddInlineTodo();
                                }
                              }}
                              className="flex-1 bg-[#18181b] border border-zinc-800 rounded px-2 py-1 text-[10px] text-zinc-200 focus:outline-none focus:border-blue-500 placeholder-zinc-600 font-medium"
                            />
                            <button
                              onClick={handleAddInlineTodo}
                              className="bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-[9px] font-bold px-2.5 py-1 rounded transition-all cursor-pointer font-semibold uppercase tracking-wider"
                            >
                              Add
                            </button>
                          </div>
                        </div>
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
                    const revenue = stateJobs.reduce((sum, j) => sum + j.companyRevenue, 0);
                    const profit = stateJobs.reduce((sum, j) => sum + j.companyProfit, 0);
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
                  <h3 className="text-base font-bold text-slate-100 tracking-wide">
                    Jobs & Payouts Ledger
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Manage dispatched jobs, import weekly Friday sheets, and process contractor payouts.
                  </p>
                </div>
                
                {/* Tabs Selector */}
                <div className="flex bg-[#09090b] p-1 rounded-lg border border-[#27272a]">
                  <button
                    onClick={() => setJobsTab('importer')}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      jobsTab === 'importer'
                        ? 'bg-[#3b82f6] text-white'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Weekly Importer
                  </button>
                  <button
                    onClick={() => setJobsTab('ledger')}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      jobsTab === 'ledger'
                        ? 'bg-[#3b82f6] text-white'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Jobs Log Ledger
                  </button>
                </div>
              </div>

              {jobsTab === 'importer' ? (
                /* Weekly Importer Tab */
                <div className="space-y-6">
                  {parsedJobs.length === 0 ? (
                    /* Input State */
                    <div className="space-y-4">
                      <div className="bg-[#09090b] rounded-xl p-8 border-2 border-dashed border-[#27272a] flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-12 h-12 rounded-full bg-zinc-800/30 flex items-center justify-center text-zinc-100">
                          <FileSpreadsheet className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-zinc-200">Upload Payout Spreadsheet</p>
                          <p className="text-xs text-zinc-500 max-w-md">
                            Drag & drop a CSV file containing check details, or select from your device.
                          </p>
                        </div>
                        <div className="relative">
                          <input
                            type="file"
                            accept=".csv,.txt,.tsv"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  const text = event.target?.result as string;
                                  if (text) {
                                    setImportRawText(text);
                                    // Parse immediately using the text
                                    const lines = text.split(/\r?\n/);
                                    if (lines.length > 0) {
                                      // Trigger parse helper directly by updating state and using local variable
                                      // We can directly call standard handler if we set it in state first, but let's parse it using local method or trigger button click
                                    }
                                  }
                                };
                                reader.readAsText(file);
                              }
                            }}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full"
                          />
                          <button className="bg-[#1e293b] border border-[#27272a] text-slate-300 hover:bg-[#28354b] text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer">
                            Browse Files
                          </button>
                        </div>
                      </div>

                      <div className="bg-[#18181b] rounded-xl p-5 border border-zinc-800 space-y-3">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold text-slate-300">
                            Or Paste Raw Cell Data (from Excel / Google Sheets)
                          </label>
                          {importRawText.trim() && (
                            <button
                              onClick={() => setImportRawText('')}
                              className="text-[10px] text-red-400 hover:underline cursor-pointer"
                            >
                              Clear Text
                            </button>
                          )}
                        </div>
                        <textarea
                          rows={8}
                          value={importRawText}
                          onChange={(e) => setImportRawText(e.target.value)}
                          placeholder="Date&#9;Tech&#9;Client&#9;Job&#9;City&#9;State&#9;Job Code&#9;Quantity&#9;Столбец1&#10;04/13/2026&#9;6375 Dzmitry&#9;Charter&#9;409009&#9;ATHENS&#9;TN&#9;RFSP&#9;1&#9;56.98 $"
                          className="w-full bg-[#09090b] border border-[#27272a] rounded-xl p-4 text-xs font-mono text-slate-300 focus:outline-none focus:border-[#3b82f6] placeholder-slate-600 custom-scrollbar"
                        />
                        <div className="flex justify-end">
                          <button
                            onClick={handleParseSheet}
                            disabled={!importRawText.trim()}
                            className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200 disabled:opacity-40 disabled:hover:bg-zinc-100 text-xs font-bold px-5 py-2.5 rounded-lg shadow-lg shadow-zinc-500/5 transition-all cursor-pointer"
                          >
                            Parse & Process Spreadsheet
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Review & Edit State */
                    <div className="space-y-6">
                      
                      {/* Control Panel */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#09090b] p-4 rounded-xl border border-[#27272a]">
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
                            <span className="text-[10px] uppercase font-bold text-zinc-500">Set All Employees:</span>
                            <select
                              value=""
                              onChange={(e) => {
                                handleBulkSetEmployee(e.target.value);
                                e.target.value = "";
                              }}
                              className="bg-transparent border-none text-zinc-200 focus:outline-none cursor-pointer text-xs font-semibold"
                            >
                              <option value="" className="bg-[#18181b]">-- Choose Employee --</option>
                              {customTechnicians.map(t => (
                                <option key={t.id} value={t.id.toString()} className="bg-[#18181b]">{t.name}</option>
                              ))}
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
                            onClick={() => handleExportProcessedCSV(importerTechFilter === 'ALL' || importerTechFilter === 'UNMATCHED' ? null : parseInt(importerTechFilter))}
                            className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-lg shadow-zinc-500/5 transition-all cursor-pointer flex items-center"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />
                            Export {importerTechFilter === 'ALL' || importerTechFilter === 'UNMATCHED' ? 'All Rows' : 'Employee Payout'} CSV
                          </button>

                          <button
                            onClick={() => {
                              setParsedJobs([]);
                              setImportRawText('');
                              setImporterTechFilter('ALL');
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

                      {/* Preview Table */}
                      <div className="bg-[#18181b] border border-zinc-800/60 rounded-xl overflow-hidden shadow-inner">
                        <div className="overflow-x-auto custom-scrollbar max-h-[400px]">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead className="bg-[#09090b] sticky top-0 z-10 border-b border-zinc-800">
                              <tr className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                                <th className="py-3 px-3">Date</th>
                                <th className="py-3 px-3">Raw Name</th>
                                <th className="py-3 px-3">Matched Employee</th>
                                <th className="py-3 px-3">Provider</th>
                                <th className="py-3 px-3">Code</th>
                                <th className="py-3 px-3">City</th>
                                <th className="py-3 px-3">State</th>
                                <th className="py-3 px-3 text-center">Qty</th>
                                <th className="py-3 px-3 text-right">Gross Rate</th>
                                <th className="py-3 px-3 text-center">Cut</th>
                                <th className="py-3 px-3 text-right text-zinc-300">Co Profit</th>
                                <th className="py-3 px-3 text-right text-zinc-300">Tech Pay</th>
                                <th className="py-3 px-3 text-center"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/40 text-slate-300 font-medium">
                              {filteredParsedJobs.map((job) => (
                                <tr key={job.tempId} className="hover:bg-slate-800/10 transition-colors">
                                  
                                  {/* Date Input */}
                                  <td className="py-2.5 px-3">
                                    <input
                                      type="text"
                                      value={job.date}
                                      onChange={(e) => handleUpdateRowValue(job.tempId, 'date', e.target.value)}
                                      className="bg-[#09090b] border border-[#27272a] rounded px-1.5 py-0.5 text-xs text-zinc-200 focus:outline-none w-20 font-mono"
                                    />
                                  </td>
                                  
                                  {/* Raw Name */}
                                  <td className="py-2.5 px-3 text-zinc-400 font-semibold truncate max-w-[120px]" title={job.techNameRaw}>
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
                                          title="Quick Create Technician with this name"
                                          className="bg-zinc-800/30 hover:bg-zinc-800/80 text-zinc-300 font-bold px-1.5 py-0.5 rounded border border-zinc-700/60 text-[9px] shrink-0 cursor-pointer"
                                        >
                                          + Create
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                  
                                  {/* Provider Select */}
                                  <td className="py-2.5 px-3">
                                    <select
                                      value={job.provider}
                                      onChange={(e) => handleUpdateRowValue(job.tempId, 'provider', e.target.value)}
                                      className="bg-[#09090b] border border-[#27272a] rounded px-1 py-0.5 text-xs text-zinc-200 focus:outline-none w-20"
                                    >
                                      <option value="Xfinity">Xfinity</option>
                                      <option value="Spectrum">Spectrum</option>
                                      <option value="Cox">Cox</option>
                                    </select>
                                  </td>
                                  
                                  {/* Job Code */}
                                  <td className="py-2.5 px-3">
                                    <input
                                      type="text"
                                      value={job.jobCode}
                                      onChange={(e) => handleUpdateRowValue(job.tempId, 'jobCode', e.target.value)}
                                      className="bg-[#09090b] border border-[#27272a] rounded px-1.5 py-0.5 text-xs text-zinc-200 focus:outline-none w-14 font-mono text-center"
                                    />
                                  </td>

                                  {/* City */}
                                  <td className="py-2.5 px-3">
                                    <input
                                      type="text"
                                      value={job.city}
                                      onChange={(e) => handleUpdateRowValue(job.tempId, 'city', e.target.value)}
                                      className="bg-[#09090b] border border-[#27272a] rounded px-1.5 py-0.5 text-xs text-zinc-200 focus:outline-none w-24"
                                    />
                                  </td>

                                  {/* State */}
                                  <td className="py-2.5 px-3">
                                    <input
                                      type="text"
                                      value={job.stateCode}
                                      onChange={(e) => handleUpdateRowValue(job.tempId, 'stateCode', e.target.value.toUpperCase())}
                                      maxLength={2}
                                      className="bg-[#09090b] border border-[#27272a] rounded px-1.5 py-0.5 text-xs text-zinc-200 focus:outline-none w-8 text-center font-bold font-mono"
                                    />
                                  </td>

                                  {/* Quantity */}
                                  <td className="py-2.5 px-3 text-center">
                                    <input
                                      type="number"
                                      value={job.quantity}
                                      onChange={(e) => handleUpdateRowValue(job.tempId, 'quantity', parseInt(e.target.value) || 1)}
                                      min={1}
                                      className="bg-[#09090b] border border-[#27272a] rounded px-1.5 py-0.5 text-xs text-zinc-200 focus:outline-none w-10 text-center font-mono"
                                    />
                                  </td>

                                  {/* Gross Price */}
                                  <td className="py-2.5 px-3 text-right">
                                    <div className="relative inline-block">
                                      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-zinc-500 font-mono">$</span>
                                      <input
                                        type="number"
                                        value={job.grossAmount}
                                        step="0.01"
                                        onChange={(e) => handleUpdateRowValue(job.tempId, 'grossAmount', parseFloat(e.target.value) || 0)}
                                        className="bg-[#09090b] border border-[#27272a] rounded pl-4 pr-1.5 py-0.5 text-xs text-zinc-200 focus:outline-none w-18 text-right font-mono"
                                      />
                                    </div>
                                  </td>

                                  {/* Company Cut */}
                                  <td className="py-2.5 px-3 text-center">
                                    {job.matchedTechId ? (
                                      (() => {
                                        const t = customTechnicians.find(tech => tech.id === job.matchedTechId);
                                        return t ? (
                                          <span className="text-[10px] bg-slate-800 text-slate-300 font-bold px-1.5 py-0.5 rounded border border-zinc-700">
                                            {t.payoutType === 'PERCENTAGE' ? `${t.payoutValue}%` : `$${t.payoutValue}`}
                                          </span>
                                        ) : null;
                                      })()
                                    ) : (
                                      <span className="text-[10px] bg-red-500/10 text-red-400 font-bold px-1.5 py-0.5 rounded border border-red-500/20">
                                        8%
                                      </span>
                                    )}
                                  </td>

                                  {/* Company Profit */}
                                  <td className="py-2.5 px-3 text-right font-mono font-bold text-zinc-300">
                                    ${job.companyProfit.toFixed(2)}
                                  </td>

                                  {/* Tech Payout */}
                                  <td className="py-2.5 px-3 text-right font-mono font-bold text-zinc-300">
                                    ${job.techPayout.toFixed(2)}
                                  </td>

                                  {/* Remove row */}
                                  <td className="py-2.5 px-3 text-center">
                                    <button
                                      onClick={() => setParsedJobs(prev => prev.filter(p => p.tempId !== job.tempId))}
                                      className="text-red-500 hover:text-red-400 cursor-pointer p-1"
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

                      {/* Adjustments and Totals */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Adjustments Panel */}
                        {importerTechFilter !== 'ALL' && importerTechFilter !== 'UNMATCHED' ? (
                          <div className="bg-[#09090b] rounded-xl p-5 border border-[#27272a] space-y-4">
                            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-zinc-800 pb-2">
                              Tech Adjustments (Deductions / Per Diem)
                            </h4>
                            
                            <div className="grid grid-cols-3 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-zinc-500">Per Diem (+)</label>
                                <div className="relative">
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-600 font-mono">$</span>
                                  <input
                                    type="number"
                                    value={perDiem}
                                    onChange={(e) => setPerDiem(e.target.value)}
                                    className="w-full bg-[#18181b] border border-zinc-800 rounded pl-5 pr-2 py-1 text-xs text-zinc-200 focus:outline-none font-mono"
                                  />
                                </div>
                              </div>
                              
                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-zinc-500">Car Ded. (-)</label>
                                <div className="relative">
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-600 font-mono">$</span>
                                  <input
                                    type="number"
                                    value={carDeduction}
                                    onChange={(e) => setCarDeduction(e.target.value)}
                                    className="w-full bg-[#18181b] border border-zinc-800 rounded pl-5 pr-2 py-1 text-xs text-zinc-200 focus:outline-none font-mono"
                                  />
                                </div>
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-zinc-500">Hotel Ded. (-)</label>
                                <div className="relative">
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-600 font-mono">$</span>
                                  <input
                                    type="number"
                                    value={hotelDeduction}
                                    onChange={(e) => setHotelDeduction(e.target.value)}
                                    className="w-full bg-[#18181b] border border-zinc-800 rounded pl-5 pr-2 py-1 text-xs text-zinc-200 focus:outline-none font-mono"
                                  />
                                </div>
                              </div>
                            </div>
                            
                            <p className="text-[10px] text-zinc-500 leading-relaxed italic">
                              * Deductions (Car, Hotel) will be subtracted from the employee's payout.
                            </p>
                          </div>
                        ) : (
                          <div className="bg-[#09090b] rounded-xl p-5 border border-[#27272a] flex flex-col justify-center items-center text-center text-zinc-500 text-xs">
                            <Info className="w-5 h-5 mb-2 text-slate-600" />
                            <p>Select a specific technician from the "Filter Employee" dropdown above to manage adjustments (Per Diem, Car, Hotel).</p>
                          </div>
                        )}

                        {/* Totals Panel */}
                        <div className="bg-[#09090b] rounded-xl p-5 border border-[#27272a] space-y-4">
                          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-zinc-800 pb-2">
                            Summary calculation
                          </h4>
                          
                          {(() => {
                            const selectedTechId = importerTechFilter === 'ALL' || importerTechFilter === 'UNMATCHED' ? null : parseInt(importerTechFilter);
                            const activeJobs = selectedTechId 
                              ? parsedJobs.filter(j => j.matchedTechId === selectedTechId)
                              : parsedJobs;
                              
                            const totalGross = activeJobs.reduce((acc, j) => acc + (j.grossAmount * j.quantity), 0);
                            const totalProfit = activeJobs.reduce((acc, j) => acc + j.companyProfit, 0);
                            const totalTechSub = activeJobs.reduce((acc, j) => acc + j.techPayout, 0);
                            
                            const pdVal = selectedTechId ? (parseFloat(perDiem) || 0) : 0;
                            const carVal = selectedTechId ? (parseFloat(carDeduction) || 0) : 0;
                            const hotelVal = selectedTechId ? (parseFloat(hotelDeduction) || 0) : 0;
                            const netPayout = totalTechSub + pdVal + carVal + hotelVal;

                            return (
                              <div className="space-y-2.5 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-zinc-400">Total Invoice Rev (Gross):</span>
                                  <span className="font-bold text-zinc-200 font-mono">${totalGross.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-zinc-400">Total Company Profit (Cut):</span>
                                  <span className="font-bold text-zinc-300 font-mono">${totalProfit.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between border-b border-zinc-800 pb-2">
                                  <span className="text-zinc-400">Tech Payout Subtotal:</span>
                                  <span className="font-bold text-zinc-300 font-mono">${totalTechSub.toFixed(2)}</span>
                                </div>
                                
                                {selectedTechId && (
                                  <>
                                    <div className="flex justify-between text-[11px] text-zinc-400">
                                      <span>Adjustments (Per Diem + Car + Hotel):</span>
                                      <span className={`font-semibold font-mono ${(pdVal + carVal + hotelVal) >= 0 ? 'text-zinc-200' : 'text-red-400'}`}>
                                        ${(pdVal + carVal + hotelVal).toFixed(2)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between border-t border-zinc-800 pt-2 text-sm">
                                      <span className="font-extrabold text-slate-100">Net Employee Payout:</span>
                                      <span className="font-black text-zinc-100 font-mono">${netPayout.toFixed(2)}</span>
                                    </div>
                                  </>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Commit bar */}
                      <div className="flex justify-between items-center pt-4 border-t border-zinc-800">
                        <p className="text-xs text-zinc-500">
                          Verify employee matching. Clicking commit imports all rows into system database.
                        </p>
                        
                        <button
                          onClick={handleCommitParsedJobs}
                          className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200 font-extrabold text-xs px-6 py-2.5 rounded-lg shadow-lg shadow-zinc-500/20 transition-all cursor-pointer"
                        >
                          Approve & Commit to Ledger
                        </button>
                      </div>

                    </div>
                  )}
                </div>
              ) : (
                /* Dispatched Jobs Log Tab */
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <p className="text-xs text-zinc-400">
                      Logged cable/fiber jobs, contractor payouts, and retained company profit.
                    </p>
                    <button
                      onClick={() => handleAddJobClick()}
                      className="bg-zinc-100 text-zinc-950 text-xs font-bold px-4 py-2 rounded-md hover:bg-zinc-200 shadow-lg shadow-zinc-500/5 transition-all flex items-center shrink-0 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Record New Job
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                          <th className="py-3 px-4">Job ID</th>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Technician</th>
                          <th className="py-3 px-4">Provider</th>
                          <th className="py-3 px-4">Job Code</th>
                          <th className="py-3 px-4">City</th>
                          <th className="py-3 px-4 text-right">Invoice Rev</th>
                          <th className="py-3 px-4 text-right">Tech Payout</th>
                          <th className="py-3 px-4 text-right text-zinc-300">Net Profit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40 text-slate-300">
                        {filteredJobLogs.map((job) => (
                          <tr key={job.id} className="hover:bg-slate-800/20 transition-colors">
                            <td className="py-3 px-4 font-mono text-zinc-500">#{job.id}</td>
                            <td className="py-3 px-4 font-mono">{job.date}</td>
                            <td className="py-3 px-4 font-bold text-zinc-200">{job.technicianName}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                job.provider === 'Xfinity' 
                                  ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                                  : 'bg-zinc-800/30 text-zinc-300 border border-blue-500/20'
                              }`}>
                                {job.provider}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono font-semibold">{job.ratePlanCode}</td>
                            <td className="py-3 px-4">
                              <span className="flex items-center text-zinc-400">
                                <MapPin className="w-3.5 h-3.5 text-slate-600 mr-1 shrink-0" />
                                {job.cityName}, {job.stateCode}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-semibold">${job.companyRevenue.toFixed(2)}</td>
                            <td className="py-3 px-4 text-right font-mono text-zinc-300">${job.techPayout.toFixed(2)}</td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-zinc-300">${job.companyProfit.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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

                  {/* Bulk Edit State Rates */}
                  <button 
                    onClick={() => setIsBulkStateEditOpen(true)}
                    className="bg-zinc-800 text-white text-xs font-bold px-3.5 py-2 rounded-md hover:bg-zinc-700 shadow-lg shadow-zinc-500/5 transition-all flex items-center font-semibold cursor-pointer"
                    title="Bulk edit all rate codes for the active state"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1" /> Bulk Edit State Rates
                  </button>

                  <button 
                    onClick={handleAddRateClick}
                    className="bg-zinc-100 text-zinc-950 text-xs font-bold px-3.5 py-2 rounded-md hover:bg-zinc-200 shadow-lg shadow-zinc-500/5 transition-all flex items-center font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Rate Plan
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

                  <div className="flex items-center space-x-3 shrink-0">
                    <button 
                      onClick={() => handleExportPDF('company')}
                      className="bg-[#27272a] text-slate-300 hover:text-white border border-[#27272a] text-xs font-semibold px-3 py-1.5 rounded hover:bg-slate-800 transition-all flex items-center shadow-md shadow-slate-900/10 cursor-pointer"
                      title="Download full grid including company rates and margins"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-zinc-300" /> Company Rates (PDF)
                    </button>
                    <button 
                      onClick={() => handleExportPDF('employee')}
                      className="bg-[#10b981]/10 text-zinc-300 hover:text-white border border-zinc-800/50 text-xs font-semibold px-3 py-1.5 rounded hover:bg-zinc-800 transition-all flex items-center shadow-md shadow-zinc-500/5 cursor-pointer"
                      title="Download clean contractor rate sheet containing only payout rates"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-zinc-300" /> Employee Rates (PDF)
                    </button>
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
                                  <td colSpan={7} className="py-12 text-center text-zinc-500 italic">
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
                                        ? 'bg-zinc-800/30 text-zinc-300 border-emerald-500/20'
                                        : tech.status === 'SUSPENDED'
                                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                        : 'bg-slate-500/10 text-zinc-400 border-slate-500/20'
                                    }`}>
                                      {tech.status}
                                    </span>
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
                                        ? 'bg-zinc-800/30 text-zinc-300 border-emerald-500/20'
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

          {/* Section 5: Task Manager Panel */}
          {activeSection === 'todo' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Header Title Block */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div>
                  <h1 className="text-xl font-bold text-slate-100 tracking-wide">
                    Task Manager
                  </h1>
                  <p className="text-xs text-zinc-400 mt-1">
                    Manage admin tasks, schedule milestones on the calendar, and track team productivity.
                  </p>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {/* Total Tasks */}
                <div className="bg-[#18181b] rounded-xl p-5 shadow-sm border border-zinc-800/40">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Total Tasks</span>
                  <h3 className="text-2xl font-black text-slate-100 font-mono tracking-tight mt-1">
                    {todoStats.total}
                  </h3>
                </div>
                {/* Pending Tasks */}
                <div className="bg-[#18181b] rounded-xl p-5 shadow-sm border border-zinc-800/40">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider text-rose-400">Pending Tasks</span>
                  <h3 className="text-2xl font-black text-slate-100 font-mono tracking-tight mt-1">
                    {todoStats.pending}
                  </h3>
                </div>
                {/* Completed Tasks */}
                <div className="bg-[#18181b] rounded-xl p-5 shadow-sm border border-zinc-800/40">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider text-emerald-400">Completed Tasks</span>
                  <h3 className="text-2xl font-black text-slate-100 font-mono tracking-tight mt-1">
                    {todoStats.completed}
                  </h3>
                </div>
                {/* Completion Rate */}
                <div className="bg-[#18181b] rounded-xl p-5 shadow-sm border border-zinc-800/40">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider text-blue-400">Completion Rate</span>
                  <h3 className="text-2xl font-black text-slate-100 font-mono tracking-tight mt-1">
                    {todoStats.completionRate.toFixed(0)}%
                  </h3>
                </div>
              </div>

              {/* Task Creator Form & Filter Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Task Creator */}
                <div className="lg:col-span-1 bg-[#18181b] rounded-xl p-6 border border-zinc-800/40 space-y-4">
                  <h3 className="text-sm font-bold text-slate-100 tracking-wide border-b border-zinc-800 pb-3 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-blue-400" /> Create New Task
                  </h3>
                  
                  <form onSubmit={handleCreateTask} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-zinc-400">Task Title *</label>
                      <input 
                        type="text"
                        required
                        placeholder="e.g. Audit Spectrum CSV imports"
                        value={taskFormText}
                        onChange={(e) => setTaskFormText(e.target.value)}
                        className="w-full bg-[#09090b] border border-[#27272a] rounded-md px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#3b82f6] placeholder-slate-600 font-semibold"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-zinc-400">Task Description</label>
                      <textarea
                        rows={3}
                        placeholder="Provide details about this task..."
                        value={taskFormDesc}
                        onChange={(e) => setTaskFormDesc(e.target.value)}
                        className="w-full bg-[#09090b] border border-[#27272a] rounded-md px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#3b82f6] placeholder-slate-600 font-medium resize-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-zinc-400">Target Date *</label>
                      <input
                        type="date"
                        required
                        value={taskFormDate}
                        onChange={(e) => setTaskFormDate(e.target.value)}
                        className="w-full bg-[#09090b] border border-[#27272a] rounded-md px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#3b82f6] font-mono font-bold"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-zinc-400">Priority Level *</label>
                      <select
                        value={taskFormPriority}
                        onChange={(e) => setTaskFormPriority(e.target.value as 'HIGH' | 'MEDIUM' | 'LOW')}
                        className="w-full bg-[#09090b] border border-[#27272a] rounded-md px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#3b82f6] font-semibold cursor-pointer"
                      >
                        <option value="LOW">Низкий (Low)</option>
                        <option value="MEDIUM">Средний (Medium)</option>
                        <option value="HIGH">Важно (High)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-zinc-400">Creator Admin</label>
                      <input
                        type="text"
                        disabled
                        value={currentUser || 'admin'}
                        className="w-full bg-[#09090b]/50 border border-transparent rounded-md px-3 py-2 text-xs text-zinc-500 font-semibold cursor-not-allowed"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-zinc-100 text-zinc-950 text-xs font-bold py-2.5 rounded-md hover:bg-zinc-200 shadow-md shadow-zinc-500/5 transition-all cursor-pointer font-bold"
                    >
                      Add Task
                    </button>
                  </form>
                </div>

                {/* Filter and Search Panel */}
                <div className="lg:col-span-2 bg-[#18181b] rounded-xl p-6 border border-zinc-800/40 space-y-4">
                  <h3 className="text-sm font-bold text-slate-100 tracking-wide border-b border-zinc-800 pb-3 flex items-center gap-2">
                    <Search className="w-4 h-4 text-indigo-400" /> Filter &amp; Search Tasks
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-zinc-400">Search Text</label>
                      <input
                        type="text"
                        placeholder="Search description..."
                        value={todoSearchQuery}
                        onChange={(e) => setTodoSearchQuery(e.target.value)}
                        className="w-full bg-[#09090b] border border-[#27272a] rounded-md px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500 placeholder-zinc-700"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-zinc-400">Creator Admin</label>
                      <select
                        value={todoCreatorFilter}
                        onChange={(e) => setTodoCreatorFilter(e.target.value)}
                        className="w-full bg-[#09090b] border border-[#27272a] rounded-md px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500 font-semibold"
                      >
                        <option value="ALL">All Admins</option>
                        {Array.from(new Set(customTodos.map(t => t.creator))).map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-zinc-400">Target Date Filter</label>
                      <input
                        type="date"
                        value={todoDateFilter}
                        onChange={(e) => setTodoDateFilter(e.target.value)}
                        className="w-full bg-[#09090b] border border-[#27272a] rounded-md px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        onClick={() => {
                          setTodoSearchQuery('');
                          setTodoCreatorFilter('ALL');
                          setTodoDateFilter('');
                        }}
                        className="w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/60 text-zinc-300 text-xs font-semibold py-2 px-4 rounded-md transition-colors cursor-pointer"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Two Columns Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pending Column */}
                <div className="bg-[#18181b] rounded-xl p-6 border border-zinc-800/40 flex flex-col min-h-[400px]">
                  <h3 className="text-sm font-bold text-slate-100 tracking-wide border-b border-zinc-800 pb-3 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      Pending Tasks
                    </span>
                    <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded font-mono font-bold border border-blue-500/20">
                      {filteredPendingTodos.length}
                    </span>
                  </h3>
                  
                  <div className="flex-1 overflow-y-auto max-h-[500px] mt-4 space-y-3 pr-1 custom-scrollbar">
                    {filteredPendingTodos.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-zinc-500 italic text-xs py-12">
                        No pending tasks match criteria.
                      </div>
                    ) : (
                      filteredPendingTodos.map(todo => (
                        <div key={todo.id} className="bg-[#09090b]/80 border border-zinc-800/60 rounded-xl p-4 space-y-3 hover:border-zinc-700/60 transition-all">
                          <div className="flex items-start justify-between gap-3">
                            <label className="flex items-start space-x-3 cursor-pointer select-none">
                              <input 
                                type="checkbox"
                                checked={todo.completed}
                                onChange={() => handleToggleTodo(todo.id)}
                                className="w-4 h-4 rounded bg-[#18181b] border-zinc-700 text-blue-500 focus:ring-0 focus:ring-offset-0 mt-0.5 cursor-pointer"
                              />
                              <span className="text-zinc-200 text-xs font-semibold leading-normal break-words">
                                {todo.text}
                              </span>
                            </label>
                            <button
                              onClick={() => handleDeleteTodo(todo.id)}
                              className="text-zinc-500 hover:text-rose-500 transition-colors p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          
                          {todo.description && (
                            <p className="text-[11px] text-zinc-400 pl-7 leading-normal break-words">
                              {todo.description}
                            </p>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t border-zinc-800/40 text-[9.5px]">
                            <span className="text-zinc-500 font-bold font-mono">
                              Target: {todo.date}
                            </span>
                            <div className="flex items-center space-x-1.5 text-zinc-400">
                              {todo.priority && (
                                <span className={`text-[8.5px] font-extrabold uppercase px-1.5 py-0.5 rounded-sm border ${
                                  todo.priority === 'HIGH' 
                                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/25 animate-pulse' 
                                    : todo.priority === 'MEDIUM' 
                                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/25' 
                                      : 'bg-zinc-850 text-zinc-500 border-zinc-700/60'
                                }`}>
                                  {todo.priority === 'HIGH' ? 'Важно' : todo.priority === 'MEDIUM' ? 'Средний' : 'Низкий'}
                                </span>
                              )}
                              <span className="uppercase font-bold tracking-wider bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-800">
                                {todo.creator}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Completed Column */}
                <div className="bg-[#18181b] rounded-xl p-6 border border-zinc-800/40 flex flex-col min-h-[400px]">
                  <h3 className="text-sm font-bold text-slate-100 tracking-wide border-b border-zinc-800 pb-3 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Completed Tasks
                    </span>
                    <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold border border-emerald-500/20">
                      {filteredCompletedTodos.length}
                    </span>
                  </h3>

                  <div className="flex-1 overflow-y-auto max-h-[500px] mt-4 space-y-3 pr-1 custom-scrollbar">
                    {filteredCompletedTodos.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-zinc-500 italic text-xs py-12">
                        No completed tasks match criteria.
                      </div>
                    ) : (
                      filteredCompletedTodos.map(todo => (
                        <div key={todo.id} className="bg-[#09090b]/40 border border-zinc-800/30 rounded-xl p-4 space-y-3 hover:border-zinc-800/60 transition-all opacity-85">
                          <div className="flex items-start justify-between gap-3">
                            <label className="flex items-start space-x-3 cursor-pointer select-none">
                              <input 
                                type="checkbox"
                                checked={todo.completed}
                                onChange={() => handleToggleTodo(todo.id)}
                                className="w-4 h-4 rounded bg-[#18181b] border-zinc-700 text-emerald-500 focus:ring-0 focus:ring-offset-0 mt-0.5 cursor-pointer"
                              />
                              <span className="text-zinc-500 text-xs font-semibold leading-normal line-through break-words">
                                {todo.text}
                              </span>
                            </label>
                            <button
                              onClick={() => handleDeleteTodo(todo.id)}
                              className="text-zinc-600 hover:text-rose-500 transition-colors p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {todo.description && (
                            <p className="text-[11px] text-zinc-600 pl-7 leading-normal line-through break-words">
                              {todo.description}
                            </p>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t border-zinc-800/40 text-[9.5px]">
                            <span className="text-zinc-600 font-bold font-mono">
                              Target: {todo.date}
                            </span>
                            <div className="flex items-center space-x-1.5 text-zinc-500">
                              {todo.priority && (
                                <span className={`text-[8.5px] font-extrabold uppercase px-1.5 py-0.5 rounded-sm border ${
                                  todo.priority === 'HIGH' 
                                    ? 'bg-rose-500/5 text-rose-500/40 border-rose-500/10' 
                                    : todo.priority === 'MEDIUM' 
                                      ? 'bg-amber-500/5 text-amber-500/40 border-amber-500/10' 
                                      : 'bg-zinc-800/10 text-zinc-600 border border-zinc-850/30'
                                }`}>
                                  {todo.priority === 'HIGH' ? 'Важно' : todo.priority === 'MEDIUM' ? 'Средний' : 'Низкий'}
                                </span>
                              )}
                              <span className="uppercase font-bold tracking-wider bg-zinc-800/20 px-1.5 py-0.5 rounded border border-zinc-800/40">
                                {todo.creator}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
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
                {editingTech && customDocuments.filter(d => d.technicianId === editingTech.id).length > 0 && (
                  <span className="bg-zinc-800 text-zinc-300 text-[9px] font-black px-1.5 py-0.5 rounded-full ml-0.5">
                    {customDocuments.filter(d => d.technicianId === editingTech.id).length}
                  </span>
                )}
              </button>
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
                    placeholder="name@netcoretelecom.com"
                    value={techForm.email}
                    onChange={(e) => setTechForm({ ...techForm, email: e.target.value })}
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-md px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#3b82f6] font-medium"
                  />
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
                  const techDocs = customDocuments.filter(d => d.technicianId === editingTech.id);
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

      {/* Custom Dialog Modal */}
      {dialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
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
