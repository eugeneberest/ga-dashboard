"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface ChannelMetrics {
  channel: string;
  users: number;
  sessions: number;
  clicks: number;
  conversions: number;
  formSubmissions: number;
  phoneCalls: number;
  clickToLeadRate: number;
}

interface SourceMetrics {
  source: string;
  medium: string;
  category: string;
  users: number;
  sessions: number;
  conversions: number;
  formSubmissions: number;
  phoneCalls: number;
  clickToLeadRate: number;
}

interface DetailedBreakdown {
  organicSearch: SourceMetrics[];
  paidSearch: SourceMetrics[];
  llmAI: SourceMetrics[];
  listings: SourceMetrics[];
  social: SourceMetrics[];
  referral: SourceMetrics[];
  direct: SourceMetrics[];
  other: SourceMetrics[];
}

interface WeeklyTotals {
  users: number;
  newUsers: number;
  sessions: number;
  pageviews: number;
  bounceRate: number;
  engagementRate: number;
  conversions: number;
  impressions: number;
  clicks: number;
  ctr: number;
  avgSessionDuration: number;
  formSubmissions: number;
  phoneCalls: number;
  clickToLeadRate: number;
}

interface WeeklyData {
  period: {
    current: { startDate: string; endDate: string };
    lastYear: { startDate: string; endDate: string };
  };
  totals: WeeklyTotals;
  daily: Array<{
    date: string;
    users: number;
    sessions: number;
    conversions: number;
  }>;
  leads: {
    total: number;
    bySource: Array<{ source: string; leads: number }>;
    byDay: Array<{ date: string; leads: number }>;
  };
  topPages: Array<{
    path: string;
    title: string;
    pageviews: number;
  }>;
  trafficSources: Array<{
    source: string;
    medium: string;
    sessions: number;
  }>;
  conversionsByChannel: ChannelMetrics[];
  detailedBreakdown: DetailedBreakdown;
  comparison: {
    current: WeeklyTotals;
    lastYear: WeeklyTotals;
    changes: Record<string, number>;
  };
}

type SortDirection = "asc" | "desc";
type SortField = "source" | "sessions" | "formSubmissions" | "phoneCalls" | "conversions" | "clickToLeadRate";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

const CHANNEL_COLORS: Record<string, string> = {
  "Organic Search": "#10b981",
  "Paid Search": "#3b82f6",
  "Direct": "#8b5cf6",
  "Referral": "#f59e0b",
  "Organic Social": "#ec4899",
  "Paid Social": "#06b6d4",
  "Email": "#ef4444",
  "Display": "#84cc16",
};

const CATEGORY_INFO: Record<string, { name: string; color: string; icon: string }> = {
  organicSearch: { name: "Organic Search", color: "bg-green-100 text-green-800", icon: "🔍" },
  paidSearch: { name: "Paid Search & Ads", color: "bg-blue-100 text-blue-800", icon: "💰" },
  llmAI: { name: "AI / LLM Referrals", color: "bg-purple-100 text-purple-800", icon: "🤖" },
  listings: { name: "Listings & Directories", color: "bg-yellow-100 text-yellow-800", icon: "📋" },
  social: { name: "Social Media", color: "bg-pink-100 text-pink-800", icon: "📱" },
  referral: { name: "Referral Sites", color: "bg-orange-100 text-orange-800", icon: "🔗" },
  direct: { name: "Direct Traffic", color: "bg-gray-100 text-gray-800", icon: "🎯" },
  other: { name: "Other Sources", color: "bg-slate-100 text-slate-800", icon: "🌐" },
};

const SOURCE_ICONS: Record<string, string> = {
  google: "🔍",
  bing: "🔎",
  yahoo: "📧",
  duckduckgo: "🦆",
  chatgpt: "🤖",
  perplexity: "🧠",
  claude: "🟠",
  gemini: "✨",
  copilot: "🪟",
  yelp: "⭐",
  clutch: "🏆",
  facebook: "📘",
  instagram: "📷",
  linkedin: "💼",
  twitter: "🐦",
  reddit: "🔴",
  youtube: "▶️",
};

