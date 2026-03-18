// Next.js instrumentation hook — runs once when the server starts.
// Docs: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
export async function register() {
  // Only run in the Node.js runtime, not in Edge or browser contexts
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startScheduler } = await import("./lib/jobs/scheduler");
    startScheduler();
  }
}
