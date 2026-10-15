export type DailyPoint = { date: string; sales: number };
export type MonthlyPoint = { month: string; label: string; sales: number };
export type RegionPoint = { region: string; sales: number };
export type DashboardData = {
  daily: DailyPoint[];
  monthly: MonthlyPoint[];
  regions: RegionPoint[];
  updatedAt: string;
  source: string
};
