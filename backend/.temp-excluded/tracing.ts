import { context, trace } from "@opentelemetry/api";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { ExpressInstrumentation } from "@opentelemetry/instrumentation-express";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { Resource } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { PrismaInstrumentation } from "@prisma/instrumentation";
import type { NextFunction, Request, Response } from "express";

// Resolve exporter endpoint from env or default to local AI Toolkit (4318)
const otlpEndpoint =
  process.env.OTEL_EXPORTER_OTLP_ENDPOINT?.trim() ||
  "http://localhost:4318/v1/traces";
const serviceName = process.env.OTEL_SERVICE_NAME || "advancia-backend";

const traceExporter = new OTLPTraceExporter({ url: otlpEndpoint });

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
    [SemanticResourceAttributes.SERVICE_VERSION]: "1.0.0",
    [SemanticResourceAttributes.DEPLOYMENT_ENV]:
      process.env.NODE_ENV || "development",
  }),
  traceExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      "@opentelemetry/instrumentation-fs": { enabled: false },
    }),
    new ExpressInstrumentation(),
    new HttpInstrumentation(),
    new PrismaInstrumentation(),
  ],
});

sdk
  .start()
  .then(() => {
    // eslint-disable-next-line no-console
    console.log(
      "[tracing] OpenTelemetry SDK started (endpoint:",
      otlpEndpoint,
      ")"
    );
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error("[tracing] Failed to start OpenTelemetry SDK", err);
  });

// Graceful shutdown
process.on("SIGTERM", () => {
  sdk
    .shutdown()
    .then(() => {
      // eslint-disable-next-line no-console
      console.log("[tracing] SDK shutdown complete");
      process.exit(0);
    })
    .catch((err) => {
      console.error("[tracing] SDK shutdown error", err);
      process.exit(1);
    });
});

// Middleware to enrich spans with route/user details
export function enrichRequestSpan(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const span = trace.getSpan(context.active());
  if (span) {
    span.setAttribute("http.route", req.route?.path || req.path);
    if (req.method) span.setAttribute("http.method", req.method);
    const userId = (req as any).user?.id || (req as any).userId;
    if (userId) span.setAttribute("app.user_id", String(userId));
    const reqId = req.headers["x-request-id"];
    if (reqId) span.setAttribute("app.request_id", String(reqId));
  }
  next();
}

// Helper for manual spans around async work
export async function withSpan<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const tracer = trace.getTracer("advancia-backend");
  const span = tracer.startSpan(name);
  try {
    return await context.with(trace.setSpan(context.active(), span), fn());
  } catch (err: any) {
    span.recordException(err);
    span.setStatus({ code: 2, message: err?.message || "error" });
    throw err;
  } finally {
    span.end();
  }
}

// Synchronous variant
export function withSpanSync<T>(name: string, fn: () => T): T {
  const tracer = trace.getTracer("advancia-backend");
  const span = tracer.startSpan(name);
  try {
    return context.with(trace.setSpan(context.active(), span), fn());
  } catch (err: any) {
    span.recordException(err);
    span.setStatus({ code: 2, message: err?.message || "error" });
    throw err;
  } finally {
    span.end();
  }
}
