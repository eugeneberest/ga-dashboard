import { NextRequest, NextResponse } from "next/server";
import {
  getWeeklyDashboardMetrics,
  getLeadsAndConversions,
  getTopPages,
  getTrafficSources,
  compareWeeklyMetrics,
  type DateRange,
} from "@/lib/ga-client";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get("startDate") || "7daysAgo";
  const endDate = searchParams.get("endDate") || "yesterday";

  const currentPeriod: DateRange = { startDate, endDate };
  const previousPeriod: DateRange = { startDate: "14daysAgo", endDate: "8daysAgo" };

  try {
    const [weeklyData, leads, topPages, trafficSources, comparison] = await Promise.all([
      getWeeklyDashboardMetrics(currentPeriod),
      getLeadsAndConversions(currentPeriod),
      getTopPages(currentPeriod, 10),
      getTrafficSources(currentPeriod),
      compareWeeklyMetrics(currentPeriod, previousPeriod),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        period: { startDate, endDate },
        totals: weeklyData.totals,
        daily: weeklyData.daily,
        leads,
        topPages,
        trafficSources,
        comparison: {
          current: comparison.current,
          previous: comparison.previous,
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
