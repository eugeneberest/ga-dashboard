"use client";

import { useState, useEffect, useCallback } from "react";
import { format, subDays } from "date-fns";
import Link from "next/link";
import MetricCard from "./components/MetricCard";
import Chart from "./components/Chart";
import DatePicker from "./components/DatePicker";
import AIChat from "./components/AIChat";
import TopPagesTable from "./components/TopPagesTable";
import AlertsSection from "./components/AlertsSection";

interface DashboardData {
  aggregated: {
    users: number;
    sessions: number;
    bounceRate: number;
    conversions: number;
    pageviews: number;
  };
  metrics: Array<{
    date: string;
    users: number;
    sessions: number;
    pageviews: number;
    bounceRate: number;
  }>;
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
  anomalies: {
    hasAnomaly: boolean;
    anomalies: Array<{
      date: string;
      value: number;
      deviation: number;
    }>;
  };
}

interface ComparisonData {
  changes: {
    users: number;
    sessions: number;
    pageviews: number;
  };
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 6), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const dashboardResponse = await fetch(
        `/api/analytics?action=dashboard&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
      );
      const dashboardData = await dashboardResponse.json();

      if (!dashboardData.success) {
        throw new Error(dashboardData.error || "Failed to fetch dashboard data");
      }

      setData(dashboardData.data);

      const compareResponse = await fetch(
        `/api/analytics?action=compare&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&period2StartDate=${format(subDays(new Date(dateRange.startDate), 7), "yyyy-MM-dd")}&period2EndDate=${format(subDays(new Date(dateRange.endDate), 7), "yyyy-MM-dd")}`
      );
      const compareData = await compareResponse.json();

      if (compareData.success) {
        setComparison(compareData.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDateChange = (startDate: string, endDate: string) => {
    setDateRange({ startDate, endDate });
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Analytics Dashboard
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Google Analytics data with AI-powered insights
              </p>
            </div>
            <Link
              href="/weekly"
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Weekly Report
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <DatePicker onDateChange={handleDateChange} />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Users"
            value={data?.aggregated.users ?? 0}
            change={comparison?.changes.users}
            format="number"
          />
          <MetricCard
            title="Sessions"
            value={data?.aggregated.sessions ?? 0}
            change={comparison?.changes.sessions}
            format="number"
          />
          <MetricCard
            title="Bounce Rate"
            value={data?.aggregated.bounceRate ?? 0}
            format="percent"
          />
          <MetricCard
            title="Pageviews"
            value={data?.aggregated.pageviews ?? 0}
            change={comparison?.changes.pageviews}
            format="number"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {data?.metrics && data.metrics.length > 0 ? (
              <Chart
                data={data.metrics}
                type="area"
                metrics={["users", "sessions"]}
              />
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-[348px] flex items-center justify-center">
                {isLoading ? (
                  <div className="animate-pulse text-gray-400">Loading chart...</div>
                ) : (
                  <p className="text-gray-500">No traffic data available</p>
                )}
              </div>
            )}
          </div>

          <div>
            <AlertsSection
              anomalies={data?.anomalies.anomalies ?? []}
              metric="users"
              isLoading={isLoading}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopPagesTable pages={data?.topPages ?? []} isLoading={isLoading} />

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Traffic Sources
            </h3>
            <div className="space-y-3">
              {isLoading ? (
                <div className="animate-pulse space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-8 bg-gray-200 rounded" />
                  ))}
                </div>
              ) : (
                data?.trafficSources.slice(0, 5).map((source, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {source.source}
                      </p>
                      <p className="text-xs text-gray-500">{source.medium}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {source.sessions.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">sessions</p>
                    </div>
                  </div>
                ))
              )}
              {!isLoading && (!data?.trafficSources || data.trafficSources.length === 0) && (
                <p className="text-center py-4 text-gray-500 text-sm">
                  No traffic source data available
                </p>
              )}
            </div>
          </div>
        </div>

        <div>
          <AIChat />
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <p className="text-center text-gray-500 text-sm">
            Powered by Google Analytics Data API and Claude AI
          </p>
        </div>
      </footer>
    </div>
  );
}
