"use client";

const STEPS = [
  { number: 1, label: "인적사항" },
  { number: 2, label: "자기소개/역량" },
  { number: 3, label: "학력/경력/스킬" },
  { number: 4, label: "질문/제출" },
];

interface WizardStepIndicatorProps {
  currentStep: number;
}

export function WizardStepIndicator({ currentStep }: WizardStepIndicatorProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      {STEPS.map((step, idx) => (
        <div key={step.number} className="flex flex-1 items-center gap-2">
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                step.number < currentStep
                  ? "bg-primary text-primary-foreground"
                  : step.number === currentStep
                    ? "bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2"
                    : "bg-surface-container-high text-on-surface-variant"
              }`}
            >
              {step.number < currentStep ? "✓" : step.number}
            </div>
            <span className={`text-center text-[10px] font-medium leading-tight ${
              step.number <= currentStep ? "text-on-surface" : "text-outline"
            }`}>
              {step.label}
            </span>
          </div>
          {idx < STEPS.length - 1 && (
            <div className={`mb-5 h-0.5 flex-1 rounded transition-colors ${
              step.number < currentStep ? "bg-primary" : "bg-surface-container-high"
            }`} />
          )}
        </div>
      ))}
    </div>
  );
}
