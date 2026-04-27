import { NextResponse } from "next/server";
import { getStore, setStore } from "@/lib/db";
import { cookies } from "next/headers";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  const widgetId = searchParams.get("w");

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  try {
    const stats = getStore("stats") || { scans: {}, events: [] };
    if (!stats.scans) stats.scans = {};
    if (!stats.events) stats.events = [];

    // Identify student if logged in
    let studentEmail = null;
    try {
      const cookieStore = await cookies();
      studentEmail = cookieStore.get("pstb_student_email")?.value || null;
    } catch (_) {}

    if (widgetId) {
      stats.scans[widgetId] = (stats.scans[widgetId] || 0) + 1;

      // Append detailed event (keep last 500)
      stats.events.push({
        widgetId,
        url,
        student: studentEmail,
        ts: Date.now(),
      });
      if (stats.events.length > 500) stats.events = stats.events.slice(-500);
    }

    setStore("stats", stats);
  } catch (error) {
    console.error("[Track API] Error updating stats:", error);
  }

  return NextResponse.redirect(url);
}
