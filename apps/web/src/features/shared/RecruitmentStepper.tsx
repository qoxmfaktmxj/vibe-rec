export interface RecruitmentStep {
  label: string;
  description?: string;
  meta?: string;
}

interface RecruitmentStepperProps {
  steps: RecruitmentStep[];
  /** Index of the current step. Omit to render every step as upcoming (informational/preview mode). */
  currentIndex?: number;
  orientation?: "horizontal" | "vertical";
  className?: string;
}

type StepState = "done" | "current" | "upcoming";

function getStepState(index: number, currentIndex?: number): StepState {
  if (currentIndex === undefined) {
    return "upcoming";
  }

  if (index < currentIndex) {
    return "done";
  }

  if (index === currentIndex) {
    return "current";
  }

  return "upcoming";
}

function getStateLabel(state: StepState) {
  switch (state) {
    case "done":
      return "완료";
    case "current":
      return "진행 중";
    default:
      return "예정";
  }
}

function StepNode({ state, index }: { state: StepState; index: number }) {
  if (state === "done") {
    return (
      <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
        <svg
          viewBox="0 0 16 16"
          fill="none"
          className="h-3.5 w-3.5"
          aria-hidden="true"
        >
          <path
            d="M3.5 8.5L6.5 11.5L12.5 4.5"
            stroke="var(--primary-foreground)"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }

  if (state === "current") {
    return (
      <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-card ring-2 ring-brand">
        <span className="h-2 w-2 rounded-full bg-brand" aria-hidden="true" />
      </span>
    );
  }

  return (
    <span
      className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-outline-variant bg-card font-mono text-[11px] text-on-surface-variant"
      aria-hidden="true"
    >
      {index + 1}
    </span>
  );
}

export function RecruitmentStepper({
  steps,
  currentIndex,
  orientation = "horizontal",
  className = "",
}: RecruitmentStepperProps) {
  if (orientation === "vertical") {
    return (
      <ol className={`flex flex-col ${className}`}>
        {steps.map((step, index) => {
          const state = getStepState(index, currentIndex);
          const isLast = index === steps.length - 1;

          return (
            <li
              key={`${index}-${step.label}`}
              className="relative flex gap-4 pb-8 last:pb-0"
            >
              {!isLast ? (
                <span
                  aria-hidden="true"
                  className={`absolute left-4 top-8 h-[calc(100%-2rem)] w-px -translate-x-1/2 ${
                    state === "done" ? "bg-primary" : "bg-outline-variant"
                  }`}
                />
              ) : null}

              <StepNode state={state} index={index} />

              <div className="min-w-0 flex-1 pb-1 pt-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <p className="font-headline text-base font-semibold tracking-[-0.01em] text-on-surface">
                    {step.label}
                    <span className="sr-only"> — {getStateLabel(state)}</span>
                  </p>
                  {step.meta ? (
                    <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-on-surface-variant">
                      {step.meta}
                    </p>
                  ) : null}
                </div>
                {step.description ? (
                  <p className="mt-1.5 text-sm leading-6 text-on-surface-variant">
                    {step.description}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <ol className={`flex w-full items-start ${className}`}>
      {steps.map((step, index) => {
        const state = getStepState(index, currentIndex);
        const isLast = index === steps.length - 1;

        return (
          <li
            key={`${index}-${step.label}`}
            className={`flex items-start ${isLast ? "flex-none" : "flex-1"}`}
          >
            <div className="flex flex-col items-center">
              <StepNode state={state} index={index} />
              <div className="mt-2 max-w-[7rem] text-center sm:max-w-[9rem]">
                <p className="text-xs font-semibold text-on-surface sm:text-sm">
                  {step.label}
                  <span className="sr-only"> — {getStateLabel(state)}</span>
                </p>
                {step.description ? (
                  <p className="mt-0.5 hidden text-[11px] leading-5 text-on-surface-variant sm:block">
                    {step.description}
                  </p>
                ) : null}
                {step.meta ? (
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-on-surface-variant">
                    {step.meta}
                  </p>
                ) : null}
              </div>
            </div>

            {!isLast ? (
              <span
                aria-hidden="true"
                className={`mt-4 h-px flex-1 ${
                  state === "done" ? "bg-primary" : "bg-outline-variant"
                }`}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
