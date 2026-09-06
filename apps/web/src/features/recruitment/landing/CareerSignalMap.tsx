"use client";

import { LazyMotion, MotionConfig, domAnimation } from "motion/react";
import * as m from "motion/react-m";

type SignalPosting = {
  id: number;
  title: string;
  location: string;
};

interface CareerSignalMapProps {
  jobPostings: SignalPosting[];
}

const nodePositions = [
  { left: "8%", top: "72%" },
  { left: "25%", top: "47%" },
  { left: "49%", top: "58%" },
  { left: "66%", top: "30%" },
  { left: "82%", top: "12%" },
] as const;

export function CareerSignalMap({ jobPostings }: CareerSignalMapProps) {
  const visiblePostings = jobPostings.slice(0, nodePositions.length);

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <div
          className="career-signal-map"
          role="img"
          aria-label="현재 모집 중인 공고를 하나의 지원 여정으로 연결한 지도"
        >
        <div className="career-signal-orbit career-signal-orbit-outer" aria-hidden="true" />
        <div className="career-signal-orbit career-signal-orbit-inner" aria-hidden="true" />

        <svg
          aria-hidden="true"
          className="career-signal-path"
          viewBox="0 0 720 520"
          preserveAspectRatio="none"
        >
          <path
            d="M42 430 C118 362 122 246 210 250 C301 255 292 354 386 325 C478 297 439 172 534 156 C606 144 622 80 685 54"
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.16"
            strokeWidth="18"
          />
          <m.path
            d="M42 430 C118 362 122 246 210 250 C301 255 292 354 386 325 C478 297 439 172 534 156 C606 144 622 80 685 54"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
          />
        </svg>

        <m.div
          className="career-signal-origin"
          aria-hidden="true"
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <span />
        </m.div>

        {visiblePostings.map((jobPosting, index) => (
          <m.div
            key={jobPosting.id}
            className={`career-signal-node career-signal-node-${index + 1}`}
            style={nodePositions[index]}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.5,
              delay: 0.5 + index * 0.12,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <span className="career-signal-dot" aria-hidden="true" />
            <span className="career-signal-label">
              <strong>{jobPosting.title}</strong>
              <small>{jobPosting.location}</small>
            </span>
          </m.div>
        ))}

        <div className="career-signal-caption" aria-hidden="true">
          <span>찾기</span>
          <span>지원</span>
          <span>확인</span>
        </div>
        </div>
      </MotionConfig>
    </LazyMotion>
  );
}
