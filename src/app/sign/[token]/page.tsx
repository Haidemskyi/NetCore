'use client';

import React, { useState, useEffect, useRef, use } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  PenTool, 
  Type, 
  Eraser, 
  ShieldCheck, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard, 
  AlertCircle, 
  Sparkles,
  Building2,
  Lock,
  Eye,
  Check,
  X,
  Landmark,
  ArrowRight
} from 'lucide-react';

import { PDF_FIELD_CONFIG } from '@/lib/pdfConfig';

interface SignPageProps {
  params: Promise<{ token: string }>;
}

interface DocState {
  id: string;
  title: string;
  fileName: string;
  category: string;
  description: string;
  signed: boolean;
}

export default function CandidateSignPage(props: SignPageProps) {
  const resolvedParams = use(props.params);
  const token = resolvedParams.token;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [candidate, setCandidate] = useState<any>(null);
  
  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [ssnOrEin, setSsnOrEin] = useState('');
  const [address, setAddress] = useState('');

  // Banking Details
  const [bankName, setBankName] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountType, setAccountType] = useState('Checking');
  
  // Signature mode: 'draw' | 'type'
  const [sigMode, setSigMode] = useState<'draw' | 'type'>('draw');
  const [typedSignature, setTypedSignature] = useState('');
  const [hasDrawn, setHasDrawn] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Live Visual Designer State
  const [fieldConfig, setFieldConfig] = useState<any>(PDF_FIELD_CONFIG);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeFieldKey, setActiveFieldKey] = useState<string | null>(null);
  const [draggingFieldKey, setDraggingFieldKey] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [saveStatus, setSaveStatus] = useState('');
  const docCanvasRef = useRef<HTMLDivElement>(null);

  const getDocKey = (modalId: string) => {
    if (modalId === 'direct-deposit') return 'directDeposit';
    if (modalId === 'w9') return 'w9';
    return 'contractorAgreement';
  };

  const handleMouseDown = (fieldKey: string, e: React.MouseEvent) => {
    if (!isEditMode) return;
    e.preventDefault();
    setActiveFieldKey(fieldKey);
    setDraggingFieldKey(fieldKey);
    if (docCanvasRef.current) {
      const rect = docCanvasRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingFieldKey || !docCanvasRef.current || !activeDocModal) return;
    const rect = docCanvasRef.current.getBoundingClientRect();
    const docKey = getDocKey(activeDocModal.id);

    const xPct = Math.max(0, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100)).toFixed(1) + '%';
    const yPct = Math.max(0, Math.min(95, ((e.clientY - rect.top) / rect.height) * 100)).toFixed(1) + '%';

    setFieldConfig((prev: any) => ({
      ...prev,
      [docKey]: {
        ...prev[docKey],
        [draggingFieldKey]: {
          ...prev[docKey][draggingFieldKey],
          screen: {
            ...prev[docKey][draggingFieldKey].screen,
            top: yPct,
            left: xPct,
          },
        },
      },
    }));
  };

  const handleMouseUp = () => {
    setDraggingFieldKey(null);
  };

  const handleNudge = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (!activeFieldKey || !activeDocModal) return;
    const docKey = getDocKey(activeDocModal.id);
    const current = fieldConfig[docKey][activeFieldKey].screen;
    let topNum = parseFloat(current.top);
    let leftNum = parseFloat(current.left);

    if (direction === 'up') topNum -= 0.3;
    if (direction === 'down') topNum += 0.3;
    if (direction === 'left') leftNum -= 0.3;
    if (direction === 'right') leftNum += 0.3;

    setFieldConfig((prev: any) => ({
      ...prev,
      [docKey]: {
        ...prev[docKey],
        [activeFieldKey]: {
          ...prev[docKey][activeFieldKey],
          screen: {
            ...prev[docKey][activeFieldKey].screen,
            top: topNum.toFixed(1) + '%',
            left: leftNum.toFixed(1) + '%',
          },
        },
      },
    }));
  };

  const handleResize = (dimension: 'width' | 'height', delta: number) => {
    if (!activeFieldKey || !activeDocModal) return;
    const docKey = getDocKey(activeDocModal.id);
    const currentScreen = fieldConfig[docKey][activeFieldKey].screen;

    if (dimension === 'width') {
      let currentVal = parseFloat(currentScreen.width);
      let newVal = Math.max(5, currentVal + delta).toFixed(1) + '%';
      setFieldConfig((prev: any) => ({
        ...prev,
        [docKey]: {
          ...prev[docKey],
          [activeFieldKey]: {
            ...prev[docKey][activeFieldKey],
            screen: {
              ...prev[docKey][activeFieldKey].screen,
              width: newVal,
            },
          },
        },
      }));
    } else {
      let currentPx = parseInt(currentScreen.height) || 26;
      let newPx = Math.max(16, currentPx + delta) + 'px';
      setFieldConfig((prev: any) => ({
        ...prev,
        [docKey]: {
          ...prev[docKey],
          [activeFieldKey]: {
            ...prev[docKey][activeFieldKey],
            screen: {
              ...prev[docKey][activeFieldKey].screen,
              height: newPx,
            },
          },
        },
      }));
    }
  };

  const handleAddField = () => {
    if (!activeDocModal) return;
    const docKey = getDocKey(activeDocModal.id);
    const fieldNamePrompt = prompt('Enter name/label for the new field:', 'New Custom Field');
    if (!fieldNamePrompt) return;

    const fieldKey = 'custom_' + Date.now();
    const newFieldObj = {
      label: fieldNamePrompt,
      type: 'text',
      screen: { top: '50.0%', left: '30.0%', width: '35%', height: '26px' },
      pdf: { x: 150, y: 350, size: 10 },
    };

    setFieldConfig((prev: any) => ({
      ...prev,
      [docKey]: {
        ...prev[docKey],
        [fieldKey]: newFieldObj,
      },
    }));
    setActiveFieldKey(fieldKey);
  };

  const handleDeleteField = () => {
    if (!activeFieldKey || !activeDocModal) return;
    const docKey = getDocKey(activeDocModal.id);
    if (!confirm(`Delete field "${fieldConfig[docKey][activeFieldKey]?.label || activeFieldKey}"?`)) return;

    setFieldConfig((prev: any) => {
      const copy = { ...prev };
      const docCopy = { ...copy[docKey] };
      delete docCopy[activeFieldKey];
      copy[docKey] = docCopy;
      return copy;
    });
    setActiveFieldKey(null);
  };

  const handleSaveConfig = async () => {
    try {
      setSaveStatus('Saving coordinates...');
      const res = await fetch('/api/documents/save-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: fieldConfig }),
      });
      if (res.ok) {
        setSaveStatus('Saved! ✓');
        setTimeout(() => setSaveStatus(''), 3000);
      } else {
        setSaveStatus('Save error');
      }
    } catch (e) {
      setSaveStatus('Save error');
    }
  };
  
  // 4 Documents Checklist
  const [docsList, setDocsList] = useState<DocState[]>([
    {
      id: 'direct-deposit',
      title: 'Direct Deposit Authorization Form',
      fileName: 'Direct Deposit NetCore.pdf',
      category: 'BANKING',
      description: 'Authorizes NETCORE to deposit contractor earnings directly into your bank account.',
      signed: false,
    },
    {
      id: 'w9',
      title: 'Form W-9 Taxpayer Certification',
      fileName: 'Form W-9 .pdf',
      category: 'TAX',
      description: 'Request for Taxpayer Identification Number (SSN or EIN) and Certification for 1099 reporting.',
      signed: false,
    },
    {
      id: 'contractor-agreement',
      title: 'Independent Contractor Subcontractor Agreement',
      fileName: 'Independent Contractor Agreement.pdf',
      category: 'CONTRACT',
      description: 'Defines master terms, Scope of Work, payment rates, and independent contractor classification.',
      signed: false,
    },
    {
      id: 'nda',
      title: 'Non-Disclosure & Confidentiality Agreement (NDA)',
      fileName: 'NDA NetCore.pdf',
      category: 'NDA',
      description: 'Protects proprietary tools, customer data, rate sheets, and telecommunications network specs.',
      signed: false,
    },
  ]);

  // Modal viewer state for signing individual documents
  const [activeDocModal, setActiveDocModal] = useState<DocState | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const modalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);

  // Fetch candidate info on mount
  useEffect(() => {
    async function loadCandidate() {
      try {
        setLoading(true);
        const res = await fetch(`/api/sign/${token}`);
        const data = await res.json();
        
        if (!res.ok || !data.success) {
          setError(data.error || 'Signing token is invalid or expired.');
          setLoading(false);
          return;
        }

        setCandidate(data.candidate);
        setFirstName(data.candidate.firstName || '');
        setLastName(data.candidate.lastName || '');
        setPhone(data.candidate.phone || '');
        setTypedSignature(`${data.candidate.firstName || ''} ${data.candidate.lastName || ''}`);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching signing details:', err);
        setError('Connection error. Please try again later.');
        setLoading(false);
      }
    }
    if (token) {
      loadCandidate();
    }
  }, [token]);

  // Setup canvas drawing listeners for main signature pad
  useEffect(() => {
    if (sigMode !== 'draw' || loading || submitted || error) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#09090b'; // Clean dark ink
    ctx.lineWidth = 2.5;

    const getPos = (e: MouseEvent | TouchEvent) => {
      const r = canvas.getBoundingClientRect();
      let clientX = 0;
      let clientY = 0;
      if ('touches' in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ('clientX' in e) {
        clientX = (e as MouseEvent).clientX;
        clientY = (e as MouseEvent).clientY;
      }
      return {
        x: clientX - r.left,
        y: clientY - r.top,
      };
    };

    const startDrawing = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      isDrawingRef.current = true;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    };

    const draw = (e: MouseEvent | TouchEvent) => {
      if (!isDrawingRef.current) return;
      e.preventDefault();
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      setHasDrawn(true);
    };

    const stopDrawing = (e: MouseEvent | TouchEvent) => {
      if (isDrawingRef.current) {
        isDrawingRef.current = false;
        ctx.closePath();
      }
    };

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);

    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDrawing);

    return () => {
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('mouseleave', stopDrawing);

      canvas.removeEventListener('touchstart', startDrawing);
      canvas.removeEventListener('touchmove', draw);
      canvas.removeEventListener('touchend', stopDrawing);
    };
  }, [sigMode, loading, submitted, error]);

  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const generateSignatureImage = (): string => {
    if (sigMode === 'draw') {
      const canvas = canvasRef.current;
      if (canvas && hasDrawn) {
        return canvas.toDataURL('image/png');
      }
    }
    
    // Typed signature canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 600;
    tempCanvas.height = 160;
    const ctx = tempCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 600, 160);
      ctx.font = 'italic bold 38px "Brush Script MT", "Dancing Script", cursive, sans-serif';
      ctx.fillStyle = '#09090b';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(typedSignature || `${firstName} ${lastName}`, 300, 80);
      
      ctx.strokeStyle = '#71717a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(100, 120);
      ctx.lineTo(500, 120);
      ctx.stroke();
    }
    return tempCanvas.toDataURL('image/png');
  };

  const handleMarkDocSigned = (docId: string) => {
    setDocsList(prev => prev.map(d => d.id === docId ? { ...d, signed: true } : d));
    setActiveDocModal(null);
  };

  const handleSignAllDocsQuick = () => {
    if (sigMode === 'draw' && !hasDrawn) {
      alert('Please draw your signature in Step 2 first.');
      return;
    }
    if (sigMode === 'type' && !typedSignature.trim()) {
      alert('Please type your legal full name for your signature in Step 2 first.');
      return;
    }
    setDocsList(prev => prev.map(d => ({ ...d, signed: true })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim() || !phone.trim() || !ssnOrEin.trim() || !address.trim()) {
      alert('Please fill out all required personal details in Step 1.');
      return;
    }

    if (sigMode === 'draw' && !hasDrawn) {
      alert('Please draw your digital signature in Step 2.');
      return;
    }

    if (sigMode === 'type' && !typedSignature.trim()) {
      alert('Please type your legal full name for your signature in Step 2.');
      return;
    }

    const unsignedDocs = docsList.filter(d => !d.signed);
    if (unsignedDocs.length > 0) {
      alert(`Please review and sign all 4 onboarding documents (${unsignedDocs.length} remaining). Click "View & Sign" or "Sign All 4 Documents".`);
      return;
    }

    if (!acceptedTerms) {
      alert('Please check the legal confirmation checkbox to proceed.');
      return;
    }

    try {
      setSubmitting(true);
      const signatureDataUrl = generateSignatureImage();
      const fullName = `${firstName.trim()} ${lastName.trim()}`;

      // Build 4 individual document payload entries
      const signedDocuments = docsList.map(doc => ({
        name: `Signed_${doc.id.toUpperCase()}_${lastName.trim()}_${firstName.trim()}.pdf`,
        category: doc.category,
        dataUrl: signatureDataUrl,
      }));

      const res = await fetch(`/api/sign/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          ssnOrEin: ssnOrEin.trim(),
          address: address.trim(),
          bankName: bankName.trim(),
          routingNumber: routingNumber.trim(),
          accountNumber: accountNumber.trim(),
          accountType,
          signatureDataUrl,
          signatureName: typedSignature || fullName,
          acceptedTerms: true,
          signedDocuments,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.error || 'Failed to submit document package.');
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
      setSubmitting(false);
    } catch (err: any) {
      console.error('Error submitting signature:', err);
      alert('Network error. Failed to submit signature package.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-4 text-white font-sans">
        <div className="flex items-center space-x-3 bg-[#18181b] p-6 rounded-xl border border-zinc-800 shadow-xl">
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-zinc-300">Loading document portal...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-4 text-white font-sans">
        <div className="max-w-md w-full bg-[#18181b] border border-rose-500/30 p-8 rounded-2xl text-center shadow-2xl space-y-4">
          <div className="w-12 h-12 bg-rose-500/10 text-rose-400 rounded-full flex items-center justify-center mx-auto border border-rose-500/20">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Signing Link Invalid</h2>
          <p className="text-zinc-400 text-xs">{error}</p>
          <div className="pt-2 text-[11px] text-zinc-500 font-mono">
            NETCORE CRM Document Security
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-4 text-white font-sans">
        <div className="max-w-lg w-full bg-[#18181b] border border-emerald-500/30 p-8 rounded-2xl text-center shadow-2xl space-y-6">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-white">All 4 Documents Signed!</h2>
            <p className="text-emerald-400 font-semibold text-xs">Onboarding Agreement Package Complete</p>
          </div>
          <div className="text-zinc-300 text-xs leading-relaxed bg-[#09090b] p-4 rounded-xl border border-zinc-800 text-left space-y-2">
            <p>Thank you, <strong className="text-white">{firstName} {lastName}</strong>.</p>
            <p>All 4 required onboarding documents have been digitally signed, verified, and saved to your employee profile in <strong>Employees (CRM)</strong>:</p>
            <ul className="list-disc list-inside text-zinc-400 text-[11px] space-y-1 pt-1 font-mono">
              <li>Direct Deposit Authorization Form</li>
              <li>Form W-9 Taxpayer Certification</li>
              <li>Independent Contractor Agreement</li>
              <li>Non-Disclosure Agreement (NDA)</li>
            </ul>
          </div>
          <div className="pt-4 border-t border-zinc-800 text-xs text-zinc-400 flex items-center justify-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>NETCORE Subcontractor Agreement Portal</span>
          </div>
        </div>
      </div>
    );
  }

  const allSigned = docsList.every(d => d.signed);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-zinc-800 selection:text-white pb-20">
      {/* Top Neutral Header */}
      <header className="sticky top-0 z-40 bg-[#18181b]/90 backdrop-blur-md border-b border-zinc-800 px-4 py-3.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-zinc-800 rounded-xl flex items-center justify-center border border-zinc-700">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-sm text-white tracking-wide">NETCORE CRM</h1>
              <p className="text-[10px] text-zinc-400">Subcontractor Agreement Signing Portal</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-3 py-1 rounded-full font-semibold">
            <Lock className="w-3.5 h-3.5" />
            <span>256-bit Encrypted</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 mt-6 space-y-6">
        
        {/* Welcome Banner */}
        <div className="rounded-2xl bg-[#18181b] border border-zinc-800/80 p-6 space-y-2 shadow-sm">
          <div className="inline-flex items-center space-x-1.5 bg-zinc-800 text-zinc-300 text-[10px] px-2.5 py-0.5 rounded-full border border-zinc-700 font-bold uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-teal-400" />
            <span>Subcontractor Onboarding Package</span>
          </div>
          <h2 className="text-xl font-bold text-white">
            Welcome, {candidate?.firstName} {candidate?.lastName}!
          </h2>
          <p className="text-zinc-400 text-xs leading-relaxed max-w-2xl">
            Please verify your details, fill your bank details for direct deposit, sign your digital signature, and complete all 4 onboarding documents below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Step 1: Personal & Banking Details */}
          <div className="bg-[#18181b] border border-zinc-800/80 rounded-2xl p-6 space-y-5 shadow-sm">
            <div className="flex items-center space-x-2.5 border-b border-zinc-800 pb-3">
              <User className="w-4 h-4 text-teal-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">1. Personal & Direct Deposit Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-zinc-400 block">First Name *</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#09090b] border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-zinc-700 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-zinc-400 block">Last Name *</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#09090b] border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-zinc-700 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-zinc-400 block">Email Address (Read-only)</label>
                <input
                  type="email"
                  disabled
                  value={candidate?.email || ''}
                  className="w-full px-3 py-2 bg-[#09090b]/50 border border-zinc-800/50 rounded-xl text-xs text-zinc-500 cursor-not-allowed font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-zinc-400 block">Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="(555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-[#09090b] border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-zinc-700 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-zinc-400 block">SSN or Tax ID (EIN) *</label>
                <input
                  type="text"
                  required
                  placeholder="XXX-XX-XXXX or XX-XXXXXXX"
                  value={ssnOrEin}
                  onChange={(e) => setSsnOrEin(e.target.value)}
                  className="w-full px-3 py-2 bg-[#09090b] border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-zinc-700 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-zinc-400 block">Residential / Business Address *</label>
                <input
                  type="text"
                  required
                  placeholder="123 Main St, City, State, ZIP"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-[#09090b] border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-zinc-700 font-medium"
                />
              </div>
            </div>

            {/* Direct Deposit Section */}
            <div className="pt-2 border-t border-zinc-800/60 space-y-3">
              <span className="text-[11px] font-bold text-zinc-300 flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5 text-teal-400" />
                <span>Direct Deposit Bank Details (Required for Payouts)</span>
              </span>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-zinc-400 block">Bank Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chase / BofA"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#09090b] border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-zinc-700 font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-zinc-400 block">Routing Number (9 Digits) *</label>
                  <input
                    type="text"
                    required
                    placeholder="123456789"
                    value={routingNumber}
                    onChange={(e) => setRoutingNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-[#09090b] border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-zinc-700 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-zinc-400 block">Account Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="Account #"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-[#09090b] border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-zinc-700 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-zinc-400 block">Account Type *</label>
                  <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value)}
                    className="w-full px-3 py-2 bg-[#09090b] border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-zinc-700 font-bold"
                  >
                    <option value="Checking">Checking</option>
                    <option value="Savings">Savings</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Digital Signature Creation */}
          <div className="bg-[#18181b] border border-zinc-800/80 rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <PenTool className="w-4 h-4 text-teal-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">2. Digital Signature Creation</h3>
              </div>

              <div className="flex items-center bg-[#09090b] p-1 rounded-xl border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setSigMode('draw')}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    sigMode === 'draw'
                      ? 'bg-zinc-800 text-white border border-zinc-700'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Draw</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSigMode('type')}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    sigMode === 'type'
                      ? 'bg-zinc-800 text-white border border-zinc-700'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Type className="w-3.5 h-3.5" />
                  <span>Type</span>
                </button>
              </div>
            </div>

            {sigMode === 'draw' ? (
              <div className="space-y-2">
                <div className="relative bg-white rounded-xl overflow-hidden border border-zinc-700">
                  <canvas
                    ref={canvasRef}
                    className="w-full h-36 touch-none cursor-crosshair block"
                  />
                  {!hasDrawn && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-zinc-400 text-xs font-medium">
                      <span>Draw signature here with mouse or finger</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>Draw signature inside white box</span>
                  <button
                    type="button"
                    onClick={handleClearCanvas}
                    className="flex items-center space-x-1 text-zinc-400 hover:text-rose-400 transition-colors"
                  >
                    <Eraser className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-zinc-400 block">Type Legal Name for Signature *</label>
                  <input
                    type="text"
                    value={typedSignature}
                    onChange={(e) => setTypedSignature(e.target.value)}
                    placeholder="Enter full legal name"
                    className="w-full px-3 py-2 bg-[#09090b] border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-zinc-700 font-bold"
                  />
                </div>

                <div className="bg-white p-4 rounded-xl border border-zinc-700 text-center">
                  <p className="text-zinc-400 text-[9px] mb-1 font-mono uppercase font-bold">Signature Preview</p>
                  <p className="text-zinc-950 font-bold italic text-2xl font-serif py-1 border-b border-zinc-400 inline-block px-6">
                    {typedSignature || 'Your Signature'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Step 3: Required 4 Onboarding Documents Checklist */}
          <div className="bg-[#18181b] border border-zinc-800/80 rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <FileText className="w-4 h-4 text-teal-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  3. Required 4 Onboarding Documents ({docsList.filter(d => d.signed).length}/4 Signed)
                </h3>
              </div>

              <button
                type="button"
                onClick={handleSignAllDocsQuick}
                className="text-xs font-bold text-teal-400 hover:text-teal-300 bg-transparent border-0 cursor-pointer p-0"
              >
                Sign All 4 Documents
              </button>
            </div>

            <p className="text-xs text-zinc-400 leading-normal">
              Click each document to review its terms and affix your signature. All 4 documents must be signed before submission:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {docsList.map((doc, idx) => (
                <div
                  key={doc.id}
                  className={`p-4 rounded-xl border transition-all space-y-2 flex flex-col justify-between ${
                    doc.signed 
                      ? 'bg-[#09090b] border-emerald-500/30' 
                      : 'bg-[#09090b] border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold">Doc #{idx + 1}</span>
                      {doc.signed ? (
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>Signed</span>
                        </span>
                      ) : (
                        <span className="text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700 px-2 py-0.5 rounded-full font-bold">
                          Pending
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-white">{doc.title}</h4>
                    <p className="text-[11px] text-zinc-400 leading-snug">{doc.description}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveDocModal(doc)}
                    className={`w-full py-1.5 px-3 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2 ${
                      doc.signed
                        ? 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                        : 'bg-white text-zinc-950 hover:bg-zinc-200 border-white'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{doc.signed ? 'Review Signed Doc' : 'View & Sign Document'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Step 4: Final Consent & Submit */}
          <div className="bg-[#18181b] border border-zinc-800/80 rounded-2xl p-6 space-y-4 shadow-sm">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-zinc-700 bg-[#09090b] text-white focus:ring-zinc-700 cursor-pointer"
              />
              <span className="text-xs text-zinc-300 leading-relaxed font-medium">
                I certify that all provided information is true, and I agree to legally affix my digital signature to all 4 onboarding documents under the US ESIGN Act.
              </span>
            </label>

            <button
              type="submit"
              disabled={submitting || !acceptedTerms || !allSigned}
              className="w-full py-3.5 bg-white hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 font-bold rounded-xl shadow-md transition-all text-sm flex items-center justify-center space-x-2 cursor-pointer"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving 4 Signed PDFs & Registering Employee Profile...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-zinc-950" />
                  <span>Submit All 4 Signed Documents & Complete Onboarding</span>
                </>
              )}
            </button>
          </div>

        </form>
      </main>

      {/* Document Review & Signing Viewer Modal */}
      {activeDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#09090b]/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#18181b] border border-zinc-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-slideUp flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-[#09090b]/40 shrink-0">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-teal-400" />
                <h4 className="text-sm font-bold text-white">{activeDocModal.title}</h4>
              </div>
              <button 
                onClick={() => setActiveDocModal(null)}
                className="text-zinc-400 hover:text-white transition-colors bg-transparent border-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>            {/* Document Body View with Live Drag & Drop Builder */}
            <div 
              className="p-4 md:p-6 overflow-y-auto space-y-4 text-xs custom-scrollbar flex-1 bg-[#09090b]"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            >
              
              {/* Document Banner */}
              <div className="flex items-center justify-between bg-[#18181b] p-3 rounded-xl border border-zinc-800 shadow-md">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-xs font-bold text-white">Fill out highlighted fields directly over document lines:</span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsEditMode(!isEditMode)}
                    className="text-[10px] text-zinc-500 hover:text-amber-400 font-mono"
                    title="Toggle Layout Builder"
                  >
                    ⚙ {isEditMode ? 'Close Builder' : 'Edit Layout'}
                  </button>
                  <a
                    href={`/api/documents/serve?file=${encodeURIComponent(activeDocModal.fileName)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-bold text-blue-400 hover:underline"
                  >
                    Download Original PDF ↗
                  </a>
                </div>
              </div>

              {/* Builder Controls Banner (Only visible when Edit Layout is toggled) */}
              {isEditMode && (
                <div className="flex flex-wrap items-center justify-between gap-2 bg-amber-500/10 p-3 rounded-xl border border-amber-500/30 shadow-md">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-amber-400">🛠 Visual Builder:</span>
                    
                    {/* Nudge Arrow Controls */}
                    <div className="flex items-center space-x-1 bg-[#09090b] px-2 py-1 rounded-lg border border-zinc-800">
                      <span className="text-[10px] text-zinc-400 font-mono mr-1">Nudge:</span>
                      <button type="button" onClick={() => handleNudge('up')} className="px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded font-bold" title="Move Up">▲</button>
                      <button type="button" onClick={() => handleNudge('down')} className="px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded font-bold" title="Move Down">▼</button>
                      <button type="button" onClick={() => handleNudge('left')} className="px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded font-bold" title="Move Left">◀</button>
                      <button type="button" onClick={() => handleNudge('right')} className="px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded font-bold" title="Move Right">▶</button>
                    </div>

                    {/* Resize Width & Height Controls */}
                    <div className="flex items-center space-x-1 bg-[#09090b] px-2 py-1 rounded-lg border border-zinc-800">
                      <span className="text-[10px] text-zinc-400 font-mono mr-1">Width:</span>
                      <button type="button" onClick={() => handleResize('width', -1)} className="px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded font-bold">-</button>
                      <button type="button" onClick={() => handleResize('width', 1)} className="px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded font-bold">+</button>
                      
                      <span className="text-[10px] text-zinc-400 font-mono ml-2 mr-1">Height:</span>
                      <button type="button" onClick={() => handleResize('height', -2)} className="px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded font-bold">-</button>
                      <button type="button" onClick={() => handleResize('height', 2)} className="px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded font-bold">+</button>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddField}
                      className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow cursor-pointer flex items-center gap-1"
                    >
                      <span>➕ Add Field</span>
                    </button>

                    {activeFieldKey && (
                      <button
                        type="button"
                        onClick={handleDeleteField}
                        className="px-2.5 py-1.5 bg-red-600/80 hover:bg-red-600 text-white font-bold text-xs rounded-lg shadow cursor-pointer flex items-center gap-1"
                      >
                        <span>🗑 Delete</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {saveStatus && (
                      <span className="text-xs font-bold text-emerald-400 animate-pulse">{saveStatus}</span>
                    )}
                    <button
                      type="button"
                      onClick={handleSaveConfig}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-md flex items-center gap-1 cursor-pointer"
                    >
                      <span>💾 Save Layout</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 100% Pixel-Perfect Dynamic Document Canvas */}
              <div 
                ref={docCanvasRef}
                className="relative w-full bg-white rounded-xl shadow-2xl overflow-hidden border border-zinc-300 select-none"
              >
                {(() => {
                  const docKey = getDocKey(activeDocModal.id);
                  const currentDocFields = fieldConfig[docKey] || {};
                  const isLetter = activeDocModal.id === 'direct-deposit' || activeDocModal.id === 'w9';
                  const bgImageSrc = 
                    activeDocModal.id === 'direct-deposit' ? "/doc_previews/Direct_Deposit_NetCore_p1.png" :
                    activeDocModal.id === 'w9' ? "/doc_previews/Form_W-9__p1.png" :
                    activeDocModal.id === 'contractor-agreement' ? "/doc_previews/Independent_Contractor_Agreement_p3.png" :
                    "/doc_previews/NDA_NetCore_p4.png";

                  return (
                    <div className={`relative w-full ${isLetter ? 'aspect-[612/792]' : 'aspect-[1191/1684]'}`}>
                      <img 
                        src={bgImageSrc} 
                        alt={activeDocModal.title} 
                        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                      />

                      {/* Dynamic Field Overlays */}
                      <div className="absolute inset-0 pointer-events-none">
                        {Object.entries(currentDocFields).map(([fKey, fObj]: [string, any]) => {
                          const isSelected = activeFieldKey === fKey;

                          // Helper to get state value for standard fields
                          const getVal = () => {
                            if (fKey === 'fullName') return firstName || lastName ? `${firstName} ${lastName}` : '';
                            if (fKey === 'bankName') return bankName;
                            if (fKey === 'routingNumber') return routingNumber;
                            if (fKey === 'accountNumber') return accountNumber;
                            if (fKey === 'ssn') return ssnOrEin;
                            if (fKey === 'address') return address;
                            return '';
                          };

                          const setVal = (v: string) => {
                            if (fKey === 'fullName') {
                              const parts = v.split(' ');
                              setFirstName(parts[0] || '');
                              setLastName(parts.slice(1).join(' ') || '');
                            } else if (fKey === 'bankName') setBankName(v);
                            else if (fKey === 'routingNumber') setRoutingNumber(v);
                            else if (fKey === 'accountNumber') setAccountNumber(v);
                            else if (fKey === 'ssn') setSsnOrEin(v);
                            else if (fKey === 'address') setAddress(v);
                          };

                          return (
                            <div
                              key={fKey}
                              onClick={() => setActiveFieldKey(fKey)}
                              onMouseDown={(e) => handleMouseDown(fKey, e)}
                              className={`absolute pointer-events-auto transition-all ${
                                isEditMode
                                  ? `cursor-move ${
                                      isSelected
                                        ? 'ring-4 ring-amber-400 bg-amber-500/20 z-30 shadow-lg'
                                        : 'ring-2 ring-blue-400/80 hover:ring-blue-500 bg-blue-500/10'
                                    }`
                                  : ''
                              }`}
                              style={{
                                top: fObj.screen.top,
                                left: fObj.screen.left,
                                width: fObj.screen.width,
                                height: fObj.screen.height,
                              }}
                            >
                              {/* Label badge in Builder mode */}
                              {isEditMode && (
                                <div className="absolute -top-4 left-0 flex items-center gap-1 bg-zinc-950 text-amber-300 px-1 py-0.2 rounded text-[8px] font-mono font-bold shadow z-40 whitespace-nowrap border border-amber-500/40">
                                  <span>{fObj.label || fKey}</span>
                                  <span className="text-zinc-400">({fObj.screen.top}, {fObj.screen.left}, {fObj.screen.width})</span>
                                </div>
                              )}

                              {/* Control Render */}
                              {fObj.type === 'signature' ? (
                                <div className="w-full h-full bg-blue-500/20 border-2 border-dashed border-blue-600 rounded p-0.5 text-center shadow-sm flex flex-col justify-center items-center">
                                  <p className="text-zinc-950 font-bold italic text-xs md:text-sm font-serif leading-none">
                                    {typedSignature || `${firstName} ${lastName}`}
                                  </p>
                                  <span className="text-[7px] text-blue-700 font-mono font-bold uppercase block mt-0.5">✓ {fObj.label || 'Signature'}</span>
                                </div>
                              ) : fObj.type === 'date' ? (
                                <input
                                  type="text"
                                  disabled
                                  value={new Date().toLocaleDateString()}
                                  className="w-full h-full px-1.5 bg-zinc-100 border border-zinc-400 text-zinc-900 font-mono font-bold text-xs rounded"
                                />
                              ) : fObj.type === 'select' ? (
                                <select
                                  value={accountType}
                                  onChange={(e) => setAccountType(e.target.value)}
                                  className="w-full h-full px-1 bg-red-500/20 border-2 border-red-500 focus:border-blue-600 text-zinc-950 font-bold rounded text-xs"
                                >
                                  <option value="Checking">Checking [✓]</option>
                                  <option value="Savings">Savings [✓]</option>
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  value={getVal()}
                                  onChange={(e) => setVal(e.target.value)}
                                  placeholder={fObj.label || fKey}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 border-t border-zinc-800 flex items-center justify-between bg-[#18181b] shrink-0">
              <span className="text-[11px] text-zinc-400 font-medium">
                {activeDocModal.signed ? 'Status: Currently Signed & Approved' : 'Click approve to complete PDF document fill'}
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setActiveDocModal(null)}
                  className="px-3.5 py-1.5 bg-[#09090b] text-zinc-400 text-xs font-semibold rounded-lg hover:text-white border border-zinc-800 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleMarkDocSigned(activeDocModal.id)}
                  className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-500 cursor-pointer shadow-md flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Approve & Save Signed PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
