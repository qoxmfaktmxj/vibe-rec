<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-30 | Updated: 2026-03-30 -->

# features

## Purpose

Feature components organized by domain. Each subdirectory groups related UI components, forms, and client-side logic for a specific product area.

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `admin/` | Admin workspace features — auth forms, applicant table, interview/hiring sections, navigation |
| `candidate/` | Candidate-facing features — profile dashboard, profile editor, application history |
| `recruitment/` | Core recruitment features — application wizard, job posting browser, public site layout |
| `shared/` | Cross-domain UI components (e.g., `PaginationBar`) |

## For AI Agents

### Working In This Directory

- Each feature is a self-contained component or component group
- Features import from `shared/` and `entities/` layers, never from other feature directories
- Admin features are desktop-only; recruitment/candidate features must be responsive
- Use `DESIGN.md` tokens for all styling — no hardcoded colors

### Admin Features (`admin/`)

| Component | Purpose |
|-----------|---------|
| `auth/AdminAuthForm.tsx` | Admin signup/login form wrapper |
| `auth/AdminLoginForm.tsx` | Admin login form |
| `auth/AdminSignupForm.tsx` | Admin signup form |
| `auth/AdminLogoutButton.tsx` | Logout button |
| `navigation/AdminRailNav.tsx` | Sidebar rail navigation for admin workspace |
| `layout/AdminMobileGuard.tsx` | Blocks admin access on small screens |
| `applicants/AdminApplicantTable.tsx` | Paginated applicant table with status badges |
| `applicants/ApplicantReviewForm.tsx` | Review status update form |
| `applicants/ApplicantAttachmentList.tsx` | Attachment viewer/downloader |
| `interview/InterviewSection.tsx` | Interview scheduling and evaluation |
| `hiring/HiringDecisionSection.tsx` | Final hiring decision form |
| `notification/NotificationSection.tsx` | Candidate notification management |
| `job-postings/JobPostingEditorForm.tsx` | Job posting create/edit form |
| `job-postings/PaginatedAdminJobPostingSection.tsx` | Admin job posting list |
| `questions/JobPostingQuestionEditor.tsx` | Custom screening question editor |

### Recruitment Features (`recruitment/`)

| Component | Purpose |
|-----------|---------|
| `application/ApplicationWizard.tsx` | 4-step application wizard orchestrator |
| `application/WizardStep1PersonalInfo.tsx` | Step 1: Personal info |
| `application/WizardStep2Introduction.tsx` | Step 2: Self-introduction |
| `application/WizardStep3Resume.tsx` | Step 3: Resume/CV upload |
| `application/WizardStep4QuestionsSubmit.tsx` | Step 4: Custom questions + submit |
| `application/ApplicationDraftForm.tsx` | Draft save/restore form |
| `application/CandidateAuthForm.tsx` | Candidate signup/login form |
| `application/CandidateApplicationsPanel.tsx` | Application list panel |
| `application/CandidateApplicationReadOnlyView.tsx` | Submitted application viewer |
| `application/ResumeSections.tsx` | Resume structured display |
| `application/draft-state.ts` | Draft persistence logic |
| `job-postings/JobPostingBrowser.tsx` | Searchable/filterable job posting browser |
| `job-postings/JobPostingList.tsx` | Job posting card grid |
| `job-postings/JobPostingDetailView.tsx` | Full job posting detail view |
| `layout/PublicSiteHeader.tsx` | Public site navigation header |
| `legal/LegalLayerLinks.tsx` | Legal/privacy links |

### Candidate Features (`candidate/`)

| Component | Purpose |
|-----------|---------|
| `profile/ProfileDashboard.tsx` | Candidate main dashboard |
| `profile/ProfileEditor.tsx` | Profile edit form |
| `profile/ProfileApplicationHistory.tsx` | Application history list |

<!-- MANUAL: -->
