import { getFullDb, dbEvents } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Send initial data immediately
      const db = getFullDb();
      const initialData = JSON.stringify(db);
      controller.enqueue(encoder.encode(`data: ${initialData}\n\n`));

      // Send updates whenever db changes
      const onDbChange = () => {
        const currentDb = getFullDb();
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(currentDb)}\n\n`));
      };

      dbEvents.on("change", onDbChange);

      // Keep connection alive with heartbeat
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(": heartbeat\n\n"));
      }, 30000);

      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        dbEvents.off("change", onDbChange);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",   // disables Nginx / proxy buffering
    },
  });
}
