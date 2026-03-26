"use client";

const inputClassName =
  "w-full rounded-lg border-none bg-surface-container-highest px-4 py-3 text-sm text-on-surface outline-none transition-all duration-200 placeholder:text-outline focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20";

interface Step2Data {
  introduction: string;
  coreStrength: string;
  motivationFit: string;
  careerYears: number | null;
}

interface WizardStep2Props {
  data: Step2Data;
  onChange: (data: Step2Data) => void;
  disabled: boolean;
}

export function WizardStep2Introduction({ data, onChange, disabled }: WizardStep2Props) {
  return (
    <div className="space-y-6">
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant">
          자기소개 <span className="text-destructive">*</span>
        </label>
        <p className="mb-2 text-[11px] text-outline">관련 경험과 지원 동기를 간략히 소개해주세요.</p>
        <textarea
          placeholder="관련 경험과 지원 동기를 간략히 소개해주세요. (최소 20자)"
          rows={5}
          disabled={disabled}
          className={`resize-y ${inputClassName}`}
          value={data.introduction}
          onChange={(e) => onChange({ ...data, introduction: e.target.value })}
        />
        <p className={`mt-1 text-[11px] ${data.introduction.length >= 20 ? "text-outline" : "text-destructive"}`}>
          {data.introduction.length}/20자 이상
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant">
          핵심 역량 <span className="text-destructive">*</span>
        </label>
        <p className="mb-2 text-[11px] text-outline">이 직무에서 발휘할 수 있는 가장 강점을 설명해주세요.</p>
        <textarea
          placeholder="이 직무에서 발휘할 수 있는 가장 강점을 설명해주세요. (최소 10자)"
          rows={4}
          disabled={disabled}
          className={`resize-y ${inputClassName}`}
          value={data.coreStrength}
          onChange={(e) => onChange({ ...data, coreStrength: e.target.value })}
        />
        <p className={`mt-1 text-[11px] ${data.coreStrength.length >= 10 ? "text-outline" : "text-destructive"}`}>
          {data.coreStrength.length}/10자 이상
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant">
          모티베이션핏
        </label>
        <p className="mb-2 text-[11px] text-outline">이 포지션에 지원하게 된 동기와 이 회사에서 이루고 싶은 목표를 알려주세요.</p>
        <textarea
          placeholder="지원 동기와 목표를 자유롭게 작성해주세요."
          rows={4}
          disabled={disabled}
          className={`resize-y ${inputClassName}`}
          value={data.motivationFit}
          onChange={(e) => onChange({ ...data, motivationFit: e.target.value })}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant">경력 연수</label>
        <input
          type="number"
          min={0}
          max={50}
          placeholder="경력 연수 (숫자)"
          disabled={disabled}
          className={`w-32 ${inputClassName}`}
          value={data.careerYears ?? ""}
          onChange={(e) => onChange({ ...data, careerYears: e.target.value ? Number(e.target.value) : null })}
        />
      </div>
    </div>
  );
}
