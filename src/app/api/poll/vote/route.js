import crypto from "crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getStore, setStore, getFullDb } from "@/lib/db";

function questionHash(q) {
  return crypto.createHash("sha1").update(String(q || "")).digest("hex").slice(0, 10);
}
const cookieName = (widgetId) => `pstb_poll_${String(widgetId).replace(/[^a-zA-Z0-9_-]/g, "_")}`;

export async function POST(req) {
  try {
    const { widgetId, optionId } = await req.json();
    if (!widgetId || !optionId) {
      return NextResponse.json({ error: "missing params" }, { status: 400 });
    }

    const ip = req.headers.get("x-forwarded-for") || req.ip || "unknown";
    const ipKey = `rate_limit_poll_${ip}_${widgetId}`;
    const lastVote = await getStore(ipKey);
    if (lastVote && Date.now() - lastVote < 60 * 1000) {
      // Basic rate limit: 1 vote per IP per minute
      return NextResponse.json({ error: "Rate limited" }, { status: 429 });
    }

    const widgets = (await getStore("widgets")) || [];
    const widgetIndex = widgets.findIndex(w => w.id === widgetId && w.type === "poll");
    if (widgetIndex === -1) return NextResponse.json({ error: "poll not found" }, { status: 404 });
    const widget = widgets[widgetIndex];

    const qHash = questionHash(widget.data?.question);
    const jar = await cookies();
    const existing = jar.get(cookieName(widgetId))?.value;

    // Cookie format "<optionId>:<questionHash>". Allow re-vote when question changes.
    if (existing) {
      const [, prevHash] = existing.split(":");
      if (prevHash === qHash) {
        return NextResponse.json({ error: "already voted", alreadyVoted: true }, { status: 409 });
      }
    }

    const options = widget.data.options || [];
    const target = options.find(o => o.id === optionId);
    if (!target) return NextResponse.json({ error: "option not found" }, { status: 400 });

    target.votes = (target.votes || 0) + 1;
    
    // Save back to db
    await setStore("widgets", widgets);
    await setStore(ipKey, Date.now()); // register IP vote

    const res = NextResponse.json({
      ok: true,
      options: options.map(o => ({ id: o.id, label: o.label, votes: o.votes })),
    });
    res.cookies.set(cookieName(widgetId), `${optionId}:${qHash}`, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
      maxAge: 60 * 60 * 24 * 60,
    });
    return res;
  } catch (e) {
    console.error("[poll/vote]", e);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const widgetId = searchParams.get("widgetId");
    if (!widgetId) return NextResponse.json({ error: "missing widgetId" }, { status: 400 });

    const widgets = (await getStore("widgets")) || [];
    const widget = widgets.find(w => w.id === widgetId && w.type === "poll");
    if (!widget) return NextResponse.json({ error: "poll not found" }, { status: 404 });

    const qHash = questionHash(widget.data?.question);
    const jar = await cookies();
    const existing = jar.get(cookieName(widgetId))?.value;
    let voted = null;
    if (existing) {
      const [opt, prevHash] = existing.split(":");
      if (prevHash === qHash) voted = opt;
    }

    return NextResponse.json({
      question: widget.data.question,
      options: (widget.data.options || []).map(o => ({ id: o.id, label: o.label, votes: o.votes || 0 })),
      voted,
    });
  } catch (e) {
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