function getSourceIcon(source: string): string {
  const sourceLower = source.toLowerCase();
  for (const [key, icon] of Object.entries(SOURCE_ICONS)) {
    if (sourceLower.includes(key)) return icon;
  }
  return "🌐";
}

function MetricCard({
  title,
  value,
  change,
  lastYearValue,
  format = "number",
  icon,
  highlight = false,
}: {
  title: string;
  value: number;
  change?: number;
  lastYearValue?: number;
  format?: "number" | "percent" | "duration";
  icon?: string;
  highlight?: boolean;
}) {
  const formatValue = (val: number): string => {
    switch (format) {
      case "percent":
        return `${val.toFixed(2)}%`;
      case "duration":
        const mins = Math.floor(val / 60);
        const secs = Math.round(val % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
      default:
        return val.toLocaleString();
    }
  };

  return (
    <div className={`rounded-xl shadow-sm border p-5 hover:shadow-md transition-shadow ${
      highlight ? "bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200" : "bg-white border-gray-100"
    }`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-500 text-sm font-medium">{title}</span>
        {icon && <span className="text-xl">{icon}</span>}
      </div>
      <div className={`text-2xl font-bold ${highlight ? "text-blue-700" : "text-gray-900"}`}>
        {formatValue(value)}
      </div>
      {change !== undefined && (
        <div className={`text-sm mt-1 flex items-center gap-1 ${
          change >= 0 ? "text-green-600" : "text-red-600"
        }`}>
          <span>{change >= 0 ? "↑" : "↓"}</span>
          <span>{Math.abs(change).toFixed(1)}% vs last year</span>
        </div>
      )}
      {lastYearValue !== undefined && (
        <div className="text-xs text-gray-400 mt-1">
          Last year: {formatValue(lastYearValue)}
        </div>
      )}
    </div>
  );
}

function SortableHeader({
  label,
  field,
  currentSort,
  onSort,
  align = "right",
}: {
  label: string;
  field: SortField;
  currentSort: { field: SortField; direction: SortDirection };
  onSort: (field: SortField) => void;
  align?: "left" | "right";
}) {
  const isActive = currentSort.field === field;
  return (
    <th
      className={`py-2 px-2 font-medium text-gray-500 cursor-pointer hover:text-gray-700 select-none ${
        align === "left" ? "text-left" : "text-right"
      }`}
      onClick={() => onSort(field)}
    >
      <div className={`flex items-center gap-1 ${align === "right" ? "justify-end" : ""}`}>
        {label}
        <span className={`text-xs ${isActive ? "text-blue-600" : "text-gray-300"}`}>
          {isActive ? (currentSort.direction === "asc" ? "↑" : "↓") : "↕"}
        </span>
      </div>
    </th>
  );
}

function CategorySummaryTable({ breakdown }: { breakdown: DetailedBreakdown }) {
  const [sort, setSort] = useState<{ field: SortField; direction: SortDirection }>({
    field: "conversions",
    direction: "desc",
  });

  const summaryData = useMemo(() => {
    const categories = (Object.entries(breakdown) as [string, SourceMetrics[]][]).map(([key, sources]) => {
      const info = CATEGORY_INFO[key];
      const totals = sources.reduce(
        (acc, s) => ({
          sessions: acc.sessions + s.sessions,
          conversions: acc.conversions + s.conversions,
          formSubmissions: acc.formSubmissions + s.formSubmissions,
          phoneCalls: acc.phoneCalls + s.phoneCalls,
        }),
        { sessions: 0, conversions: 0, formSubmissions: 0, phoneCalls: 0 }
      );
      return {
        key,
        name: info.name,
        icon: info.icon,
        color: info.color,
        ...totals,
        clickToLeadRate: totals.sessions > 0 ? (totals.conversions / totals.sessions) * 100 : 0,
        sourceCount: sources.length,
      };
    });

    return categories.sort((a, b) => {
      const aVal = a[sort.field as keyof typeof a] as number;
      const bVal = b[sort.field as keyof typeof b] as number;
      return sort.direction === "asc" ? aVal - bVal : bVal - aVal;
    });
  }, [breakdown, sort]);

  const handleSort = (field: SortField) => {
    setSort((prev) => ({
      field,
      direction: prev.field === field && prev.direction === "desc" ? "asc" : "desc",
    }));
  };

  const grandTotal = summaryData.reduce(
    (acc, cat) => ({
      sessions: acc.sessions + cat.sessions,
      conversions: acc.conversions + cat.conversions,
      formSubmissions: acc.formSubmissions + cat.formSubmissions,
      phoneCalls: acc.phoneCalls + cat.phoneCalls,
    }),
    { sessions: 0, conversions: 0, formSubmissions: 0, phoneCalls: 0 }
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <h3 className="font-semibold text-lg">Summary by Category</h3>
        <p className="text-indigo-100 text-sm">Click column headers to sort</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left py-3 px-4 font-medium text-gray-500">Category</th>
              <SortableHeader label="Sessions" field="sessions" currentSort={sort} onSort={handleSort} />
              <SortableHeader label="Forms" field="formSubmissions" currentSort={sort} onSort={handleSort} />
              <SortableHeader label="Calls" field="phoneCalls" currentSort={sort} onSort={handleSort} />
              <SortableHeader label="Total Leads" field="conversions" currentSort={sort} onSort={handleSort} />
              <SortableHeader label="Conv. Rate" field="clickToLeadRate" currentSort={sort} onSort={handleSort} />
              <th className="text-right py-3 px-4 font-medium text-gray-500">Sources</th>
            </tr>
          </thead>
          <tbody>
            {summaryData.filter(cat => cat.sessions > 0).map((cat) => (
              <tr key={cat.key} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{cat.icon}</span>
                    <span className="font-medium text-gray-900">{cat.name}</span>
                  </div>
                </td>
                <td className="py-3 px-2 text-right text-gray-700">{cat.sessions.toLocaleString()}</td>
                <td className="py-3 px-2 text-right text-gray-700">{cat.formSubmissions.toLocaleString()}</td>
                <td className="py-3 px-2 text-right text-gray-700">{cat.phoneCalls.toLocaleString()}</td>
                <td className="py-3 px-2 text-right font-semibold text-gray-900">{cat.conversions.toLocaleString()}</td>
                <td className="py-3 px-2 text-right">
                  <span className={`font-semibold ${cat.clickToLeadRate > 5 ? "text-green-600" : cat.clickToLeadRate > 2 ? "text-blue-600" : "text-gray-600"}`}>
                    {cat.clickToLeadRate.toFixed(2)}%
                  </span>
                </td>
                <td className="py-3 px-4 text-right text-gray-500">{cat.sourceCount}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 font-semibold">
              <td className="py-3 px-4 text-gray-900">Total</td>
              <td className="py-3 px-2 text-right text-gray-900">{grandTotal.sessions.toLocaleString()}</td>
              <td className="py-3 px-2 text-right text-gray-900">{grandTotal.formSubmissions.toLocaleString()}</td>
              <td className="py-3 px-2 text-right text-gray-900">{grandTotal.phoneCalls.toLocaleString()}</td>
              <td className="py-3 px-2 text-right text-gray-900">{grandTotal.conversions.toLocaleString()}</td>
              <td className="py-3 px-2 text-right text-gray-900">
                {grandTotal.sessions > 0 ? ((grandTotal.conversions / grandTotal.sessions) * 100).toFixed(2) : 0}%
              </td>
              <td className="py-3 px-4 text-right text-gray-500">-</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function DetailedSourceTable({
  title,
  sources,
  color,
  icon,
  defaultExpanded = true,
}: {
  title: string;
  sources: SourceMetrics[];
  color: string;
  icon: string;
  defaultExpanded?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [sort, setSort] = useState<{ field: SortField; direction: SortDirection }>({
    field: "sessions",
    direction: "desc",
  });

  const sortedSources = useMemo(() => {
    return [...sources].sort((a, b) => {
      let aVal: number | string = a[sort.field as keyof SourceMetrics] as number | string;
      let bVal: number | string = b[sort.field as keyof SourceMetrics] as number | string;

      if (sort.field === "source") {
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();
        return sort.direction === "asc"
          ? aVal.localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal as string);
      }

      return sort.direction === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  }, [sources, sort]);

  const handleSort = (field: SortField) => {
    setSort((prev) => ({
      field,
      direction: prev.field === field && prev.direction === "desc" ? "asc" : "desc",
    }));
  };

  const totals = sources.reduce(
    (acc, s) => ({
      sessions: acc.sessions + s.sessions,
      conversions: acc.conversions + s.conversions,
      forms: acc.forms + s.formSubmissions,
      phones: acc.phones + s.phoneCalls,
    }),
    { sessions: 0, conversions: 0, forms: 0, phones: 0 }
  );

  if (sources.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div
        className={`px-4 py-3 ${color} cursor-pointer`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{icon}</span>
            <h3 className="font-semibold">{title}</h3>
            <span className="text-sm opacity-75">({sources.length} sources)</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-4 text-sm">
              <span><strong>{totals.sessions.toLocaleString()}</strong> sessions</span>
              <span><strong>{totals.conversions.toLocaleString()}</strong> leads</span>
            </div>
            <span className="text-lg">{isExpanded ? "▼" : "▶"}</span>
          </div>
        </div>
      </div>
      {isExpanded && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <SortableHeader label="Source" field="source" currentSort={sort} onSort={handleSort} align="left" />
                <th className="text-left py-2 px-2 font-medium text-gray-500">Medium</th>
                <SortableHeader label="Sessions" field="sessions" currentSort={sort} onSort={handleSort} />
                <SortableHeader label="Forms" field="formSubmissions" currentSort={sort} onSort={handleSort} />
                <SortableHeader label="Calls" field="phoneCalls" currentSort={sort} onSort={handleSort} />
                <SortableHeader label="Leads" field="conversions" currentSort={sort} onSort={handleSort} />
                <SortableHeader label="Conv. Rate" field="clickToLeadRate" currentSort={sort} onSort={handleSort} />
              </tr>
            </thead>
            <tbody>
              {sortedSources.map((source, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 px-4">
                    <div className="flex items-center gap-2">
                      <span>{getSourceIcon(source.source)}</span>
                      <span className="font-medium text-gray-900">{source.source}</span>
                    </div>
                  </td>
                  <td className="py-2 px-2 text-gray-500">{source.medium}</td>
                  <td className="py-2 px-2 text-right text-gray-700">{source.sessions.toLocaleString()}</td>
                  <td className="py-2 px-2 text-right text-gray-700">{source.formSubmissions.toLocaleString()}</td>
                  <td className="py-2 px-2 text-right text-gray-700">{source.phoneCalls.toLocaleString()}</td>
                  <td className="py-2 px-2 text-right font-semibold text-gray-900">{source.conversions.toLocaleString()}</td>
                  <td className="py-2 px-4 text-right">
                    <span className={`font-semibold ${source.clickToLeadRate > 5 ? "text-green-600" : source.clickToLeadRate > 2 ? "text-blue-600" : "text-gray-600"}`}>
                      {source.clickToLeadRate.toFixed(2)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-semibold">
                <td className="py-2 px-4 text-gray-900" colSpan={2}>Total</td>
                <td className="py-2 px-2 text-right text-gray-900">{totals.sessions.toLocaleString()}</td>
                <td className="py-2 px-2 text-right text-gray-900">{totals.forms.toLocaleString()}</td>
                <td className="py-2 px-2 text-right text-gray-900">{totals.phones.toLocaleString()}</td>
                <td className="py-2 px-2 text-right text-gray-900">{totals.conversions.toLocaleString()}</td>
                <td className="py-2 px-4 text-right text-gray-900">
                  {totals.sessions > 0 ? ((totals.conversions / totals.sessions) * 100).toFixed(2) : 0}%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

export default function WeeklyDashboard() {
  const [data, setData] = useState<WeeklyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodType, setPeriodType] = useState<"lastWeek" | "last7days">("lastWeek");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const url = periodType === "lastWeek"
        ? "/api/analytics/weekly?period=lastWeek"
        : "/api/analytics/weekly?period=custom&startDate=7daysAgo&endDate=yesterday";

      const response = await fetch(url);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch data");
      }

      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [periodType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const formatFullDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-64" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const chartData = data.daily.map((d) => ({
    ...d,
    formattedDate: formatDate(d.date),
  }));

  const breakdown = data.detailedBreakdown;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Weekly Performance Report</h1>
              <p className="text-gray-500 text-sm mt-1">
                {formatFullDate(data.period.current.startDate)} - {formatFullDate(data.period.current.endDate)}
                <span className="text-gray-400 ml-2">
                  (vs {formatFullDate(data.period.lastYear.startDate)} - {formatFullDate(data.period.lastYear.endDate)})
                </span>
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPeriodType("lastWeek")}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                  periodType === "lastWeek"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Last Week (Mon-Sun)
              </button>
              <button
                onClick={() => setPeriodType("last7days")}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                  periodType === "last7days"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Last 7 Days
              </button>
              <Link
                href="/"
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Daily View
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Primary Metrics - Forms, Calls, Click to Lead */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Lead Generation</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              title="Form Submissions"
              value={data.totals.formSubmissions}
              change={data.comparison.changes.formSubmissions}
              lastYearValue={data.comparison.lastYear.formSubmissions}
              icon="📝"
              highlight={true}
            />
            <MetricCard
              title="Phone Calls"
              value={data.totals.phoneCalls}
              change={data.comparison.changes.phoneCalls}
              lastYearValue={data.comparison.lastYear.phoneCalls}
              icon="📞"
              highlight={true}
            />
            <MetricCard
              title="Total Leads"
              value={data.totals.conversions}
              change={data.comparison.changes.conversions}
              lastYearValue={data.comparison.lastYear.conversions}
              icon="🎯"
              highlight={true}
            />
            <MetricCard
              title="Click → Lead Rate"
              value={data.totals.clickToLeadRate}
              change={data.comparison.changes.clickToLeadRate}
              lastYearValue={data.comparison.lastYear.clickToLeadRate}
              format="percent"
              icon="📈"
              highlight={true}
            />
          </div>
        </section>

        {/* Search Performance */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Search Performance</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              title="Impressions"
              value={data.totals.impressions}
              change={data.comparison.changes.impressions}
              lastYearValue={data.comparison.lastYear.impressions}
              icon="👀"
            />
            <MetricCard
              title="Clicks"
              value={data.totals.clicks}
              change={data.comparison.changes.clicks}
              lastYearValue={data.comparison.lastYear.clicks}
              icon="🖱"
            />
            <MetricCard
              title="CTR (Impression → Click)"
              value={data.totals.ctr}
              change={data.comparison.changes.ctr}
              lastYearValue={data.comparison.lastYear.ctr}
              format="percent"
              icon="📊"
            />
            <MetricCard
              title="Users"
              value={data.totals.users}
              change={data.comparison.changes.users}
              lastYearValue={data.comparison.lastYear.users}
              icon="👥"
            />
          </div>
        </section>

        {/* Category Summary Table */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h2>
          <CategorySummaryTable breakdown={breakdown} />
        </section>

        {/* Detailed Channel Breakdowns */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Detailed Channel Performance</h2>
          <p className="text-gray-500 text-sm mb-4">Click headers to sort • Click category headers to expand/collapse</p>
          <div className="space-y-4">
            <DetailedSourceTable
              title="Organic Search"
              sources={breakdown.organicSearch}
              color="bg-green-100 text-green-800"
              icon="🔍"
            />
            <DetailedSourceTable
              title="Paid Search & Ads"
              sources={breakdown.paidSearch}
              color="bg-blue-100 text-blue-800"
              icon="💰"
            />
            <DetailedSourceTable
              title="AI / LLM Referrals"
              sources={breakdown.llmAI}
              color="bg-purple-100 text-purple-800"
              icon="🤖"
            />
            <DetailedSourceTable
              title="Listings & Directories"
              sources={breakdown.listings}
              color="bg-yellow-100 text-yellow-800"
              icon="📋"
            />
            <DetailedSourceTable
              title="Direct Traffic"
              sources={breakdown.direct}
              color="bg-gray-200 text-gray-800"
              icon="🎯"
            />
            <DetailedSourceTable
              title="Social Media"
              sources={breakdown.social}
              color="bg-pink-100 text-pink-800"
              icon="📱"
              defaultExpanded={false}
            />
            <DetailedSourceTable
              title="Referral Sites"
              sources={breakdown.referral}
              color="bg-orange-100 text-orange-800"
              icon="🔗"
              defaultExpanded={false}
            />
            {breakdown.other.length > 0 && (
              <DetailedSourceTable
                title="Other Sources"
                sources={breakdown.other}
                color="bg-slate-100 text-slate-800"
                icon="🌐"
                defaultExpanded={false}
              />
            )}
          </div>
        </section>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Leads Trend */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Leads</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.leads.byDay.map((d) => ({ ...d, formattedDate: formatDate(d.date) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="formattedDate" fontSize={11} tickLine={false} />
                <YAxis fontSize={11} tickLine={false} />
                <Tooltip />
                <Bar dataKey="leads" name="Leads" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Traffic Trend */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Traffic Trend</h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="formattedDate" fontSize={11} tickLine={false} />
                <YAxis fontSize={11} tickLine={false} />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="users"
                  name="Users"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.1}
                />
                <Area
                  type="monotone"
                  dataKey="sessions"
                  name="Sessions"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.1}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Leads by Channel Pie + Top Pages */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Leads by Channel Type</h3>
            <div className="flex items-center">
              <ResponsiveContainer width="50%" height={220}>
                <PieChart>
                  <Pie
                    data={data.conversionsByChannel.filter(c => c.conversions > 0)}
                    dataKey="conversions"
                    nameKey="channel"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={50}
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {data.conversionsByChannel.filter(c => c.conversions > 0).map((entry, i) => (
                      <Cell key={i} fill={CHANNEL_COLORS[entry.channel] || COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {data.conversionsByChannel.filter(c => c.conversions > 0).slice(0, 6).map((channel, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: CHANNEL_COLORS[channel.channel] || COLORS[i % COLORS.length] }}
                      />
                      <span className="text-gray-700 truncate max-w-[120px]">{channel.channel}</span>
                    </div>
                    <span className="font-semibold">{channel.conversions}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Pages</h3>
            <div className="space-y-3">
              {data.topPages.slice(0, 7).map((page, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="text-sm font-medium text-gray-900 truncate">{page.title || page.path}</p>
                    <p className="text-xs text-gray-500 truncate">{page.path}</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{page.pageviews.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-lg font-semibold mb-4">Weekly Summary vs Last Year</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div>
              <p className="text-blue-100 text-sm">Total Leads</p>
              <p className="text-3xl font-bold">{data.totals.conversions.toLocaleString()}</p>
              <p className={`text-sm ${data.comparison.changes.conversions >= 0 ? "text-green-300" : "text-red-300"}`}>
                {data.comparison.changes.conversions >= 0 ? "↑" : "↓"} {Math.abs(data.comparison.changes.conversions).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-blue-100 text-sm">Form Submissions</p>
              <p className="text-3xl font-bold">{data.totals.formSubmissions.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-blue-100 text-sm">Phone Calls</p>
              <p className="text-3xl font-bold">{data.totals.phoneCalls.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-blue-100 text-sm">Click → Lead</p>
              <p className="text-3xl font-bold">{data.totals.clickToLeadRate.toFixed(2)}%</p>
            </div>
            <div>
              <p className="text-blue-100 text-sm">Total Users</p>
              <p className="text-3xl font-bold">{data.totals.users.toLocaleString()}</p>
              <p className={`text-sm ${data.comparison.changes.users >= 0 ? "text-green-300" : "text-red-300"}`}>
                {data.comparison.changes.users >= 0 ? "↑" : "↓"} {Math.abs(data.comparison.changes.users).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-8">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <p className="text-center text-gray-500 text-sm">
            Data compared with same week last year ({formatFullDate(data.period.lastYear.startDate)} - {formatFullDate(data.period.lastYear.endDate)})
          </p>
        </div>
      </footer>
    </div>
  );
}
