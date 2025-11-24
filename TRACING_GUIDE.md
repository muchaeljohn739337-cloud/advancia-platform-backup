# Tracing Guide (OpenTelemetry)

## Overview

OpenTelemetry tracing is initialized in `backend/src/tracing.ts` and imported early in `backend/src/index.ts`. It automatically instruments HTTP, Express, and Prisma. Custom spans can be added with `withSpan` / `withSpanSync`.

## Environment Variables

```
OTEL_SERVICE_NAME=advancia-backend
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces
```

Point `OTEL_EXPORTER_OTLP_ENDPOINT` to your collector (Jaeger, Tempo, Honeycomb, AI Toolkit local collector).

## Adding Manual Spans

```ts
import { withSpan } from "./tracing";

await withSpan("payments.process", async () => {
  // business logic
});
```

## Enriched Attributes

The middleware `enrichRequestSpan` adds: `http.route`, `http.method`, `app.user_id`, `app.request_id` (if present).

## Shutdown

SDK shuts down gracefully on SIGTERM; ensure your process manager sends the signal (PM2, systemd).

## Verification

1. Start backend.
2. Hit `curl http://localhost:4000/health`.
3. Check collector UI (or enable a console exporter temporarily).

## Optional: Sentry Bridge

Sentry is already initialized for error tracking. For unified tracing, add the Sentry OpenTelemetry SDK or configure Sentry performance monitoring. (Not included in current setup for minimal change.)

## Troubleshooting

-   No spans: verify import order (tracing imported before Express routes).
-   Export errors: confirm OTLP endpoint reachable.
-   High cardinality: avoid adding raw user emails or large payloads as attributes.

## Next Steps

-   Add metrics (`@opentelemetry/sdk-metrics`) if needed.
-   Forward traces to production collector.
-   Define sampling strategy (default always-on). Adjust via environment or SDK config.
