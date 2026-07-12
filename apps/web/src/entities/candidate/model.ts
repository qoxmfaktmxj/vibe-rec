export interface CandidateSession {
  candidateAccountId: number;
  email: string;
  name: string;
  phone: string;
  authenticatedAt: string;
  expiresAt: string;
  emailVerified: boolean;
}

export interface CandidateLoginPayload {
  email: string;
  password: string;
}

export interface CandidateSignupPayload extends CandidateLoginPayload {
  name: string;
  phone: string;
}

export interface CandidateLoginResponse extends CandidateSession {
  sessionToken: string;
}

export interface CandidateAccountSession {
  id: number;
  current: boolean;
  userAgent: string;
  lastSeenAt: string;
  createdAt: string;
  expiresAt: string;
}

export interface CandidatePasswordChangePayload {
  currentPassword: string;
  newPassword: string;
}

export interface CandidateSessionRevocationResponse {
  currentSessionRevoked: boolean;
}
