const fs = require("fs");
const path = require("path");
const { chromium } = require(path.join(
  __dirname,
  "..",
  "apps",
  "web",
  "node_modules",
  "playwright",
));

const baseURL = process.env.DEMO_BASE_URL || "http://127.0.0.1:3181";
const postingId = Number(process.env.DEMO_POSTING_ID || "1005");
const adminUsername = process.env.DEMO_ADMIN_USERNAME || "ops.lead";
const adminPassword = process.env.DEMO_ADMIN_PASSWORD || "demo1234!";
const candidatePassword = process.env.DEMO_CANDIDATE_PASSWORD || "password123";
const candidateName =
  process.env.DEMO_CANDIDATE_NAME ||
  `Executive Demo ${Date.now().toString().slice(-4)}`;
const candidateEmail =
  process.env.DEMO_CANDIDATE_EMAIL ||
  `executive.record.${Date.now()}@example.com`;
const candidatePhone =
  process.env.DEMO_CANDIDATE_PHONE ||
  `010-${String(Date.now()).slice(-8, -4)}-${String(Date.now()).slice(-4)}`;

const viewport = { width: 1280, height: 720 };
const outputDir = path.join(__dirname, "..", "output", "demo", "video");
const outputLabel =
  process.env.DEMO_OUTPUT_LABEL || "hireflow-executive-demo-90s-typed";
const typeDelay = Number(process.env.DEMO_TYPE_DELAY || "90");

async function ensureDir() {
  await fs.promises.mkdir(outputDir, { recursive: true });
}

async function pause(page, ms) {
  await page.waitForTimeout(ms);
}

async function waitForStable(page, urlPattern) {
  if (urlPattern) {
    await page.waitForURL(urlPattern);
  }
  await page.waitForLoadState("networkidle");
}

async function showCard(page, title, body, ms) {
  await page.setContent(`
    <html lang="ko">
      <head>
        <meta charset="utf-8" />
        <style>
          body {
            margin: 0;
            width: 100vw;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background:
              radial-gradient(circle at top left, rgba(100, 26, 65, 0.16), transparent 36%),
              linear-gradient(135deg, #faf7f2 0%, #f4ede7 100%);
            color: #1f2937;
            font-family: "Segoe UI", sans-serif;
          }
          .card {
            width: min(880px, calc(100vw - 120px));
            padding: 48px 56px;
            border: 1px solid rgba(31, 41, 55, 0.12);
            background: rgba(255, 255, 255, 0.9);
            box-shadow: 0 24px 60px -32px rgba(31, 41, 55, 0.28);
          }
          .eyebrow {
            margin: 0 0 16px;
            font-size: 14px;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: #641a41;
          }
          h1 {
            margin: 0;
            font-size: 42px;
            line-height: 1.15;
            letter-spacing: -0.04em;
          }
          p {
            margin: 20px 0 0;
            font-size: 20px;
            line-height: 1.7;
            color: rgba(31, 41, 55, 0.78);
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="eyebrow">HireFlow Executive Demo</div>
          <h1>${title}</h1>
          <p>${body}</p>
        </div>
      </body>
    </html>
  `);
  await pause(page, ms);
}

