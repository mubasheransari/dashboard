'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Area, AreaChart, Bar, CartesianGrid, Cell, ComposedChart,
  Line, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import {
  Activity, ArrowUpRight, CalendarDays, Check, ChevronDown,
  Clock3, Filter, Leaf, RefreshCw, Search, TrendingUp,
} from 'lucide-react';
import type { DashboardData } from '@/lib/types';

/* Optional: put your logo file in /public (e.g. /public/logo.png) and set this to '/logo.png'.
   Leave empty to show the text wordmark. */
const LOGO_SRC = '';

/* Mezan Tea red + white palette (keep in sync with app/globals.css) */
const C = {
  red: '#d4141c',
  redDark: '#a30d14',
  redMid: '#e8545a',
  redLight: '#f4a3a6',
  grid: '#f8ecec',
  axis: '#a58a8c',
  line: '#f1dcdc',
};

const fmt = new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 });
const compact = (v: number) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : fmt.format(v);
const dateLabel = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' });
const monthLabel = (iso: string) => new Date(`${iso}-01T12:00:00`).toLocaleDateString('en-PK', { month: 'short' });
const monthName = (iso: string) => new Date(`${iso}-01T12:00:00`).toLocaleDateString('en-PK', { month: 'long' });

const tooltipStyle = { border: `1px solid ${C.line}`, borderRadius: 12, boxShadow: '0 8px 24px #a30d1418', fontFamily: 'DM Sans, sans-serif' };
const tick = { fill: C.axis, fontSize: 12 };

