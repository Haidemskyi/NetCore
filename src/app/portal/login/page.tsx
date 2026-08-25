'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, User, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export default function EmployeePortalLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/portal/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Redirect to employee portal dashboard
      router.push('/portal');
    } catch (err: any) {
      setError(err.message || 'Connection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col justify-center items-center p-4 font-sans text-[#202124]">
      
      {/* Header Logo */}
      <div className="flex items-center space-x-3 mb-8">
        <div className="w-12 h-12 rounded-full bg-[#1a73e8] flex items-center justify-center font-extrabold text-white text-xl shadow-md shadow-[#1a73e8]/30">
          N
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#202124]">NetCore Employee Portal</h1>
          <p className="text-xs text-[#5f6368] font-medium uppercase tracking-wider">Internal Operations & Field Operations</p>
        </div>
      </div>

      {/* Google-Style Card */}
      <div className="bg-white border border-[#dadce0] rounded-2xl shadow-xl max-w-md w-full p-8 space-y-6 animate-fadeIn">
        
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold text-[#202124]">Sign in to your account</h2>
          <p className="text-xs text-[#5f6368]">Use your Technician / Employee credentials assigned by NetCore</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center space-x-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#5f6368] uppercase tracking-wider mb-1.5">
              Username or Email
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#80868b]" />
              <input
                type="text"
                required
                placeholder="e.g. haidemskyi or tech@netcore.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#f8f9fa] border border-[#dadce0] rounded-xl pl-10 pr-4 py-3 text-sm text-[#202124] focus:outline-none focus:border-[#1a73e8] focus:bg-white transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#5f6368] uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#80868b]" />
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#f8f9fa] border border-[#dadce0] rounded-xl pl-10 pr-4 py-3 text-sm text-[#202124] focus:outline-none focus:border-[#1a73e8] focus:bg-white transition-all font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-[#1a73e8] hover:bg-[#1557b0] disabled:bg-[#80868b] text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2 active:scale-98"
          >
            {loading ? (
              <span>Signing in...</span>
            ) : (
              <>
                <span>Continue to Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-[#f1f3f4] text-center space-y-2">
          <div className="flex items-center justify-center space-x-2 text-[11px] text-[#5f6368]">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>Encrypted Enterprise Authentication</span>
          </div>
          <p className="text-[10px] text-[#80868b]">
            Need access or forgot password? Contact your Regional Dispatcher or Admin.
          </p>
        </div>
      </div>

      <div className="mt-8 text-center text-xs text-[#80868b]">
        © {new Date().getFullYear()} NetCore LLC • Broadband & Fleet Operations Platform
      </div>
    </div>
  );
}