async function setSubtitle(page, text) {
  await page.evaluate((caption) => {
    const styleId = "__demo_subtitle_style__";
    const nodeId = "__demo_subtitle__";

    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        #${nodeId} {
          position: fixed;
          left: 50%;
          bottom: 28px;
          transform: translateX(-50%);
          z-index: 2147483647;
          max-width: min(1040px, calc(100vw - 96px));
          padding: 14px 22px;
          border-radius: 16px;
          background: rgba(17, 24, 39, 0.84);
          color: #ffffff;
          font-family: "Segoe UI", sans-serif;
          font-size: 24px;
          line-height: 1.45;
          font-weight: 600;
          letter-spacing: -0.02em;
          text-align: center;
          box-shadow: 0 18px 40px -18px rgba(0, 0, 0, 0.42);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
      `;
      document.head.appendChild(style);
    }

    let node = document.getElementById(nodeId);
    if (!node) {
      node = document.createElement("div");
      node.id = nodeId;
      document.body.appendChild(node);
    }

    node.textContent = caption;
  }, text);
}

async function clearAndType(locator, value, delay = typeDelay) {
  await locator.click();
  await locator.fill("");
  await locator.type(value, { delay });
}

async function enrichProfileForImport(page) {
  const result = await page.evaluate(async () => {
    const response = await fetch("/api/candidate/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        introductionTemplate:
          "채용 운영 제품을 더 빠르고 명확하게 만드는 프론트엔드 엔지니어입니다.",
        coreStrengthTemplate:
          "복잡한 흐름을 단순한 UI와 명확한 구조로 정리하는 데 강합니다.",
        careerYears: 3,
        educations: [
          {
            institution: "새빛대학교",
            degree: "BACHELOR",
            fieldOfStudy: "컴퓨터공학",
            startDate: "2018-03-01",
            endDate: "2022-02-28",
            description: "",
            sortOrder: 0,
          },
        ],
        experiences: [
          {
            company: "스튜디오 플로우",
            position: "Frontend Engineer",
            startDate: "2022-03-01",
            endDate: null,
            description: "지원자와 운영자 화면을 함께 개선했습니다.",
            sortOrder: 0,
          },
        ],
        skills: [
          {
            skillName: "React",
            proficiency: "ADVANCED",
            years: 3,
            sortOrder: 0,
          },
        ],
        certifications: [],
        languages: [],
      }),
    });

    return {
      ok: response.ok,
      status: response.status,
      text: await response.text(),
    };
  });

  if (!result.ok) {
    throw new Error(
      `Profile enrichment failed with status ${result.status}: ${result.text}`,
    );
  }
}

async function fillMany(locator, values) {
  for (let index = 0; index < values.length; index += 1) {
    await clearAndType(locator.nth(index), values[index]);
    await pause(locator.page(), 180);
  }
}

async function main() {
  await ensureDir();

  const browser = await chromium.launch({
    headless: true,
    channel: "msedge",
  });

  const context = await browser.newContext({
    viewport,
    recordVideo: {
      dir: outputDir,
      size: viewport,
    },
  });
  const page = await context.newPage();
  const video = page.video();

  try {
    await showCard(
      page,
      "HireFlow Executive Demo",
      "지원자 작성 흐름과 관리자 운영 화면을 조금 더 천천히, 실제 입력이 보이게 보여주는 90초 버전입니다.",
      5200,
    );

    await page.goto(`${baseURL}/job-postings`, { waitUntil: "networkidle" });
    await setSubtitle(
      page,
      "공고 탐색에서 시작해, 지원자 프로필과 지원서 작성 흐름을 자연스럽게 이어갑니다.",
    );
    await pause(page, 5200);

    await page.goto(
      `${baseURL}/auth/login?mode=signup&next=${encodeURIComponent(
        `/job-postings/${postingId}/apply`,
      )}`,
    );
    await waitForStable(page);
    await setSubtitle(
      page,
      "지원자는 공개 채용 공고에서 바로 계정을 만들고 지원 흐름으로 들어갑니다.",
    );
    await pause(page, 2400);
    await clearAndType(page.locator("#candidate-name"), candidateName);
    await clearAndType(page.locator("#candidate-email"), candidateEmail);
    await clearAndType(page.locator("#candidate-phone"), candidatePhone);
    await clearAndType(page.locator("#candidate-password"), candidatePassword);
    await clearAndType(
      page.locator("#candidate-confirm-password"),
      candidatePassword,
    );
    await pause(page, 1800);
    await page.locator("form").getByRole("button", { name: "가입하기" }).click();
    await waitForStable(page, new RegExp(`/job-postings/${postingId}/apply$`));
    await pause(page, 1800);

    await page.goto(`${baseURL}/profile`);
    await waitForStable(page);
    await setSubtitle(
      page,
      "프로필은 한 번 저장해 두고 이후 여러 공고 지원에 반복 활용합니다.",
    );
    await pause(page, 2600);
    const profileBoxes = page.locator("textarea");
    await clearAndType(
      profileBoxes.nth(0),
      "채용 운영 제품을 더 빠르고 명확하게 만드는 프론트엔드 엔지니어입니다.",
    );
    await clearAndType(
      profileBoxes.nth(1),
      "복잡한 흐름을 단순한 UI와 명확한 구조로 정리하는 데 강합니다.",
    );
    await clearAndType(page.locator('input[type="number"]').first(), "3");
    await pause(page, 1800);
    await page.getByRole("button", { name: "프로필 저장" }).click();
    await page.getByText("저장 완료!").waitFor();
    await pause(page, 2400);
    await enrichProfileForImport(page);

    await page.goto(`${baseURL}/job-postings/${postingId}`);
    await waitForStable(page);
    await setSubtitle(
      page,
      "공고 상세에서 채용 단계와 현재 지원 상태를 함께 확인하고 바로 이어서 지원합니다.",
    );
    await pause(page, 4200);
    await page.getByRole("link", { name: "지원하기" }).click();
    await waitForStable(page, new RegExp(`/job-postings/${postingId}/apply$`));
    await pause(page, 1600);
    await page.getByRole("button", { name: "다음" }).click();
    await pause(page, 1200);

    const basicBoxes = page.getByRole("textbox");
    await clearAndType(
      basicBoxes.nth(0),
      "채용 운영 제품을 더 명확하고 쓰기 좋게 만드는 프론트엔드 개발자입니다.",
    );
    await clearAndType(
      basicBoxes.nth(1),
      "React 기반 UI 설계와 운영 화면 개선에 강합니다.",
    );
    await clearAndType(
      basicBoxes.nth(2),
      "지원자와 운영자 모두에게 더 나은 경험을 만드는 제품에 기여하고 싶습니다.",
    );
    await clearAndType(page.getByPlaceholder("경력 연수 (숫자)"), "3");
    await pause(page, 2200);
    await page.getByRole("button", { name: "다음" }).click();
    await pause(page, 1500);

    await setSubtitle(
      page,
      "저장한 프로필을 불러오고, 공고별 질문에는 이번 지원에 맞는 답변만 추가합니다.",
    );
    await page.getByRole("button", { name: "프로필에서 가져오기" }).click();
    await pause(page, 3200);
    await page.getByRole("button", { name: "다음" }).click();
    await page.getByRole("heading", { name: "추가 질문", exact: true }).waitFor();
    await pause(page, 1800);

    const answers = page.getByRole("textbox", { name: "답변을 작성해주세요." });
    await fillMany(answers, [
      "지원 경험과 운영 경험을 동시에 개선하는 제품에 기여하고 싶습니다.",
      "문제 원인과 사용자 영향을 먼저 분리해서 보고 처리합니다.",
      "명확한 구조를 먼저 만들고 팀과 빠르게 공유합니다.",
      "최근 1년간 운영 도메인과 프론트엔드 UX를 함께 공부했습니다.",
      "지원자 플로우와 운영 화면을 함께 개선한 프로젝트를 가장 잘 설명할 수 있습니다.",
    ]);
    await page.locator('input[type="radio"]').first().check();
    await page.getByRole("button", { name: "4", exact: true }).last().click();
    await pause(page, 2200);
    await page.getByRole("button", { name: "최종 제출" }).click();
    await waitForStable(page, /\/me\?submitted=1$/);
    await pause(page, 4200);

    await setSubtitle(
      page,
      "제출된 지원서는 읽기 전용 문서처럼 확인할 수 있고, 제출 후 상태도 계속 추적할 수 있습니다.",
    );
    await page.getByRole("link", { name: "지원서 보기" }).first().click();
    await waitForStable(page, /\/me\/applications\/\d+$/);
    await pause(page, 5200);

    await page.getByRole("button", { name: "로그아웃" }).click();
    await pause(page, 1000);

    await page.goto(`${baseURL}/admin/login`);
    await waitForStable(page);
    await setSubtitle(
      page,
      "관리자 워크스페이스에서는 방금 제출된 지원자를 검색과 필터로 바로 확인할 수 있습니다.",
    );
    await pause(page, 2400);
    await clearAndType(page.locator("#username"), adminUsername);
    await clearAndType(page.locator("#password"), adminPassword);
    await pause(page, 1500);
    await page.locator("form").getByRole("button", { name: "로그인" }).click();
    await waitForStable(page, /\/admin$/);
    await pause(page, 1800);

    await page.goto(
      `${baseURL}/admin/applicants?applicantEmail=${encodeURIComponent(candidateEmail)}`,
    );
    await waitForStable(page);
    await pause(page, 5200);

    await showCard(
      page,
      "One Connected Flow",
      "지원자는 덜 반복 입력하고, 관리자는 더 빨리 검토합니다. 이 데모는 그 전체 흐름을 하나로 보여줍니다.",
      5200,
    );
  } finally {
    await context.close();
    await browser.close();
  }

  const rawVideoPath = await video.path();
  const finalPath = path.join(outputDir, `${outputLabel}-${Date.now()}.webm`);
  await fs.promises.copyFile(rawVideoPath, finalPath);

  console.log(`Saved video: ${finalPath}`);
  console.log(`Candidate email: ${candidateEmail}`);
  console.log(`Admin username: ${adminUsername}`);
}

main().catch((error) => {
  console.error("Executive 90s typed video generation failed.");
  console.error(error);
  process.exitCode = 1;
});
