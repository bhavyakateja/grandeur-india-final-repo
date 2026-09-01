export type DependencyName =
  | "postgresql"
  | "redis"
  | "cloudinary";

export type HealthState =
  | "healthy"
  | "unhealthy";

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