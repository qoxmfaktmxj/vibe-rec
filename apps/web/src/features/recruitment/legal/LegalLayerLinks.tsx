"use client";

import { useMemo, useState } from "react";

type LegalType = "privacy" | "terms" | null;

const legalContent = {
  privacy: {
    title: "개인정보처리방침",
    sections: [
      {
        heading: "1. 처리 목적",
        body: "HireFlow는 채용 공고 조회, 지원서 접수, 문의 응대를 위해 필요한 최소한의 개인정보를 처리합니다.",
      },
      {
        heading: "2. 처리 항목",
        body: "지원자 정보(성명, 연락처, 이메일, 학력 및 경력 정보, 서비스 이용 과정에서 생성되는 접속 로그)를 처리할 수 있습니다.",
      },
      {
        heading: "3. 보유 및 이용 기간",
        body: "채용 절차 종료 후 관련 법령 또는 내부 기준에 따라 필요한 기간 동안 보관하며, 보관 기간 경과 후 지체 없이 파기합니다.",
      },
      {
        heading: "4. 제3자 제공 및 처리위탁",
        body: "원칙적으로 정보주체 동의 또는 법령 근거 없이 제3자에게 제공하지 않으며, 위탁이 필요한 경우 수탁자와 위탁 업무를 별도로 공개합니다.",
      },
      {
        heading: "5. 정보주체의 권리",
        body: "정보주체는 열람, 정정, 삭제, 처리정지를 요청할 수 있으며 문의 채널을 통해 접수할 수 있습니다.",
      },
      {
        heading: "6. 안전성 확보 조치",
        body: "접근권한 관리, 암호화, 로그 보관 등 기술적·관리적 보호조치를 적용합니다.",
      },
      {
        heading: "7. 문의",
        body: "개인정보 관련 문의는 문의 링크를 통해 접수해 주세요.",
      },
    ],
  },
  terms: {
    title: "이용약관",
    sections: [
      {
        heading: "1. 목적",
        body: "본 약관은 HireFlow 서비스 이용과 관련한 회사와 이용자의 권리, 의무 및 책임사항을 규정합니다.",
      },
      {
        heading: "2. 서비스 제공",
        body: "회사는 채용 공고 열람, 지원서 작성 및 제출, 관리자 커뮤니케이션 기능을 제공합니다.",
      },
      {
        heading: "3. 회원 및 비회원의 의무",
        body: "이용자는 관련 법령, 본 약관, 서비스 안내사항을 준수해야 하며 타인의 권리를 침해하는 행위를 해서는 안 됩니다.",
      },
      {
        heading: "4. 게시물 및 자료",
        body: "이용자가 등록한 자료에 대한 권리와 책임은 이용자에게 있으며, 회사는 법령과 정책에 따라 필요한 조치를 할 수 있습니다.",
      },
      {
        heading: "5. 면책",
        body: "회사는 천재지변, 불가항력, 이용자 귀책 등으로 인한 서비스 이용 장애에 대해 관련 법령 범위 내에서 책임을 제한할 수 있습니다.",
      },
      {
        heading: "6. 약관 변경",
        body: "약관을 변경하는 경우 시행일과 변경 사유를 사전에 고지합니다.",
      },
      {
        heading: "7. 준거법 및 관할",
        body: "본 약관은 대한민국 법령을 준거법으로 하며 분쟁은 관련 법령에 따른 관할 법원에서 해결합니다.",
      },
    ],
  },
} as const;

export function LegalLayerLinks() {
  const [activeModal, setActiveModal] = useState<LegalType>(null);

  const content = useMemo(() => {
    if (!activeModal) {
      return null;
    }
    return legalContent[activeModal];
  }, [activeModal]);

  function closeModal() {
    setActiveModal(null);
  }

  return (
    <>
      <button
        type="button"
        className="transition-colors hover:text-primary"
        onClick={() => setActiveModal("privacy")}
      >
        개인정보처리방침
      </button>
      <button
        type="button"
        className="transition-colors hover:text-primary"
        onClick={() => setActiveModal("terms")}
      >
        이용약관
      </button>
      {content ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="legal-modal-title"
          onClick={closeModal}
        >
          <div
            className="max-h-[80vh] w-full max-w-3xl overflow-y-auto rounded-sm border border-outline-variant bg-background p-6 shadow-2xl md:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between gap-4 border-b border-outline-variant pb-4">
              <h3
                id="legal-modal-title"
                className="font-headline text-2xl font-medium tracking-[-0.03em] text-on-surface"
              >
                {content.title}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-sm border border-outline-variant px-3 py-1.5 text-xs font-medium text-on-surface transition-colors hover:border-primary hover:text-primary"
              >
                닫기
              </button>
            </div>
            <div className="space-y-5">
              {content.sections.map((section) => (
                <section key={section.heading} className="space-y-2">
                  <h4 className="font-medium text-on-surface">{section.heading}</h4>
                  <p className="text-sm leading-7 text-on-surface-variant">
                    {section.body}
                  </p>
                </section>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
