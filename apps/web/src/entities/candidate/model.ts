export interface CandidateSession {
  candidateAccountId: number;
  email: string;
  name: string;
  phone: string;
  authenticatedAt: string;
  expiresAt: string;
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
