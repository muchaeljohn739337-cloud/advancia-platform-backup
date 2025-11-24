import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const API_BASE_URL = process.env.BACKEND_URL || "http://localhost:4000";

interface EndpointTest {
  method: "GET" | "POST";
  path: string;
  expectedStatus: number;
  description: string;
  body?: any;
  headers?: Record<string, string>;
}

const CRITICAL_ENDPOINTS: EndpointTest[] = [
  {
    method: "GET",
    path: "/api/health",
    expectedStatus: 200,
    description: "Health check endpoint",
  },
  // Skip authenticated endpoints in pre-production verification
  // {
  //   method: "GET",
  //   path: "/api/nowpayments/currencies",
  //   expectedStatus: 200,
  //   description: "NOWPayments currencies endpoint",
  // },
];

class APIVerifier {
  private passed = 0;
  private failed = 0;

  async verify() {
    console.log(`🔍 Verifying API endpoints at ${API_BASE_URL}...\n`);

    for (const test of CRITICAL_ENDPOINTS) {
      await this.testEndpoint(test);
    }

    console.log("\n📊 SUMMARY:");
    console.log(`  Passed: ${this.passed}`);
    console.log(`  Failed: ${this.failed}`);

    if (this.failed > 0) {
      console.error(
        "\n❌ API VERIFICATION FAILED - Make sure backend is running",
      );
      process.exit(1);
    }

    console.log("\n✅ All critical API endpoints verified successfully!");
    process.exit(0);
  }

  private async testEndpoint(test: EndpointTest) {
    const url = `${API_BASE_URL}${test.path}`;
    console.log(`Testing ${test.method} ${test.path} - ${test.description}`);

    try {
      const response = await axios({
        method: test.method,
        url,
        data: test.body,
        headers: test.headers,
        validateStatus: () => true,
        timeout: 5000,
      });

      if (response.status === test.expectedStatus) {
        console.log(
          `  ✅ Status: ${response.status} (expected ${test.expectedStatus})`,
        );
        this.passed++;
      } else {
        console.error(
          `  ❌ Status: ${response.status} (expected ${test.expectedStatus})`,
        );
        if (response.data) {
          console.error(
            `  Response:`,
            JSON.stringify(response.data).substring(0, 200),
          );
        }
        this.failed++;
      }
    } catch (error: any) {
      console.error(`  ❌ Request failed:`, error.message);
      this.failed++;
    }
  }
}

new APIVerifier().verify();
