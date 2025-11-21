/**
 * Test RabbitMQ Queue Implementation
 * Run: node backend/test-queue.js
 * Make sure to build first: npm run build
 */

require("dotenv").config();
const path = require("path");

// Try to load from dist first, fallback to src with ts-node
let queueModule;
try {
  queueModule = require("./dist/utils/queue");
} catch (e) {
  console.log("⚠️  Compiled version not found, using ts-node...");
  require("ts-node/register");
  queueModule = require("./src/utils/queue");
}

const { initQueue, sendToQueue, closeQueue } = queueModule;

async function testQueue() {
  try {
    console.log("🧪 Testing RabbitMQ Queue...\n");

    // 1. Initialize queue
    console.log("1️⃣ Initializing queue connection...");
    await initQueue();
    console.log("✅ Queue initialized\n");

    // 2. Send test notification
    console.log("2️⃣ Sending test notification to queue...");
    const testNotification = {
      userId: 1,
      type: "test",
      title: "Test Notification",
      message: "This is a test notification from the queue system",
      priority: "normal",
      metadata: {
        source: "test-script",
        timestamp: new Date().toISOString(),
      },
    };

    await sendToQueue("notifications", testNotification);
    console.log("✅ Notification sent to queue");
    console.log("📦 Payload:", JSON.stringify(testNotification, null, 2));
    console.log("\n");

    // 3. Send multiple test messages
    console.log("3️⃣ Sending batch of test notifications...");
    for (let i = 1; i <= 5; i++) {
      await sendToQueue("notifications", {
        userId: i,
        type: "batch-test",
        title: `Batch Test ${i}`,
        message: `Test message number ${i}`,
        priority: i % 2 === 0 ? "high" : "normal",
      });
      console.log(`   ✓ Sent batch notification ${i}/5`);
    }
    console.log("✅ Batch sent successfully\n");

    // 4. Close connection
    console.log("4️⃣ Closing queue connection...");
    await closeQueue();
    console.log("✅ Connection closed\n");

    console.log("🎉 All tests passed!");
    console.log("\n📝 Next steps:");
    console.log("   1. Start the worker: npm run worker");
    console.log("   2. Check worker logs to see messages being processed");
    console.log("   3. Verify notifications in database");
    console.log("   4. Access RabbitMQ Management UI: http://localhost:15672");
    console.log("      Username: advancia");
    console.log("      Password: rabbitmq_pass_change_in_prod\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error("\n🔍 Troubleshooting:");
    console.error("   - Is RabbitMQ running? (docker-compose up rabbitmq)");
    console.error("   - Is RABBITMQ_URL set in .env?");
    console.error(
      "   - Default: amqp://advancia:rabbitmq_pass_change_in_prod@localhost:5672"
    );
    process.exit(1);
  }
}

testQueue();
