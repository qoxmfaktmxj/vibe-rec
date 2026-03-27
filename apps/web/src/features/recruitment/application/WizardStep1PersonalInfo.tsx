"use client";

interface WizardStep1Props {
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
}

const readOnlyInputClassName =
  "w-full rounded-lg border-none bg-surface-container-highest px-4 py-3 text-sm text-on-surface outline-none cursor-not-allowed opacity-70";

export function WizardStep1PersonalInfo({ applicantName, applicantEmail, applicantPhone }: WizardStep1Props) {
  return (
    <div className="space-y-6">
      <div>
        <p className="mb-1 text-xs font-medium text-on-surface-variant">
          로그인된 지원자 계정 정보를 사용합니다. 이름, 이메일, 휴대전화는 계정 정보와 동기화되어 임의로 변경할 수 없습니다.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant">지원자 이름</label>
          <input value={applicantName} readOnly className={readOnlyInputClassName} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant">이메일</label>
          <input value={applicantEmail} readOnly className={readOnlyInputClassName} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant">휴대전화</label>
          <input value={applicantPhone} readOnly className={readOnlyInputClassName} />
        </div>
      </div>
    </div>
  );
}
