import { NextResponse } from "next/server";
import { z } from "zod";
import { getChatReply } from "@/server/services/chat";

const chatPayloadSchema = z.object({
  elderId: z.string().optional(),
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().min(1)
    })
  )
});

export async function POST(request: Request) {
  try {
    const payload = chatPayloadSchema.parse(await request.json());
    const result = await getChatReply(payload);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
