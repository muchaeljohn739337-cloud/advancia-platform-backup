/**
 * Quick test to verify tracing is working
 * Run this after starting the backend to see traces in AI Toolkit
 */

const axios = require("axios");

const API_URL = process.env.BACKEND_URL || "http://localhost:4000";

async function testTracing() {
  console.log("🔍 Testing OpenTelemetry Tracing...\n");
  console.log("Make sure:");
  console.log("1. Backend is running (npm run dev)");
  console.log("2. AI Toolkit trace viewer is open in VS Code");
  console.log("3. OTEL_TRACING_ENABLED=true in .env\n");

  const tests = [
    { name: "Health Check", url: `${API_URL}/api/health` },
    { name: "Root Endpoint", url: `${API_URL}/` },
    { name: "System Status", url: `${API_URL}/api/system` },
  ];

  for (const test of tests) {
    try {
      console.log(`📡 ${test.name}...`);
      const start = Date.now();
      const response = await axios.get(test.url, {
        headers: {
          "User-Agent": "Tracing-Test/1.0",
        },
      });
      const duration = Date.now() - start;
      console.log(`   ✅ Status: ${response.status} (${duration}ms)`);
      console.log(`   📊 Check AI Toolkit for trace details\n`);
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}\n`);
    }

    // Wait a bit between requests to see individual traces
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log("\n✅ Test complete!");
  console.log("📊 Open AI Toolkit trace viewer to see:");
  console.log("   - HTTP request spans");
  console.log("   - Express middleware execution");
  console.log("   - Request timing and attributes");
  console.log("   - Any errors or exceptions\n");
}

testTracing().catch(console.error);
