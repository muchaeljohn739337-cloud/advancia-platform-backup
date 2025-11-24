/**
 * Offline Socket.IO verification harness.
 * Intended to be run AFTER the backend is live.
 * It will:
 * 1. Connect to the Socket.IO server using BACKEND_SOCKET_URL (wss/http)
 * 2. Authenticate via JWT if BACKEND_TEST_JWT provided
 * 3. Emit a join-room event with the decoded user id (or USER_ID env)
 * 4. Listen for a small set of expected events to confirm realtime path
 *
 * Run: npx ts-node backend/scripts/verify-socketio.ts
 */
import { io, Socket } from "socket.io-client";

interface Result {
  step: string;
  success: boolean;
  detail?: string;
}

async function main() {
  const results: Result[] = [];
  const url =
    process.env.BACKEND_SOCKET_URL ||
    process.env.BACKEND_URL ||
    "http://localhost:4000";
  const jwt = process.env.BACKEND_TEST_JWT;
  const explicitUserId = process.env.USER_ID;

  if (!url) {
    console.error("Missing BACKEND_SOCKET_URL or BACKEND_URL env.");
    process.exit(1);
  }

  let userId: string | undefined = explicitUserId;
  if (!userId && jwt) {
    try {
      const payloadPart = jwt.split(".")[1];
      const decoded = JSON.parse(
        Buffer.from(payloadPart, "base64").toString("utf8"),
      );
      userId = decoded.userId || decoded.id || decoded.sub;
    } catch (e) {
      results.push({
        step: "decode-jwt",
        success: false,
        detail: (e as Error).message,
      });
    }
  }

  if (!userId) {
    results.push({
      step: "derive-user-id",
      success: false,
      detail: "Set USER_ID or provide a decodable BACKEND_TEST_JWT",
    });
  }

  let socket: Socket | null = null;
  try {
    socket = io(url, {
      auth: jwt ? { token: jwt } : undefined,
      transports: ["websocket", "polling"],
      timeout: 5000,
    });
    results.push({ step: "socket-init", success: true, detail: url });
  } catch (e) {
    results.push({
      step: "socket-init",
      success: false,
      detail: (e as Error).message,
    });
  }

  if (!socket) {
    dump(results);
    process.exit(1);
  }

  const awaitedEvents: Record<string, boolean> = {
    connect: false,
    disconnect: false,
    error: false,
    "notification:new": false,
  };

  socket.on("connect", () => {
    awaitedEvents.connect = true;
    results.push({
      step: "connect",
      success: true,
      detail: `id=${socket!.id}`,
    });
    if (userId) {
      socket!.emit("join-room", { room: `user-${userId}` });
      results.push({
        step: "join-room",
        success: true,
        detail: `user-${userId}`,
      });
    }
  });

  socket.on("notification:new", (payload: any) => {
    awaitedEvents["notification:new"] = true;
    results.push({
      step: "notification:new",
      success: true,
      detail: JSON.stringify(payload).slice(0, 120),
    });
  });

  socket.on("disconnect", (reason: string) => {
    awaitedEvents.disconnect = true;
    results.push({ step: "disconnect", success: true, detail: reason });
  });

  socket.on("connect_error", (err: any) => {
    awaitedEvents.error = true;
    results.push({
      step: "connect_error",
      success: false,
      detail: err?.message || String(err),
    });
  });

  // Allow some time for events then close.
  await new Promise((res) => setTimeout(res, 4000));
  socket.close();

  // Summarize required baseline.
  const baselineOk = awaitedEvents.connect && !awaitedEvents.error;
  results.push({
    step: "baseline",
    success: baselineOk,
    detail: JSON.stringify(awaitedEvents),
  });

  dump(results);
  process.exit(baselineOk ? 0 : 1);
}

function dump(results: Result[]) {
  const width = 60;
  console.log("\nSocket.IO Verification Summary".padEnd(width, "="));
  for (const r of results) {
    console.log(
      `${r.success ? "[PASS]" : "[FAIL]"} ${r.step} - ${r.detail || ""}`,
    );
  }
}

main().catch((e) => {
  console.error("Fatal error", e);
  process.exit(1);
});
