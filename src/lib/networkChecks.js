import net from "node:net";

export function isLikelyIpv4(value) {
  if (!value || typeof value !== "string") return false;
  const parts = value.trim().split(".");
  if (parts.length !== 4) return false;
  return parts.every((p) => /^\d+$/.test(p) && Number(p) >= 0 && Number(p) <= 255);
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error("timeout")), ms);
    }),
  ]);
}

export async function checkHttpTarget(url, timeoutMs) {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
      headers: { Accept: "text/html,application/json" },
    });
    clearTimeout(timeout);
    return {
      status: res.ok ? "online" : "degraded",
      latencyMs: Date.now() - start,
      detail: res.ok ? "HTTP OK" : `HTTP ${res.status}`,
    };
  } catch (error) {
    return { status: "offline", latencyMs: null, detail: error.message || "request_failed" };
  }
}

export async function checkTcpTarget(host, port, timeoutMs) {
  const start = Date.now();
  try {
    await withTimeout(
      new Promise((resolve, reject) => {
        const socket = new net.Socket();
        socket.setTimeout(timeoutMs);

        socket.once("connect", () => {
          socket.destroy();
          resolve();
        });
        socket.once("timeout", () => {
          socket.destroy();
          reject(new Error("timeout"));
        });
        socket.once("error", (err) => {
          socket.destroy();
          reject(err);
        });

        socket.connect(port, host);
      }),
      timeoutMs + 150
    );

    return {
      status: "online",
      latencyMs: Date.now() - start,
      detail: `TCP ${host}:${port}`,
    };
  } catch (error) {
    return { status: "offline", latencyMs: null, detail: error.message || "tcp_failed" };
  }
}

export function deriveGlobalStatus(results) {
  if (results.some((r) => r.status === "offline")) return "offline";
  if (results.some((r) => r.status === "degraded")) return "degraded";
  return "online";
}

export function buildDefaultChecksFromEnv() {
  const timeoutMs = Number(process.env.NETWORK_TIMEOUT_MS || 1500);
  const publicUrl = process.env.NETWORK_PUBLIC_URL || "https://pstb.fr";
  const wifiIpRaw = process.env.NETWORK_WIFI_IP || "";
  const wifiIp = wifiIpRaw.trim();
  const wifiPort = Number(process.env.NETWORK_WIFI_PORT || 80);

  const checks = [
    {
      id: "pstb-site",
      label: "Site PST&B",
      kind: "http",
      run: () => checkHttpTarget(publicUrl, timeoutMs),
    },
  ];

  if (wifiIp) {
    if (isLikelyIpv4(wifiIp)) {
      checks.push({
        id: "wifi-gateway",
        label: "Wi-Fi campus",
        kind: "tcp",
        run: () => checkTcpTarget(wifiIp, wifiPort, timeoutMs),
      });
    } else {
      checks.push({
        id: "wifi-gateway",
        label: "Wi-Fi campus",
        kind: "tcp",
        run: async () => ({
          status: "degraded",
          latencyMs: null,
          detail: `IP invalide: ${wifiIp}`,
        }),
      });
    }
  }

  return { checks, timeoutMs, wifiConfigured: Boolean(wifiIp), wifiIpValid: isLikelyIpv4(wifiIp) };
}
