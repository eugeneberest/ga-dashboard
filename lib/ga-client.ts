import { BetaAnalyticsDataClient } from "@google-analytics/data";

const analyticsDataClient = new BetaAnalyticsDataClient();

const propertyId = process.env.GA_PROPERTY_ID || "";

export interface MetricsResult {
  date: string;
  users: number;
  sessions: number;
  bounceRate: number;
  conversions: number;
  pageviews: number;
}

export interface WeeklyMetrics {
  date: string;
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
}

export interface TopPage {
  path: string;
  title: string;
  pageviews: number;
  avgTimeOnPage: number;
}

export interface TrafficSource {
  source: string;
  medium: string;
  sessions: number;
  users: number;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export async function getMetrics(
  dateRange: DateRange,
  metrics: string[] = ["activeUsers", "sessions", "bounceRate", "conversions", "screenPageViews"]
): Promise<MetricsResult[]> {
  const [response] = await analyticsDataClient.runReport({
    property: propertyId,
    dateRanges: [{ startDate: dateRange.startDate, endDate: dateRange.endDate }],
    dimensions: [{ name: "date" }],
    metrics: metrics.map((m) => ({ name: m })),
    orderBys: [{ dimension: { dimensionName: "date" } }],
  });

  const results: MetricsResult[] = [];

  if (response.rows) {
    for (const row of response.rows) {
      const date = row.dimensionValues?.[0]?.value || "";
      const metricValues = row.metricValues || [];

      results.push({
        date: formatDate(date),
        users: parseInt(metricValues[0]?.value || "0"),
        sessions: parseInt(metricValues[1]?.value || "0"),
        bounceRate: parseFloat(metricValues[2]?.value || "0") * 100,
        conversions: parseInt(metricValues[3]?.value || "0"),
        pageviews: parseInt(metricValues[4]?.value || "0"),
      });
    }
  }

  return results;
}

export async function getAggregatedMetrics(dateRange: DateRange): Promise<{
  users: number;
  sessions: number;
  bounceRate: number;
  conversions: number;
  pageviews: number;
}> {
  const [response] = await analyticsDataClient.runReport({
    property: propertyId,
    dateRanges: [{ startDate: dateRange.startDate, endDate: dateRange.endDate }],
    metrics: [
      { name: "activeUsers" },
      { name: "sessions" },
      { name: "bounceRate" },
      { name: "conversions" },
      { name: "screenPageViews" },
    ],
  });

  const metricValues = response.rows?.[0]?.metricValues || [];

  return {
    users: parseInt(metricValues[0]?.value || "0"),
    sessions: parseInt(metricValues[1]?.value || "0"),
    bounceRate: parseFloat(metricValues[2]?.value || "0") * 100,
    conversions: parseInt(metricValues[3]?.value || "0"),
    pageviews: parseInt(metricValues[4]?.value || "0"),
  };
}

export async function getWeeklyDashboardMetrics(dateRange: DateRange): Promise<{
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
  daily: WeeklyMetrics[];
}> {
  // Fetch main metrics
  const [mainResponse] = await analyticsDataClient.runReport({
    property: propertyId,
    dateRanges: [{ startDate: dateRange.startDate, endDate: dateRange.endDate }],
    dimensions: [{ name: "date" }],
    metrics: [
      { name: "activeUsers" },
      { name: "newUsers" },
      { name: "sessions" },
      { name: "screenPageViews" },
      { name: "bounceRate" },
      { name: "engagementRate" },
      { name: "conversions" },
      { name: "averageSessionDuration" },
    ],
    orderBys: [{ dimension: { dimensionName: "date" } }],
  });

  // Fetch Search Console metrics (if available)
  let searchData: Map<string, { impressions: number; clicks: number; ctr: number }> = new Map();
  try {
    const [searchResponse] = await analyticsDataClient.runReport({
      property: propertyId,
      dateRanges: [{ startDate: dateRange.startDate, endDate: dateRange.endDate }],
      dimensions: [{ name: "date" }],
      metrics: [
        { name: "organicGoogleSearchImpressions" },
        { name: "organicGoogleSearchClicks" },
        { name: "organicGoogleSearchClickThroughRate" },
      ],
      orderBys: [{ dimension: { dimensionName: "date" } }],
    });

    if (searchResponse.rows) {
      for (const row of searchResponse.rows) {
        const date = formatDate(row.dimensionValues?.[0]?.value || "");
        searchData.set(date, {
          impressions: parseInt(row.metricValues?.[0]?.value || "0"),
          clicks: parseInt(row.metricValues?.[1]?.value || "0"),
          ctr: parseFloat(row.metricValues?.[2]?.value || "0") * 100,
        });
      }
    }
  } catch {
    // Search Console data may not be available
  }

  const daily: WeeklyMetrics[] = [];
  let totalUsers = 0, totalNewUsers = 0, totalSessions = 0, totalPageviews = 0;
  let totalConversions = 0, totalImpressions = 0, totalClicks = 0;
  let bounceRateSum = 0, engagementRateSum = 0, avgSessionDurationSum = 0;
  let rowCount = 0;

  if (mainResponse.rows) {
    for (const row of mainResponse.rows) {
      const date = formatDate(row.dimensionValues?.[0]?.value || "");
      const metricValues = row.metricValues || [];
      const search = searchData.get(date) || { impressions: 0, clicks: 0, ctr: 0 };

      const users = parseInt(metricValues[0]?.value || "0");
      const newUsers = parseInt(metricValues[1]?.value || "0");
      const sessions = parseInt(metricValues[2]?.value || "0");
      const pageviews = parseInt(metricValues[3]?.value || "0");
      const bounceRate = parseFloat(metricValues[4]?.value || "0") * 100;
      const engagementRate = parseFloat(metricValues[5]?.value || "0") * 100;
      const conversions = parseInt(metricValues[6]?.value || "0");
      const avgSessionDuration = parseFloat(metricValues[7]?.value || "0");

      daily.push({
        date,
        users,
        newUsers,
        sessions,
        pageviews,
        bounceRate,
        engagementRate,
        conversions,
        impressions: search.impressions,
        clicks: search.clicks,
        ctr: search.ctr,
      });

      totalUsers += users;
      totalNewUsers += newUsers;
      totalSessions += sessions;
      totalPageviews += pageviews;
      totalConversions += conversions;
      totalImpressions += search.impressions;
      totalClicks += search.clicks;
      bounceRateSum += bounceRate;
      engagementRateSum += engagementRate;
      avgSessionDurationSum += avgSessionDuration;
      rowCount++;
    }
  }

  return {
    totals: {
      users: totalUsers,
      newUsers: totalNewUsers,
      sessions: totalSessions,
      pageviews: totalPageviews,
      bounceRate: rowCount > 0 ? bounceRateSum / rowCount : 0,
      engagementRate: rowCount > 0 ? engagementRateSum / rowCount : 0,
      conversions: totalConversions,
      impressions: totalImpressions,
      clicks: totalClicks,
      ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
      avgSessionDuration: rowCount > 0 ? avgSessionDurationSum / rowCount : 0,
    },
    daily,
  };
}

export async function getLeadsAndConversions(dateRange: DateRange): Promise<{
  total: number;
  bySource: Array<{ source: string; leads: number }>;
  byDay: Array<{ date: string; leads: number }>;
}> {
  // Get conversions by source
  const [bySourceResponse] = await analyticsDataClient.runReport({
    property: propertyId,
    dateRanges: [{ startDate: dateRange.startDate, endDate: dateRange.endDate }],
    dimensions: [{ name: "sessionSource" }],
    metrics: [{ name: "conversions" }],
    orderBys: [{ metric: { metricName: "conversions" }, desc: true }],
    limit: 10,
  });

  // Get conversions by day
  const [byDayResponse] = await analyticsDataClient.runReport({
    property: propertyId,
    dateRanges: [{ startDate: dateRange.startDate, endDate: dateRange.endDate }],
    dimensions: [{ name: "date" }],
    metrics: [{ name: "conversions" }],
    orderBys: [{ dimension: { dimensionName: "date" } }],
  });

  const bySource = (bySourceResponse.rows || []).map((row) => ({
    source: row.dimensionValues?.[0]?.value || "Unknown",
    leads: parseInt(row.metricValues?.[0]?.value || "0"),
  }));

  const byDay = (byDayResponse.rows || []).map((row) => ({
    date: formatDate(row.dimensionValues?.[0]?.value || ""),
    leads: parseInt(row.metricValues?.[0]?.value || "0"),
  }));

  const total = byDay.reduce((sum, day) => sum + day.leads, 0);

  return { total, bySource, byDay };
}

export async function getTopPages(
  dateRange: DateRange,
  limit: number = 10
): Promise<TopPage[]> {
  const [response] = await analyticsDataClient.runReport({
    property: propertyId,
    dateRanges: [{ startDate: dateRange.startDate, endDate: dateRange.endDate }],
    dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
    metrics: [{ name: "screenPageViews" }, { name: "averageSessionDuration" }],
    orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
    limit,
  });

  const results: TopPage[] = [];

  if (response.rows) {
    for (const row of response.rows) {
      results.push({
        path: row.dimensionValues?.[0]?.value || "",
        title: row.dimensionValues?.[1]?.value || "",
        pageviews: parseInt(row.metricValues?.[0]?.value || "0"),
        avgTimeOnPage: parseFloat(row.metricValues?.[1]?.value || "0"),
      });
    }
  }

  return results;
}

export async function getTrafficSources(dateRange: DateRange): Promise<TrafficSource[]> {
  const [response] = await analyticsDataClient.runReport({
    property: propertyId,
    dateRanges: [{ startDate: dateRange.startDate, endDate: dateRange.endDate }],
    dimensions: [{ name: "sessionSource" }, { name: "sessionMedium" }],
    metrics: [{ name: "sessions" }, { name: "activeUsers" }],
    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    limit: 20,
  });

  const results: TrafficSource[] = [];

  if (response.rows) {
    for (const row of response.rows) {
      results.push({
        source: row.dimensionValues?.[0]?.value || "",
        medium: row.dimensionValues?.[1]?.value || "",
        sessions: parseInt(row.metricValues?.[0]?.value || "0"),
        users: parseInt(row.metricValues?.[1]?.value || "0"),
      });
    }
  }

  return results;
}

export async function comparePeriods(
  period1: DateRange,
  period2: DateRange
): Promise<{
  period1: { users: number; sessions: number; pageviews: number };
  period2: { users: number; sessions: number; pageviews: number };
  changes: { users: number; sessions: number; pageviews: number };
}> {
  const [metrics1, metrics2] = await Promise.all([
    getAggregatedMetrics(period1),
    getAggregatedMetrics(period2),
  ]);

  const calculateChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  return {
    period1: {
      users: metrics1.users,
      sessions: metrics1.sessions,
      pageviews: metrics1.pageviews,
    },
    period2: {
      users: metrics2.users,
      sessions: metrics2.sessions,
      pageviews: metrics2.pageviews,
    },
    changes: {
      users: calculateChange(metrics1.users, metrics2.users),
      sessions: calculateChange(metrics1.sessions, metrics2.sessions),
      pageviews: calculateChange(metrics1.pageviews, metrics2.pageviews),
    },
  };
}

export async function compareWeeklyMetrics(
  period1: DateRange,
  period2: DateRange
): Promise<{
  current: Awaited<ReturnType<typeof getWeeklyDashboardMetrics>>["totals"];
  previous: Awaited<ReturnType<typeof getWeeklyDashboardMetrics>>["totals"];
  changes: Record<string, number>;
}> {
  const [current, previous] = await Promise.all([
    getWeeklyDashboardMetrics(period1),
    getWeeklyDashboardMetrics(period2),
  ]);

  const calculateChange = (curr: number, prev: number): number => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return ((curr - prev) / prev) * 100;
  };

