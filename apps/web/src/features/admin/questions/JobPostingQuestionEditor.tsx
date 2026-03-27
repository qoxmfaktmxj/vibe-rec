"use client";

import { useState, useTransition } from "react";

const inputClassName =
  "w-full rounded-lg border-none bg-surface-container-highest px-4 py-3 text-sm text-on-surface outline-none transition-all duration-200 placeholder:text-outline focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20";

interface QuestionItem {
  questionText: string;
  questionType: "TEXT" | "CHOICE" | "SCALE";
  choices: string[];
  required: boolean;
  sortOrder: number;
}

interface JobPostingQuestionEditorProps {
  jobPostingId: number;
  initialQuestions: QuestionItem[];
}

export function JobPostingQuestionEditor({
  jobPostingId,
  initialQuestions,
}: JobPostingQuestionEditorProps) {
  const [isPending, startTransition] = useTransition();
  const [questions, setQuestions] = useState<QuestionItem[]>(initialQuestions);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  function addQuestion() {
    setQuestions([
      ...questions,
      {
        questionText: "",
        questionType: "TEXT",
        choices: [],
        required: true,
        sortOrder: questions.length,
      },
    ]);
  }

  function updateQuestion(index: number, patch: Partial<QuestionItem>) {
    setQuestions(questions.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  }

  function removeQuestion(index: number) {
    setQuestions(
      questions
        .filter((_, i) => i !== index)
        .map((q, i) => ({ ...q, sortOrder: i })),
    );
  }

  function addChoice(questionIndex: number) {
    const q = questions[questionIndex];
    updateQuestion(questionIndex, { choices: [...q.choices, ""] });
  }

  function updateChoice(questionIndex: number, choiceIndex: number, value: string) {
    const q = questions[questionIndex];
    updateQuestion(questionIndex, {
      choices: q.choices.map((c, i) => (i === choiceIndex ? value : c)),
    });
  }

  function removeChoice(questionIndex: number, choiceIndex: number) {
    const q = questions[questionIndex];
    updateQuestion(questionIndex, {
      choices: q.choices.filter((_, i) => i !== choiceIndex),
    });
  }

  function handleSave() {
    startTransition(async () => {
      setError(null);
      setSaveStatus("저장 중...");
      try {
        const payload = questions.map((q) => ({
          questionText: q.questionText.trim(),
          questionType: q.questionType,
          choices: q.questionType === "CHOICE" ? JSON.stringify(q.choices) : null,
          required: q.required,
          sortOrder: q.sortOrder,
        }));

        const response = await fetch(`/api/admin/job-postings/${jobPostingId}/questions`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as
            | { message?: string; error?: string }
            | null;
          throw new Error(body?.message ?? body?.error ?? "Failed to save questions.");
        }
        setSaveStatus("Questions saved.");
        setTimeout(() => setSaveStatus(null), 3000);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save questions.");
        setSaveStatus(null);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-headline text-lg font-medium text-on-surface">지원 문항</h2>
        <button
          type="button"
          onClick={addQuestion}
          className="rounded-lg bg-surface-container-high px-4 py-2 text-xs font-semibold text-on-surface transition hover:bg-surface-container-highest"
        >
          문항 추가
        </button>
      </div>

      {questions.length === 0 && (
        <p className="py-8 text-center text-sm text-on-surface-variant">
          등록된 문항이 없습니다. 지원서 양식에 포함할 문항을 추가하세요.
        </p>
      )}

      {questions.map((q, qIdx) => (
        <div key={qIdx} className="space-y-4 rounded-sm border border-outline-variant bg-card p-5">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-medium text-outline">문항 {qIdx + 1}</span>
            <button
              type="button"
              onClick={() => removeQuestion(qIdx)}
              className="text-xs text-outline transition hover:text-destructive"
            >
              삭제
            </button>
          </div>

          <input
            placeholder="질문 내용을 입력하세요"
            disabled={isPending}
            className={inputClassName}
            value={q.questionText}
            onChange={(e) => updateQuestion(qIdx, { questionText: e.target.value })}
          />

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs text-on-surface-variant">유형:</label>
              <select
                disabled={isPending}
                className={`w-32 ${inputClassName}`}
                value={q.questionType}
                onChange={(e) =>
                  updateQuestion(qIdx, {
                    questionType: e.target.value as "TEXT" | "CHOICE" | "SCALE",
                    choices: e.target.value === "CHOICE" ? q.choices : [],
                  })
                }
              >
                <option value="TEXT">텍스트</option>
                <option value="CHOICE">선택형</option>
                <option value="SCALE">척도 (1-5)</option>
              </select>
            </div>

            <label className="flex items-center gap-2 text-xs text-on-surface-variant">
              <input
                type="checkbox"
                checked={q.required}
                onChange={(e) => updateQuestion(qIdx, { required: e.target.checked })}
                className="h-4 w-4"
              />
              필수
            </label>
          </div>

          {q.questionType === "CHOICE" && (
            <div className="space-y-2 pl-4">
              <span className="text-xs text-on-surface-variant">선택지:</span>
              {q.choices.map((choice, cIdx) => (
                <div key={cIdx} className="flex items-center gap-2">
                  <input
                    placeholder={`선택지 ${cIdx + 1}`}
                    disabled={isPending}
                    className={`flex-1 ${inputClassName}`}
                    value={choice}
                    onChange={(e) => updateChoice(qIdx, cIdx, e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeChoice(qIdx, cIdx)}
                    className="text-xs text-outline hover:text-destructive"
                  >
                    삭제
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addChoice(qIdx)}
                className="text-xs text-primary hover:underline"
              >
                선택지 추가
              </button>
            </div>
          )}
        </div>
      ))}

      {error && (
        <div className="rounded-lg bg-error-container px-4 py-3 text-sm text-destructive">{error}</div>
      )}
      {saveStatus && !error && (
        <div className="rounded-lg bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">{saveStatus}</div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          disabled={isPending}
          onClick={handleSave}
          className="rounded-sm bg-primary px-6 py-3 text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
        >
          문항 저장
        </button>
      </div>
    </div>
  );
}
