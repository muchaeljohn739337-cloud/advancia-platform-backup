/**
 * OpenTelemetry Tracing Configuration
 *
 * This module sets up distributed tracing for the backend using OpenTelemetry.
 * Must be imported BEFORE any other modules to ensure proper instrumentation.
 *
 * Features:
 * - Automatic HTTP/Express instrumentation
 * - Prisma database query tracing
 * - OTLP export to AI Toolkit trace viewer
 * - Console export for development debugging
 */

import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { Resource } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";
import {
  BatchSpanProcessor,
  ConsoleSpanExporter,
} from "@opentelemetry/sdk-trace-node";
import { PrismaInstrumentation } from "@prisma/instrumentation";

// Check if tracing should be enabled
const TRACING_ENABLED = process.env.OTEL_TRACING_ENABLED !== "false";
const CONSOLE_EXPORT_ENABLED = process.env.OTEL_TRACING_CONSOLE === "true";
const OTLP_ENDPOINT =
  process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://localhost:4318/v1/traces";
const SERVICE_NAME = process.env.OTEL_SERVICE_NAME || "advancia-backend";
const SERVICE_VERSION = process.env.npm_package_version || "1.0.0";

let sdk: NodeSDK | null = null;

/**
 * Initialize OpenTelemetry tracing
 */
export function initTracing(): void {
  if (!TRACING_ENABLED) {
    console.log(
      "⚠️  Tracing disabled (set OTEL_TRACING_ENABLED=true to enable)"
    );
    return;
  }

  try {
    console.log("🔍 Initializing OpenTelemetry tracing...");
    console.log(`   - Service: ${SERVICE_NAME} v${SERVICE_VERSION}`);
    console.log(`   - OTLP endpoint: ${OTLP_ENDPOINT}`);

    // Create OTLP exporter for AI Toolkit
    const otlpExporter = new OTLPTraceExporter({
      url: OTLP_ENDPOINT,
      headers: {},
    });

    // Create console exporter for development debugging
    const consoleExporter = new ConsoleSpanExporter();

    // Configure SDK with automatic instrumentations
    sdk = new NodeSDK({
      resource: new Resource({
        "service.name": SERVICE_NAME,
        "service.version": SERVICE_VERSION,
      }),
      spanProcessors: [
        new BatchSpanProcessor(otlpExporter),
        ...(CONSOLE_EXPORT_ENABLED
          ? [new BatchSpanProcessor(consoleExporter)]
          : []),
      ],
      instrumentations: [
        // Auto-instrument Node.js core modules, HTTP, Express, etc.
        getNodeAutoInstrumentations({
          "@opentelemetry/instrumentation-fs": {
            enabled: false, // Disable filesystem instrumentation (too noisy)
          },
          "@opentelemetry/instrumentation-http": {
            enabled: true,
          },
          "@opentelemetry/instrumentation-express": {
            enabled: true,
          },
        }),
        // Instrument Prisma database queries
        new PrismaInstrumentation(),
      ],
    });

    // Start the SDK
    sdk.start();
    console.log("✅ OpenTelemetry tracing initialized successfully");
    console.log("   📊 View traces in AI Toolkit (http://localhost:4318)");
  } catch (error) {
    console.error("❌ Failed to initialize tracing:", error);
    // Don't fail the app if tracing setup fails
  }
}

/**
 * Gracefully shutdown tracing on app exit
 */
export async function shutdownTracing(): Promise<void> {
  if (sdk) {
    try {
      console.log("🔍 Shutting down OpenTelemetry tracing...");
      await sdk.shutdown();
      console.log("✅ Tracing shutdown complete");
    } catch (error) {
      console.error("❌ Error shutting down tracing:", error);
    }
  }
}

/**
 * Get the tracer instance for manual span creation
 * Only use this if you need custom spans beyond automatic instrumentation
 */
export function getTracer() {
  const { trace } = require("@opentelemetry/api");
  return trace.getTracer(SERVICE_NAME, SERVICE_VERSION);
}

// NOTE: Shutdown handlers removed from here
// Graceful shutdown is now centrally managed in index.ts
// Call shutdownTracing() from the main shutdown handler

// Auto-initialize if this module is imported
if (TRACING_ENABLED) {
  initTracing();
}

export default {
  initTracing,
  shutdownTracing,
  getTracer,
};