  return {
    current: current.totals,
    previous: previous.totals,
    changes: {
      users: calculateChange(current.totals.users, previous.totals.users),
      newUsers: calculateChange(current.totals.newUsers, previous.totals.newUsers),
      sessions: calculateChange(current.totals.sessions, previous.totals.sessions),
      pageviews: calculateChange(current.totals.pageviews, previous.totals.pageviews),
      conversions: calculateChange(current.totals.conversions, previous.totals.conversions),
      impressions: calculateChange(current.totals.impressions, previous.totals.impressions),
      clicks: calculateChange(current.totals.clicks, previous.totals.clicks),
      ctr: calculateChange(current.totals.ctr, previous.totals.ctr),
    },
  };
}

export async function detectAnomalies(
  metric: string,
  threshold: number = 2
): Promise<{
  hasAnomaly: boolean;
  anomalies: Array<{ date: string; value: number; deviation: number }>;
}> {
  const dateRange: DateRange = {
    startDate: "30daysAgo",
    endDate: "today",
  };

  const metricMap: Record<string, string> = {
    users: "activeUsers",
    sessions: "sessions",
    pageviews: "screenPageViews",
    bounceRate: "bounceRate",
  };

  const gaMetric = metricMap[metric] || metric;

  const [response] = await analyticsDataClient.runReport({
    property: propertyId,
    dateRanges: [{ startDate: dateRange.startDate, endDate: dateRange.endDate }],
    dimensions: [{ name: "date" }],
    metrics: [{ name: gaMetric }],
    orderBys: [{ dimension: { dimensionName: "date" } }],
  });

  const values: Array<{ date: string; value: number }> = [];

  if (response.rows) {
    for (const row of response.rows) {
      values.push({
        date: formatDate(row.dimensionValues?.[0]?.value || ""),
        value: parseFloat(row.metricValues?.[0]?.value || "0"),
      });
    }
  }

  const numValues = values.map((v) => v.value);
  const mean = numValues.reduce((a, b) => a + b, 0) / numValues.length;
  const stdDev = Math.sqrt(
    numValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / numValues.length
  );

  const anomalies = values
    .map((v) => ({
      date: v.date,
      value: v.value,
      deviation: stdDev > 0 ? (v.value - mean) / stdDev : 0,
    }))
    .filter((v) => Math.abs(v.deviation) > threshold);

  return {
    hasAnomaly: anomalies.length > 0,
    anomalies,
  };
}

function formatDate(dateStr: string): string {
  if (dateStr.length === 8) {
    return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
  }
  return dateStr;
}
