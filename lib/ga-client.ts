import { BetaAnalyticsDataClient } from "@google-analytics/data";

// Support both file-based credentials (local) and JSON string (Vercel)
const getCredentials = () => {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    return JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
  }
  return undefined; // Falls back to GOOGLE_APPLICATION_CREDENTIALS file
};

const credentials = getCredentials();
const analyticsDataClient = credentials
  ? new BetaAnalyticsDataClient({ credentials })
  : new BetaAnalyticsDataClient();

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

export interface ChannelMetrics {
  channel: string;
  users: number;
  sessions: number;
  clicks: number;
  conversions: number;
  formSubmissions: number;
  phoneCalls: number;
  clickToLeadRate: number;
}

export interface SourceMetrics {
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

export interface DetailedChannelBreakdown {
  organicSearch: SourceMetrics[];
  paidSearch: SourceMetrics[];
  llmAI: SourceMetrics[];
  listings: SourceMetrics[];
  social: SourceMetrics[];
  referral: SourceMetrics[];
  direct: SourceMetrics[];
  other: SourceMetrics[];
}

export interface ConversionsByType {
  formSubmissions: number;
  phoneCalls: number;
  totalConversions: number;
  byChannel: ChannelMetrics[];
}

// Known LLM/AI sources
const LLM_SOURCES = [
  'chatgpt.com', 'chat.openai.com', 'openai.com',
  'perplexity.ai', 'perplexity',
  'claude.ai', 'anthropic.com',
  'bard.google.com', 'gemini.google.com',
  'bing.com/chat', 'copilot.microsoft.com',
  'you.com', 'phind.com', 'poe.com'
];

// Known listing/directory sources
const LISTING_SOURCES = [
  'yelp.com', 'm.yelp.com', 'yelp',
  'google.com/maps', 'maps.google.com', 'google.com/local',
  'business.google.com', 'g.page',
  'clutch.co', 'expertise.com', 'thumbtack.com',
  'homeadvisor.com', 'angieslist.com', 'angi.com',
  'bbb.org', 'yellowpages.com', 'manta.com',
  'facebook.com/biz', 'nextdoor.com',
  'avvo.com', 'justia.com', 'lawyers.com',
  'healthgrades.com', 'zocdoc.com', 'vitals.com',
  'houzz.com', 'buildzoom.com',
  'cpafee.com', 'designrush.com', 'upcity.com'
];

// Known search engines for organic
const ORGANIC_SEARCH_ENGINES = [
  'google', 'bing', 'yahoo', 'duckduckgo', 'baidu',
  'yandex', 'ecosia', 'brave', 'startpage'
];

// Known paid search sources
const PAID_SEARCH_SOURCES = [
  'google', 'bing', 'yahoo', 'facebook', 'instagram',
  'linkedin', 'twitter', 'tiktok', 'pinterest'
];

function categorizeSource(source: string, medium: string): string {
  const sourceLower = source.toLowerCase();
  const mediumLower = medium.toLowerCase();

  // Check for LLM/AI sources
  if (LLM_SOURCES.some(llm => sourceLower.includes(llm.split('.')[0]))) {
    return 'llmAI';
  }

  // Check for listing sources
  if (LISTING_SOURCES.some(listing => sourceLower.includes(listing.split('.')[0]))) {
    return 'listings';
  }

  // Check medium for paid
  if (mediumLower === 'cpc' || mediumLower === 'ppc' || mediumLower === 'paid' || mediumLower.includes('paid')) {
    return 'paidSearch';
  }

  // Check for organic search
  if (mediumLower === 'organic' && ORGANIC_SEARCH_ENGINES.some(engine => sourceLower.includes(engine))) {
    return 'organicSearch';
  }

  // Check for social
  if (mediumLower.includes('social') || ['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'pinterest'].some(s => sourceLower.includes(s))) {
    return 'social';
  }

  // Check for referral
  if (mediumLower === 'referral') {
    return 'referral';
  }

  // Check for direct
  if (sourceLower === '(direct)' || mediumLower === '(none)' || mediumLower === 'direct') {
    return 'direct';
  }

  return 'other';
}

// Get the last complete week (Monday to Sunday)
export function getLastCompleteWeek(): DateRange {
  const today = new Date();
  const dayOfWeek = today.getDay();

  // Calculate last Sunday
  const lastSunday = new Date(today);
  lastSunday.setDate(today.getDate() - (dayOfWeek === 0 ? 7 : dayOfWeek));

  // Calculate last Monday (6 days before last Sunday)
  const lastMonday = new Date(lastSunday);
  lastMonday.setDate(lastSunday.getDate() - 6);

  return {
    startDate: formatDateForGA(lastMonday),
    endDate: formatDateForGA(lastSunday),
  };
}

// Get the same week from last year
export function getSameWeekLastYear(dateRange: DateRange): DateRange {
  const start = new Date(dateRange.startDate);
  const end = new Date(dateRange.endDate);

  start.setFullYear(start.getFullYear() - 1);
  end.setFullYear(end.getFullYear() - 1);

  return {
    startDate: formatDateForGA(start),
    endDate: formatDateForGA(end),
  };
}

function formatDateForGA(date: Date): string {
  return date.toISOString().split('T')[0];
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

export async function getDetailedChannelBreakdown(dateRange: DateRange): Promise<DetailedChannelBreakdown> {
  // Get data by source/medium
  const [sourceResponse] = await analyticsDataClient.runReport({
    property: propertyId,
    dateRanges: [{ startDate: dateRange.startDate, endDate: dateRange.endDate }],
    dimensions: [{ name: "sessionSource" }, { name: "sessionMedium" }],
    metrics: [
      { name: "activeUsers" },
      { name: "sessions" },
      { name: "conversions" },
    ],
    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    limit: 100,
  });

  // Get form submissions and phone calls by source/medium
  const [eventsResponse] = await analyticsDataClient.runReport({
    property: propertyId,
    dateRanges: [{ startDate: dateRange.startDate, endDate: dateRange.endDate }],
    dimensions: [{ name: "sessionSource" }, { name: "sessionMedium" }, { name: "eventName" }],
    metrics: [{ name: "eventCount" }],
    limit: 500,
  });

  const formEventNames = ['form_submit', 'generate_lead', 'contact_form', 'form_submission', 'submit_form', 'lead_form'];
  const phoneEventNames = ['phone_click', 'click_to_call', 'tel_click', 'phone_call', 'call_click', 'phone'];

  // Build event data map
  const eventData: Map<string, { forms: number; phones: number }> = new Map();
  if (eventsResponse.rows) {
    for (const row of eventsResponse.rows) {
      const source = row.dimensionValues?.[0]?.value || "";
      const medium = row.dimensionValues?.[1]?.value || "";
      const eventName = (row.dimensionValues?.[2]?.value || "").toLowerCase();
      const count = parseInt(row.metricValues?.[0]?.value || "0");
      const key = `${source}|${medium}`;

      if (!eventData.has(key)) {
        eventData.set(key, { forms: 0, phones: 0 });
      }
      const data = eventData.get(key)!;

      if (formEventNames.some(e => eventName.includes(e))) {
        data.forms += count;
      } else if (phoneEventNames.some(e => eventName.includes(e))) {
        data.phones += count;
      }
    }
  }

  // Initialize breakdown
  const breakdown: DetailedChannelBreakdown = {
    organicSearch: [],
    paidSearch: [],
    llmAI: [],
    listings: [],
    social: [],
    referral: [],
    direct: [],
    other: [],
  };

  if (sourceResponse.rows) {
    for (const row of sourceResponse.rows) {
      const source = row.dimensionValues?.[0]?.value || "";
      const medium = row.dimensionValues?.[1]?.value || "";
      const users = parseInt(row.metricValues?.[0]?.value || "0");
      const sessions = parseInt(row.metricValues?.[1]?.value || "0");
      const conversions = parseInt(row.metricValues?.[2]?.value || "0");

      const key = `${source}|${medium}`;
      const events = eventData.get(key) || { forms: 0, phones: 0 };
      const category = categorizeSource(source, medium);

      const metrics: SourceMetrics = {
        source,
        medium,
        category,
        users,
        sessions,
        conversions,
        formSubmissions: events.forms,
        phoneCalls: events.phones,
        clickToLeadRate: sessions > 0 ? (conversions / sessions) * 100 : 0,
      };

      breakdown[category as keyof DetailedChannelBreakdown].push(metrics);
    }
  }

  // Sort each category by sessions
  for (const key of Object.keys(breakdown) as Array<keyof DetailedChannelBreakdown>) {
    breakdown[key].sort((a, b) => b.sessions - a.sessions);
  }

  return breakdown;
}

export async function getConversionsByChannel(dateRange: DateRange): Promise<ConversionsByType> {
  // Get conversions by default channel group
  const [channelResponse] = await analyticsDataClient.runReport({
    property: propertyId,
    dateRanges: [{ startDate: dateRange.startDate, endDate: dateRange.endDate }],
    dimensions: [{ name: "sessionDefaultChannelGroup" }],
    metrics: [
      { name: "activeUsers" },
      { name: "sessions" },
      { name: "conversions" },
    ],
    orderBys: [{ metric: { metricName: "conversions" }, desc: true }],
  });

  // Get form submissions and phone calls by event name and channel
  const [eventsResponse] = await analyticsDataClient.runReport({
    property: propertyId,
    dateRanges: [{ startDate: dateRange.startDate, endDate: dateRange.endDate }],
    dimensions: [{ name: "sessionDefaultChannelGroup" }, { name: "eventName" }],
    metrics: [{ name: "eventCount" }],
  });

  // Get clicks data by channel (from Search Console if available)
  let clicksByChannel: Map<string, number> = new Map();
  try {
    const [searchResponse] = await analyticsDataClient.runReport({
      property: propertyId,
      dateRanges: [{ startDate: dateRange.startDate, endDate: dateRange.endDate }],
      dimensions: [{ name: "sessionDefaultChannelGroup" }],
      metrics: [{ name: "organicGoogleSearchClicks" }],
    });

    if (searchResponse.rows) {
      for (const row of searchResponse.rows) {
        const channel = row.dimensionValues?.[0]?.value || "";
        const clicks = parseInt(row.metricValues?.[0]?.value || "0");
        clicksByChannel.set(channel, clicks);
      }
    }
  } catch {
    // Search Console data may not be available
  }

  // Process events to categorize form submissions and phone calls
  const formEventNames = ['form_submit', 'generate_lead', 'contact_form', 'form_submission', 'submit_form', 'lead_form'];
  const phoneEventNames = ['phone_click', 'click_to_call', 'tel_click', 'phone_call', 'call_click', 'phone'];

  const channelData: Map<string, { forms: number; phones: number }> = new Map();
  let totalForms = 0;
  let totalPhones = 0;

  if (eventsResponse.rows) {
    for (const row of eventsResponse.rows) {
      const channel = row.dimensionValues?.[0]?.value || "";
      const eventName = (row.dimensionValues?.[1]?.value || "").toLowerCase();
      const count = parseInt(row.metricValues?.[0]?.value || "0");

      if (!channelData.has(channel)) {
        channelData.set(channel, { forms: 0, phones: 0 });
      }

      const data = channelData.get(channel)!;

      if (formEventNames.some(e => eventName.includes(e))) {
        data.forms += count;
        totalForms += count;
      } else if (phoneEventNames.some(e => eventName.includes(e))) {
        data.phones += count;
        totalPhones += count;
      }
    }
  }

  // Build channel metrics
  const byChannel: ChannelMetrics[] = [];
  let totalConversions = 0;

  if (channelResponse.rows) {
    for (const row of channelResponse.rows) {
      const channel = row.dimensionValues?.[0]?.value || "";
      const users = parseInt(row.metricValues?.[0]?.value || "0");
      const sessions = parseInt(row.metricValues?.[1]?.value || "0");
      const conversions = parseInt(row.metricValues?.[2]?.value || "0");
      const clicks = clicksByChannel.get(channel) || sessions; // Use sessions as proxy if no click data
      const eventData = channelData.get(channel) || { forms: 0, phones: 0 };

      totalConversions += conversions;

      byChannel.push({
        channel,
        users,
        sessions,
        clicks,
        conversions,
        formSubmissions: eventData.forms,
        phoneCalls: eventData.phones,
        clickToLeadRate: clicks > 0 ? (conversions / clicks) * 100 : 0,
      });
    }
  }

  return {
    formSubmissions: totalForms,
    phoneCalls: totalPhones,
    totalConversions,
    byChannel,
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

export async function compareWithLastYear(
  currentPeriod: DateRange
): Promise<{
  current: Awaited<ReturnType<typeof getWeeklyDashboardMetrics>>["totals"] & {
    formSubmissions: number;
    phoneCalls: number;
    clickToLeadRate: number;
  };
  lastYear: Awaited<ReturnType<typeof getWeeklyDashboardMetrics>>["totals"] & {
    formSubmissions: number;
    phoneCalls: number;
    clickToLeadRate: number;
  };
  changes: Record<string, number>;
}> {
  const lastYearPeriod = getSameWeekLastYear(currentPeriod);

  const [currentData, lastYearData, currentConversions, lastYearConversions] = await Promise.all([
    getWeeklyDashboardMetrics(currentPeriod),
    getWeeklyDashboardMetrics(lastYearPeriod),
    getConversionsByChannel(currentPeriod),
    getConversionsByChannel(lastYearPeriod),
  ]);

  const calculateChange = (curr: number, prev: number): number => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return ((curr - prev) / prev) * 100;
  };

  const currentClickToLead = currentData.totals.clicks > 0
    ? (currentConversions.totalConversions / currentData.totals.clicks) * 100
    : 0;
  const lastYearClickToLead = lastYearData.totals.clicks > 0
    ? (lastYearConversions.totalConversions / lastYearData.totals.clicks) * 100
    : 0;

  return {
    current: {
      ...currentData.totals,
      formSubmissions: currentConversions.formSubmissions,
      phoneCalls: currentConversions.phoneCalls,
      clickToLeadRate: currentClickToLead,
    },
    lastYear: {
      ...lastYearData.totals,
      formSubmissions: lastYearConversions.formSubmissions,
      phoneCalls: lastYearConversions.phoneCalls,
      clickToLeadRate: lastYearClickToLead,
    },
    changes: {
      users: calculateChange(currentData.totals.users, lastYearData.totals.users),
      newUsers: calculateChange(currentData.totals.newUsers, lastYearData.totals.newUsers),
      sessions: calculateChange(currentData.totals.sessions, lastYearData.totals.sessions),
      pageviews: calculateChange(currentData.totals.pageviews, lastYearData.totals.pageviews),
      conversions: calculateChange(currentData.totals.conversions, lastYearData.totals.conversions),
      impressions: calculateChange(currentData.totals.impressions, lastYearData.totals.impressions),
      clicks: calculateChange(currentData.totals.clicks, lastYearData.totals.clicks),
      ctr: calculateChange(currentData.totals.ctr, lastYearData.totals.ctr),
      formSubmissions: calculateChange(currentConversions.formSubmissions, lastYearConversions.formSubmissions),
      phoneCalls: calculateChange(currentConversions.phoneCalls, lastYearConversions.phoneCalls),
      clickToLeadRate: calculateChange(currentClickToLead, lastYearClickToLead),
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
