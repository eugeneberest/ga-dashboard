import Anthropic from "@anthropic-ai/sdk";
import {
  getMetrics,
  getTopPages,
  getTrafficSources,
  comparePeriods,
  detectAnomalies,
  getAggregatedMetrics,
  type DateRange,
} from "./ga-client";

const client = new Anthropic();

const tools: Anthropic.Tool[] = [
  {
    name: "get_metrics",
    description:
      "Fetch key performance metrics from Google Analytics for a specified date range. Returns daily data for users, sessions, bounce rate, conversions, and pageviews.",
    input_schema: {
      type: "object" as const,
      properties: {
        startDate: {
          type: "string",
          description:
            "Start date in format YYYY-MM-DD or relative like '7daysAgo', '30daysAgo', 'yesterday'",
        },
        endDate: {
          type: "string",
          description:
            "End date in format YYYY-MM-DD or relative like 'today', 'yesterday'",
        },
      },
      required: ["startDate", "endDate"],
    },
  },
  {
    name: "get_aggregated_metrics",
    description:
      "Fetch aggregated (total) metrics for a date range. Returns single totals for users, sessions, bounce rate, conversions, and pageviews.",
    input_schema: {
      type: "object" as const,
      properties: {
        startDate: {
          type: "string",
          description: "Start date in format YYYY-MM-DD or relative",
        },
        endDate: {
          type: "string",
          description: "End date in format YYYY-MM-DD or relative",
        },
      },
      required: ["startDate", "endDate"],
    },
  },
  {
    name: "get_top_pages",
    description:
      "Get the most visited pages on the website for a specified date range.",
    input_schema: {
      type: "object" as const,
      properties: {
        startDate: {
          type: "string",
          description: "Start date in format YYYY-MM-DD or relative",
        },
        endDate: {
          type: "string",
          description: "End date in format YYYY-MM-DD or relative",
        },
        limit: {
          type: "number",
          description: "Maximum number of pages to return (default: 10)",
        },
      },
      required: ["startDate", "endDate"],
    },
  },
  {
    name: "get_traffic_sources",
    description:
      "Get traffic acquisition data showing where visitors come from (sources and mediums).",
    input_schema: {
      type: "object" as const,
      properties: {
        startDate: {
          type: "string",
          description: "Start date in format YYYY-MM-DD or relative",
        },
        endDate: {
          type: "string",
          description: "End date in format YYYY-MM-DD or relative",
        },
      },
      required: ["startDate", "endDate"],
    },
  },
  {
    name: "compare_periods",
    description:
      "Compare metrics between two time periods to see growth or decline.",
    input_schema: {
      type: "object" as const,
      properties: {
        period1StartDate: {
          type: "string",
          description: "Start date of first (current) period",
        },
        period1EndDate: {
          type: "string",
          description: "End date of first (current) period",
        },
        period2StartDate: {
          type: "string",
          description: "Start date of second (comparison) period",
        },
        period2EndDate: {
          type: "string",
          description: "End date of second (comparison) period",
        },
      },
      required: [
        "period1StartDate",
        "period1EndDate",
        "period2StartDate",
        "period2EndDate",
      ],
    },
  },
  {
    name: "detect_anomalies",
    description:
      "Detect unusual spikes or drops in a specific metric over the last 30 days using statistical analysis.",
    input_schema: {
      type: "object" as const,
      properties: {
        metric: {
          type: "string",
          enum: ["users", "sessions", "pageviews", "bounceRate"],
          description: "The metric to analyze for anomalies",
        },
        threshold: {
          type: "number",
          description:
            "Standard deviation threshold for anomaly detection (default: 2)",
        },
      },
      required: ["metric"],
    },
  },
];

interface ToolInput {
  startDate?: string;
  endDate?: string;
  limit?: number;
  period1StartDate?: string;
  period1EndDate?: string;
  period2StartDate?: string;
  period2EndDate?: string;
  metric?: string;
  threshold?: number;
}

