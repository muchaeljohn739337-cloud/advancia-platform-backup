/**
 * Offline notification service test harness.
 * Steps (requires backend process running in same environment):
 * 1. Loads notificationService
 * 2. Sends a synthetic notification to USER_ID (or test user) without email/push side-effects if DISABLE_EXTERNAL_SEND is set.
 * 3. Confirms promise resolution and logs structured result.
 */
import { Server } from "socket.io";
import {
  sendNotification,
  setSocketIO,
} from "../src/services/notificationService";

interface Outcome {
  step: string;
  success: boolean;
  detail?: string;
}

async function main() {
  const outcomes: Outcome[] = [];
  // Lightweight in-memory Socket.IO server (no HTTP bind) for emission path only.
  const io = new Server();
  setSocketIO(io);
  outcomes.push({ step: "socket-stub", success: true });

  const userId = process.env.USER_ID || "test-user";
  const disableExternal = process.env.DISABLE_EXTERNAL_SEND === "true";

  try {
    await sendNotification({
      userId,
      title: "Test Notification",
      message: "Verification harness notification",
      type: "info",
      meta: { harness: true, timestamp: new Date().toISOString() },
      suppressEmail: disableExternal,
      suppressPush: disableExternal,
    });
    outcomes.push({ step: "send-notification", success: true, detail: userId });
  } catch (e) {
    outcomes.push({
      step: "send-notification",
      success: false,
      detail: (e as Error).message,
    });
  }

  summarize(outcomes);
  process.exit(outcomes.every((o) => o.success) ? 0 : 1);
}

function summarize(list: Outcome[]) {
  console.log("\nNotification Service Verification".padEnd(50, "="));
  for (const o of list) {
    console.log(
      `${o.success ? "[PASS]" : "[FAIL]"} ${o.step} ${
        o.detail ? "- " + o.detail : ""
      }`,
    );
  }
}

main().catch((e) => {
  console.error("Fatal", e);
  process.exit(1);
});
