"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  LineChart,
  Line,
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

interface WeeklyData {
  period: { startDate: string; endDate: string };
  totals: {
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
  };
  daily: Array<{
    date: string;
    users: number;
    newUsers: number;
    sessions: number;
    pageviews: number;
    conversions: number;
    impressions: number;
    clicks: number;
    ctr: number;
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
    avgTimeOnPage: number;
  }>;
  trafficSources: Array<{
    source: string;
    medium: string;
    sessions: number;
    users: number;
  }>;
  comparison: {
    current: typeof WeeklyData.prototype.totals;
    previous: typeof WeeklyData.prototype.totals;
    changes: Record<string, number>;
  };
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

function MetricCard({
  title,
  value,
  change,
  format = "number",
  icon,
}: {
  title: string;
  value: number;
  change?: number;
  format?: "number" | "percent" | "duration";
  icon?: string;
}) {
  const formatValue = (val: number): string => {
    switch (format) {
      case "percent":
        return `${val.toFixed(1)}%`;
      case "duration":
        const mins = Math.floor(val / 60);
        const secs = Math.round(val % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
      default:
        return val.toLocaleString();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-500 text-sm font-medium">{title}</span>
        {icon && <span className="text-xl">{icon}</span>}
      </div>
      <div className="text-2xl font-bold text-gray-900">{formatValue(value)}</div>
      {change !== undefined && (
        <div
          className={`text-sm mt-1 flex items-center gap-1 ${
            change >= 0 ? "text-green-600" : "text-red-600"
          }`}
        >
          <span>{change >= 0 ? "↑" : "↓"}</span>
          <span>{Math.abs(change).toFixed(1)}% vs last week</span>
        </div>
      )}
    </div>
  );
}

export default function WeeklyDashboard() {
  const [data, setData] = useState<WeeklyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/analytics/weekly");
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
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
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
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-28 bg-gray-200 rounded-xl" />
              ))}
            </div>
            <div className="h-80 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const chartData = data.daily.map((d) => ({
    ...d,
    formattedDate: formatDate(d.date),
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Weekly Dashboard</h1>
              <p className="text-gray-500 text-sm mt-1">
                {formatDate(data.period.startDate)} - {formatDate(data.period.endDate)}
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/"
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Daily View
              </Link>
              <button
                onClick={fetchData}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Key Metrics Grid */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Key Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <MetricCard
              title="Users"
              value={data.totals.users}
              change={data.comparison.changes.users}
              icon="👥"
            />
            <MetricCard
              title="New Users"
              value={data.totals.newUsers}
              change={data.comparison.changes.newUsers}
              icon="🆕"
            />
            <MetricCard
              title="Sessions"
              value={data.totals.sessions}
              change={data.comparison.changes.sessions}
              icon="📊"
            />
            <MetricCard
              title="Pageviews"
              value={data.totals.pageviews}
              change={data.comparison.changes.pageviews}
              icon="👁"
            />
            <MetricCard
              title="Bounce Rate"
              value={data.totals.bounceRate}
              format="percent"
              icon="↩️"
            />
            <MetricCard
              title="Avg. Duration"
              value={data.totals.avgSessionDuration}
              format="duration"
              icon="⏱"
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
              icon="👀"
            />
            <MetricCard
              title="Clicks"
              value={data.totals.clicks}
              change={data.comparison.changes.clicks}
              icon="🖱"
            />
            <MetricCard
              title="CTR"
              value={data.totals.ctr}
              change={data.comparison.changes.ctr}
              format="percent"
              icon="📈"
            />
            <MetricCard
              title="Leads / Conversions"
              value={data.totals.conversions}
              change={data.comparison.changes.conversions}
              icon="🎯"
            />
          </div>
        </section>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

          {/* Conversions/Leads Trend */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Leads & Conversions</h3>
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
        </div>

        {/* Search Metrics Chart */}
        {data.totals.impressions > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Performance Trend</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="formattedDate" fontSize={11} tickLine={false} />
                <YAxis yAxisId="left" fontSize={11} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" fontSize={11} tickLine={false} />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="impressions"
                  name="Impressions"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="clicks"
                  name="Clicks"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="ctr"
                  name="CTR %"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Pages */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Pages</h3>
            <div className="space-y-3">
              {data.topPages.slice(0, 7).map((page, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {page.title || page.path}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{page.path}</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {page.pageviews.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Traffic Sources */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Traffic Sources</h3>
            <div className="space-y-3">
              {data.trafficSources.slice(0, 7).map((source, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{source.source}</p>
                      <p className="text-xs text-gray-500">{source.medium}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {source.sessions.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Leads by Source */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Leads by Source</h3>
            {data.leads.bySource.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={180}>
                  <PieChart>
                    <Pie
                      data={data.leads.bySource.slice(0, 5)}
                      dataKey="leads"
                      nameKey="source"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      innerRadius={40}
                    >
                      {data.leads.bySource.slice(0, 5).map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {data.leads.bySource.slice(0, 5).map((source, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[i % COLORS.length] }}
                        />
                        <span className="text-gray-700 truncate max-w-[100px]">
                          {source.source}
                        </span>
                      </div>
                      <span className="font-semibold">{source.leads}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-8">No conversion data available</p>
            )}
          </div>
        </div>

        {/* Week Summary */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-lg font-semibold mb-4">Weekly Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-blue-100 text-sm">Total Visitors</p>
              <p className="text-3xl font-bold">{data.totals.users.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-blue-100 text-sm">Total Pageviews</p>
              <p className="text-3xl font-bold">{data.totals.pageviews.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-blue-100 text-sm">Total Leads</p>
              <p className="text-3xl font-bold">{data.leads.total.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-blue-100 text-sm">Engagement Rate</p>
              <p className="text-3xl font-bold">{data.totals.engagementRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-8">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <p className="text-center text-gray-500 text-sm">
            Powered by Google Analytics Data API
          </p>
        </div>
      </footer>
    </div>
  );
}
