import { NextResponse } from "next/server";
import { runJobs } from "@/lib/jobs/scheduler";

export const dynamic = "force-dynamic";

// POST /api/jobs/run — manually trigger a fetch cycle
export async function POST() {
  try {
    await runJobs();
    return NextResponse.json({ ok: true, message: "Jobs completed" });
  } catch (err) {
    console.error("[POST /api/jobs/run]", err);
    return NextResponse.json({ error: "Jobs failed" }, { status: 500 });
  }
}
