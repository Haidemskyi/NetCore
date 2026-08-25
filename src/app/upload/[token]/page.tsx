'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  FileText, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  Image as ImageIcon, 
  ShieldCheck, 
  Trash2, 
  Lock,
  Camera
} from 'lucide-react';

interface DocSlot {
  key: string;
  title: string;
  subtitle: string;
  icon: string;
  file: File | null;
  dataUrl: string | null;
}

const REQUIRED_DOCS = [
  { key: 'DL_FRONT', title: "Driver's License — Front Side", subtitle: 'Full-color photo of the front side of your valid Driver License', icon: '🆔' },
  { key: 'DL_BACK', title: "Driver's License — Back Side", subtitle: 'Full-color photo of the back side of your valid Driver License', icon: '🆔' },
  { key: 'SSN', title: 'Social Security Card (SSN)', subtitle: 'Legible photo of your original Social Security Card', icon: '🔒' },
  { key: 'EAD_FRONT', title: 'Employment Authorization (EAD) — Front', subtitle: 'Front photo of your Work Authorization Document / Green Card', icon: '📄' },
  { key: 'EAD_BACK', title: 'Employment Authorization (EAD) — Back', subtitle: 'Back photo of your Work Authorization Document / Green Card', icon: '📄' },
  { key: 'BADGE_PHOTO', title: 'Official ID Badge Photo', subtitle: 'Headshot portrait photo taken against a clean white background', icon: '👤' },
];

