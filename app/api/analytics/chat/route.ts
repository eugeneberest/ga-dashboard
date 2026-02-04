import { NextRequest, NextResponse } from "next/server";
import { chat, generateReport, type ChatMessage } from "@/lib/ai-agent";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, history = [], action } = body;

    if (action === "report") {
      const reportType = body.reportType || "weekly";
      const report = await generateReport(reportType);
      return NextResponse.json({ success: true, response: report });
    }

    if (!message) {
      return NextResponse.json(
        { success: false, error: "Message is required" },
        { status: 400 }
      );
    }

    const response = await chat(message, history as ChatMessage[]);
    return NextResponse.json({ success: true, response });
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
