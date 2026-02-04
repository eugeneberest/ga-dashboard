"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

interface ChartProps {
  data: Array<{
    date: string;
    users?: number;
    sessions?: number;
    pageviews?: number;
    bounceRate?: number;
  }>;
  type?: "line" | "area";
  metrics?: Array<"users" | "sessions" | "pageviews" | "bounceRate">;
  height?: number;
}

const metricColors: Record<string, string> = {
  users: "#3b82f6",
  sessions: "#10b981",
  pageviews: "#8b5cf6",
  bounceRate: "#f59e0b",
};

const metricLabels: Record<string, string> = {
  users: "Users",
  sessions: "Sessions",
  pageviews: "Pageviews",
  bounceRate: "Bounce Rate",
};

export default function Chart({
  data,
  type = "area",
  metrics = ["users", "sessions"],
  height = 300,
}: ChartProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formattedData = data.map((item) => ({
    ...item,
    formattedDate: formatDate(item.date),
  }));

  const ChartComponent = type === "area" ? AreaChart : LineChart;
  const DataComponent = type === "area" ? Area : Line;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Traffic Overview
      </h3>
      <ResponsiveContainer width="100%" height={height}>
        <ChartComponent data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="formattedDate"
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
          />
          <YAxis stroke="#6b7280" fontSize={12} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
            }}
          />
          <Legend />
          {metrics.map((metric) =>
            type === "area" ? (
              <Area
                key={metric}
                type="monotone"
                dataKey={metric}
                name={metricLabels[metric]}
                stroke={metricColors[metric]}
                fill={metricColors[metric]}
                fillOpacity={0.1}
                strokeWidth={2}
              />
            ) : (
              <Line
                key={metric}
                type="monotone"
                dataKey={metric}
                name={metricLabels[metric]}
                stroke={metricColors[metric]}
                strokeWidth={2}
                dot={false}
              />
            )
          )}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
}
