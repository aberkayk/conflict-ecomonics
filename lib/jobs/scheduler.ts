import { runFetchGdeltJob } from "./fetchGdeltJob";
import { runFetchRssJob } from "./fetchRssJob";
import { cleanupOldEvents } from "@/lib/database/eventService";

const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
let started = false;
let running = false;

export function startScheduler(): void {
  if (started) return;
  started = true;

  console.log("[Scheduler] Started — interval: 5 min");

  // Run immediately on server boot
  runJobs().catch((err) => console.error("[Scheduler] Boot run error:", err));

  setInterval(() => {
    runJobs().catch((err) =>
      console.error("[Scheduler] Interval run error:", err)
    );
  }, INTERVAL_MS);
}

export async function runJobs(): Promise<void> {
  if (running) {
    console.log("[Scheduler] Already running — skipping cycle");
    return;
  }

  running = true;
  const t = Date.now();

  try {
    const [gdelt, rss] = await Promise.allSettled([
      runFetchGdeltJob(),
      runFetchRssJob(),
    ]);

    if (gdelt.status === "fulfilled") {
      console.log(
        `[Scheduler] GDELT saved=${gdelt.value.saved} skipped=${gdelt.value.skipped}`
      );
    } else {
      console.error("[Scheduler] GDELT failed:", gdelt.reason);
    }

    if (rss.status === "fulfilled") {
      console.log(
        `[Scheduler] RSS saved=${rss.value.saved} skipped=${rss.value.skipped}`
      );
    } else {
      console.error("[Scheduler] RSS failed:", rss.reason);
    }

    // Prune events older than 30 days (keep manual entries forever)
    cleanupOldEvents(30);

    console.log(`[Scheduler] Cycle done in ${Date.now() - t}ms`);
  } finally {
    running = false;
  }
}
