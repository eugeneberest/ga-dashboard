"use client";

interface Anomaly {
  date: string;
  value: number;
  deviation: number;
}

interface AlertsSectionProps {
  anomalies: Anomaly[];
  metric: string;
  isLoading?: boolean;
}

export default function AlertsSection({
  anomalies,
  metric,
  isLoading,
}: AlertsSectionProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Anomaly Alerts
        </h3>
        <div className="animate-pulse space-y-3">
          <div className="h-16 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  const getAlertType = (deviation: number): "high" | "low" => {
    return deviation > 0 ? "high" : "low";
  };

  const getAlertColor = (type: "high" | "low"): string => {
    return type === "high"
      ? "bg-green-50 border-green-200 text-green-800"
      : "bg-red-50 border-red-200 text-red-800";
  };

  const getAlertIcon = (type: "high" | "low"): string => {
    return type === "high" ? "↑" : "↓";
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Anomaly Alerts
      </h3>

      {anomalies.length === 0 ? (
        <div className="text-center py-6">
          <div className="w-12 h-12 mx-auto mb-3 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-green-600 text-xl">✓</span>
          </div>
          <p className="text-gray-600 text-sm">
            No unusual activity detected in {metric}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {anomalies.map((anomaly, index) => {
            const type = getAlertType(anomaly.deviation);
            return (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getAlertColor(type)}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg">{getAlertIcon(type)}</span>
                  <div className="flex-1">
                    <p className="font-medium">
                      {type === "high" ? "Unusual spike" : "Unusual drop"} in{" "}
                      {metric}
                    </p>
                    <p className="text-sm opacity-80 mt-1">
                      {new Date(anomaly.date).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "short",
                        day: "numeric",
                      })}
                      : {anomaly.value.toLocaleString()} ({anomaly.deviation > 0 ? "+" : ""}
                      {anomaly.deviation.toFixed(1)} standard deviations)
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
