import { NextResponse } from "next/server";
import { verifyOrgPin } from "@/lib/security";
import { getReportById } from "@/server/repositories/report-repository";
import { processPendingReport } from "@/server/services/report-workflow";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const pin = request.headers.get("x-org-pin");
    if (!verifyOrgPin(pin)) {
      return NextResponse.json({ error: "Invalid organization pin." }, { status: 401 });
    }

    const { id } = await context.params;
    await processPendingReport(id);

    const report = await getReportById(id);
    return NextResponse.json({ report }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
