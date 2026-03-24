import Link from "next/link";

import { JobPostingList } from "@/features/recruitment/job-postings/JobPostingList";
import { getJobPostings } from "@/shared/api/recruitment";

const navLinks = [
  { href: "#positions", label: "Job Postings" },
  { href: "#about", label: "About" },
  { href: "#contact", label: "Contact" },
];

export default async function Home() {
  const jobPostings = await getJobPostings().catch(() => []);
  const openJobPostingCount = jobPostings.filter(
    (jobPosting) => jobPosting.status === "OPEN",
  ).length;

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <nav className="glass-nav sticky top-0 z-50 border-b border-outline-variant px-6 py-4 md:px-16">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
          <Link
            href="/"
            className="font-headline text-2xl font-medium tracking-[-0.04em] text-on-surface"
          >
            Vibe Rec
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-[13px] font-normal text-on-surface transition-colors hover:text-primary"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/login"
              className="rounded-sm bg-primary px-5 py-2 text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              Login
            </Link>
          </div>
        </div>
      </nav>

      <main>
        <section className="border-b border-outline-variant bg-[#fdf2f8] px-6 py-24 md:px-16">
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 text-center">
            <span className="font-mono text-xs uppercase tracking-[0.28em] text-on-surface-variant">
              {openJobPostingCount} active roles
            </span>
            <h1 className="max-w-4xl font-headline text-5xl font-light leading-[1.08] tracking-[-0.06em] text-primary md:text-7xl">
              Connecting Talent
              <br />
              with Opportunity
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-on-surface-variant md:text-base">
              Discover your next career move with Vibe Rec, where precise
              hiring operations meet a calmer candidate experience.
            </p>
            <Link
              href="#positions"
              className="rounded-sm bg-primary px-8 py-3 text-xs font-medium uppercase tracking-[0.24em] text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              Browse Jobs
            </Link>
          </div>
        </section>

        <section
          id="positions"
          className="mx-auto max-w-7xl px-6 py-16 md:px-16"
        >
          {jobPostings.length === 0 ? (
            <div className="mb-8 rounded-sm border border-destructive/20 bg-error-container px-5 py-4 text-sm text-destructive">
              Job postings could not be loaded from the API right now. The rest
              of the site is still available.
            </div>
          ) : null}
          <div className="mb-10 flex items-end justify-between gap-6">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-on-surface-variant">
                Featured Positions
              </p>
              <h2 className="mt-3 font-headline text-3xl font-medium tracking-[-0.04em] text-on-surface">
                A tighter shortlist of roles worth your time.
              </h2>
            </div>
            <p className="hidden max-w-sm text-sm leading-7 text-on-surface-variant lg:block">
              The Penpot direction is quiet and editorial, so the list leans on
              mono metadata, thin borders, and strong hierarchy instead of loud
              decoration.
            </p>
          </div>
          <JobPostingList jobPostings={jobPostings} />
        </section>

        <section
          id="about"
          className="border-t border-outline-variant bg-surface-container-low px-6 py-16 md:px-16"
        >
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-on-surface-variant">
                About
              </p>
              <h2 className="mt-3 font-headline text-3xl font-medium tracking-[-0.04em] text-on-surface">
                Designed to feel human, operational, and precise.
              </h2>
            </div>
            <p className="text-sm leading-7 text-on-surface-variant">
              Vibe Rec now borrows the Penpot file&apos;s cream surfaces, plum
              accents, and cleaner spacing rhythm to feel more like a refined
              hiring workspace than a generic SaaS landing page.
            </p>
          </div>
        </section>
      </main>

      <footer
        id="contact"
        className="border-t border-outline-variant bg-surface-container-low px-6 py-8 md:px-16"
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-[11px] text-on-surface-variant md:flex-row md:items-center md:justify-between">
          <p>© 2026 Vibe Rec. All rights reserved.</p>
          <div className="flex gap-6">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Contact</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
