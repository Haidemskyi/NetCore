'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Upload, 
  HelpCircle, 
  Check, 
  AlertTriangle, 
  Trash2, 
  Sparkles,
  Info,
  MapPin,
  CheckCircle,
  FileSpreadsheet
} from 'lucide-react';
import { RatePlan, State, City } from '../data/mockData';

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

interface BulkRateImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (newRates: Omit<RatePlan, 'id'>[], overwriteDuplicates: boolean) => void;
  defaultStateCode?: string;
  states: State[];
  cities: City[];
  onAddState: (code: string, name: string) => void;
  onAddCity: (name: string, stateCode: string) => void;
  customAlert: (message: string, title?: string) => Promise<boolean>;
}

type LayoutMode = 'side_by_side' | 'single_table' | 'company_only' | 'employee_only';

export default function BulkRateImportModal({
  isOpen,
  onClose,
  onImport,
  defaultStateCode = 'TN',
  states,
  cities,
  onAddState,
  onAddCity,
  customAlert
}: BulkRateImportModalProps) {
  // Configuration State
  const [provider, setProvider] = useState('Xfinity');
  const [stateCode, setStateCode] = useState(defaultStateCode);
  const [selectedCityName, setSelectedCityName] = useState('');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('side_by_side');
  
  // Inline Add geography states
  const [isAddingState, setIsAddingState] = useState(false);
  const [newStateCode, setNewStateCode] = useState('');
  const [newStateName, setNewStateName] = useState('');

  const [isAddingCity, setIsAddingCity] = useState(false);
  const [newCityName, setNewCityName] = useState('');

  // Auto-calculator states
  const [autoCalc, setAutoCalc] = useState(false);
  const [retentionPercent, setRetentionPercent] = useState(35);

  // Data Input State
  const [pastedText, setPastedText] = useState('');
  const [hasHeader, setHasHeader] = useState(false);
  const [overwriteDuplicates, setOverwriteDuplicates] = useState(true);

  // Column Mapping state
  // Left table (Company in side_by_side, or main table in others)
  const [colMap, setColMap] = useState({
    compCode: -1,
    compDesc: -1,
    compPrice: -1,
    empCode: -1,
    empDesc: -1,
    empPrice: -1
  });

  const activeProvider = provider.trim();

  // Split pasted text into rows and columns
  const parsedGrid = useMemo(() => {
    if (!pastedText.trim()) return [];
    
    // Split by carriage return/newline
    const lines = pastedText.split(/\r?\n/);
    const grid = lines
      .map(line => line.split('\t').map(cell => cell.trim()))
      .filter(row => row.length > 0 && row.some(cell => cell !== ''));
      
    return grid;
  }, [pastedText]);

  // Max number of columns in the parsed data
  const maxColsCount = useMemo(() => {
    return parsedGrid.reduce((max, row) => Math.max(max, row.length), 0);
  }, [parsedGrid]);

  // Determine headers if present
  const headers = useMemo(() => {
    if (parsedGrid.length === 0) return [];
    if (hasHeader) {
      return parsedGrid[0];
    }
    // Default column names
    return Array.from({ length: maxColsCount }).map((_, i) => `Col ${String.fromCharCode(65 + i)}`);
  }, [parsedGrid, hasHeader, maxColsCount]);

  // Heuristically detect columns whenever grid changes
  useEffect(() => {
    if (parsedGrid.length === 0) return;

    const startRowIdx = hasHeader ? 1 : 0;
    const dataRows = parsedGrid.slice(startRowIdx);

    // Heuristics:
    // 1. Identify numeric columns
    // 2. Identify short uppercase alphanumeric codes
    // 3. Identify descriptions (longer strings)
    const colStats = Array.from({ length: maxColsCount }).map((_, colIdx) => {
      let numericCount = 0;
      let codeCount = 0;
      let textCount = 0;
      let filledCount = 0;

      dataRows.forEach(row => {
        if (colIdx >= row.length) return;
        const val = row[colIdx];
        if (!val) return;
        filledCount++;

        // Clean price values (remove $, commas, etc.)
        const cleanedPrice = val.replace(/[$,]/g, '');
        const isNum = !isNaN(parseFloat(cleanedPrice)) && isFinite(Number(cleanedPrice));
        if (isNum) numericCount++;

        const isCode = /^[A-Z0-9_-]{2,10}$/i.test(val) && isNaN(Number(val));
        if (isCode) codeCount++;
        else if (val.length > 8) textCount++;
      });

      return {
        colIdx,
        numericCount,
        codeCount,
        textCount,
        filledCount,
        isNumeric: numericCount > filledCount * 0.4,
        isCode: codeCount > filledCount * 0.3,
        isText: textCount > filledCount * 0.4
      };
    });

    // Reset column map
    let compCode = -1;
    let compDesc = -1;
    let compPrice = -1;
    let empCode = -1;
    let empDesc = -1;
    let empPrice = -1;

    if (layoutMode === 'side_by_side') {
      // Find code columns
      const codeCols = colStats.filter(c => c.isCode).map(c => c.colIdx);
      const priceCols = colStats.filter(c => c.isNumeric).map(c => c.colIdx);
      const textCols = colStats.filter(c => c.isText).map(c => c.colIdx);

      // We want to map:
      // Table 1 (Left): compCode, compDesc, compPrice
      // Table 2 (Right): empCode, empDesc, empPrice
      if (codeCols.length >= 2) {
        compCode = codeCols[0];
        empCode = codeCols[1];
      } else if (codeCols.length === 1) {
        compCode = codeCols[0];
        empCode = codeCols[0]; // fallback to same code
      } else {
        // Guess by typical layout
        compCode = 1;
        empCode = maxColsCount > 5 ? 5 : (maxColsCount > 4 ? 4 : 1);
      }

      // Match prices
      if (priceCols.length >= 2) {
        // Check if employee is on left or right. Usually company is left, employee is right
        // Wait, check header text for clues
        const firstRow = parsedGrid[0] || [];
        const isEmployeeLeft = firstRow.some((h, idx) => 
          idx < maxColsCount / 2 && h.toLowerCase().includes('employee')
        );

        if (isEmployeeLeft) {
          empPrice = priceCols[0];
          compPrice = priceCols[1];
        } else {
          compPrice = priceCols[0];
          empPrice = priceCols[1];
        }
      } else if (priceCols.length === 1) {
        compPrice = priceCols[0];
        empPrice = priceCols[0];
      }

      // Match descriptions
      if (textCols.length >= 2) {
        compDesc = textCols[0];
        empDesc = textCols[1];
      } else if (textCols.length === 1) {
        compDesc = textCols[0];
        empDesc = textCols[0];
      } else {
        compDesc = compCode - 1 >= 0 ? compCode - 1 : -1;
        empDesc = empCode - 1 >= 0 ? empCode - 1 : -1;
      }
    } else {
      // Single table or pricing-specific tables
      const codeCols = colStats.filter(c => c.isCode).map(c => c.colIdx);
      const priceCols = colStats.filter(c => c.isNumeric).map(c => c.colIdx);
      const textCols = colStats.filter(c => c.isText).map(c => c.colIdx);

      compCode = codeCols.length > 0 ? codeCols[0] : 0;
      compDesc = textCols.length > 0 ? textCols[0] : (compCode + 1 < maxColsCount ? compCode + 1 : -1);

      if (layoutMode === 'single_table') {
        if (priceCols.length >= 2) {
          compPrice = priceCols[0];
          empPrice = priceCols[1];
        } else if (priceCols.length === 1) {
          compPrice = priceCols[0];
          empPrice = priceCols[0];
        }
      } else if (layoutMode === 'company_only') {
        compPrice = priceCols.length > 0 ? priceCols[0] : 1;
      } else if (layoutMode === 'employee_only') {
        empPrice = priceCols.length > 0 ? priceCols[0] : 1;
      }
    }

    setColMap({
      compCode: compCode < maxColsCount ? compCode : -1,
      compDesc: compDesc < maxColsCount ? compDesc : -1,
      compPrice: compPrice < maxColsCount ? compPrice : -1,
      empCode: empCode < maxColsCount ? empCode : -1,
      empDesc: empDesc < maxColsCount ? empDesc : -1,
      empPrice: empPrice < maxColsCount ? empPrice : -1
    });

  }, [parsedGrid, layoutMode, hasHeader, maxColsCount]);

  // Clean raw price text into parsed float
  const cleanPrice = (val?: string): number => {
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

  // Compile individual rates from parsed copy-paste based on active mapping
  const compiledRates = useMemo(() => {
    if (parsedGrid.length === 0) return [];

    const startRowIdx = hasHeader ? 1 : 0;
    const dataRows = parsedGrid.slice(startRowIdx);
    
    const ratesMap = new Map<string, Omit<RatePlan, 'id'>>();

    dataRows.forEach((row) => {
      // Helper to grab cell value safely
      const getVal = (colIdx: number) => (colIdx >= 0 && colIdx < row.length) ? row[colIdx] : '';

      if (layoutMode === 'side_by_side') {
        // Left side table: Company
        const codeL = getVal(colMap.compCode).toUpperCase();
        const descL = getVal(colMap.compDesc);
        const priceL = cleanPrice(getVal(colMap.compPrice));

        // Right side table: Employee
        const codeR = getVal(colMap.empCode).toUpperCase();
        const descR = getVal(colMap.empDesc);
        const priceR = cleanPrice(getVal(colMap.empPrice));

        // Let's create rates for both codes if they differ, or merge them if they match!
        if (codeL && codeL === codeR) {
          ratesMap.set(codeL, {
            provider: activeProvider,
            stateCode,
            cityName: selectedCityName || undefined,
            code: codeL,
            description: sanitizeDescription(descL || descR),
            grossPrice: priceL,
            employeePrice: autoCalc ? priceL * (1 - retentionPercent / 100) : priceR
          });
        } else {
          // Process Company Left Side
          if (codeL) {
            const existing = ratesMap.get(codeL);
            ratesMap.set(codeL, {
              provider: activeProvider,
              stateCode,
              cityName: selectedCityName || undefined,
              code: codeL,
              description: sanitizeDescription(descL) || existing?.description || '',
              grossPrice: priceL,
              employeePrice: autoCalc ? priceL * (1 - retentionPercent / 100) : (existing?.employeePrice || 0)
            });
          }
          // Process Employee Right Side
          if (codeR) {
            const existing = ratesMap.get(codeR);
            ratesMap.set(codeR, {
              provider: activeProvider,
              stateCode,
              cityName: selectedCityName || undefined,
              code: codeR,
              description: sanitizeDescription(descR) || existing?.description || '',
              grossPrice: existing?.grossPrice || 0,
              employeePrice: autoCalc ? (existing?.grossPrice || 0) * (1 - retentionPercent / 100) : priceR
            });
          }
        }
      } else {
        // Single Table / Company Only / Employee Only
        const code = getVal(colMap.compCode).toUpperCase();
        if (!code) return;

        const desc = getVal(colMap.compDesc);
        const grossPrice = layoutMode === 'employee_only' ? 0 : cleanPrice(getVal(colMap.compPrice));
        let employeePrice = layoutMode === 'company_only' ? 0 : cleanPrice(getVal(colMap.empPrice));

        if (autoCalc) {
          employeePrice = grossPrice * (1 - retentionPercent / 100);
        }

        ratesMap.set(code, {
          provider: activeProvider,
          stateCode,
          cityName: selectedCityName || undefined,
          code,
          description: sanitizeDescription(desc),
          grossPrice,
          employeePrice
        });
      }
    });

    return Array.from(ratesMap.values());
  }, [parsedGrid, layoutMode, colMap, activeProvider, stateCode, selectedCityName, autoCalc, retentionPercent, hasHeader]);

  // State to filter compiled rates locally (in preview) or manually edit
  const [editedRates, setEditedRates] = useState<Omit<RatePlan, 'id'>[]>([]);

  useEffect(() => {
    setEditedRates(compiledRates);
  }, [compiledRates]);

  const handleRemoveRate = (code: string) => {
    setEditedRates(prev => prev.filter(r => r.code !== code));
  };

  const handleRateFieldChange = (code: string, field: 'description' | 'grossPrice' | 'employeePrice', value: string) => {
    setEditedRates(prev => prev.map(r => {
      if (r.code !== code) return r;
      if (field === 'description') return { ...r, description: value };
      const parsedVal = parseFloat(value) || 0;
      if (field === 'grossPrice' && autoCalc) {
        return { 
          ...r, 
          grossPrice: parsedVal, 
          employeePrice: parsedVal * (1 - retentionPercent / 100) 
        };
      }
      return { ...r, [field]: parsedVal };
    }));
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProvider) {
      await customAlert('Please specify a Provider', 'Validation Error');
      return;
    }
    const finalRates = editedRates.filter(r => r.code.trim() !== '');
    if (finalRates.length === 0) {
      await customAlert('No valid rates to import', 'Empty Import');
      return;
    }
    onImport(finalRates, overwriteDuplicates);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#09090b]/90 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] overflow-hidden flex flex-col animate-slideUp">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-[#09090b]/40 shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-800/30 text-zinc-100 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100 tracking-wide">
                Bulk Spreadsheet Rate Importer
              </h4>
              <p className="text-[10px] text-zinc-400">
                Copy columns from Google Sheets/Excel and paste them directly to build pricing matrices.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-full hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col lg:flex-row gap-6 min-h-0">
          
          {/* Left Panel: Settings and Paste Area */}
          <div className="w-full lg:w-[40%] flex flex-col space-y-4.5 shrink-0">
            
            {/* Scope selectors */}
            <div className="bg-[#09090b]/40 p-4.5 rounded-xl border border-zinc-800/80 space-y-4">
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block border-b border-zinc-800 pb-1.5">
                1. Select Target Scope
              </span>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Provider Selection */}
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase font-black text-zinc-400">Provider *</label>
                  <input 
                    type="text" 
                    list="provider-options"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    placeholder="Enter or select..."
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-md px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#3b82f6] font-semibold"
                  />
                  <datalist id="provider-options">
                    <option value="Xfinity" />
                    <option value="Spectrum" />
                    <option value="Cox" />
                    <option value="Comcast" />
                    <option value="Optimum" />
                    <option value="Mediacom" />
                    <option value="RCN" />
                  </datalist>
                </div>

                {/* State Selection */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] uppercase font-black text-zinc-400 flex items-center">
                      <MapPin className="w-3 h-3 text-zinc-500 mr-1" /> State *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingState(true);
                        setIsAddingCity(false);
                      }}
                      className="text-[9px] text-zinc-100 hover:underline"
                    >
                      + Add State
                    </button>
                  </div>
                  <select 
                    value={stateCode}
                    onChange={(e) => {
                      setStateCode(e.target.value);
                      setSelectedCityName('');
                    }}
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-md px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#3b82f6] font-semibold"
                  >
                    {states.map(s => (
                      <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>

                {/* City Selection */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] uppercase font-black text-zinc-400">City (Optional)</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingCity(true);
                        setIsAddingState(false);
                      }}
                      className="text-[9px] text-zinc-100 hover:underline"
                    >
                      + Add City
                    </button>
                  </div>
                  <select 
                    value={selectedCityName}
                    onChange={(e) => setSelectedCityName(e.target.value)}
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-md px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#3b82f6] font-semibold"
                  >
                    <option value="">Statewide / All Cities</option>
                    {cities
                      .filter(c => {
                        const stateObj = states.find(s => s.code === stateCode);
                        return stateObj ? c.stateId === stateObj.id : false;
                      })
                      .map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Inline Form: Add New State */}
              {isAddingState && (
                <div className="bg-[#09090b] border border-zinc-800 p-3.5 rounded-lg space-y-3.5 animate-fadeIn">
                  <span className="text-[9.5px] uppercase font-bold text-slate-300 block">
                    Add New State
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase text-zinc-500 font-bold block">State Code (e.g. NY)</span>
                      <input
                        type="text"
                        maxLength={2}
                        value={newStateCode}
                        onChange={(e) => setNewStateCode(e.target.value.toUpperCase())}
                        className="w-full bg-[#18181b] border border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-200 uppercase font-mono font-bold focus:outline-none focus:border-[#3b82f6]"
                        placeholder="NY"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase text-zinc-500 font-bold block">State Name (e.g. New York)</span>
                      <input
                        type="text"
                        value={newStateName}
                        onChange={(e) => setNewStateName(e.target.value)}
                        className="w-full bg-[#18181b] border border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-200 font-semibold focus:outline-none focus:border-[#3b82f6]"
                        placeholder="New York"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingState(false)}
                      className="px-2.5 py-1 bg-slate-800 text-zinc-400 text-[10px] font-bold rounded hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const code = newStateCode.trim().toUpperCase();
                        const name = newStateName.trim();
                        if (!code || !name) {
                          await customAlert('Please fill out both State Code and Name', 'Validation Error');
                          return;
                        }
                        onAddState(code, name);
                        setStateCode(code);
                        setSelectedCityName('');
                        setIsAddingState(false);
                        setNewStateCode('');
                        setNewStateName('');
                      }}
                      className="px-2.5 py-1 bg-zinc-800 text-white text-[10px] font-bold rounded hover:bg-zinc-700 border border-zinc-700/60"
                    >
                      Save State
                    </button>
                  </div>
                </div>
              )}

              {/* Inline Form: Add New City */}
              {isAddingCity && (
                <div className="bg-[#09090b] border border-zinc-800 p-3.5 rounded-lg space-y-3.5 animate-fadeIn">
                  <span className="text-[9.5px] uppercase font-bold text-slate-300 block">
                    Add New City to {states.find(s => s.code === stateCode)?.name || stateCode}
                  </span>
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase text-zinc-500 font-bold block">City Name (e.g. Buffalo)</span>
                    <input
                      type="text"
                      value={newCityName}
                      onChange={(e) => setNewCityName(e.target.value)}
                      className="w-full bg-[#18181b] border border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-200 font-semibold focus:outline-none focus:border-[#3b82f6]"
                      placeholder="e.g. Memphis, Buffalo"
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingCity(false)}
                      className="px-2.5 py-1 bg-slate-800 text-zinc-400 text-[10px] font-bold rounded hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const name = newCityName.trim();
                        if (!name) {
                          await customAlert('Please enter a City Name', 'Validation Error');
                          return;
                        }
                        onAddCity(name, stateCode);
                        setSelectedCityName(name);
                        setIsAddingCity(false);
                        setNewCityName('');
                      }}
                      className="px-2.5 py-1 bg-zinc-800 text-white text-[10px] font-bold rounded hover:bg-zinc-700 border border-zinc-700/60"
                    >
                      Save City
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Layout selector */}
            <div className="bg-[#09090b]/40 p-4.5 rounded-xl border border-zinc-800/80 space-y-3.5">
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block border-b border-zinc-800 pb-1.5">
                2. Choose Spreadsheet Format
              </span>

              <div className="space-y-2.5">
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => setLayoutMode('side_by_side')}
                    className={`flex items-start p-2.5 rounded-lg border text-left transition-all ${
                      layoutMode === 'side_by_side'
                        ? 'bg-zinc-800/40 border-[#3b82f6] text-slate-100'
                        : 'bg-[#09090b]/30 border-zinc-800 text-zinc-400 hover:bg-[#09090b]/70'
                    }`}
                  >
                    <div className="mr-3 mt-0.5">
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${layoutMode === 'side_by_side' ? 'border-[#3b82f6]' : 'border-zinc-600'}`}>
                        {layoutMode === 'side_by_side' && <div className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-200">Side-by-side Company & Employee tables</p>
                      <p className="text-[9px] text-zinc-400 mt-0.5 leading-relaxed">
                        Matches your Google Sheets. Columns parsed: Description | Code | Price (Company) and Description | Code | Price (Employee).
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLayoutMode('single_table')}
                    className={`flex items-start p-2.5 rounded-lg border text-left transition-all ${
                      layoutMode === 'single_table'
                        ? 'bg-zinc-800/40 border-[#3b82f6] text-slate-100'
                        : 'bg-[#09090b]/30 border-zinc-800 text-zinc-400 hover:bg-[#09090b]/70'
                    }`}
                  >
                    <div className="mr-3 mt-0.5">
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${layoutMode === 'single_table' ? 'border-[#3b82f6]' : 'border-zinc-600'}`}>
                        {layoutMode === 'single_table' && <div className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-200">Single Table (Both Prices)</p>
                      <p className="text-[9px] text-zinc-400 mt-0.5 leading-relaxed">
                        A single list showing columns like: Code, Description, Company Price, Employee Price.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLayoutMode('company_only')}
                    className={`flex items-start p-2.5 rounded-lg border text-left transition-all ${
                      layoutMode === 'company_only'
                        ? 'bg-zinc-800/40 border-[#3b82f6] text-slate-100'
                        : 'bg-[#09090b]/30 border-zinc-800 text-zinc-400 hover:bg-[#09090b]/70'
                    }`}
                  >
                    <div className="mr-3 mt-0.5">
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${layoutMode === 'company_only' ? 'border-[#3b82f6]' : 'border-zinc-600'}`}>
                        {layoutMode === 'company_only' && <div className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-200">Company rates only</p>
                      <p className="text-[9px] text-zinc-400 mt-0.5 leading-relaxed">
                        Only company billing rates (e.g. Description, Code, Company Price). Payouts default to $0.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLayoutMode('employee_only')}
                    className={`flex items-start p-2.5 rounded-lg border text-left transition-all ${
                      layoutMode === 'employee_only'
                        ? 'bg-zinc-800/40 border-[#3b82f6] text-slate-100'
                        : 'bg-[#09090b]/30 border-zinc-800 text-zinc-400 hover:bg-[#09090b]/70'
                    }`}
                  >
                    <div className="mr-3 mt-0.5">
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${layoutMode === 'employee_only' ? 'border-[#3b82f6]' : 'border-zinc-600'}`}>
                        {layoutMode === 'employee_only' && <div className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-200">Employee rates only</p>
                      <p className="text-[9px] text-zinc-400 mt-0.5 leading-relaxed">
                        Only employee payouts (e.g. Code, Employee Price). Company rates default to $0.
                      </p>
                    </div>
                  </button>
                </div>

                <div className="flex items-center space-x-2 pt-1 border-t border-zinc-800">
                  <input
                    type="checkbox"
                    id="chkHeader"
                    checked={hasHeader}
                    onChange={(e) => setHasHeader(e.target.checked)}
                    className="w-3.5 h-3.5 bg-[#09090b] border-[#27272a] text-zinc-100 rounded focus:outline-none focus:ring-0"
                  />
                  <label htmlFor="chkHeader" className="text-[10px] text-slate-300 font-semibold cursor-pointer">
                    First row contains table headers (skip)
                  </label>
                </div>
              </div>
            </div>

            {/* Auto-calculator settings */}
            <div className="bg-[#09090b]/40 p-4.5 rounded-xl border border-zinc-800/80 space-y-3.5">
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block border-b border-zinc-800 pb-1.5 flex justify-between items-center">
                <span>3. Technician Payout Calculator</span>
                <span className="text-[8.5px] bg-zinc-800/40 text-zinc-100 px-1 rounded uppercase font-black tracking-wide">Real-time</span>
              </span>
              
              <div className="space-y-3">
                <label className="flex items-center space-x-2 text-xs text-slate-300 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoCalc}
                    onChange={(e) => setAutoCalc(e.target.checked)}
                    className="w-3.5 h-3.5 bg-[#09090b] border-[#27272a] text-zinc-100 rounded focus:outline-none"
                  />
                  <span>Auto-calculate Employee Payout from Company Rates</span>
                </label>

                {autoCalc && (
                  <div className="flex items-center space-x-2.5 shrink-0 bg-[#09090b] p-2 rounded border border-zinc-800 animate-fadeIn text-xs">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase">Company Margin / Retention %:</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={retentionPercent}
                      onChange={(e) => setRetentionPercent(parseFloat(e.target.value) || 0)}
                      className="w-16 bg-[#18181b] border border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-100 font-mono font-bold focus:outline-none focus:border-[#3b82f6]"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Paste container */}
            <div className="flex-1 flex flex-col space-y-1.5 min-h-[160px]">
              <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider flex items-center justify-between">
                <span>4. Paste Spreadsheet Data</span>
                <span className="text-[9px] text-zinc-100 hover:underline cursor-pointer flex items-center" onClick={() => setPastedText('')}>
                  Clear Data
                </span>
              </label>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Click here and press Ctrl+V to paste cells copied from Excel or Google Sheets...&#13;Example:&#13;Bulk Installation&#9;CBI&#9;30.00&#9;&#9;Bulk Installation&#9;CBI&#9;27.60&#13;Change of Service&#9;CCoSu&#9;89.87&#9;&#9;Change of Service&#9;CCoSu&#9;82.68"
                className="w-full flex-1 bg-[#09090b] border border-[#27272a] rounded-xl p-3 text-[11px] font-mono text-slate-300 focus:outline-none focus:border-[#3b82f6] placeholder-slate-600 resize-none leading-relaxed"
              />
            </div>

          </div>

          {/* Right Panel: Mapping and Live Preview */}
          <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-[#09090b]/25 border border-zinc-800/80 rounded-xl p-4.5 space-y-4">
            
            {/* Dynamic Column Mapping Controls */}
            {parsedGrid.length > 0 && (
              <div className="bg-[#09090b]/50 p-4 rounded-lg border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <span className="text-[10px] uppercase font-bold text-slate-300 tracking-wider flex items-center">
                    <Sparkles className="w-3.5 h-3.5 text-zinc-100 mr-1.5" /> Column Mapping (Auto-Detected)
                  </span>
                  <span className="text-[9px] text-zinc-500 font-mono">Found {maxColsCount} cols</span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
                  {/* Company / Code col */}
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block">
                      {layoutMode === 'side_by_side' ? 'Company Code Col' : 'Code Column'}
                    </span>
                    <select
                      value={colMap.compCode}
                      onChange={(e) => setColMap({ ...colMap, compCode: parseInt(e.target.value) })}
                      className="w-full bg-[#09090b] border border-[#27272a] rounded px-2 py-1 text-[10.5px] text-slate-300 focus:outline-none"
                    >
                      <option value="-1">Ignore</option>
                      {headers.map((h, i) => (
                        <option key={i} value={i}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* Company / Desc col */}
                  {(layoutMode === 'side_by_side' || layoutMode !== 'employee_only') && (
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase font-bold text-zinc-500 block">
                        {layoutMode === 'side_by_side' ? 'Company Desc Col' : 'Description Col'}
                      </span>
                      <select
                        value={colMap.compDesc}
                        onChange={(e) => setColMap({ ...colMap, compDesc: parseInt(e.target.value) })}
                        className="w-full bg-[#09090b] border border-[#27272a] rounded px-2 py-1 text-[10.5px] text-slate-300 focus:outline-none"
                      >
                        <option value="-1">Ignore</option>
                        {headers.map((h, i) => (
                          <option key={i} value={i}>{h}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Company / Price col */}
                  {layoutMode !== 'employee_only' && (
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase font-bold text-zinc-500 block">Company Rate Col</span>
                      <select
                        value={colMap.compPrice}
                        onChange={(e) => setColMap({ ...colMap, compPrice: parseInt(e.target.value) })}
                        className="w-full bg-[#09090b] border border-[#27272a] rounded px-2 py-1 text-[10.5px] text-slate-300 focus:outline-none"
                      >
                        <option value="-1">Ignore</option>
                        {headers.map((h, i) => (
                          <option key={i} value={i}>{h}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Employee Side column mappings for side-by-side or combined main tables */}
                  {layoutMode === 'side_by_side' && (
                    <>
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase font-bold text-zinc-500 block">Employee Code Col</span>
                        <select
                          value={colMap.empCode}
                          onChange={(e) => setColMap({ ...colMap, empCode: parseInt(e.target.value) })}
                          className="w-full bg-[#09090b] border border-[#27272a] rounded px-2 py-1 text-[10.5px] text-slate-300 focus:outline-none"
                        >
                          <option value="-1">Ignore</option>
                          {headers.map((h, i) => (
                            <option key={i} value={i}>{h}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[9px] uppercase font-bold text-zinc-500 block">Employee Desc Col</span>
                        <select
                          value={colMap.empDesc}
                          onChange={(e) => setColMap({ ...colMap, empDesc: parseInt(e.target.value) })}
                          className="w-full bg-[#09090b] border border-[#27272a] rounded px-2 py-1 text-[10.5px] text-slate-300 focus:outline-none"
                        >
                          <option value="-1">Ignore</option>
                          {headers.map((h, i) => (
                            <option key={i} value={i}>{h}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  {/* Employee Price col (Employee only or Single Table / side-by-side) */}
                  {layoutMode !== 'company_only' && (
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase font-bold text-zinc-500 block">Employee Payout Col</span>
                      <select
                        value={colMap.empPrice}
                        onChange={(e) => setColMap({ ...colMap, empPrice: parseInt(e.target.value) })}
                        className="w-full bg-[#09090b] border border-[#27272a] rounded px-2 py-1 text-[10.5px] text-slate-300 focus:outline-none"
                      >
                        <option value="-1">Ignore</option>
                        {headers.map((h, i) => (
                          <option key={i} value={i}>{h}</option>
                        ))}
                      </select>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* Compiled Preview Section */}
            <div className="flex-1 flex flex-col min-h-0 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                  Live Parsing Preview ({editedRates.length} rates)
                </span>
                {editedRates.length > 0 && (
                  <span className="text-[9px] text-[#10b981] font-bold flex items-center bg-zinc-800/30 px-2 py-0.5 rounded border border-emerald-500/20">
                    <CheckCircle className="w-3.5 h-3.5 mr-1" /> Checked & Ready
                  </span>
                )}
              </div>

              {editedRates.length > 0 ? (
                <div className="flex-1 border border-zinc-800/80 rounded-xl overflow-hidden flex flex-col bg-[#09090b]/30">
                  {/* Table header */}
                  <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-[#09090b] border-b border-zinc-800 text-[9.5px] uppercase font-bold text-zinc-400 shrink-0">
                    <div className="col-span-2">Code</div>
                    <div className="col-span-4">Description</div>
                    <div className="col-span-2 text-right">Comp Price ($)</div>
                    <div className="col-span-2 text-right">Emp Price ($)</div>
                    <div className="col-span-2 text-center">Action</div>
                  </div>

                  {/* Table body (scrollable) */}
                  <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40 text-xs custom-scrollbar">
                    {editedRates.map((rate, idx) => {
                      const codeWarning = !rate.code.trim();
                      const priceWarning = rate.grossPrice < rate.employeePrice;

                      return (
                        <div key={idx} className="grid grid-cols-12 gap-2 px-4 py-2.5 items-center hover:bg-slate-800/20 transition-colors">
                          
                          {/* Code */}
                          <div className="col-span-2">
                            <span className={`font-mono font-bold tracking-tight px-1.5 py-0.5 rounded text-[10px] ${
                              codeWarning ? 'bg-red-500/20 text-red-400' : 'bg-[#18181b] text-zinc-200 border border-zinc-800'
                            }`}>
                              {rate.code || 'MISSING'}
                            </span>
                          </div>

                          {/* Description */}
                          <div className="col-span-4">
                            <input
                              type="text"
                              value={rate.description}
                              onChange={(e) => handleRateFieldChange(rate.code, 'description', e.target.value)}
                              className="w-full bg-transparent border-none focus:outline-none focus:bg-[#09090b] hover:bg-[#09090b]/30 px-1 py-0.5 rounded text-slate-300 font-medium truncate"
                            />
                          </div>

                          {/* Company grossPrice */}
                          <div className="col-span-2 text-right">
                            <input
                              type="number"
                              step="0.01"
                              value={rate.grossPrice === 0 ? '' : rate.grossPrice}
                              placeholder="0.00"
                              onChange={(e) => handleRateFieldChange(rate.code, 'grossPrice', e.target.value)}
                              className="w-20 bg-transparent text-right border-none focus:outline-none focus:bg-[#09090b] hover:bg-[#09090b]/30 px-1.5 py-0.5 rounded text-zinc-100 font-mono font-bold"
                            />
                          </div>

                          {/* Employee price */}
                          <div className="col-span-2 text-right">
                            <input
                              type="number"
                              step="0.01"
                              value={rate.employeePrice === 0 ? '' : rate.employeePrice}
                              placeholder="0.00"
                              disabled={autoCalc}
                              onChange={(e) => handleRateFieldChange(rate.code, 'employeePrice', e.target.value)}
                              className={`w-20 bg-transparent text-right border-none focus:outline-none focus:bg-[#09090b] hover:bg-[#09090b]/30 px-1.5 py-0.5 rounded font-mono font-bold ${
                                autoCalc ? 'text-zinc-300/50 cursor-not-allowed' : (priceWarning ? 'text-amber-400' : 'text-zinc-300')
                              }`}
                            />
                          </div>

                          {/* Actions */}
                          <div className="col-span-2 flex items-center justify-center space-x-1.5">
                            {priceWarning && !autoCalc && (
                              <span className="text-amber-400 cursor-help" title="Employee rate exceeds Company rate (negative margin)">
                                <AlertTriangle className="w-3.5 h-3.5" />
                              </span>
                            )}
                            {autoCalc && (
                              <span className="text-zinc-300 cursor-help text-[9px] font-black" title="Calculated automatically using margin">
                                %
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveRate(rate.code)}
                              className="p-1 text-rose-500 hover:bg-rose-500/10 rounded transition-colors"
                              title="Delete from list"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex-1 border border-dashed border-zinc-800 rounded-xl flex flex-col items-center justify-center p-8 bg-[#09090b]/10">
                  <div className="w-12 h-12 rounded-full bg-slate-800/40 text-zinc-500 flex items-center justify-center mb-3">
                    <Upload className="w-5 h-5 animate-pulse" />
                  </div>
                  <span className="text-xs font-semibold text-zinc-400 text-center max-w-[280px] leading-relaxed">
                    Paste rows from your spreadsheet to generate a live parsing preview here.
                  </span>
                  <span className="text-[10px] text-slate-600 text-center mt-1">
                    Press Ctrl+C in Sheets/Excel, then click in the editor and press Ctrl+V.
                  </span>
                </div>
              )}
            </div>

            {/* Importer Settings & Actions */}
            <div className="pt-3.5 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
              <div className="flex items-center space-x-2 text-[10px] text-zinc-400">
                <input
                  type="checkbox"
                  id="chkOverwrite"
                  checked={overwriteDuplicates}
                  onChange={(e) => setOverwriteDuplicates(e.target.checked)}
                  className="w-3.5 h-3.5 bg-[#09090b] border-[#27272a] text-zinc-100 rounded focus:outline-none focus:ring-0"
                />
                <label htmlFor="chkOverwrite" className="font-semibold cursor-pointer select-none">
                  Overwrite existing plans with the same code in <strong className="text-slate-300">{selectedCityName ? `${selectedCityName}, ${stateCode}` : stateCode}</strong> for <strong className="text-slate-300">{activeProvider}</strong>
                </label>
              </div>

              <div className="flex items-center space-x-3 shrink-0">
                <button 
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-[#09090b] border border-[#27272a] text-zinc-400 text-xs font-semibold rounded-md hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={handleImportSubmit}
                  disabled={editedRates.length === 0}
                  className="px-4.5 py-2 bg-zinc-100 disabled:bg-[#1e293b] disabled:text-slate-600 disabled:shadow-none text-zinc-950 text-xs font-bold rounded-md hover:bg-zinc-200 shadow-lg shadow-zinc-500/5 transition-all flex items-center"
                >
                  Confirm Import ({editedRates.length} plans)
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
