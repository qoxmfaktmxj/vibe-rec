import type {
  JobPostingStatus,
  RecruitmentCategory,
  RecruitmentMode,
} from "@/entities/recruitment/model";

export type AdminRole = "ADMIN" | "SUPER_ADMIN";

export interface AdminSession {
  adminAccountId: number;
  username: string;
  displayName: string;
  role: AdminRole;
  authenticatedAt: string;
  expiresAt: string;
  permissions: string[];
}

export interface AdminLoginPayload {
  username: string;
  password: string;
}

export interface AdminSignupPayload {
  username: string;
  displayName: string;
  password: string;
}

export interface AdminLoginResponse extends AdminSession {
  sessionToken: string;
}

export interface AdminJobPostingPayload {
  legacyAnnoId: number | null;
  publicKey: string;
  title: string;
  headline: string;
  description: string;
  employmentType: string;
  recruitmentCategory: RecruitmentCategory;
  recruitmentMode: RecruitmentMode;
  location: string;
  status: JobPostingStatus;
  published: boolean;
  opensAt: string;
  closesAt: string | null;
}

export type UpdateAdminJobPostingPayload = AdminJobPostingPayload;

export interface AdminJobPosting extends AdminJobPostingPayload {
  id: number;
}
