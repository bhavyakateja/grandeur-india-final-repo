export enum NotificationChannel {
  EMAIL = "EMAIL",
  SMS = "SMS",
  PUSH = "PUSH",
}

export interface NotificationPayload {
  to: string;
  subject?: string;
  message: string;
}