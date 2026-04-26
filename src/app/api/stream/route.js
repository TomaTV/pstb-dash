import { getFullDb, dbEvents } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const encoder = new TextEncoder();
  let isClosed = false;

  const stream = new ReadableStream({
    start(controller) {
      const send = (data) => {
        if (isClosed) return;
        try {
          controller.enqueue(encoder.encode(data));
        } catch (e) {
          console.error("SSE enqueue error:", e);
          cleanup();
        }
      };

      // Send initial data immediately
      try {
        const db = getFullDb();
        send(`data: ${JSON.stringify(db)}\n\n`);
      } catch (e) {
        console.error("SSE initial data error:", e);
      }

      // Send updates whenever db changes
      const onDbChange = () => {
        try {
          const currentDb = getFullDb();
          send(`data: ${JSON.stringify(currentDb)}\n\n`);
        } catch (e) {
          console.error("SSE update error:", e);
        }
      };

      dbEvents.on("change", onDbChange);

      // Keep connection alive with heartbeat
      const heartbeat = setInterval(() => {
        send(": heartbeat\n\n");
      }, 15000); // More frequent heartbeat for Vercel

      const cleanup = () => {
        if (isClosed) return;
        isClosed = true;
        clearInterval(heartbeat);
        dbEvents.off("change", onDbChange);
        try {
          controller.close();
        } catch (e) {
          // ignore already closed
        }
      };

      req.signal.addEventListener("abort", cleanup);

      // Vercel serverless functions have a timeout (usually 10-60s).
      // We close the connection slightly before to allow clean reconnection.
      const maxDuration = 55000; // 55 seconds
      setTimeout(cleanup, maxDuration);
    },
    cancel() {
      isClosed = true;
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

