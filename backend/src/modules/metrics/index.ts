/**
 * Prometheus metrics for the e-commerce backend.
 *
 * All metrics are created here and exported so they
 * can be imported from a single canonical location.
 */
import {
  Counter,
  Histogram,
  register,
} from "prom-client";

// ─────────────────────────────────────────────────────────────
// CACHE METRICS
// ─────────────────────────────────────────────────────────────

export const cacheOperationsTotal = new Counter({
  name: "cache_operations_total",
  help: "Total number of cache operations",
  labelNames: ["operation", "result"] as const,
  registers: [register],
});

export const cacheOperationDurationSeconds = new Histogram({
  name: "cache_operation_duration_seconds",
  help: "Duration of cache operations in seconds",
  labelNames: ["operation"] as const,
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5],
  registers: [register],
});

// ─────────────────────────────────────────────────────────────
// PROMETHEUS REGISTRY EXPORT
// ─────────────────────────────────────────────────────────────

export { register } from "prom-client";
