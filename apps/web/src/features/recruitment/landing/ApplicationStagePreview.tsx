"use client";

import { LazyMotion, MotionConfig, domAnimation, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";

const stages = ["지원서 제출", "서류 검토", "면접", "최종 결과"] as const;
const currentStageIndex = 2;

export function ApplicationStagePreview() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <figure
          className="application-stage-preview"
          aria-labelledby="application-stage-preview-caption"
        >
          <m.span
            aria-hidden="true"
            className="application-stage-preview-number font-headline"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 0.12, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            03
          </m.span>

          <figcaption
            id="application-stage-preview-caption"
            className="application-stage-preview-caption"
          >
            지원 흐름 화면 예시
          </figcaption>

          <div className="application-stage-rail">
            <span className="application-stage-line" aria-hidden="true">
              <m.span
                initial={shouldReduceMotion ? false : { scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1.1, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              />
            </span>

            <ol className="application-stage-steps" aria-label="예시 전형 단계">
              {stages.map((stage, index) => {
                const state =
                  index < currentStageIndex
                    ? "done"
                    : index === currentStageIndex
                      ? "current"
                      : "upcoming";

                return (
                  <m.li
                    key={stage}
                    className="application-stage-step"
                    data-state={state}
                    aria-current={state === "current" ? "step" : undefined}
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.45,
                      delay: 0.35 + index * 0.12,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  >
                    <span className="application-stage-node font-mono" aria-hidden="true">
                      0{index + 1}
                    </span>
                    <span className="application-stage-label">{stage}</span>
                    <span className="sr-only">
                      {state === "done" ? "완료" : state === "current" ? "현재 단계 예시" : "예정"}
                    </span>
                  </m.li>
                );
              })}
            </ol>
          </div>

          <m.div
            className="application-stage-callout"
            initial={shouldReduceMotion ? false : { opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, delay: 0.85, ease: [0.16, 1, 0.3, 1] }}
          >
            <strong>현재 단계 예시</strong>
            <span>로그인 후 일정을 확인하세요</span>
          </m.div>
        </figure>
      </MotionConfig>
    </LazyMotion>
  );
}
