# AI Tooling Notes

The assessment explicitly expects intentional use of AI tools. This
document captures **how** AI was used while building this solution —
where it helped, where it didn't, and representative prompts.

The goal isn't to log every prompt verbatim, but to show the *pattern*
of AI use: what was delegated, what was reviewed, and what was rejected.

---

## Tools Used

- **Claude Code** (CLI, Opus 4.6) — primary pair for design discussions,
  scaffolding, code generation, and review.
- _(Add others as applicable — e.g. GitHub Copilot for in-editor
  completions, Cursor, etc.)_

---

## How AI Was Used

### ✅ Where AI added clear value

- **Exploring trade-offs before committing** — talked through stack
  choices (Rails vs FastAPI, MUI vs shadcn, server-side vs client-side
  pagination) before writing code. Forced explicit reasoning instead of
  defaulting.
- **Scaffolding boilerplate** — generating initial models, migrations,
  controllers, and React components from a clear spec.
- **Writing focused tests** — given a behaviour description, AI produces
  decent first-pass RSpec examples that I then tighten.
- **Documentation** — ADRs, README, this document. AI is good at turning
  decisions I've already made into readable prose.
- **Rubber-ducking tricky decisions** — e.g. whether to use keyset vs
  offset pagination, when to introduce service objects.

### ⚠️ Where AI needed careful review

- **Performance claims** — any "this is faster" statement got verified
  with an actual benchmark. AI is confident about perf in ways that
  aren't always correct.
- **Security-sensitive code** — parameter allow-listing, sort column
  whitelisting, SQL injection surface. Reviewed line-by-line.
- **Edge cases in aggregations** — empty groups, single-row groups,
  NULL handling. Explicitly tested rather than trusted.

### ❌ Where AI was deliberately not used

- **Final design decisions** — AI was a thinking partner, not the
  decider. Every ADR in `decisions.md` is a decision I own.
- **Copying code without reading it** — every generated block was read
  and understood before being committed.

---

## Representative Prompts

_(Filled in as the solution evolves. A few examples of the kind of
prompts used:)_

**Design discussion:**
> "We're building a salary management tool for an HR Manager.
> 10k employees. Should we use client-side or server-side pagination
> given MUI DataGrid supports both? Walk me through the trade-offs."

**Scaffolding:**
> "Generate a Rails migration and model for `employees` with columns
> full_name, job_title, country, salary (cents), currency, email,
> hired_on. Add indexes on country and (country, job_title). Include
> NOT NULL and length constraints."

**Test generation:**
> "Write RSpec request specs for `GET /api/insights/by_country` covering:
> happy path with multiple countries, empty database, single employee
> per country, and ensuring the response includes min/max/avg/count."

**Review:**
> "Read the seed task I just wrote and tell me the three highest-impact
> performance issues before I benchmark it."

---

## Principles Followed

1. **AI accelerates, humans decide.** Every architectural choice is
   explained and owned in `decisions.md`.
2. **Verify, don't trust.** Performance claims and security-sensitive
   code are checked against reality.
3. **Keep the diff small enough to review.** Large AI-generated blocks
   are broken into reviewable commits.
4. **Prompts are artifacts.** Keeping representative prompts here makes
   the AI usage visible and auditable, which is the whole point of the
   assessment's AI framing.
