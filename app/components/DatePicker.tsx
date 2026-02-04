"use client";

import { useState } from "react";
import { format, subDays, startOfMonth, startOfWeek } from "date-fns";

interface DatePickerProps {
  onDateChange: (startDate: string, endDate: string) => void;
}

type PresetRange = "today" | "yesterday" | "7days" | "30days" | "thisWeek" | "thisMonth";

const presets: Array<{ label: string; value: PresetRange }> = [
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "Last 7 days", value: "7days" },
  { label: "Last 30 days", value: "30days" },
  { label: "This week", value: "thisWeek" },
  { label: "This month", value: "thisMonth" },
];

export default function DatePicker({ onDateChange }: DatePickerProps) {
  const [selectedPreset, setSelectedPreset] = useState<PresetRange>("7days");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const handlePresetChange = (preset: PresetRange) => {
    setSelectedPreset(preset);
    setShowCustom(false);

    const today = new Date();
    let startDate: string;
    let endDate: string = format(today, "yyyy-MM-dd");

    switch (preset) {
      case "today":
        startDate = format(today, "yyyy-MM-dd");
        break;
      case "yesterday":
        startDate = format(subDays(today, 1), "yyyy-MM-dd");
        endDate = startDate;
        break;
      case "7days":
        startDate = format(subDays(today, 6), "yyyy-MM-dd");
        break;
      case "30days":
        startDate = format(subDays(today, 29), "yyyy-MM-dd");
        break;
      case "thisWeek":
        startDate = format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
        break;
      case "thisMonth":
        startDate = format(startOfMonth(today), "yyyy-MM-dd");
        break;
      default:
        startDate = format(subDays(today, 6), "yyyy-MM-dd");
    }

    onDateChange(startDate, endDate);
  };

  const handleCustomSubmit = () => {
    if (customStart && customEnd) {
      onDateChange(customStart, customEnd);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex flex-wrap items-center gap-2">
        {presets.map((preset) => (
          <button
            key={preset.value}
            onClick={() => handlePresetChange(preset.value)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              selectedPreset === preset.value && !showCustom
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {preset.label}
          </button>
        ))}
        <button
          onClick={() => setShowCustom(!showCustom)}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            showCustom
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Custom
        </button>
      </div>

      {showCustom && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">From:</label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">To:</label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleCustomSubmit}
            className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}
