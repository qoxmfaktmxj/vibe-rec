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