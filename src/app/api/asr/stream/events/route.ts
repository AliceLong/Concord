import { subscribeToStreamingAsrSession } from "@/server/services/asr-stream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return new Response(JSON.stringify({ error: "sessionId is required." }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;

      const send = (payload: unknown) => {
        if (closed) {
          return;
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      let unsubscribe = () => {};

      try {
        unsubscribe = subscribeToStreamingAsrSession(sessionId, (event) => {
          send(event);

          if (event.type === "done" || event.type === "error") {
            closed = true;
            unsubscribe();
            controller.close();
          }
        });
      } catch (error) {
        send({
          type: "error",
          transcript: "",
          model: null,
          message: error instanceof Error ? error.message : "Unknown error"
        });
        closed = true;
        controller.close();
        return;
      }

      request.signal.addEventListener("abort", () => {
        if (closed) {
          return;
        }

        closed = true;
        unsubscribe();
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
}
