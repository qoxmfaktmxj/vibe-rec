export type AdminRole = "SUPER_ADMIN";

export interface AdminSession {
  adminAccountId: number;
  username: string;
  displayName: string;
  role: AdminRole;
  authenticatedAt: string;
  expiresAt: string;
}

export interface AdminLoginPayload {
  username: string;
  password: string;
}

export interface AdminLoginResponse extends AdminSession {
  sessionToken: string;
}
