import { NextResponse } from "next/server";
import {
  getWeeklyDashboardMetrics,
  getLeadsAndConversions,
  getTopPages,
  getTrafficSources,
  getConversionsByChannel,
  getDetailedChannelBreakdown,
  getDailyEvents,
  type DateRange,
} from "@/lib/ga-client";

function getLastCompleteMonth(): DateRange {
  const today = new Date();
  const year = today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear();
  const month = today.getMonth() === 0 ? 12 : today.getMonth(); // 1-based previous month
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { startDate, endDate };
}

function getSameMonthLastYear(dateRange: DateRange): DateRange {
  const [year, month] = dateRange.startDate.split("-").map(Number);
  const prevYear = year - 1;
  const startDate = `${prevYear}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(prevYear, month, 0).getDate();
  const endDate = `${prevYear}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { startDate, endDate };
}

function getPreviousMonth(dateRange: DateRange): DateRange {
  const [year, month] = dateRange.startDate.split("-").map(Number);
  const prevYear = month === 1 ? year - 1 : year;
  const prevMonth = month === 1 ? 12 : month - 1;
  const startDate = `${prevYear}-${String(prevMonth).padStart(2, "0")}-01`;
  const lastDay = new Date(prevYear, prevMonth, 0).getDate();
  const endDate = `${prevYear}-${String(prevMonth).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { startDate, endDate };
}

const calculateChange = (curr: number, prev: number): number => {
  if (prev === 0) return curr > 0 ? 100 : 0;
  return ((curr - prev) / prev) * 100;
};

export async function GET() {
  const currentPeriod = getLastCompleteMonth();
  const lastYearPeriod = getSameMonthLastYear(currentPeriod);
  const previousMonthPeriod = getPreviousMonth(currentPeriod);

  try {
    const [
      monthlyData,
      leads,
      topPages,
      trafficSources,
      conversionsByChannel,
      detailedBreakdownResult,
      dailyEvents,
      lastYearMetrics,
      lastYearBreakdownResult,
      prevMonthMetrics,
      prevMonthBreakdownResult,
      prevMonthConversions,
    ] = await Promise.all([
      getWeeklyDashboardMetrics(currentPeriod),
      getLeadsAndConversions(currentPeriod),
      getTopPages(currentPeriod, 10),
      getTrafficSources(currentPeriod),
      getConversionsByChannel(currentPeriod),
      getDetailedChannelBreakdown(currentPeriod),
      getDailyEvents(currentPeriod),
      getWeeklyDashboardMetrics(lastYearPeriod),
      getDetailedChannelBreakdown(lastYearPeriod),
      getWeeklyDashboardMetrics(previousMonthPeriod),
      getDetailedChannelBreakdown(previousMonthPeriod),
      getConversionsByChannel(previousMonthPeriod),
    ]);

    const { breakdown: detailedBreakdown, rawPhoneCallsBySource } = detailedBreakdownResult;

    // Aggregate totals from detailed breakdown
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

    const totalLeads = breakdownTotals.formSubmissions + breakdownTotals.phoneCalls;
    const clickToLeadRate =
      breakdownTotals.sessions > 0 ? (totalLeads / breakdownTotals.sessions) * 100 : 0;

    // Last year comparison
    const lastYearSources = Object.values(lastYearBreakdownResult.breakdown).flat();
    const lastYearTotals = lastYearSources.reduce(
      (acc, s) => ({
        sessions: acc.sessions + s.sessions,
        users: acc.users + s.users,
        formSubmissions: acc.formSubmissions + s.formSubmissions,
        phoneCalls: acc.phoneCalls + s.phoneCalls,
      }),
      { sessions: 0, users: 0, formSubmissions: 0, phoneCalls: 0 }
    );
    const lastYearTotalLeads = lastYearTotals.formSubmissions + lastYearTotals.phoneCalls;
    const lastYearClickToLeadRate =
      lastYearTotals.sessions > 0 ? (lastYearTotalLeads / lastYearTotals.sessions) * 100 : 0;

    const lastYearComparison = {
      lastYear: {
        ...lastYearMetrics.totals,
        users: lastYearTotals.users,
        conversions: lastYearTotalLeads,
        formSubmissions: lastYearTotals.formSubmissions,
        phoneCalls: lastYearTotals.phoneCalls,
        clickToLeadRate: lastYearClickToLeadRate,
      },
      changes: {
        users: calculateChange(breakdownTotals.users, lastYearTotals.users),
        newUsers: calculateChange(monthlyData.totals.newUsers, lastYearMetrics.totals.newUsers),
        sessions: calculateChange(breakdownTotals.sessions, lastYearTotals.sessions),
        pageviews: calculateChange(monthlyData.totals.pageviews, lastYearMetrics.totals.pageviews),
        conversions: calculateChange(totalLeads, lastYearTotalLeads),
        impressions: calculateChange(monthlyData.totals.impressions, lastYearMetrics.totals.impressions),
        clicks: calculateChange(monthlyData.totals.clicks, lastYearMetrics.totals.clicks),
        ctr: calculateChange(monthlyData.totals.ctr, lastYearMetrics.totals.ctr),
        formSubmissions: calculateChange(breakdownTotals.formSubmissions, lastYearTotals.formSubmissions),
        phoneCalls: calculateChange(breakdownTotals.phoneCalls, lastYearTotals.phoneCalls),
        clickToLeadRate: calculateChange(clickToLeadRate, lastYearClickToLeadRate),
      },
    };

    // Previous month comparison (MoM)
    const prevMonthSources = Object.values(prevMonthBreakdownResult.breakdown).flat();
    const prevMonthTotals = prevMonthSources.reduce(
      (acc, s) => ({
        sessions: acc.sessions + s.sessions,
        users: acc.users + s.users,
        formSubmissions: acc.formSubmissions + s.formSubmissions,
        phoneCalls: acc.phoneCalls + s.phoneCalls,
      }),
      { sessions: 0, users: 0, formSubmissions: 0, phoneCalls: 0 }
    );
    const prevMonthTotalLeads = prevMonthTotals.formSubmissions + prevMonthTotals.phoneCalls;
    const prevMonthClickToLeadRate =
      prevMonthTotals.sessions > 0 ? (prevMonthTotalLeads / prevMonthTotals.sessions) * 100 : 0;

    const previousMonthComparison = {
      previousMonth: {
        ...prevMonthMetrics.totals,
        users: prevMonthTotals.users,
        conversions: prevMonthTotalLeads,
        formSubmissions: prevMonthTotals.formSubmissions,
        phoneCalls: prevMonthTotals.phoneCalls,
        clickToLeadRate: prevMonthClickToLeadRate,
      },
      changes: {
        users: calculateChange(breakdownTotals.users, prevMonthTotals.users),
        newUsers: calculateChange(monthlyData.totals.newUsers, prevMonthMetrics.totals.newUsers),
        sessions: calculateChange(breakdownTotals.sessions, prevMonthTotals.sessions),
        pageviews: calculateChange(monthlyData.totals.pageviews, prevMonthMetrics.totals.pageviews),
        conversions: calculateChange(totalLeads, prevMonthTotalLeads),
        impressions: calculateChange(monthlyData.totals.impressions, prevMonthMetrics.totals.impressions),
        clicks: calculateChange(monthlyData.totals.clicks, prevMonthMetrics.totals.clicks),
        ctr: calculateChange(monthlyData.totals.ctr, prevMonthMetrics.totals.ctr),
        formSubmissions: calculateChange(breakdownTotals.formSubmissions, prevMonthTotals.formSubmissions),
        phoneCalls: calculateChange(breakdownTotals.phoneCalls, prevMonthTotals.phoneCalls),
        clickToLeadRate: calculateChange(clickToLeadRate, prevMonthClickToLeadRate),
      },
    };

    return NextResponse.json({
      success: true,
      data: {
        period: {
          current: currentPeriod,
          lastYear: lastYearPeriod,
          previousMonth: previousMonthPeriod,
        },
        totals: {
          ...monthlyData.totals,
          users: breakdownTotals.users,
          conversions: totalLeads,
          formSubmissions: breakdownTotals.formSubmissions,
          phoneCalls: breakdownTotals.phoneCalls,
          clickToLeadRate,
        },
        daily: monthlyData.daily,
        dailyEvents,
        leads,
        topPages,
        trafficSources,
        conversionsByChannel: conversionsByChannel.byChannel,
        detailedBreakdown,
        rawPhoneCallsBySource,
        lastYearComparison,
        previousMonthComparison,
      },
    });
  } catch (error) {
    console.error("Monthly Analytics API Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
