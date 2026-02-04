import { NextRequest, NextResponse } from "next/server";
import {
  getMetrics,
  getAggregatedMetrics,
  getTopPages,
  getTrafficSources,
  comparePeriods,
  detectAnomalies,
  type DateRange,
} from "@/lib/ga-client";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get("action");
  const startDate = searchParams.get("startDate") || "7daysAgo";
  const endDate = searchParams.get("endDate") || "today";

  const dateRange: DateRange = { startDate, endDate };

  try {
    switch (action) {
      case "metrics": {
        const data = await getMetrics(dateRange);
        return NextResponse.json({ success: true, data });
      }

      case "aggregated": {
        const data = await getAggregatedMetrics(dateRange);
        return NextResponse.json({ success: true, data });
      }

      case "topPages": {
        const limit = parseInt(searchParams.get("limit") || "10");
        const data = await getTopPages(dateRange, limit);
        return NextResponse.json({ success: true, data });
      }

      case "trafficSources": {
        const data = await getTrafficSources(dateRange);
        return NextResponse.json({ success: true, data });
      }

      case "compare": {
        const period2Start = searchParams.get("period2StartDate") || "14daysAgo";
        const period2End = searchParams.get("period2EndDate") || "8daysAgo";
        const period2: DateRange = { startDate: period2Start, endDate: period2End };
        const data = await comparePeriods(dateRange, period2);
        return NextResponse.json({ success: true, data });
      }

      case "anomalies": {
        const metric = searchParams.get("metric") || "users";
        const threshold = parseFloat(searchParams.get("threshold") || "2");
        const data = await detectAnomalies(metric, threshold);
        return NextResponse.json({ success: true, data });
      }

      case "dashboard": {
        const [aggregated, metrics, topPages, trafficSources, anomalies] =
          await Promise.all([
            getAggregatedMetrics(dateRange),
            getMetrics(dateRange),
            getTopPages(dateRange, 5),
            getTrafficSources(dateRange),
            detectAnomalies("users"),
          ]);

        return NextResponse.json({
          success: true,
          data: {
            aggregated,
            metrics,
            topPages,
            trafficSources,
            anomalies,
          },
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action. Use: metrics, aggregated, topPages, trafficSources, compare, anomalies, or dashboard" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Analytics API Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
