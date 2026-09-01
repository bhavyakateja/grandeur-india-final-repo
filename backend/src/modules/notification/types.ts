export interface NotificationPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface AdminNotificationPayload {
  subject: string;
  html: string;
  text?: string;
}