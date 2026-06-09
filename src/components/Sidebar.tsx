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
  CheckSquare
} from 'lucide-react';
import { technicians as defaultTechs, Technician } from '../data/mockData';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  selectedTechId?: number | null;
  onSelectTechnician?: (techId: number) => void;
  technicians?: Technician[];
  currentUser?: string | null;
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
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Filter technicians
  const filteredTechs = technicians.filter(tech => {
    const matchesSearch = tech.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesStatus = true;
    if (statusFilter === 'ACTIVE') {
      matchesStatus = tech.status === 'ACTIVE';
    } else if (statusFilter === 'INACTIVE') {
      matchesStatus = tech.status === 'INACTIVE' || tech.status === 'SUSPENDED';
    }

    return matchesSearch && matchesStatus;
  });

  return (
    <aside className={`fixed md:relative inset-y-0 left-0 z-40 w-[260px] h-screen bg-[#18181b] flex flex-col text-[#e2e8f0] select-none overflow-hidden shrink-0 font-sans border-r border-zinc-800/40 transition-transform duration-300 ease-in-out md:translate-x-0 ${
      isOpen ? 'translate-x-0 shadow-2xl shadow-black/80' : '-translate-x-full'
    }`}>
      
      {/* 1. Header Logo Block */}
      <div className="h-16 flex items-center px-6 border-b border-zinc-800/40 bg-zinc-950/20">
        <div className="flex items-center space-x-0.5">
          <span className="text-white font-extrabold text-base tracking-wide bg-gradient-to-r from-white via-zinc-100 to-zinc-300 bg-clip-text text-transparent">
            NetCore CRM
          </span>
          <span className="text-blue-500 font-extrabold text-base select-none">.</span>
        </div>
      </div>

      {/* 2. User Profile Card */}
      <div className="px-6 py-5 flex items-center space-x-4 bg-zinc-950/10 border-b border-zinc-800/40">
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-zinc-800 to-zinc-700 border border-zinc-700/80 flex items-center justify-center font-bold text-white text-sm shadow-inner font-mono">
            {currentUser ? currentUser.substring(0, 2).toUpperCase() : 'AD'}
          </div>
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#18181b] rounded-full shadow-sm animate-pulse"></span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between group">
            <p className="text-xs font-bold text-zinc-200 group-hover:text-white truncate">
              {currentUser ? currentUser.charAt(0).toUpperCase() + currentUser.slice(1) : 'Admin User'}
            </p>
          </div>
          <p className="text-[10px] text-zinc-500 mt-0.5 font-semibold uppercase tracking-wider">Administrator</p>
        </div>
      </div>

      {/* Scrollable Navigation */}
      <div className="flex-1 overflow-y-auto custom-scrollbar py-4 space-y-5">
        
        {/* GROUP 1: Pages */}
        <div className="space-y-1">
          <p className="px-6 text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
            Pages
          </p>

          <div className="space-y-1">
            <button
              onClick={() => setIsDashboardsOpen(!isDashboardsOpen)}
              className={`w-full flex items-center justify-between px-6 py-2 text-xs font-bold transition-all relative ${
                activeSection === 'dashboard' || activeSection === 'jobs' || activeSection === 'rates' || activeSection === 'employees' || activeSection === 'todo'
                  ? 'text-slate-100'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Sliders className="w-4 h-4 text-zinc-400" />
                <span>Dashboards</span>
              </div>
              {isDashboardsOpen ? (
                <ChevronUp className="w-3.5 h-3.5 text-zinc-500" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
              )}
            </button>

            {/* Nested Submenu links */}
            {isDashboardsOpen && (
              <div className="px-4 space-y-1 mt-1 animate-fadeIn">
                <button
                  onClick={() => handleSectionClick('dashboard')}
                  className={`w-full flex items-center space-x-3 px-6 py-2 text-xs font-semibold rounded-lg transition-all text-left ${
                    activeSection === 'dashboard'
                      ? 'bg-zinc-800/50 text-white shadow-sm border border-zinc-700/30'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30'
                  }`}
                >
                  <TrendingUp className={`w-3.5 h-3.5 ${activeSection === 'dashboard' ? 'text-blue-400' : 'text-zinc-500'}`} />
                  <span>Analytics</span>
                </button>

                <button
                  onClick={() => handleSectionClick('jobs')}
                  className={`w-full flex items-center space-x-3 px-6 py-2 text-xs font-semibold rounded-lg transition-all text-left ${
                    activeSection === 'jobs'
                      ? 'bg-zinc-800/50 text-white shadow-sm border border-zinc-700/30'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30'
                  }`}
                >
                  <FileSpreadsheet className={`w-3.5 h-3.5 ${activeSection === 'jobs' ? 'text-indigo-400' : 'text-zinc-500'}`} />
                  <span>Jobs Ledger</span>
                </button>

                <button
                  onClick={() => handleSectionClick('rates')}
                  className={`w-full flex items-center space-x-3 px-6 py-2 text-xs font-semibold rounded-lg transition-all text-left ${
                    activeSection === 'rates'
                      ? 'bg-zinc-800/50 text-white shadow-sm border border-zinc-700/30'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30'
                  }`}
                >
                  <Percent className={`w-3.5 h-3.5 ${activeSection === 'rates' ? 'text-emerald-400' : 'text-zinc-500'}`} />
                  <span>Rate Manager</span>
                </button>

                <button
                  onClick={() => handleSectionClick('employees')}
                  className={`w-full flex items-center space-x-3 px-6 py-2 text-xs font-semibold rounded-lg transition-all text-left ${
                    activeSection === 'employees'
                      ? 'bg-zinc-800/50 text-white shadow-sm border border-zinc-700/30'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30'
                  }`}
                >
                  <Wrench className={`w-3.5 h-3.5 ${activeSection === 'employees' ? 'text-amber-400' : 'text-zinc-500'}`} />
                  <span>Employee Manager</span>
                </button>

                <button
                  onClick={() => handleSectionClick('todo')}
                  className={`w-full flex items-center space-x-3 px-6 py-2 text-xs font-semibold rounded-lg transition-all text-left ${
                    activeSection === 'todo'
                      ? 'bg-zinc-800/50 text-white shadow-sm border border-zinc-700/30'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30'
                  }`}
                >
                  <CheckSquare className={`w-3.5 h-3.5 ${activeSection === 'todo' ? 'text-rose-400' : 'text-zinc-500'}`} />
                  <span>Task Manager</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* GROUP 2: Contractors control */}
        <div className="space-y-1 border-t border-zinc-800/40 pt-4">
          <p className="px-6 text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
            Contractors
          </p>

          <div className="space-y-1">
            <button
              onClick={() => setIsEmployeesOpen(!isEmployeesOpen)}
              className="w-full flex items-center justify-between px-6 py-2 text-xs font-bold text-zinc-300 hover:text-white transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Users className="w-4 h-4 text-zinc-400" />
                <span>Field Technicians</span>
              </div>
              {isEmployeesOpen ? (
                <ChevronUp className="w-3.5 h-3.5 text-zinc-500" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
              )}
            </button>

            {isEmployeesOpen && (
              <div className="px-6 space-y-3 mt-2 mb-1 animate-fadeIn">
                {/* Text Filter */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#09090b] border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 placeholder-zinc-600 transition-colors font-medium"
                  />
                </div>

                {/* Filters */}
                <div className="bg-[#09090b] p-0.5 rounded-lg border border-zinc-800/80 flex gap-0.5 text-[10px] font-bold text-center">
                  {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`flex-1 py-1 rounded-md transition-all cursor-pointer ${
                        statusFilter === status 
                          ? 'bg-zinc-800 text-white shadow-sm font-extrabold' 
                          : 'text-zinc-500 hover:text-zinc-300 font-semibold'
                      }`}
                    >
                      {status === 'ALL' ? 'All' : status === 'ACTIVE' ? 'Active' : 'Inactive'}
                    </button>
                  ))}
                </div>

                {/* Techs Nested List */}
                <div className="space-y-1 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                  {filteredTechs.length === 0 ? (
                    <div className="py-4 text-center text-[10px] text-zinc-600 font-semibold italic">
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
                          className={`p-2 rounded-lg cursor-pointer transition-all border flex items-center space-x-3.5 ${
                            isSelected 
                              ? 'bg-zinc-800/60 border-zinc-700/60 text-white'
                              : 'bg-transparent border-transparent hover:bg-zinc-900/30 text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          {/* Avatar Circle */}
                          <div className={`w-6.5 h-6.5 rounded-md flex items-center justify-center font-bold text-[9px] ${
                            isSelected ? 'bg-zinc-700 text-white' : 'bg-zinc-900 text-zinc-500'
                          } font-mono border border-zinc-800`}>
                            {initials || 'T'}
                          </div>
                          
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold truncate">{tech.name}</p>
                            <p className="text-[8px] text-zinc-500 font-semibold truncate capitalize">{tech.workType.toLowerCase()} Spec</p>
                          </div>

                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${tech.status === 'ACTIVE' ? 'bg-emerald-500 shadow-sm shadow-emerald-500/20' : 'bg-zinc-600'}`} />
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
      <div className="p-4 bg-zinc-950/40 border-t border-zinc-800/50 space-y-3">
        <div className="flex items-center space-x-3 px-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-[10px] text-zinc-500 font-bold truncate">
            Session: <span className="text-zinc-400 font-extrabold">{currentUser || 'Admin'}</span>
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={onInviteClick}
            className="flex items-center justify-center space-x-1.5 text-[9px] uppercase tracking-wider bg-zinc-800 border border-zinc-700/60 text-zinc-200 py-2 rounded-lg hover:bg-zinc-700 hover:text-white transition-all cursor-pointer font-bold active:scale-95"
          >
            <UserPlus className="w-3 h-3" />
            <span>Invite</span>
          </button>
          
          <button 
            onClick={onLogoutClick}
            className="flex items-center justify-center space-x-1.5 text-[9px] uppercase tracking-wider bg-zinc-900 border border-zinc-800 text-zinc-400 py-2 rounded-lg hover:bg-zinc-800 hover:text-zinc-200 transition-all cursor-pointer font-bold active:scale-95"
          >
            <LogOut className="w-3 h-3" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
