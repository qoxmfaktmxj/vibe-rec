import type { AttachmentSummary } from "@/entities/recruitment/attachment-model";
import { formatDateTime } from "@/shared/lib/recruitment";

interface ApplicantAttachmentListProps {
  attachments: AttachmentSummary[];
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ApplicantAttachmentList({
  attachments,
}: ApplicantAttachmentListProps) {
  if (attachments.length === 0) {
    return (
      <p className="text-sm text-on-surface-variant">
        첨부된 파일이 없습니다.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {attachments.map((attachment) => (
        <li
          key={attachment.id}
          className="flex items-center justify-between rounded-lg bg-surface-container-low px-5 py-3"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <svg
              className="h-5 w-5 shrink-0 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
              />
            </svg>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-on-surface">
                {attachment.originalFilename}
              </p>
              <p className="text-xs text-outline">
                {formatFileSize(attachment.fileSizeBytes)} &bull;{" "}
                {formatDateTime(attachment.uploadedAt)}
              </p>
            </div>
          </div>
          <a
            href={`/api/admin/attachments/${attachment.id}/download`}
            className="ml-4 shrink-0 rounded-lg bg-surface-container-high px-4 py-2 text-xs font-semibold text-on-surface transition hover:bg-surface-container-highest"
          >
            다운로드
          </a>
        </li>
      ))}
    </ul>
  );
}
