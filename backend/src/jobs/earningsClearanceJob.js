import mongoose from "mongoose";
import { releaseEligibleEarnings, reconcileMentorClearingBalances } from "../services/mentorEarningsService.js";

let timer;
let running = false;
export function startEarningsClearanceJob() {
  if (running) return;
  running = true;
  const tick = async () => {
    try {
      if (mongoose.connection.readyState === 1) {
        await releaseEligibleEarnings();
        const report = await reconcileMentorClearingBalances();
        if (report.mismatches.length) console.error("[earnings reconciliation]", JSON.stringify(report.mismatches));
      }
    } catch (error) { console.error("[earnings clearance]", error.message); }
    if (running) { timer = setTimeout(tick, 3600000); timer.unref?.(); }
  };
  void tick();
}
export function stopEarningsClearanceJob() { running = false; clearTimeout(timer); }
