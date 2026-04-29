import { NextResponse } from "next/server";
import { getStore } from "@/lib/db";
import { getUsers } from "@/lib/auth";

export async function GET() {
  try {
    const users = (await getUsers()) || {};
    const stats = (await getStore("stats")) || { scans: {}, events: [] };
    if (!stats.events) stats.events = [];

    const students = Object.values(users)
      .map((u) => ({
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        pin: u.pin,
        createdAt: u.createdAt,
        // Last scan timestamp for this student
        lastScan: stats.events
          .filter((e) => e.student === u.email)
          .reduce((max, e) => Math.max(max, e.ts), 0) || null,
        scanCount: stats.events.filter((e) => e.student === u.email).length,
      }))
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    return NextResponse.json({ students, stats });
  } catch (error) {
    console.error("[Analytics API] Error:", error);
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 });
  }
}
