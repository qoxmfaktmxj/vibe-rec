export interface AttachmentSummary {
  id: number;
  applicationId: number;
  originalFilename: string;
  contentType: string;
  fileSizeBytes: number;
  sha256: string;
  validationStatus: "LEGACY_UNVERIFIED" | "SIGNATURE_VALIDATED";
  uploadedAt: string;
}
