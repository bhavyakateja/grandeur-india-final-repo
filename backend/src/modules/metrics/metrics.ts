import { Counter, Gauge, Histogram } from "prom-client";
import { registry } from "./registry";

export const httpRequestsTotal = new Counter({
  name: "ecommerce_http_requests_total",
  help: "Total HTTP requests handled by the API",
  labelNames: ["method", "route", "status"],
  registers: [registry],
});

export const httpRequestDurationSeconds = new Histogram({
  name: "ecommerce_http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [registry],
});

export const usersRegistered = new Counter({
  name: "ecommerce_users_registered_total",
  help: "Total successfully registered users",
  registers: [registry],
});

export const paymentSuccess = new Counter({
  name: "ecommerce_payment_success_total",
  help: "Total successfully verified payments",
  labelNames: ["provider"],
  registers: [registry],
});

export const paymentFailure = new Counter({
  name: "ecommerce_payment_failure_total",
  help: "Total failed payment verification attempts",
  labelNames: ["provider"],
  registers: [registry],
});

export const ordersCreated = new Counter({
  name: "ecommerce_orders_created_total",
  help: "Total orders created after successful payment",
  registers: [registry],
});

export const orderValueRupees = new Histogram({
  name: "ecommerce_order_value_rupees",
  help: "Value of newly created orders in Indian rupees",
  buckets: [100, 250, 500, 1_000, 2_500, 5_000, 10_000, 25_000, 50_000],
  registers: [registry],
});

export const couponApplicationsTotal = new Counter({
  name: "ecommerce_coupon_applications_total",
  help: "Coupon application attempts by result",
  labelNames: ["result"],
  registers: [registry],
});

export const couponRedemptionsTotal = new Counter({
  name: "ecommerce_coupon_redemptions_total",
  help: "Coupons redeemed after a successful payment",
  registers: [registry],
});

export const inventoryOperationsTotal = new Counter({
  name: "ecommerce_inventory_operations_total",
  help: "Inventory operations by operation and result",
  labelNames: ["operation", "result"],
  registers: [registry],
});

export const inventoryUnitsTotal = new Counter({
  name: "ecommerce_inventory_units_total",
  help: "Inventory units changed by operation",
  labelNames: ["operation"],
  registers: [registry],
});

export const cacheOperationsTotal = new Counter({
  name: "ecommerce_cache_operations_total",
  help: "Cache operations by operation and result",
  labelNames: ["operation", "result"],
  registers: [registry],
});

export const cacheOperationDurationSeconds = new Histogram({
  name: "ecommerce_cache_operation_duration_seconds",
  help: "Cache operation latency in seconds",
  labelNames: ["operation"],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
  registers: [registry],
});

export const queueJobsTotal = new Counter({
  name: "ecommerce_queue_jobs_total",
  help: "Queue jobs by queue, job name, and event",
  labelNames: ["queue", "job", "event"],
  registers: [registry],
});

export const queueJobsInFlight = new Gauge({
  name: "ecommerce_queue_jobs_in_flight",
  help: "Queue jobs currently being processed",
  labelNames: ["queue"],
  registers: [registry],
});

export const queueJobDurationSeconds = new Histogram({
  name: "ecommerce_queue_job_duration_seconds",
  help: "Queue job processing duration",
  labelNames: ["queue", "job"],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30, 60],
  registers: [registry],
});