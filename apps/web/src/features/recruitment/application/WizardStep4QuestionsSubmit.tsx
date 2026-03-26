"use client";

import type { ApplicationAnswer, JobPostingQuestion } from "@/entities/recruitment/model";

const inputClassName =
  "w-full rounded-lg border-none bg-surface-container-highest px-4 py-3 text-sm text-on-surface outline-none transition-all duration-200 placeholder:text-outline focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20";

// Fixed trend questions (code constants)
export const TREND_QUESTIONS = [
  {
    key: "motivation",
    label: "모티베이션핏",
    question: "이 포지션에 지원하게 된 동기와 이 회사에서 이루고 싶은 목표를 알려주세요.",
  },
  {
    key: "situation",
    label: "상황판단",
    question: "예상치 못한 문제가 발생했을 때, 당신의 대처 방식을 구체적인 경험을 들어 설명해주세요.",
  },
  {
    key: "workStyle",
    label: "업무스타일",
    question: "팀에서 협업할 때 본인의 역할과 강점은 무엇인가요?",
  },
  {
    key: "growth",
    label: "성장지향",
    question: "최근 1년간 업무 역량 향상을 위해 어떤 노력을 했는지 알려주세요.",
  },
];

interface Step4Data {
  trendAnswers: Record<string, string>;
  customAnswers: ApplicationAnswer[];
}

interface WizardStep4Props {
  data: Step4Data;
  onChange: (data: Step4Data) => void;
  customQuestions: JobPostingQuestion[];
  disabled: boolean;
}

export function WizardStep4QuestionsSubmit({ data, onChange, customQuestions, disabled }: WizardStep4Props) {
  function updateTrendAnswer(key: string, value: string) {
    onChange({ ...data, trendAnswers: { ...data.trendAnswers, [key]: value } });
  }

  function updateCustomAnswer(questionId: number, patch: Partial<ApplicationAnswer>) {
    const existing = data.customAnswers.find((a) => a.questionId === questionId);
    if (existing) {
      onChange({
        ...data,
        customAnswers: data.customAnswers.map((a) =>
          a.questionId === questionId ? { ...a, ...patch } : a,
        ),
      });
    } else {
      onChange({
        ...data,
        customAnswers: [
          ...data.customAnswers,
          { questionId, answerText: null, answerChoice: null, answerScale: null, ...patch },
        ],
      });
    }
  }

  function parseChoices(choicesStr: string | null): string[] {
    if (!choicesStr) return [];
    try {
      const parsed = JSON.parse(choicesStr);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return (
    <div className="space-y-8">
      {/* Trend Questions */}
      <div className="space-y-6">
        <h3 className="text-sm font-semibold text-on-surface-variant">트렌드 질문</h3>
        <p className="text-[11px] text-outline">
          최신 채용 트렌드에 맞춘 질문입니다. 자유롭게 답변해주세요.
        </p>
        {TREND_QUESTIONS.map((tq) => (
          <div key={tq.key}>
            <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant">{tq.label}</label>
            <p className="mb-2 text-[11px] text-outline">{tq.question}</p>
            <textarea
              rows={3}
              disabled={disabled}
              className={`resize-y ${inputClassName}`}
              placeholder="답변을 작성해주세요."
              value={data.trendAnswers[tq.key] ?? ""}
              onChange={(e) => updateTrendAnswer(tq.key, e.target.value)}
            />
          </div>
        ))}
      </div>

      {/* Custom Questions */}
      {customQuestions.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-sm font-semibold text-on-surface-variant">추가 질문</h3>
          <p className="text-[11px] text-outline">
            이 공고에서 요구하는 추가 질문입니다.
          </p>
          {customQuestions.map((q) => {
            const answer = data.customAnswers.find((a) => a.questionId === q.id);
            return (
              <div key={q.id}>
                <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant">
                  {q.questionText} {q.required && <span className="text-destructive">*</span>}
                </label>

                {q.questionType === "TEXT" && (
                  <textarea
                    rows={3}
                    disabled={disabled}
                    className={`resize-y ${inputClassName}`}
                    placeholder="답변을 작성해주세요."
                    value={answer?.answerText ?? ""}
                    onChange={(e) => updateCustomAnswer(q.id, { answerText: e.target.value })}
                  />
                )}

                {q.questionType === "CHOICE" && (
                  <div className="space-y-2">
                    {parseChoices(q.choices).map((choice) => (
                      <label key={choice} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`question-${q.id}`}
                          disabled={disabled}
                          checked={answer?.answerChoice === choice}
                          onChange={() => updateCustomAnswer(q.id, { answerChoice: choice })}
                          className="h-4 w-4 text-primary"
                        />
                        <span className="text-sm text-on-surface">{choice}</span>
                      </label>
                    ))}
                  </div>
                )}

                {q.questionType === "SCALE" && (
                  <div className="flex items-center gap-3">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        disabled={disabled}
                        onClick={() => updateCustomAnswer(q.id, { answerScale: n })}
                        className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition ${
                          answer?.answerScale === n
                            ? "bg-primary text-primary-foreground"
                            : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                    <span className="text-[11px] text-outline">1 = 매우 낮음, 5 = 매우 높음</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
