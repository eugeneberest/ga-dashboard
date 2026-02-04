"use client";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
  format?: "number" | "percent" | "currency";
}

export default function MetricCard({
  title,
  value,
  change,
  icon,
  format = "number",
}: MetricCardProps) {
  const formatValue = (val: string | number): string => {
    if (typeof val === "string") return val;

    switch (format) {
      case "percent":
        return `${val.toFixed(1)}%`;
      case "currency":
        return `$${val.toLocaleString()}`;
      default:
        return val.toLocaleString();
    }
  };

  const getChangeColor = (changeVal: number): string => {
    if (changeVal > 0) return "text-green-600";
    if (changeVal < 0) return "text-red-600";
    return "text-gray-600";
  };

  const getChangeIcon = (changeVal: number): string => {
    if (changeVal > 0) return "↑";
    if (changeVal < 0) return "↓";
    return "→";
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
      <div className="mt-2">
        <p className="text-3xl font-semibold text-gray-900">
          {formatValue(value)}
        </p>
        {change !== undefined && (
          <p className={`mt-1 text-sm ${getChangeColor(change)}`}>
            {getChangeIcon(change)} {Math.abs(change).toFixed(1)}% vs previous
            period
          </p>
        )}
      </div>
    </div>
  );
}
