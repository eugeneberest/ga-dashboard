import { NextRequest, NextResponse } from "next/server";
import {
  getWeeklyDashboardMetrics,
  getLeadsAndConversions,
  getTopPages,
  getTrafficSources,
  compareWithLastYear,
  getConversionsByChannel,
  getDetailedChannelBreakdown,
  getDailyEvents,
  getLastCompleteWeek,
  getSameWeekLastYear,
  type DateRange,
} from "@/lib/ga-client";

function getPreviousWeek(dateRange: DateRange): DateRange {
  const start = new Date(dateRange.startDate);
  const end = new Date(dateRange.endDate);
  start.setDate(start.getDate() - 7);
  end.setDate(end.getDate() - 7);
  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const periodType = searchParams.get("period") || "lastWeek";

  let currentPeriod: DateRange;

  if (periodType === "lastWeek") {
    currentPeriod = getLastCompleteWeek();
  } else {
    currentPeriod = {
      startDate: searchParams.get("startDate") || "7daysAgo",
      endDate: searchParams.get("endDate") || "yesterday",
    };
  }

  const lastYearPeriod = getSameWeekLastYear(currentPeriod);
  const previousWeekPeriod = getPreviousWeek(currentPeriod);

  try {
    const [
      weeklyData, leads, topPages, trafficSources, comparison,
      conversionsByChannel, detailedBreakdownResult, dailyEvents,
      prevWeekMetrics, prevWeekBreakdownResult, prevWeekConversions,
    ] = await Promise.all([
      getWeeklyDashboardMetrics(currentPeriod),
      getLeadsAndConversions(currentPeriod),
      getTopPages(currentPeriod, 10),
      getTrafficSources(currentPeriod),
      compareWithLastYear(currentPeriod),
      getConversionsByChannel(currentPeriod),
      getDetailedChannelBreakdown(currentPeriod),
      getDailyEvents(currentPeriod),
      getWeeklyDashboardMetrics(previousWeekPeriod),
      getDetailedChannelBreakdown(previousWeekPeriod),
      getConversionsByChannel(previousWeekPeriod),
    ]);

    const { breakdown: detailedBreakdown, rawPhoneCallsBySource } = detailedBreakdownResult;

    // Aggregate totals from detailed breakdown (same data the tables use)
    const allSources = Object.values(detailedBreakdown).flat();
    const breakdownTotals = allSources.reduce(
      (acc, s) => ({
        sessions: acc.sessions + s.sessions,
        users: acc.users + s.users,
        conversions: acc.conversions + s.conversions,
        formSubmissions: acc.formSubmissions + s.formSubmissions,
        phoneCalls: acc.phoneCalls + s.phoneCalls,
      }),
      { sessions: 0, users: 0, conversions: 0, formSubmissions: 0, phoneCalls: 0 }
    );

    // Use form + phone_call as total leads (not GA4 conversions metric)
    const totalLeads = breakdownTotals.formSubmissions + breakdownTotals.phoneCalls;
    const clickToLeadRate = breakdownTotals.sessions > 0
      ? (totalLeads / breakdownTotals.sessions) * 100
      : 0;

    // Build previous week comparison
    const prevBreakdownSources = Object.values(prevWeekBreakdownResult.breakdown).flat();
    const prevBreakdownTotals = prevBreakdownSources.reduce(
      (acc, s) => ({
        sessions: acc.sessions + s.sessions,
        users: acc.users + s.users,
        formSubmissions: acc.formSubmissions + s.formSubmissions,
        phoneCalls: acc.phoneCalls + s.phoneCalls,
      }),
      { sessions: 0, users: 0, formSubmissions: 0, phoneCalls: 0 }
    );

    const prevTotalLeads = prevBreakdownTotals.formSubmissions + prevBreakdownTotals.phoneCalls;
    const prevClickToLeadRate = prevBreakdownTotals.sessions > 0
      ? (prevTotalLeads / prevBreakdownTotals.sessions) * 100
      : 0;

    const calculateChange = (curr: number, prev: number): number => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return ((curr - prev) / prev) * 100;
    };

    const previousWeekComparison = {
      previousWeek: {
        ...prevWeekMetrics.totals,
        users: prevBreakdownTotals.users,
        conversions: prevTotalLeads,
        formSubmissions: prevBreakdownTotals.formSubmissions,
        phoneCalls: prevBreakdownTotals.phoneCalls,
        clickToLeadRate: prevClickToLeadRate,
      },
      changes: {
        users: calculateChange(breakdownTotals.users, prevBreakdownTotals.users),
        newUsers: calculateChange(weeklyData.totals.newUsers, prevWeekMetrics.totals.newUsers),
        sessions: calculateChange(breakdownTotals.sessions, prevBreakdownTotals.sessions),
        pageviews: calculateChange(weeklyData.totals.pageviews, prevWeekMetrics.totals.pageviews),
        conversions: calculateChange(totalLeads, prevTotalLeads),
        impressions: calculateChange(weeklyData.totals.impressions, prevWeekMetrics.totals.impressions),
        clicks: calculateChange(weeklyData.totals.clicks, prevWeekMetrics.totals.clicks),
        ctr: calculateChange(weeklyData.totals.ctr, prevWeekMetrics.totals.ctr),
        formSubmissions: calculateChange(breakdownTotals.formSubmissions, prevBreakdownTotals.formSubmissions),
        phoneCalls: calculateChange(breakdownTotals.phoneCalls, prevBreakdownTotals.phoneCalls),
        clickToLeadRate: calculateChange(clickToLeadRate, prevClickToLeadRate),
      },
    };

    return NextResponse.json({
      success: true,
      data: {
        period: {
          current: currentPeriod,
          lastYear: lastYearPeriod,
          previousWeek: previousWeekPeriod,
        },
        totals: {
          ...weeklyData.totals,
          users: breakdownTotals.users,
          conversions: totalLeads,
          formSubmissions: breakdownTotals.formSubmissions,
          phoneCalls: breakdownTotals.phoneCalls,
          clickToLeadRate,
        },
        daily: weeklyData.daily,
        dailyEvents,
        leads,
        topPages,
        trafficSources,
        conversionsByChannel: conversionsByChannel.byChannel,
        detailedBreakdown,
        rawPhoneCallsBySource,
        comparison: {
          current: comparison.current,
          lastYear: comparison.lastYear,
          changes: comparison.changes,
        },
        previousWeekComparison,
      },
    });
  } catch (error) {
    console.error("Weekly Analytics API Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
