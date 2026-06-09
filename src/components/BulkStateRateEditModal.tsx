'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Search, 
  Plus, 
  Trash2, 
  Sparkles, 
  MapPin, 
  Info,
  DollarSign,
  Percent,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { RatePlan, State, City } from '../data/mockData';

interface BulkStateRateEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  states: State[];
  cities: City[];
  initialStateCode: string;
  ratePlans: RatePlan[];
  onSave: (updatedPlans: RatePlan[]) => void;
}

type AdjustmentTarget = 'grossPrice' | 'employeePrice' | 'both';
type AdjustmentMode = 'percent' | 'flat';
type AdjustmentAction = 'add' | 'sub' | 'set';

export default function BulkStateRateEditModal({
  isOpen,
  onClose,
  states,
  cities,
  initialStateCode,
  ratePlans,
  onSave
}: BulkStateRateEditModalProps) {
  // We keep a clone of all rate plans locally so we can edit, add, or delete without modifying parent state until saved
  const [draftRatePlans, setDraftRatePlans] = useState<RatePlan[]>([]);
  const [selectedStateCode, setSelectedStateCode] = useState('TN');
  const [searchQuery, setSearchQuery] = useState('');

  // Bulk adjustment form state
  const [adjTarget, setAdjTarget] = useState<AdjustmentTarget>('both');
  const [adjMode, setAdjMode] = useState<AdjustmentMode>('percent');
  const [adjAction, setAdjAction] = useState<AdjustmentAction>('add');
  const [adjValue, setAdjValue] = useState<string>('5');

  // Inline new rate plan form state
  const [newRateCode, setNewRateCode] = useState('');
  const [newRateProvider, setNewRateProvider] = useState('Xfinity');
  const [newRateDesc, setNewRateDesc] = useState('');
  const [newRateGross, setNewRateGross] = useState<string>('');
  const [newRateEmp, setNewRateEmp] = useState<string>('');
  const [newRateCity, setNewRateCity] = useState('');

  // Success indicator message inside modal
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);

  // Initialize draft rate plans and state code when modal opens
  useEffect(() => {
    if (isOpen) {
      setDraftRatePlans(JSON.parse(JSON.stringify(ratePlans))); // Deep copy
      const stateToSelect = initialStateCode === 'ALL' || !initialStateCode 
        ? (states[0]?.code || 'TN') 
        : initialStateCode;
      setSelectedStateCode(stateToSelect);
      setSearchQuery('');
      setAlertMsg(null);
      // Reset new rate form
      setNewRateCode('');
      setNewRateDesc('');
      setNewRateGross('');
      setNewRateEmp('');
      setNewRateCity('');
    }
  }, [isOpen, initialStateCode, ratePlans, states]);

  // Unique list of providers across all existing rate plans for helper autocomplete/dropdown
  const uniqueProviders = useMemo(() => {
    const set = new Set<string>(['Xfinity', 'Spectrum', 'Cox', 'Charter']);
    draftRatePlans.forEach(rp => {
      if (rp.provider) set.add(rp.provider);
    });
    return Array.from(set);
  }, [draftRatePlans]);

  // Selected State Name
  const selectedStateName = useMemo(() => {
    const st = states.find(s => s.code === selectedStateCode);
    return st ? st.name : selectedStateCode;
  }, [selectedStateCode, states]);

  // Cities matching selected state for dropdown
  const filteredCities = useMemo(() => {
    const stateObj = states.find(s => s.code === selectedStateCode);
    return stateObj ? cities.filter(c => c.stateId === stateObj.id) : [];
  }, [selectedStateCode, cities, states]);

  // Filtered rates for the selected state code
  const stateRates = useMemo(() => {
    return draftRatePlans.filter(rp => rp.stateCode === selectedStateCode);
  }, [draftRatePlans, selectedStateCode]);

  // Further filtered by search query
  const displayedRates = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return stateRates;
    return stateRates.filter(rp => 
      rp.code.toLowerCase().includes(query) || 
      (rp.description && rp.description.toLowerCase().includes(query)) ||
      rp.provider.toLowerCase().includes(query) ||
      (rp.cityName && rp.cityName.toLowerCase().includes(query))
    );
  }, [stateRates, searchQuery]);

  if (!isOpen) return null;

  // Perform bulk adjustment
  const handleApplyAdjustment = () => {
    const val = parseFloat(adjValue);
    if (isNaN(val) || val <= 0) {
      setAlertMsg({ type: 'error', text: 'Please enter a valid positive number for adjustment.' });
      return;
    }

    let modifiedCount = 0;
    const updated = draftRatePlans.map(rp => {
      if (rp.stateCode !== selectedStateCode) return rp;
      
      modifiedCount++;
      let newGross = rp.grossPrice;
      let newEmp = rp.employeePrice;

      if (adjTarget === 'grossPrice' || adjTarget === 'both') {
        if (adjMode === 'percent') {
          if (adjAction === 'add') newGross = newGross * (1 + val / 100);
          if (adjAction === 'sub') newGross = newGross * (1 - val / 100);
        } else {
          if (adjAction === 'add') newGross = newGross + val;
          if (adjAction === 'sub') newGross = newGross - val;
          if (adjAction === 'set') newGross = val;
        }
      }

      if (adjTarget === 'employeePrice' || adjTarget === 'both') {
        if (adjMode === 'percent') {
          if (adjAction === 'add') newEmp = newEmp * (1 + val / 100);
          if (adjAction === 'sub') newEmp = newEmp * (1 - val / 100);
        } else {
          if (adjAction === 'add') newEmp = newEmp + val;
          if (adjAction === 'sub') newEmp = newEmp - val;
          if (adjAction === 'set') newEmp = val;
        }
      }

      // Round to 2 decimals
      return {
        ...rp,
        grossPrice: Math.max(0, Math.round(newGross * 100) / 100),
        employeePrice: Math.max(0, Math.round(newEmp * 100) / 100)
      };
    });

    setDraftRatePlans(updated);
    setAlertMsg({
      type: 'success',
      text: `Successfully applied bulk adjustment to ${modifiedCount} rates for state ${selectedStateCode}.`
    });
  };

  // Handle individual inline changes
  const handleRateChange = (id: number, field: keyof RatePlan, value: any) => {
    setDraftRatePlans(prev => prev.map(rp => {
      if (rp.id !== id) return rp;
      
      let parsedValue = value;
      if (field === 'grossPrice' || field === 'employeePrice') {
        parsedValue = parseFloat(value);
        if (isNaN(parsedValue)) parsedValue = 0;
      }
      
      return {
        ...rp,
        [field]: parsedValue
      };
    }));
  };

  // Inline delete
  const handleDeleteRate = (id: number) => {
    setDraftRatePlans(prev => prev.filter(rp => rp.id !== id));
    setAlertMsg({ type: 'info', text: 'Rate plan staged for deletion.' });
  };

  // Inline add new rate
  const handleAddNewRate = (e: React.FormEvent) => {
    e.preventDefault();
    const code = newRateCode.trim().toUpperCase();
    if (!code) {
      setAlertMsg({ type: 'error', text: 'Please enter a rate code.' });
      return;
    }

    // Check for duplicate in selected state
    if (draftRatePlans.some(rp => rp.stateCode === selectedStateCode && rp.code === code)) {
      setAlertMsg({ type: 'error', text: `Rate code "${code}" already exists for state ${selectedStateCode}.` });
      return;
    }

    const gross = parseFloat(newRateGross);
    const emp = parseFloat(newRateEmp);
    if (isNaN(gross) || isNaN(emp)) {
      setAlertMsg({ type: 'error', text: 'Please enter valid numbers for Company Rate and Employee Rate.' });
      return;
    }

    // Unique ID
    const newId = Math.max(0, ...draftRatePlans.map(rp => rp.id)) + 1;
    const newPlan: RatePlan = {
      id: newId,
      provider: newRateProvider,
      stateCode: selectedStateCode,
      cityName: newRateCity ? newRateCity : undefined,
      code,
      description: newRateDesc.trim() || `Residential ${code} code`,
      grossPrice: gross,
      employeePrice: emp
    };

    setDraftRatePlans(prev => [...prev, newPlan]);
    
    // Reset inputs
    setNewRateCode('');
    setNewRateDesc('');
    setNewRateGross('');
    setNewRateEmp('');
    setNewRateCity('');
    
    setAlertMsg({ type: 'success', text: `Successfully added new rate code ${code} to ${selectedStateCode}.` });
  };

  const handleSave = () => {
    // Save draft back to parent
    onSave(draftRatePlans);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#09090b]/90 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] overflow-hidden flex flex-col animate-slideUp">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-[#09090b]/40 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-800/30 text-zinc-100 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100 tracking-wide flex items-center">
                Bulk Edit State Rates
                <span className="ml-2 bg-[#27272a] text-slate-300 font-mono text-[10px] px-2 py-0.5 rounded font-semibold border border-zinc-700">
                  {selectedStateCode} - {selectedStateName}
                </span>
              </h4>
              <p className="text-[10px] text-zinc-400">
                Modify pricing matrices for the entire state, scale rates by percentages, and manage active codes.
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* State selector dropdown */}
            <div className="flex items-center space-x-1.5 bg-[#09090b] border border-[#27272a] rounded px-2 py-1 text-xs text-slate-300">
              <span className="text-[9px] uppercase font-bold text-zinc-500">Edit State:</span>
              <select 
                value={selectedStateCode} 
                onChange={(e) => {
                  setSelectedStateCode(e.target.value);
                  setAlertMsg(null);
                }}
                className="bg-transparent border-none text-zinc-200 focus:outline-none cursor-pointer text-xs font-semibold"
              >
                {states.map(s => (
                  <option key={s.code} value={s.code} className="bg-[#18181b]">{s.code} - {s.name}</option>
                ))}
              </select>
            </div>

            <button 
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-full hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Info / Alert Banner */}
        {alertMsg && (
          <div className={`px-6 py-2.5 flex items-center space-x-2 text-xs shrink-0 border-b ${
            alertMsg.type === 'success' ? 'bg-zinc-800/30 border-emerald-500/20 text-zinc-300' :
            alertMsg.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
            'bg-zinc-800/30 border-blue-500/20 text-zinc-300'
          }`}>
            {alertMsg.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : 
             alertMsg.type === 'error' ? <AlertTriangle className="w-4 h-4 shrink-0" /> : 
             <Info className="w-4 h-4 shrink-0" />}
            <span>{alertMsg.text}</span>
          </div>
        )}

        {/* Modal Body (Split: Top bulk adjuster, Bottom scrollable table) */}
        <div className="flex-1 overflow-hidden p-6 flex flex-col space-y-5 min-h-0 bg-[#18181b]">
          
          {/* Top Adjustments Block */}
          <div className="bg-[#09090b]/60 border border-zinc-800/80 p-4 rounded-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0">
            <div className="space-y-1">
              <h5 className="text-xs font-bold text-zinc-200 flex items-center">
                <Sparkles className="w-3.5 h-3.5 text-zinc-300 mr-1.5" />
                Bulk Adjust State Rates
              </h5>
              <p className="text-[10px] text-zinc-500">
                Perform calculations across all {stateRates.length} rates in {selectedStateCode} simultaneously.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Target */}
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-zinc-500 mb-1">Target Rate</span>
                <select
                  value={adjTarget}
                  onChange={(e) => setAdjTarget(e.target.value as AdjustmentTarget)}
                  className="bg-[#09090b] border border-[#27272a] text-zinc-200 text-xs px-2 py-1.5 rounded focus:outline-none focus:border-blue-500"
                >
                  <option value="both">Both (Co & Tech)</option>
                  <option value="grossPrice">Company Rate Only</option>
                  <option value="employeePrice">Tech Payout Only</option>
                </select>
              </div>

              {/* Mode */}
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-zinc-500 mb-1">Type</span>
                <select
                  value={adjMode}
                  onChange={(e) => {
                    const m = e.target.value as AdjustmentMode;
                    setAdjMode(m);
                    if (m === 'percent' && adjAction === 'set') {
                      setAdjAction('add');
                    }
                  }}
                  className="bg-[#09090b] border border-[#27272a] text-zinc-200 text-xs px-2 py-1.5 rounded focus:outline-none focus:border-blue-500"
                >
                  <option value="percent">Percentage (%)</option>
                  <option value="flat">Flat Amount ($)</option>
                </select>
              </div>

              {/* Action */}
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-zinc-500 mb-1">Action</span>
                <select
                  value={adjAction}
                  onChange={(e) => setAdjAction(e.target.value as AdjustmentAction)}
                  className="bg-[#09090b] border border-[#27272a] text-zinc-200 text-xs px-2 py-1.5 rounded focus:outline-none focus:border-blue-500"
                >
                  <option value="add">Increase (+)</option>
                  <option value="sub">Decrease (-)</option>
                  {adjMode === 'flat' && <option value="set">Set To (=)</option>}
                </select>
              </div>

              {/* Value */}
              <div className="flex flex-col w-20">
                <span className="text-[9px] uppercase font-bold text-zinc-500 mb-1">Value</span>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    step="0.01"
                    value={adjValue}
                    onChange={(e) => setAdjValue(e.target.value)}
                    className="w-full bg-[#09090b] border border-[#27272a] text-zinc-200 text-xs px-2 py-1.5 rounded focus:outline-none focus:border-blue-500 font-mono text-center"
                    placeholder="5"
                  />
                  <span className="absolute right-1 text-[10px] text-zinc-500 font-semibold pointer-events-none">
                    {adjMode === 'percent' ? '%' : '$'}
                  </span>
                </div>
              </div>

              {/* Button */}
              <button
                type="button"
                onClick={handleApplyAdjustment}
                className="mt-4 bg-zinc-100 text-zinc-950 text-xs font-bold px-4 py-2 rounded hover:bg-zinc-200 transition-colors shadow-lg shadow-zinc-500/5 cursor-pointer"
              >
                Apply to State
              </button>
            </div>
          </div>

          {/* Table Container Header: Search & Info */}
          <div className="flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
              <span>Rate Sheet Entries:</span>
              <span className="bg-[#09090b] border border-zinc-800 text-zinc-400 font-mono text-[11px] px-2 py-0.5 rounded font-black">
                {displayedRates.length} of {stateRates.length} codes
              </span>
            </div>

            {/* Search Input */}
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search rate codes..."
                className="w-full bg-[#09090b] border border-[#27272a] text-zinc-200 text-xs pl-8 pr-3 py-1.5 rounded focus:outline-none focus:border-blue-500 placeholder-slate-500"
              />
            </div>
          </div>

          {/* Rates Table (Scrollable) */}
          <div className="flex-1 overflow-y-auto border border-zinc-800/80 rounded-lg min-h-0 bg-[#09090b]/20">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#09090b]/80 text-zinc-400 uppercase text-[9px] font-black tracking-wider border-b border-zinc-800/80 sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-4 w-[120px]">Provider</th>
                  <th className="py-2.5 px-4 w-[110px]">Job Code</th>
                  <th className="py-2.5 px-4 w-[120px]">City/Region</th>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4 w-[110px] text-right">Company Rate ($)</th>
                  <th className="py-2.5 px-4 w-[110px] text-right">Tech Payout ($)</th>
                  <th className="py-2.5 px-4 w-[140px] text-right">Est. Retention</th>
                  <th className="py-2.5 px-4 w-[50px] text-center">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {displayedRates.length > 0 ? (
                  displayedRates.map((rate) => {
                    const marginVal = rate.grossPrice - rate.employeePrice;
                    const marginPct = rate.grossPrice > 0 ? (marginVal / rate.grossPrice) * 100 : 0;
                    const isNegativeMargin = marginVal < 0;

                    return (
                      <tr key={rate.id} className="hover:bg-[#09090b]/30 transition-colors group">
                        {/* Provider */}
                        <td className="p-3">
                          <select
                            value={rate.provider}
                            onChange={(e) => handleRateChange(rate.id, 'provider', e.target.value)}
                            className="w-full bg-[#09090b] border border-zinc-800 hover:border-zinc-700 text-zinc-200 text-xs px-1.5 py-1 rounded focus:outline-none focus:border-blue-500 font-semibold"
                          >
                            {uniqueProviders.map(p => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                        </td>

                        {/* Code */}
                        <td className="p-3">
                          <input
                            type="text"
                            value={rate.code}
                            onChange={(e) => handleRateChange(rate.id, 'code', e.target.value.toUpperCase())}
                            className="w-full bg-[#09090b] border border-zinc-800 hover:border-zinc-700 text-zinc-200 text-xs px-2 py-1 rounded focus:outline-none focus:border-blue-500 font-mono font-bold"
                          />
                        </td>

                        {/* City */}
                        <td className="p-3">
                          <select
                            value={rate.cityName || ''}
                            onChange={(e) => handleRateChange(rate.id, 'cityName', e.target.value || undefined)}
                            className="w-full bg-[#09090b] border border-zinc-800 hover:border-zinc-700 text-zinc-200 text-xs px-1.5 py-1 rounded focus:outline-none focus:border-blue-500 font-semibold"
                          >
                            <option value="">Statewide</option>
                            {filteredCities.map(c => (
                              <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                          </select>
                        </td>

                        {/* Description */}
                        <td className="p-3">
                          <input
                            type="text"
                            value={rate.description}
                            onChange={(e) => handleRateChange(rate.id, 'description', e.target.value)}
                            className="w-full bg-[#09090b] border border-zinc-800 hover:border-zinc-700 text-slate-300 text-xs px-2 py-1 rounded focus:outline-none focus:border-blue-500"
                          />
                        </td>

                        {/* Company Rate */}
                        <td className="p-3 text-right">
                          <div className="relative flex items-center justify-end">
                            <span className="absolute left-2.5 text-zinc-500 font-mono font-semibold">$</span>
                            <input
                              type="number"
                              step="0.01"
                              value={rate.grossPrice || ''}
                              onChange={(e) => handleRateChange(rate.id, 'grossPrice', e.target.value)}
                              className="w-24 bg-[#09090b] border border-zinc-800 hover:border-zinc-700 text-zinc-100 text-right text-xs pl-6 pr-2 py-1 rounded focus:outline-none focus:border-blue-500 font-mono font-bold"
                            />
                          </div>
                        </td>

                        {/* Employee Rate */}
                        <td className="p-3 text-right">
                          <div className="relative flex items-center justify-end">
                            <span className="absolute left-2.5 text-zinc-500 font-mono font-semibold">$</span>
                            <input
                              type="number"
                              step="0.01"
                              value={rate.employeePrice || ''}
                              onChange={(e) => handleRateChange(rate.id, 'employeePrice', e.target.value)}
                              className="w-24 bg-[#09090b] border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-right text-xs pl-6 pr-2 py-1 rounded focus:outline-none focus:border-blue-500 font-mono font-bold"
                            />
                          </div>
                        </td>

                        {/* Margin */}
                        <td className="p-3 text-right text-[11px] font-mono">
                          <span className={isNegativeMargin ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                            ${marginVal.toFixed(2)}
                          </span>
                          <span className={`text-[10px] ml-1.5 font-bold ${
                            isNegativeMargin ? 'text-rose-500/80 bg-rose-500/10 px-1 rounded' : 'text-zinc-400'
                          }`}>
                            ({marginPct.toFixed(0)}%)
                          </span>
                        </td>

                        {/* Delete button */}
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteRate(rate.id)}
                            className="text-zinc-500 hover:text-rose-400 p-1 rounded hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Delete Rate Plan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-zinc-500 italic">
                      No rate plans found matching the filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Inline Add Rate Code Form */}
          <form onSubmit={handleAddNewRate} className="bg-[#09090b]/40 border border-zinc-800 p-3.5 rounded-lg shrink-0 space-y-3">
            <h5 className="text-[11px] uppercase font-bold text-zinc-400 flex items-center tracking-wide">
              <Plus className="w-3.5 h-3.5 text-zinc-300 mr-1.5" />
              Quick Add Rate Plan to {selectedStateCode}
            </h5>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
              {/* Provider */}
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-zinc-500">Provider</label>
                <select
                  value={newRateProvider}
                  onChange={(e) => setNewRateProvider(e.target.value)}
                  className="w-full bg-[#09090b] border border-[#27272a] text-zinc-200 text-xs px-2 py-1.5 rounded focus:outline-none focus:border-blue-500 font-semibold"
                >
                  {uniqueProviders.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* Job Code */}
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-zinc-500">Rate Code</label>
                <input
                  type="text"
                  value={newRateCode}
                  onChange={(e) => setNewRateCode(e.target.value)}
                  placeholder="e.g. RFSP"
                  className="w-full bg-[#09090b] border border-[#27272a] text-zinc-200 text-xs px-2.5 py-1.5 rounded focus:outline-none focus:border-blue-500 font-mono font-bold uppercase"
                />
              </div>

              {/* City */}
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-zinc-500">Region/City</label>
                <select
                  value={newRateCity}
                  onChange={(e) => setNewRateCity(e.target.value)}
                  className="w-full bg-[#09090b] border border-[#27272a] text-zinc-200 text-xs px-2 py-1.5 rounded focus:outline-none focus:border-blue-500 font-semibold"
                >
                  <option value="">Statewide</option>
                  {filteredCities.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="space-y-1 lg:col-span-1">
                <label className="text-[9px] uppercase font-bold text-zinc-500">Description</label>
                <input
                  type="text"
                  value={newRateDesc}
                  onChange={(e) => setNewRateDesc(e.target.value)}
                  placeholder="e.g. Residential Install"
                  className="w-full bg-[#09090b] border border-[#27272a] text-zinc-200 text-xs px-2.5 py-1.5 rounded focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Company Rate */}
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-zinc-500">Company Rate ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newRateGross}
                  onChange={(e) => setNewRateGross(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-[#09090b] border border-[#27272a] text-zinc-100 text-xs px-2.5 py-1.5 rounded focus:outline-none focus:border-blue-500 font-mono font-bold"
                />
              </div>

              {/* Employee Rate */}
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-zinc-500">Tech Payout ($)</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    step="0.01"
                    value={newRateEmp}
                    onChange={(e) => setNewRateEmp(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-[#09090b] border border-[#27272a] text-zinc-300 text-xs px-2.5 py-1.5 rounded focus:outline-none focus:border-blue-500 font-mono font-bold"
                  />
                  <button
                    type="submit"
                    className="bg-zinc-800 hover:bg-zinc-700 text-white p-2 rounded transition-colors flex items-center justify-center shrink-0 cursor-pointer"
                    title="Add to table"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </form>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-[#09090b]/50 flex items-center justify-between shrink-0">
          <span className="text-[10px] text-zinc-400 italic">
            * Changes are only saved permanently when you click "Save Changes".
          </span>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-zinc-700 text-slate-300 rounded text-xs font-semibold hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-zinc-100 text-zinc-950 rounded text-xs font-bold hover:bg-zinc-200 transition-colors shadow-lg shadow-zinc-500/5 cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
