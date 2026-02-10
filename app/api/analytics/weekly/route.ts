import { NextRequest, NextResponse } from "next/server";
import {
  getWeeklyDashboardMetrics,
  getLeadsAndConversions,
  getTopPages,
  getTrafficSources,
  compareWithLastYear,
  getConversionsByChannel,
  getDetailedChannelBreakdown,
  getLastCompleteWeek,
  getSameWeekLastYear,
  type DateRange,
} from "@/lib/ga-client";

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

  try {
    const [weeklyData, leads, topPages, trafficSources, comparison, conversionsByChannel, detailedBreakdownResult] = await Promise.all([
      getWeeklyDashboardMetrics(currentPeriod),
      getLeadsAndConversions(currentPeriod),
      getTopPages(currentPeriod, 10),
      getTrafficSources(currentPeriod),
      compareWithLastYear(currentPeriod),
      getConversionsByChannel(currentPeriod),
      getDetailedChannelBreakdown(currentPeriod),
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

    const clickToLeadRate = breakdownTotals.sessions > 0
      ? (breakdownTotals.conversions / breakdownTotals.sessions) * 100
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        period: {
          current: currentPeriod,
          lastYear: lastYearPeriod,
        },
        totals: {
          ...weeklyData.totals,
          users: breakdownTotals.users,
          conversions: breakdownTotals.conversions,
          formSubmissions: breakdownTotals.formSubmissions,
          phoneCalls: breakdownTotals.phoneCalls,
          clickToLeadRate,
        },
        daily: weeklyData.daily,
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
