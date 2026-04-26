import { NextResponse } from "next/server";
import { buildDefaultChecksFromEnv, checkHttpTarget, deriveGlobalStatus } from "@/lib/networkChecks";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CACHE_TTL_MS = 10_000;
let cache = { at: 0, data: null };
const MAX_POINTS = 2880; // ~24h @ 30s
if (!globalThis.__uptimeHistory) {
  globalThis.__uptimeHistory = [];
}

function avg(values) {
  if (!values.length) return null;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

function jitter(values) {
  if (values.length < 2) return 0;
  const diffs = [];
  for (let i = 1; i < values.length; i += 1) diffs.push(Math.abs(values[i] - values[i - 1]));
  return avg(diffs) ?? 0;
}

function qualityGrade({ packetLoss, avgLatency, jitterMs }) {
  if (packetLoss > 34 || avgLatency === null) return "poor";
  if (packetLoss > 0 || avgLatency > 450 || jitterMs > 180) return "fair";
  if (avgLatency > 250 || jitterMs > 100) return "good";
  return "excellent";
}

function percentage(points) {
  if (!points.length) return 100;
  const online = points.filter((p) => p.status === "online").length;
  return Math.round((online / points.length) * 1000) / 10;
}

export async function GET() {
  const now = Date.now();
  if (cache.data && now - cache.at < CACHE_TTL_MS) {
    return NextResponse.json(cache.data);
  }

  const { checks, timeoutMs, wifiConfigured, wifiIpValid } = buildDefaultChecksFromEnv();
  const primaryUrl = process.env.NETWORK_PUBLIC_URL || "https://pstb.fr";
  const backupUrl = process.env.NETWORK_BACKUP_URL || "https://www.cloudflare.com/cdn-cgi/trace";

  const results = await Promise.all(
    checks.map(async (check) => {
      const result = await check.run();
      return {
        id: check.id,
        label: check.label,
        kind: check.kind,
        ...result,
      };
    })
  );

  const payload = {
    status: deriveGlobalStatus(results),
    updatedAt: new Date().toISOString(),
    targets: results,
    meta: {
      timeoutMs,
      wifiConfigured,
      note: wifiConfigured
        ? "Le test Wi-Fi est fait en TCP depuis la route API (Node runtime)."
        : "Définis NETWORK_WIFI_IP pour activer le test Wi-Fi campus.",
      wifiIpValid,
    },
  };

  // Uptime tracking (based on merged status)
  const timestamp = Date.now();
  globalThis.__uptimeHistory.push({ ts: timestamp, status: payload.status });
  if (globalThis.__uptimeHistory.length > MAX_POINTS) {
    globalThis.__uptimeHistory.splice(0, globalThis.__uptimeHistory.length - MAX_POINTS);
  }
  const oneHourAgo = timestamp - 60 * 60 * 1000;
  const dayAgo = timestamp - 24 * 60 * 60 * 1000;
  const oneHourPoints = globalThis.__uptimeHistory.filter((p) => p.ts >= oneHourAgo);
  const dayPoints = globalThis.__uptimeHistory.filter((p) => p.ts >= dayAgo);
  payload.uptime = {
    uptime1h: percentage(oneHourPoints),
    uptime24h: percentage(dayPoints),
    samples1h: oneHourPoints.length,
    samples24h: dayPoints.length,
    timeline: dayPoints.slice(-60).map((p) => p.status),
  };

  // Internet quality sampling (small probe set)
  const sampleTargets = [primaryUrl, backupUrl, primaryUrl];
  const sampleResults = [];
  for (const target of sampleTargets) {
    const result = await checkHttpTarget(target, timeoutMs);
    sampleResults.push({ target, ...result });
  }
  const successes = sampleResults.filter((r) => typeof r.latencyMs === "number").map((r) => r.latencyMs);
  const packetLoss = Math.round(((sampleResults.length - successes.length) / sampleResults.length) * 100);
  const avgLatency = avg(successes);
  const jitterMs = jitter(successes);
  payload.quality = {
    avgLatency,
    jitterMs,
    packetLoss,
    quality: qualityGrade({ packetLoss, avgLatency, jitterMs }),
    samples: sampleResults,
  };

  cache = { at: now, data: payload };
  return NextResponse.json(payload);
}