export default function CandidateUploadPage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [candidateInfo, setCandidateInfo] = useState<{
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    uploadCompleted: boolean;
  } | null>(null);

  const [slots, setSlots] = useState<DocSlot[]>(
    REQUIRED_DOCS.map(d => ({
      key: d.key,
      title: d.title,
      subtitle: d.subtitle,
      icon: d.icon,
      file: null,
      dataUrl: null,
    }))
  );

  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    async function verifyToken() {
      if (!token) return;
      try {
        const res = await fetch(`/api/candidates/upload-docs?token=${token}`);
        const data = await res.json();
        if (res.ok && data.success) {
          setCandidateInfo(data.candidate);
          if (data.candidate.uploadCompleted) {
            setCompleted(true);
          }
        } else {
          setErrorMsg(data.error || 'Invalid or expired upload link.');
        }
      } catch (err: any) {
        setErrorMsg('Network error validating upload link.');
      } finally {
        setLoading(false);
      }
    }
    verifyToken();
  }, [token]);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      // 1. If PDF, read directly
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        const reader = new FileReader();
        reader.onload = (e) => resolve((e.target?.result as string) || '');
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
        return;
      }

      // 2. Timeout safety: 15 seconds max for high-res mobile photos
      const timeoutId = setTimeout(() => {
        const fallbackReader = new FileReader();
        fallbackReader.onload = (e) => resolve((e.target?.result as string) || '');
        fallbackReader.onerror = () => resolve('');
        fallbackReader.readAsDataURL(file);
      }, 15000);

      // 3. Resize photo via HTML5 Canvas (max 1200px, 0.65 JPEG)
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const rawDataUrl = event.target?.result as string;
        if (!rawDataUrl) {
          clearTimeout(timeoutId);
          resolve('');
          return;
        }

        const img = new Image();
        img.src = rawDataUrl;
        img.onload = () => {
          clearTimeout(timeoutId);
          try {
            const maxDim = 1200;
            let width = img.width;
            let height = img.height;

            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve(rawDataUrl);
              return;
            }
            ctx.drawImage(img, 0, 0, width, height);
            let compressedDataUrl = canvas.toDataURL('image/jpeg', 0.65);

            // If still large (>1.5MB string), compress further
            if (compressedDataUrl.length > 2000000) {
              const smallCanvas = document.createElement('canvas');
              smallCanvas.width = Math.round(width * 0.75);
              smallCanvas.height = Math.round(height * 0.75);
              const smallCtx = smallCanvas.getContext('2d');
              if (smallCtx) {
                smallCtx.drawImage(img, 0, 0, smallCanvas.width, smallCanvas.height);
                compressedDataUrl = smallCanvas.toDataURL('image/jpeg', 0.5);
              }
            }

            resolve(compressedDataUrl || rawDataUrl);
          } catch (e) {
            resolve(rawDataUrl);
          }
        };
        img.onerror = () => {
          clearTimeout(timeoutId);
          resolve(rawDataUrl);
        };
      };
      reader.onerror = () => {
        clearTimeout(timeoutId);
        resolve('');
      };
    });
  };

  const handleFileChange = async (key: string, file: File | null) => {
    if (!file) return;
    try {
      const compressedDataUrl = await compressImage(file);
      if (compressedDataUrl) {
        setSlots(prev =>
          prev.map(slot => (slot.key === key ? { ...slot, file, dataUrl: compressedDataUrl } : slot))
        );
      } else {
        alert('Could not read selected photo. Please select a valid photo or image.');
      }
    } catch (err) {
      console.error('File compression error:', err);
    }
  };

  const handleRemoveSlot = (key: string) => {
    setSlots(prev =>
      prev.map(slot => (slot.key === key ? { ...slot, file: null, dataUrl: null } : slot))
    );
  };

  const uploadedCount = slots.filter(s => s.dataUrl !== null).length;
  const progressPercent = Math.round((uploadedCount / 6) * 100);

  const handleSubmit = async () => {
    if (uploadedCount < 6) {
      alert(`Please attach all 6 required document photos before submitting (${uploadedCount}/6 attached).`);
      return;
    }

    setSubmitting(true);
    try {
      const payloadDocs = slots.map(s => {
        const originalName = s.file?.name?.replace(/\.[^/.]+$/, "") || 'photo';
        const ext = s.file?.name?.toLowerCase().endsWith('.pdf') ? '.pdf' : '.jpg';
        return {
          docType: s.key,
          name: `${s.key}_${originalName}${ext}`,
          fileType: s.file?.type || 'image/jpeg',
          size: s.file?.size || 0,
          dataUrl: s.dataUrl,
        };
      });

      const res = await fetch('/api/candidates/upload-docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          documents: payloadDocs,
        }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch (jsonErr) {
        if (res.status === 413) {
          data = { error: 'The uploaded files are too large. Please select smaller photo files or images and try again.' };
        } else {
          data = { error: `Server response error (${res.status}). Please try again.` };
        }
      }

      if (res.ok && data.success) {
        setCompleted(true);
      } else {
        alert(data.error || 'Failed to submit documents. Please try again.');
      }
    } catch (err) {
      console.error(err);
      alert('Error uploading documents. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-4 font-sans">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-600">Verifying secure document link...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-6 font-sans">
        <div className="bg-white border border-slate-200 p-8 rounded-2xl max-w-md w-full text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-center mx-auto text-red-600">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-900">Upload Link Expired</h2>
          <p className="text-xs text-slate-600 leading-relaxed">{errorMsg}</p>
          <p className="text-[11px] text-slate-400 italic">Please contact your recruiter to request a new onboarding document link.</p>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-6 font-sans">
        <div className="bg-white border border-slate-200 p-8 rounded-3xl max-w-md w-full text-center space-y-6 shadow-xl animate-fadeIn">
          <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-3xl flex items-center justify-center mx-auto text-emerald-600">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-slate-900">Documents Received!</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Thank you, <strong className="text-slate-900">{candidateInfo?.firstName} {candidateInfo?.lastName}</strong>. All 6 onboarding documents have been securely uploaded to your profile.
            </p>
          </div>
          <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl text-left space-y-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-800 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Link Deactivated (One-Time Link)</span>
            </div>
            <p className="text-[11px] text-emerald-700">
              Our compliance team has been notified. You may now safely close this browser tab.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-blue-600 selection:text-white py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* Header Title Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-5 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 pb-5">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold shadow-sm">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-[#1e3a8a]">NETCORE CRM</h1>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">Onboarding Verification Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-xs font-bold shadow-xs">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Secure SSL</span>
            </div>
          </div>

          {/* Candidate Onboarding Status Stepper */}
          <div className="pt-2">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">Onboarding Progress Tracker</p>
            <div className="grid grid-cols-5 gap-1.5 text-center text-[10px] font-bold">
              <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl">
                1. Account
              </div>
              <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl">
                2. Rates
              </div>
              <div className="p-2 bg-[#1a73e8] text-white rounded-xl shadow-xs font-extrabold animate-pulse">
                3. Docs
              </div>
              <div className="p-2 bg-slate-100 border border-slate-200 text-slate-400 rounded-xl">
                4. Sign
              </div>
              <div className="p-2 bg-slate-100 border border-slate-200 text-slate-400 rounded-xl">
                5. Hired
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-900">
              Welcome, <span className="text-[#1a73e8]">{candidateInfo?.firstName} {candidateInfo?.lastName}</span>
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              Please upload clear photos of your 6 required onboarding documents. Once submitted, your secure link will automatically complete and deactivate.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs font-bold font-mono">
              <span className="text-slate-500">UPLOAD PROGRESS</span>
              <span className={uploadedCount === 6 ? 'text-emerald-600 font-extrabold' : 'text-[#1a73e8]'}>
                {uploadedCount} of 6 Attached ({progressPercent}%)
              </span>
            </div>
            <div className="w-full bg-slate-100 border border-slate-200 h-3 rounded-full overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  uploadedCount === 6 ? 'bg-emerald-500' : 'bg-[#1a73e8]'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* 6 Required Upload Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {slots.map((slot, index) => (
            <div
              key={slot.key}
              className={`bg-white border rounded-2xl p-4 space-y-3 transition-all shadow-sm ${
                slot.dataUrl
                  ? 'border-emerald-300 ring-2 ring-emerald-500/10'
                  : 'border-slate-200 hover:border-blue-300 hover:shadow-md'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2.5">
                  <span className="text-xl mt-0.5">{slot.icon}</span>
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-900 leading-tight">
                      {index + 1}. {slot.title}
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-1 leading-snug">{slot.subtitle}</p>
                  </div>
                </div>

                {slot.dataUrl ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full shrink-0 shadow-xs">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Attached
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full shrink-0 shadow-xs">
                    Required
                  </span>
                )}
              </div>

              {/* Upload Drop Zone / Image Preview */}
              {slot.dataUrl ? (
                <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-100 h-36 flex items-center justify-center">
                  <img
                    src={slot.dataUrl}
                    alt={slot.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleRemoveSlot(slot.key)}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-md"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ) : (
                <label className="border-2 border-dashed border-slate-200 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/50 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all space-y-2 h-36 text-center group">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => handleFileChange(slot.key, e.target.files?.[0] || null)}
                  />
                  <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 group-hover:border-blue-300 text-slate-400 group-hover:text-blue-600 flex items-center justify-center shadow-xs transition-colors">
                    <Camera className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-700 group-hover:text-blue-600 block">
                      Take Photo or Browse
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">JPG, PNG, PDF up to 10MB</span>
                  </div>
                </label>
              )}
            </div>
          ))}
        </div>

        {/* Submit Action Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
          <div>
            <h4 className="text-xs font-extrabold text-slate-900">
              Ready to submit onboarding documents?
            </h4>
            <p className="text-[11px] text-slate-500 mt-1">
              Ensure all 6 photos are legible. This single-use link will complete upon submission.
            </p>
          </div>

          <button
            type="button"
            disabled={uploadedCount < 6 || submitting}
            onClick={handleSubmit}
            className={`px-8 py-3.5 rounded-2xl font-extrabold text-xs transition-all shadow-md flex items-center justify-center space-x-2 shrink-0 cursor-pointer ${
              uploadedCount === 6 && !submitting
                ? 'bg-[#2563eb] hover:bg-blue-700 text-white shadow-blue-500/25 cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300/60'
            }`}
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Uploading Documents...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span>Submit All 6 Documents ({uploadedCount}/6)</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
