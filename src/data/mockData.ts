// Types mirroring our Prisma DB schema
export type TechStatus = 'ONBOARDING' | 'TRAINING' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type WorkType = 'BURY' | 'COAX' | 'FIBER';
export type OwnershipType = 'COMPANY' | 'PERSONAL';
export type VehicleStatus = 'ACTIVE' | 'MAINTENANCE' | 'RETIRED';
export type PayoutType = 'PERCENTAGE' | 'FIXED';

export interface Todo {
  id: string;
  text: string;
  description?: string;
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  date: string; // YYYY-MM-DD format
  completed: boolean;
  creator: string;
  createdAt: string;
}

export interface State {
  id: number;
  code: string;
  name: string;
  requiredTechs?: number;
  requirements?: string;
  companyPerDiem?: number;
  employeePerDiem?: number;
  onboardingWaitTime?: string;
  monthlySalary?: string;
  description?: string;
  vacancyCities?: string;
  defaultCut?: number;
}

export interface Candidate {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  stateCode: string;
  status: string; // 'NEW' | 'RATES_SENT' | 'DOCS_REQUESTED' | 'SIGNING_SENT' | 'HIRED' | 'REJECTED'
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface City {
  id: number;
  name: string;
  stateId: number;
}

export interface Vehicle {
  id: number;
  make: string;
  model: string;
  year: number;
  vin: string;
  plateNumber: string;
  ownershipType: OwnershipType;
  status: VehicleStatus;
  technicianId?: number;
}

export interface TechContract {
  id: number;
  technicianId: number;
  provider: string;
  payoutType: PayoutType;
  payoutValue: number; // e.g. 65 for 65%, 45 for $45 flat
}

export interface Technician {
  id: number;
  name: string;
  username?: string;
  password?: string;
  phone: string;
  email: string;
  status: TechStatus;
  workType: WorkType;
  stateId: number;
  stateCode: string; // convenient helper
  vehicle?: Vehicle; // current vehicle
  payoutType: PayoutType;
  payoutValue: number;
  perDiemOverride?: number | null;
  carToolsDeduction?: number;
  companyToolsCost?: number;
  defaultProvider?: string;
  notes?: string; // Internal admin notes / remarks
  jobsToday?: number;
}

export interface TechDocument {
  id: string;
  technicianId: number;
  name: string;
  fileType: string;   // e.g. 'application/pdf', 'image/png'
  size: number;       // bytes
  uploadedAt: string; // ISO date string
  dataUrl: string;    // base64 data URL for client-side storage
  category: 'CONTRACT' | 'ID' | 'CERTIFICATION' | 'OTHER' | 'PAYMENT';
  batchId?: string | null;
}

export interface RatePlan {
  id: number;
  provider: string;
  stateCode: string;
  cityName?: string;
  code: string;
  description: string;
  grossPrice: number;
  employeePrice: number;
}

export interface JobLog {
  id: number;
  date: string;
  technicianId: number;
  technicianName: string;
  ratePlanId: number;
  ratePlanCode: string;
  provider: string;
  cityId: number;
  cityName: string;
  stateCode: string;
  companyRevenue: number;
  techPayout: number;
  companyProfit: number;
  batchId?: string | null;
}

export const states: State[] = [];

export const cities: City[] = [];

export const vehicles: Vehicle[] = [];

export const ratePlans: RatePlan[] = [];

export const technicians: Technician[] = [];

// Seeded JobLogs
export const jobLogs: JobLog[] = [];

// Helper to compute stats for a given state, or nationally if stateCode is undefined
export function getStats(stateCode?: string) {
  const filteredJobs = stateCode 
    ? jobLogs.filter(j => j.stateCode === stateCode)
    : jobLogs;

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
}

// Helper to get active cities with jobs for a given state
export function getActiveCities(stateCode: string) {
  const stateJobs = jobLogs.filter(j => j.stateCode === stateCode);
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
}