async function executeToolCall(
  toolName: string,
  toolInput: ToolInput
): Promise<string> {
  switch (toolName) {
    case "get_metrics": {
      const dateRange: DateRange = {
        startDate: toolInput.startDate!,
        endDate: toolInput.endDate!,
      };
      const result = await getMetrics(dateRange);
      return JSON.stringify(result, null, 2);
    }

    case "get_aggregated_metrics": {
      const dateRange: DateRange = {
        startDate: toolInput.startDate!,
        endDate: toolInput.endDate!,
      };
      const result = await getAggregatedMetrics(dateRange);
      return JSON.stringify(result, null, 2);
    }

    case "get_top_pages": {
      const dateRange: DateRange = {
        startDate: toolInput.startDate!,
        endDate: toolInput.endDate!,
      };
      const result = await getTopPages(dateRange, toolInput.limit);
      return JSON.stringify(result, null, 2);
    }

    case "get_traffic_sources": {
      const dateRange: DateRange = {
        startDate: toolInput.startDate!,
        endDate: toolInput.endDate!,
      };
      const result = await getTrafficSources(dateRange);
      return JSON.stringify(result, null, 2);
    }

    case "compare_periods": {
      const period1: DateRange = {
        startDate: toolInput.period1StartDate!,
        endDate: toolInput.period1EndDate!,
      };
      const period2: DateRange = {
        startDate: toolInput.period2StartDate!,
        endDate: toolInput.period2EndDate!,
      };
      const result = await comparePeriods(period1, period2);
      return JSON.stringify(result, null, 2);
    }

    case "detect_anomalies": {
      const result = await detectAnomalies(
        toolInput.metric!,
        toolInput.threshold
      );
      return JSON.stringify(result, null, 2);
    }

    default:
      return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function chat(
  userMessage: string,
  conversationHistory: ChatMessage[] = []
): Promise<string> {
  const messages: Anthropic.MessageParam[] = conversationHistory.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));

  messages.push({ role: "user", content: userMessage });

  const systemPrompt = `You are an expert Google Analytics analyst assistant. You help users understand their website traffic, identify trends, and provide actionable insights.

When users ask about their analytics data, use the available tools to fetch real data and provide clear, insightful responses.

Key guidelines:
- Always provide context for numbers (e.g., "This is a 15% increase compared to the previous period")
- Highlight notable trends or anomalies
- Suggest actionable next steps when appropriate
- Be concise but thorough in your analysis
- If you detect any issues or opportunities, proactively mention them

For date references:
- "yesterday" means the previous day
- "last week" means the 7 days ending yesterday
- "last month" means the 30 days ending yesterday
- "this week" means the current week starting from Monday
- "this month" means from the 1st of the current month to today`;

  let response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: systemPrompt,
    tools,
    messages,
  });

  while (response.stop_reason === "tool_use") {
    const toolUseBlocks = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
    );

    const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
      toolUseBlocks.map(async (toolUse) => {
        const result = await executeToolCall(
          toolUse.name,
          toolUse.input as ToolInput
        );
        return {
          type: "tool_result" as const,
          tool_use_id: toolUse.id,
          content: result,
        };
      })
    );

    messages.push({ role: "assistant", content: response.content });
    messages.push({ role: "user", content: toolResults });

    response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      tools,
      messages,
    });
  }

  const textBlock = response.content.find(
    (block): block is Anthropic.TextBlock => block.type === "text"
  );

  return textBlock?.text || "I apologize, but I couldn't generate a response.";
}

export async function generateReport(
  reportType: "daily" | "weekly" | "monthly"
): Promise<string> {
  const dateRanges: Record<string, { current: DateRange; previous: DateRange }> = {
    daily: {
      current: { startDate: "yesterday", endDate: "yesterday" },
      previous: { startDate: "2daysAgo", endDate: "2daysAgo" },
    },
    weekly: {
      current: { startDate: "7daysAgo", endDate: "yesterday" },
      previous: { startDate: "14daysAgo", endDate: "8daysAgo" },
    },
    monthly: {
      current: { startDate: "30daysAgo", endDate: "yesterday" },
      previous: { startDate: "60daysAgo", endDate: "31daysAgo" },
    },
  };

  const { current, previous } = dateRanges[reportType];

  const [metrics, topPages, trafficSources, comparison, anomalies] =
    await Promise.all([
      getAggregatedMetrics(current),
      getTopPages(current, 5),
      getTrafficSources(current),
      comparePeriods(current, previous),
      detectAnomalies("users"),
    ]);

  const prompt = `Generate a ${reportType} analytics report based on this data:

Current Period Metrics:
${JSON.stringify(metrics, null, 2)}

Top Pages:
${JSON.stringify(topPages, null, 2)}

Traffic Sources:
${JSON.stringify(trafficSources, null, 2)}

Period Comparison:
${JSON.stringify(comparison, null, 2)}

Anomaly Detection (Users):
${JSON.stringify(anomalies, null, 2)}

Please provide a well-structured report with:
1. Executive Summary (2-3 sentences)
2. Key Metrics Overview
3. Notable Trends
4. Top Performing Content
5. Traffic Analysis
6. Recommendations`;

  return chat(prompt);
}
