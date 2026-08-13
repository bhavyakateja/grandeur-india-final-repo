export type DependencyName = "postgresql" | "redis" | "bullmq" | "cloudinary";
export type HealthState = "healthy" | "unhealthy";

export interface DependencyHealth {
  status: HealthState;
  latencyMs: number;
}

export interface HealthResponse {
  status: HealthState;
  timestamp: string;
  checks: Record<DependencyName, DependencyHealth>;
}

export interface LivenessResponse {
  status: "healthy";
  timestamp: string;
}
