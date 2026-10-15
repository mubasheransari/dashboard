import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { numberValue, sampleData } from '@/lib/data';
import type { DashboardData } from '@/lib/types';

export const runtime = 'nodejs';
export const revalidate = 0;

async function getLiveData(): Promise<DashboardData | null> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;
  if (!spreadsheetId || !email || !rawKey) return null;

  const auth = new google.auth.JWT({
    email,
    key: rawKey.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth });
  const [dailyRes, monthlyRes, regionsRes] = await Promise.all([
    sheets.spreadsheets.values.get({ spreadsheetId, range: "'Daily Sales'!A2:B" }),
    sheets.spreadsheets.values.get({ spreadsheetId, range: "'Monthly Sales'!A2:C" }),
    sheets.spreadsheets.values.get({ spreadsheetId, range: "'Regional Sales'!A2:B" }),
  ]);
  const daily = (dailyRes.data.values ?? []).map((r) => ({ date: String(r[0] ?? ''), sales: numberValue(r[1]) })).filter((r) => /^\d{4}-\d{2}-\d{2}$/.test(r.date));
  const monthly = (monthlyRes.data.values ?? []).map((r) => ({ month: String(r[0] ?? ''), label: String(r[1] ?? r[0] ?? ''), sales: numberValue(r[2]) })).filter((r) => r.month);
  const regions = (regionsRes.data.values ?? []).map((r) => ({ region: String(r[0] ?? ''), sales: numberValue(r[1]) })).filter((r) => r.region);
  return { daily, monthly, regions, updatedAt: new Date().toISOString(), source: 'Google Sheets' };
}

export async function GET() {
  try {
    const live = await getLiveData();
    return NextResponse.json(live ?? sampleData, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (error) {
    console.error('Dashboard data fetch failed:', error);
    // The dashboard remains usable if Sheets is temporarily unavailable.
    return NextResponse.json({ ...sampleData, source: 'Sample data (Google Sheets connection unavailable)' }, { status: 200 });
  }
}
