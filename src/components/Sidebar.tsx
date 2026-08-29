'use client';

import React, { useState } from 'react';
import { 
  Sliders, 
  Search, 
  Users,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  FileSpreadsheet,
  Percent,
  Wrench,
  UserPlus,
  LogOut,
  CheckSquare,
  MessageSquare,
  Sun,
  Moon
} from 'lucide-react';
import { technicians as defaultTechs, Technician } from '../data/mockData';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  selectedTechId?: number | null;
  onSelectTechnician?: (techId: number) => void;
  technicians?: Technician[];
  currentUser?: string | null;
  ticketsCount?: number;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onInviteClick?: () => void;
  onLogoutClick?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({
  activeSection,
  onSectionChange,
  selectedTechId,
  onSelectTechnician,
  technicians = defaultTechs,
  currentUser,
  ticketsCount = 0,
  theme = 'dark',
  onToggleTheme,
  onInviteClick,
  onLogoutClick,
  isOpen = false,
  onClose
}: SidebarProps) {
  const handleSectionClick = (section: string) => {
    onSectionChange(section);
    if (onClose) onClose();
  };

  const handleTechClick = (techId: number) => {
    onSelectTechnician?.(techId);
    if (onClose) onClose();
  };

  // Collapsible Submenus
  const [isDashboardsOpen, setIsDashboardsOpen] = useState(true);
  const [isEmployeesOpen, setIsEmployeesOpen] = useState(true);

  // Technician filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ONBOARDING' | 'TRAINING' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Filter technicians
  const filteredTechs = technicians.filter(tech => {
    const matchesSearch = tech.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesStatus = true;
    if (statusFilter === 'ONBOARDING') {
      matchesStatus = tech.status === 'ONBOARDING';
    } else if (statusFilter === 'TRAINING') {
      matchesStatus = tech.status === 'TRAINING';
    } else if (statusFilter === 'ACTIVE') {
      matchesStatus = tech.status === 'ACTIVE';
    } else if (statusFilter === 'INACTIVE') {
      matchesStatus = tech.status === 'INACTIVE' || tech.status === 'SUSPENDED';
    }

    return matchesSearch && matchesStatus;
  });

  const isLight = theme === 'light';

  return (
    <aside className={`fixed md:relative inset-y-0 left-0 z-40 w-[260px] h-screen flex flex-col select-none overflow-hidden shrink-0 font-sans border-r transition-all duration-300 ease-in-out md:translate-x-0 ${
      isLight 
        ? 'bg-white text-[#202124] border-[#dadce0]' 
        : 'bg-[#121316] text-[#e8eaed] border-[#2c2f38]'
    } ${
      isOpen ? 'translate-x-0 shadow-2xl shadow-black/80' : '-translate-x-full'
    }`}>
      
      {/* 1. Header Logo Block */}
      <div className={`h-16 flex items-center justify-between px-5 border-b shrink-0 ${
        isLight ? 'border-[#dadce0] bg-slate-50' : 'border-[#2c2f38] bg-[#1a1c23]'
      }`}>
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-full bg-[#1a73e8] flex items-center justify-center font-bold text-white text-sm shadow-md shadow-[#1a73e8]/30">
            N
          </div>
          <div className="flex flex-col">
            <span className={`font-extrabold text-sm tracking-wide ${isLight ? 'text-[#202124]' : 'text-white'}`}>
              NetCore LLC
            </span>
            <span className={`text-[10px] font-semibold tracking-wider uppercase ${isLight ? 'text-[#5f6368]' : 'text-[#9aa0a6]'}`}>
              CRM Portal
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleTheme}
          title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          className={`p-2 rounded-full border transition-all cursor-pointer ${
            isLight
              ? 'bg-[#f1f3f4] border-[#dadce0] text-[#202124] hover:bg-[#e8f0fe] hover:border-[#1a73e8]'
              : 'bg-[#121316] border-[#2c2f38] text-[#9aa0a6] hover:text-white hover:border-zinc-700'
          }`}
        >
          {isLight ? (
            <Moon className="w-4 h-4 text-[#1a73e8]" />
          ) : (
            <Sun className="w-4 h-4 text-amber-400" />
          )}
        </button>
      </div>

      {/* 2. User Profile Card */}
      <div className={`px-6 py-4 flex items-center space-x-3.5 border-b shrink-0 ${
        isLight ? 'bg-slate-100/70 border-[#dadce0]' : 'bg-[#16181f] border-[#2c2f38]'
      }`}>
        <div className="relative shrink-0">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-inner ${
            isLight 
              ? 'bg-[#1a73e8]/10 border border-[#1a73e8]/30 text-[#1a73e8]' 
              : 'bg-[#1a73e8]/20 border border-[#1a73e8]/40 text-[#4285f4]'
          }`}>
            {currentUser ? currentUser.substring(0, 2).toUpperCase() : 'AD'}
          </div>
          <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 rounded-full shadow-sm ${
            isLight ? 'border-white' : 'border-[#16181f]'
          }`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-xs font-bold truncate ${isLight ? 'text-[#202124]' : 'text-[#e8eaed]'}`}>
            {currentUser ? currentUser.charAt(0).toUpperCase() + currentUser.slice(1) : 'Admin User'}
          </p>
          <p className={`text-[10px] font-semibold uppercase tracking-wider ${isLight ? 'text-[#5f6368]' : 'text-[#9aa0a6]'}`}>
            Administrator
          </p>
        </div>
      </div>

      {/* Scrollable Navigation */}
      <div className="flex-1 overflow-y-auto custom-scrollbar py-4 space-y-5 px-3">
        
        {/* GROUP 1: Pages */}
        <div className="space-y-1">
          <p className={`px-3 text-[10px] font-bold uppercase tracking-widest mb-2 ${isLight ? 'text-[#5f6368]' : 'text-[#9aa0a6]'}`}>
            Navigation
          </p>

          <div className="space-y-1">
            <button
              onClick={() => setIsDashboardsOpen(!isDashboardsOpen)}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold rounded-full transition-all ${
                activeSection === 'dashboard' || activeSection === 'jobs' || activeSection === 'rates' || activeSection === 'employees' || activeSection === 'todo' || activeSection === 'recruiting' || activeSection === 'tickets'
                  ? isLight ? 'text-[#1a73e8] bg-slate-100 font-extrabold' : 'text-white bg-[#1a1c23]'
                  : isLight ? 'text-[#5f6368] hover:text-[#202124] hover:bg-slate-100' : 'text-[#9aa0a6] hover:text-white hover:bg-[#1a1c23]/50'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Sliders className="w-4 h-4 text-[#1a73e8]" />
                <span>Dashboards</span>
              </div>
              {isDashboardsOpen ? (
                <ChevronUp className={`w-3.5 h-3.5 ${isLight ? 'text-[#5f6368]' : 'text-[#9aa0a6]'}`} />
              ) : (
                <ChevronDown className={`w-3.5 h-3.5 ${isLight ? 'text-[#5f6368]' : 'text-[#9aa0a6]'}`} />
              )}
            </button>

            {/* Nested Submenu links */}
            {isDashboardsOpen && (
              <div className="space-y-1 mt-1 pl-2 animate-fadeIn">
                <button
                  onClick={() => handleSectionClick('dashboard')}
                  className={`w-full flex items-center space-x-3 px-4 py-2 text-xs font-semibold rounded-full transition-all text-left ${
                    activeSection === 'dashboard'
                      ? isLight ? 'bg-[#1a73e8]/10 text-[#1a73e8] font-bold border border-[#1a73e8]/30 shadow-sm' : 'bg-[#1a73e8]/15 text-[#4285f4] font-bold border border-[#1a73e8]/30 shadow-sm'
                      : isLight ? 'text-[#5f6368] hover:text-[#202124] hover:bg-slate-100' : 'text-[#9aa0a6] hover:text-white hover:bg-[#1a1c23]'
                  }`}
                >
                  <TrendingUp className={`w-3.5 h-3.5 ${activeSection === 'dashboard' ? (isLight ? 'text-[#1a73e8]' : 'text-[#4285f4]') : (isLight ? 'text-[#5f6368]' : 'text-[#9aa0a6]')}`} />
                  <span>Analytics</span>
                </button>

                <button
                  onClick={() => handleSectionClick('jobs')}
                  className={`w-full flex items-center space-x-3 px-4 py-2 text-xs font-semibold rounded-full transition-all text-left ${
                    activeSection === 'jobs'
                      ? isLight ? 'bg-[#1a73e8]/10 text-[#1a73e8] font-bold border border-[#1a73e8]/30 shadow-sm' : 'bg-[#1a73e8]/15 text-[#4285f4] font-bold border border-[#1a73e8]/30 shadow-sm'
                      : isLight ? 'text-[#5f6368] hover:text-[#202124] hover:bg-slate-100' : 'text-[#9aa0a6] hover:text-white hover:bg-[#1a1c23]'
                  }`}
                >
                  <FileSpreadsheet className={`w-3.5 h-3.5 ${activeSection === 'jobs' ? (isLight ? 'text-[#1a73e8]' : 'text-[#4285f4]') : (isLight ? 'text-[#5f6368]' : 'text-[#9aa0a6]')}`} />
                  <span>Jobs & Payroll</span>
                </button>

                <button
                  onClick={() => handleSectionClick('rates')}
                  className={`w-full flex items-center space-x-3 px-4 py-2 text-xs font-semibold rounded-full transition-all text-left ${
                    activeSection === 'rates'
                      ? isLight ? 'bg-[#1a73e8]/10 text-[#1a73e8] font-bold border border-[#1a73e8]/30 shadow-sm' : 'bg-[#1a73e8]/15 text-[#4285f4] font-bold border border-[#1a73e8]/30 shadow-sm'
                      : isLight ? 'text-[#5f6368] hover:text-[#202124] hover:bg-slate-100' : 'text-[#9aa0a6] hover:text-white hover:bg-[#1a1c23]'
                  }`}
                >
                  <Percent className={`w-3.5 h-3.5 ${activeSection === 'rates' ? (isLight ? 'text-[#1a73e8]' : 'text-[#4285f4]') : (isLight ? 'text-[#5f6368]' : 'text-[#9aa0a6]')}`} />
                  <span>Rate Manager</span>
                </button>

                <button
                  onClick={() => handleSectionClick('employees')}
                  className={`w-full flex items-center space-x-3 px-4 py-2 text-xs font-semibold rounded-full transition-all text-left ${
                    activeSection === 'employees'
                      ? isLight ? 'bg-[#1a73e8]/10 text-[#1a73e8] font-bold border border-[#1a73e8]/30 shadow-sm' : 'bg-[#1a73e8]/15 text-[#4285f4] font-bold border border-[#1a73e8]/30 shadow-sm'
                      : isLight ? 'text-[#5f6368] hover:text-[#202124] hover:bg-slate-100' : 'text-[#9aa0a6] hover:text-white hover:bg-[#1a1c23]'
                  }`}
                >
                  <Wrench className={`w-3.5 h-3.5 ${activeSection === 'employees' ? (isLight ? 'text-[#1a73e8]' : 'text-[#4285f4]') : (isLight ? 'text-[#5f6368]' : 'text-[#9aa0a6]')}`} />
                  <span>Employee Manager</span>
                </button>

                <button
                  onClick={() => handleSectionClick('recruiting')}
                  className={`w-full flex items-center space-x-3 px-4 py-2 text-xs font-semibold rounded-full transition-all text-left ${
                    activeSection === 'recruiting'
                      ? isLight ? 'bg-[#1a73e8]/10 text-[#1a73e8] font-bold border border-[#1a73e8]/30 shadow-sm' : 'bg-[#1a73e8]/15 text-[#4285f4] font-bold border border-[#1a73e8]/30 shadow-sm'
                      : isLight ? 'text-[#5f6368] hover:text-[#202124] hover:bg-slate-100' : 'text-[#9aa0a6] hover:text-white hover:bg-[#1a1c23]'
                  }`}
                >
                  <UserPlus className={`w-3.5 h-3.5 ${activeSection === 'recruiting' ? (isLight ? 'text-[#1a73e8]' : 'text-[#4285f4]') : (isLight ? 'text-[#5f6368]' : 'text-[#9aa0a6]')}`} />
                  <span>Recruiting & HR</span>
                </button>

                <button
                  onClick={() => handleSectionClick('tickets')}
                  className={`w-full flex items-center justify-between px-4 py-2 text-xs font-semibold rounded-full transition-all text-left ${
                    activeSection === 'tickets'
                      ? isLight ? 'bg-[#1a73e8]/10 text-[#1a73e8] font-bold border border-[#1a73e8]/30 shadow-sm' : 'bg-[#1a73e8]/15 text-[#4285f4] font-bold border border-[#1a73e8]/30 shadow-sm'
                      : isLight ? 'text-[#5f6368] hover:text-[#202124] hover:bg-slate-100' : 'text-[#9aa0a6] hover:text-white hover:bg-[#1a1c23]'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <MessageSquare className={`w-3.5 h-3.5 ${activeSection === 'tickets' ? (isLight ? 'text-[#1a73e8]' : 'text-[#4285f4]') : (isLight ? 'text-[#5f6368]' : 'text-[#9aa0a6]')}`} />
                    <span>Tickets & Leads</span>
                  </div>
                  {ticketsCount > 0 && (
                    <span className="px-2 py-0.5 text-[9px] font-extrabold bg-[#1a73e8] text-white rounded-full shadow-sm animate-pulse">
                      {ticketsCount} NEW
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* GROUP 2: Contractors control */}
        <div className={`space-y-1 border-t pt-4 ${isLight ? 'border-[#dadce0]' : 'border-[#2c2f38]'}`}>
          <p className={`px-3 text-[10px] font-bold uppercase tracking-widest mb-2 ${isLight ? 'text-[#5f6368]' : 'text-[#9aa0a6]'}`}>
            Contractors
          </p>

          <div className="space-y-1">
            <button
              onClick={() => setIsEmployeesOpen(!isEmployeesOpen)}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold transition-colors ${
                isLight ? 'text-[#202124] hover:bg-slate-100' : 'text-[#e8eaed] hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Users className="w-4 h-4 text-[#1a73e8]" />
                <span>Field Technicians</span>
              </div>
              {isEmployeesOpen ? (
                <ChevronUp className={`w-3.5 h-3.5 ${isLight ? 'text-[#5f6368]' : 'text-[#9aa0a6]'}`} />
              ) : (
                <ChevronDown className={`w-3.5 h-3.5 ${isLight ? 'text-[#5f6368]' : 'text-[#9aa0a6]'}`} />
              )}
            </button>

            {isEmployeesOpen && (
              <div className="px-1 space-y-2.5 mt-2 mb-1 animate-fadeIn">
                {/* Search Input */}
                <div className="relative">
                  <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isLight ? 'text-[#5f6368]' : 'text-[#9aa0a6]'}`} />
                  <input
                    type="text"
                    placeholder="Search name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full rounded-full pl-9 pr-3 py-1.5 text-xs focus:outline-none transition-colors font-medium border ${
                      isLight 
                        ? 'bg-slate-100 border-[#dadce0] text-[#202124] placeholder-[#80868b] focus:border-[#1a73e8]' 
                        : 'bg-[#1a1c23] border-[#2c2f38] text-[#e8eaed] placeholder-[#6e737d] focus:border-[#1a73e8]'
                    }`}
                  />
                </div>

                {/* Filters Pill Switcher */}
                <div className={`p-1 rounded-full border flex gap-0.5 text-[9px] font-bold text-center ${
                  isLight ? 'bg-slate-100 border-[#dadce0]' : 'bg-[#1a1c23] border-[#2c2f38]'
                }`}>
                  {(['ALL', 'ONBOARDING', 'TRAINING', 'ACTIVE', 'INACTIVE'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`flex-1 py-1 px-1 rounded-full transition-all cursor-pointer truncate ${
                        statusFilter === status 
                          ? 'bg-[#1a73e8] text-white shadow-sm font-extrabold' 
                          : isLight ? 'text-[#5f6368] hover:text-[#202124] font-semibold' : 'text-[#9aa0a6] hover:text-white font-semibold'
                      }`}
                      title={status}
                    >
                      {status === 'ALL' ? 'All' : status === 'ONBOARDING' ? 'Hiring' : status === 'TRAINING' ? 'Train' : status === 'ACTIVE' ? 'Active' : 'Off'}
                    </button>
                  ))}
                </div>

                {/* Techs Nested List */}
                <div className="space-y-1 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                  {filteredTechs.length === 0 ? (
                    <div className={`py-4 text-center text-[10px] font-semibold italic ${isLight ? 'text-[#80868b]' : 'text-[#6e737d]'}`}>
                      No technicians found
                    </div>
                  ) : (
                    filteredTechs.map((tech) => {
                      const isSelected = selectedTechId === tech.id;
                      const initials = tech.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                      return (
                        <div
                          key={tech.id}
                          onClick={() => handleTechClick(tech.id)}
                          className={`p-2 rounded-full cursor-pointer transition-all border flex items-center space-x-3 px-3 ${
                            isSelected 
                              ? isLight ? 'bg-[#1a73e8]/10 border-[#1a73e8]/30 text-[#1a73e8]' : 'bg-[#1a73e8]/15 border-[#1a73e8]/40 text-white'
                              : isLight ? 'bg-transparent border-transparent hover:bg-slate-100 text-[#5f6368] hover:text-[#202124]' : 'bg-transparent border-transparent hover:bg-[#1a1c23] text-[#9aa0a6] hover:text-white'
                          }`}
                        >
                          {/* Avatar Circle */}
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[9px] font-mono border ${
                            isSelected 
                              ? 'bg-[#1a73e8] text-white border-[#1a73e8]' 
                              : isLight ? 'bg-slate-200 text-[#5f6368] border-[#dadce0]' : 'bg-[#262933] text-[#9aa0a6] border-[#2c2f38]'
                          }`}>
                            {initials || 'T'}
                          </div>
                          
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold truncate">{tech.name}</p>
                            <p className={`text-[8px] font-semibold truncate capitalize ${isLight ? 'text-[#80868b]' : 'text-[#9aa0a6]'}`}>
                              {tech.workType.toLowerCase()} Spec
                            </p>
                          </div>

                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            tech.status === 'ACTIVE' 
                              ? 'bg-emerald-500 shadow-sm shadow-emerald-500/20' 
                              : tech.status === 'TRAINING'
                              ? 'bg-purple-500 shadow-sm shadow-purple-500/20'
                              : tech.status === 'ONBOARDING'
                              ? 'bg-cyan-500 shadow-sm shadow-cyan-500/20'
                              : tech.status === 'SUSPENDED'
                              ? 'bg-rose-500 shadow-sm shadow-rose-500/20'
                              : 'bg-zinc-500'
                          }`} />
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 4. Footer */}
      <div className={`p-4 border-t space-y-3 shrink-0 ${
        isLight ? 'bg-slate-50 border-[#dadce0]' : 'bg-[#16181f] border-[#2c2f38]'
      }`}>
        <div className="flex items-center space-x-2.5 px-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <p className={`text-[10px] font-bold truncate ${isLight ? 'text-[#5f6368]' : 'text-[#9aa0a6]'}`}>
            Session: <span className={`font-extrabold ${isLight ? 'text-[#202124]' : 'text-[#e8eaed]'}`}>{currentUser || 'Admin'}</span>
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={onInviteClick}
            className="flex items-center justify-center space-x-1 text-[10px] font-bold bg-[#1a73e8] hover:bg-[#1557b0] text-white py-2 rounded-full shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <UserPlus className="w-3 h-3" />
            <span>Invite</span>
          </button>
          
          <button 
            onClick={onLogoutClick}
            className={`flex items-center justify-center space-x-1 text-[10px] font-bold bg-transparent border py-2 rounded-full transition-all cursor-pointer active:scale-95 ${
              isLight
                ? 'border-[#dadce0] hover:bg-slate-100 hover:border-[#1a73e8] text-[#5f6368] hover:text-[#1a73e8]'
                : 'border-[#2c2f38] hover:bg-[#1a73e8]/10 hover:border-[#1a73e8] text-[#9aa0a6] hover:text-white'
            }`}
          >
            <LogOut className="w-3 h-3" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