function StatCard({ title, value, note, icon: Icon, accent, trend }: { title: string; value: string; note: string; icon: typeof Activity; accent: string; trend?: string }) {
  return (
    <article className="stat-card">
      <div className="stat-top"><span>{title}</span><span className={`stat-icon ${accent}`}><Icon size={19} /></span></div>
      <div className="stat-value">{value}</div>
      <div className="stat-bottom">
        <span className="stat-note">{note}</span>
        {trend && <span className="trend-pill"><ArrowUpRight size={13} />{trend}</span>}
      </div>
    </article>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState('This month');
  const [chartMode, setChartMode] = useState<'daily' | 'monthly'>('daily');
  const [lastUpdated, setLastUpdated] = useState('');

  const loadData = async (manual = false) => {
    if (manual) setRefreshing(true); else setLoading(true);
    try {
      const res = await fetch('/api/dashboard', { cache: 'no-store' });
      if (!res.ok) throw new Error('Could not load dashboard data');
      const next = await res.json() as DashboardData;
      setData(next);
      setLastUpdated(new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }));
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };
  useEffect(() => { void loadData(); }, []);

  // "This month" follows the latest month that exists in the data.
  const latestMonthKey = data?.daily.length ? data.daily[data.daily.length - 1].date.slice(0, 7) : '';
  const latestMonthly = data?.monthly[data.monthly.length - 1];

  const filteredDaily = useMemo(() => {
    const daily = data?.daily ?? [];
    if (period === 'Last 7 days') return daily.slice(-7);
    if (period === 'Last 30 days') return daily.slice(-30);
    return daily.filter((d) => d.date.startsWith(latestMonthKey));
  }, [data, period, latestMonthKey]);

  const currentMonthSales = latestMonthly?.sales ?? 0;
  const visibleDailySales = filteredDaily.reduce((sum, d) => sum + d.sales, 0);
  const activeDays = filteredDaily.filter((d) => d.sales > 0).length;
  const average = activeDays ? visibleDailySales / activeDays : 0;
  const bestDay = filteredDaily.reduce((best, d) => d.sales > best.sales ? d : best, { date: '', sales: 0 });
  const maxRegion = Math.max(1, ...(data?.regions ?? []).map((r) => r.sales));
  const regions = [...(data?.regions ?? [])].sort((a, b) => b.sales - a.sales);
  const monthly = data?.monthly ?? [];

  return (
    <main className="app-shell">
      <header className="hero">
        <div className="hero-inner">
          <div className="topbar">
            <div className="brand">
              {LOGO_SRC
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={LOGO_SRC} alt="Mezan Tea" />
                : <>
                    <span className="brand-mark"><Leaf size={22} /></span>
                    <span className="brand-name">Mezan Tea<small>Sales dashboard</small></span>
                  </>}
            </div>
            <div className="top-actions">
              <div className="live-status"><span className="status-light" /> Live dashboard</div>
              <button className="icon-button" aria-label="Refresh dashboard" onClick={() => void loadData(true)} disabled={refreshing}>
                <RefreshCw size={17} className={refreshing ? 'spin' : ''} />
              </button>
            </div>
          </div>

          <div className="hero-body">
            <div>
              <h1>Sales overview</h1>
              <p>Track daily performance, understand monthly momentum, and see which regions are driving the numbers.</p>
            </div>
            <button className="primary-button" onClick={() => void loadData(true)} disabled={refreshing}>
              <RefreshCw size={16} className={refreshing ? 'spin' : ''} /> Refresh data
            </button>
          </div>
        </div>
              </header>

      <div className="page-content">
        <div className="filter-bar">
          <div className="filter-intro"><Filter size={16} /><span>View filters</span></div>
          <label className="select-wrap">
            <CalendarDays size={15} />
            <select value={period} onChange={(e) => setPeriod(e.target.value)} aria-label="Period">
              <option>This month</option><option>Last 7 days</option><option>Last 30 days</option>
            </select>
            <ChevronDown size={14} />
          </label>
          <div className="filter-spacer" />
          <div className="updated"><Clock3 size={14} /><span>Updated {lastUpdated || '—'}</span></div>
        </div>

        <div className="stats-grid">
          <StatCard title={`${latestMonthKey ? monthName(latestMonthKey) : 'Current month'} MTD sales`} value={fmt.format(currentMonthSales)} note="Sales reported in workbook" icon={Activity} accent="solid" trend="MTD" />
          <StatCard title="Selected-period sales" value={fmt.format(visibleDailySales)} note={`${filteredDaily.length} calendar days in view`} icon={TrendingUp} accent="tint" />
          <StatCard title="Average per active day" value={fmt.format(average)} note={`${activeDays} days with sales`} icon={CalendarDays} accent="tint" />
          <StatCard title="Best sales day" value={fmt.format(bestDay.sales)} note={bestDay.date ? dateLabel(bestDay.date) : 'No data yet'} icon={ArrowUpRight} accent="tint" trend="Peak" />
        </div>

        <section className="panel trend-panel">
          <div className="panel-heading">
            <div>
              <h2>Daily and monthly trends</h2>
              <p>Follow the sales curve and compare the bigger picture.</p>
            </div>
            <div className="segmented">
              <button className={chartMode === 'daily' ? 'selected' : ''} onClick={() => setChartMode('daily')}>Daily sales</button>
              <button className={chartMode === 'monthly' ? 'selected' : ''} onClick={() => setChartMode('monthly')}>Monthly trend</button>
            </div>
          </div>

          <div className="chart-summary">
            <div>
              <span className="summary-label">{chartMode === 'daily' ? 'Sales in selected period' : 'Total across months shown'}</span>
              <strong>{fmt.format(chartMode === 'daily' ? visibleDailySales : monthly.reduce((sum, m) => sum + m.sales, 0))}<small> kg</small></strong>
            </div>
            <div className="chart-legend"><span className="legend-dot" />{chartMode === 'daily' ? 'Daily primary sales' : 'Monthly primary sales'}</div>
          </div>

          <div className="chart-wrap">
            {loading ? <div className="chart-loading">Loading your sales data…</div> : chartMode === 'daily' ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={filteredDaily} margin={{ top: 14, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.red} stopOpacity={0.32} />
                      <stop offset="100%" stopColor={C.red} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={C.grid} vertical={false} />
                  <XAxis dataKey="date" tickFormatter={dateLabel} axisLine={false} tickLine={false} tick={tick} dy={12} />
                  <YAxis tickFormatter={compact} axisLine={false} tickLine={false} tick={tick} width={48} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelFormatter={(v) => new Date(`${v}T12:00:00`).toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short' })}
                    formatter={(v) => [`${fmt.format(Number(v))} kg`, 'Sales']}
                  />
                  <Area type="monotone" dataKey="sales" stroke={C.red} strokeWidth={3.2} fill="url(#salesFill)" activeDot={{ r: 5, fill: C.redDark, stroke: '#fff', strokeWidth: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthly} margin={{ top: 14, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke={C.grid} vertical={false} />
                  <XAxis dataKey="label" tickFormatter={(_, i) => monthLabel(monthly[i]?.month ?? '2026-01')} axisLine={false} tickLine={false} tick={tick} dy={12} />
                  <YAxis tickFormatter={compact} axisLine={false} tickLine={false} tick={tick} width={48} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${fmt.format(Number(v))} kg`, 'Sales']} />
                  <Bar dataKey="sales" barSize={44} radius={[8, 8, 0, 0]}>
                    {monthly.map((entry, i) => <Cell key={entry.month} fill={i === monthly.length - 1 ? C.red : C.redLight} />)}
                  </Bar>
                  <Line dataKey="sales" stroke={C.redDark} strokeWidth={2.2} dot={{ r: 4, fill: C.redDark, stroke: '#fff', strokeWidth: 2 }} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="chart-footer">
            <span><span className="footer-dot" /> {data?.source ?? 'Sales data'}</span>
            <span>Units: kg · Values reflect the workbook</span>
          </div>
        </section>

        <div className="lower-grid">
          <section className="panel region-panel">
            <div className="panel-heading">
              <div>
                <h2>Regional performance</h2>
                <p>Current reported daily sales by region.</p>
              </div>
              <span className="round-icon"><Activity size={18} /></span>
            </div>
            <div className="region-list">
              {regions.map((r, i) => (
                <div className="region-row" key={r.region}>
                  <div className="region-meta">
                    <span className="region-rank">{String(i + 1).padStart(2, '0')}</span>
                    <span className="region-name">{r.region}</span>
                    <b>{fmt.format(r.sales)} <small>kg</small></b>
                  </div>
                  <div className="progress-track"><div className={`progress-fill fill-${i % 4}`} style={{ width: `${Math.max(1, (r.sales / maxRegion) * 100)}%` }} /></div>
                </div>
              ))}
            </div>
          </section>

          <section className="panel daily-panel">
            <div className="panel-heading">
              <div>
                <h2>Daily sales</h2>
                <p>Browse the latest recorded values.</p>
              </div>
            </div>
            <div className="table-search"><Search size={15} /><span>Daily records</span><span className="record-count">{filteredDaily.length} days</span></div>
            <div className="table-scroll">
              <table>
                <thead><tr><th>Date</th><th>Day</th><th className="numeric">Sales (kg)</th></tr></thead>
                <tbody>
                  {[...filteredDaily].reverse().slice(0, 8).map((d) => (
                    <tr key={d.date}>
                      <td>{new Date(`${d.date}T12:00:00`).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td className="day-cell">{new Date(`${d.date}T12:00:00`).toLocaleDateString('en-PK', { weekday: 'short' })}</td>
                      <td className="numeric sales-cell">{fmt.format(d.sales)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="table-foot"><span><Check size={13} /> Data loaded</span><span>Showing latest 8</span></div>
          </section>
        </div>
      </div>

      <footer className="site-footer">
                <div className="footer-inner">
          <div>
            <div className="footer-brand"><span className="brand-mark"><Leaf size={18} /></span>Mezan Tea</div>
            <div>Mezan Tea Pvt Ltd. Plot No. A-22, Mauripur Road, S.I.T.E, Karachi</div>
          </div>
          <div className="footer-right">
<div>Designed &amp; Developed by Mubasher Hasnain<br />Mezan Tea Pvt Ltd.</div>
          </div>
        </div>
      </footer>
    </main>
  );
}
