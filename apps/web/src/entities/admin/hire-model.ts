export type HireDecisionType = "HIRED" | "REJECTED" | "WITHDRAWN";
export type NotificationChannel = "EMAIL" | "SMS";
export type NotificationStatus = "PENDING" | "SENT" | "FAILED" | "CANCELLED";

export interface HireDecision {
  decisionId: number;
  applicationId: number;
  decision: HireDecisionType;
  salaryInfo: string | null;
  startDate: string | null;
  note: string | null;
  decidedAt: string;
}

export interface NotificationTemplate {
  templateId: number;
  templateKey: string;
  title: string;
  bodyTemplate: string;
  channel: NotificationChannel;
}

export interface NotificationPreview {
  templateId: number;
  templateKey: string;
  channel: NotificationChannel;
  recipient: string;
  subject: string;
  body: string;
}

export interface NotificationLog {
  logId: number;
  applicationId: number;
  templateKey: string | null;
  channel: NotificationChannel;
  recipient: string;
  subject: string;
  body: string;
  status: NotificationStatus;
  sentAt: string | null;
  createdAt: string;
}

export interface CreateHireDecisionPayload {
  decision: HireDecisionType;
  salaryInfo?: string;
  startDate?: string;
  note?: string;
}
