# Agent playbook

How multiple Claude agents (and Paul) work this repo concurrently without collisions.

## The one absolute rule
Never push to `main`. Ever. See `CLAUDE.md`. Enforced locally by `.githooks` (run
`scripts/setup-hooks.sh` on every clone; `scripts/agent` does it for you) and detected in
CI by `guard-main.yml`, which reverts and opens an issue. Branch protection itself is
unavailable on the current GitHub plan.

## Principles
- GitHub Issues are the only shared state. Local memory and chat do not sync.
- One issue, one branch, one agent. Never commit to `main`. Paul or the Reviewer merges
  (`docs/review-agent.md`); never the author.
- Claim before branching. Handoff before ending a session. Both are scripts, and the PR
  template has a required `Handoff:` line that CI `pr-shape` checks.
- `git push` before any merge, always.
- Found something out of scope: open an issue, do not widen the branch.
- Every issue uses the template: Context, Scope, Out of scope, Acceptance tests, Files
  touched, Dependencies. Issues without all sections get `needs-spec` and are not claimable.
- Branch names carry the issue number: `feat/123-short-slug`. `gh` auto-links, and anyone
  can map a branch to an issue.
- "Who is doing what" is the `claimed` / `changes-requested` / `needs-paul` labels plus the
  `Agent:` line in each PR (`scripts/review who <N>`). There is no project board.

## Identity
1. Copy `.env.agent.example` to `.env.agent` and set `AGENT_NAME`. Format `FAB <Machine>
   <Role> <Model>`: orchestrator `FAB MacBook Orchestrator`, workers `FAB MacBook Coder-1
   Sonnet 5` and `FAB MacBook Reviewer Opus 5`, cloud sessions `FAB Cloud <Model>`. The
   machine comes first so two Macs running `/work` never collide.
2. Sign every issue and PR comment with `— $AGENT_NAME`. The scripts do this for you.

## Paul's own checkout stays on main
Paul's own clone of this repo is where he runs `npm run dev` and looks at the site by hand;
it must stay on `main` and usable at all times. Agents never claim an issue or resume a PR
there: `scripts/agent claim`/`resume` refuse to switch branches in the repository's primary
checkout and print the `scripts/agent worktree <name>` command instead
(`FAB_ALLOW_SHARED_CHECKOUT=1` overrides this for Paul's own use only). The `/work`
orchestrator always spawns coders with `isolation: "worktree"` and checks that the worktree
path is in the coder's return line; if it is missing, treat the spawn as failed.

## Several agents on one machine
One folder holds one checked-out branch, so each concurrent agent gets its own git worktree:
```bash
scripts/agent worktree 2        # creates ../fab-2 on fresh origin/main with AGENT_NAME "FAB <Machine> Coder-2 <model>"
cd ../fab-2 && npm ci && scripts/agent next
scripts/agent worktree-rm 2     # after the PR merges
```
Hooks and the remote are shared through `.git`; `.env.agent` and `node_modules` are per
worktree. Give each agent a different issue in the same wave.

## Reporting what Paul finds
`/bug <description>` (bugs and improvements alike): the Opus investigator reproduces it and
finds the root cause, the skill files a labelled issue from the report, then Paul chooses
fix-now (Sonnet coder + Opus reviewer, the single-issue `/work` path) or issue-only.
`--issue-only` and `--fix` skip the question. Issues carry `bug` or `improvement` plus the
usual labels, so a later `/work` picks them up in wave order.

## Picking up work
Your own PRs come before new work. `scripts/agent mine` shows them with a state; anything
`fix-needed` (Reviewer requested changes, you have not pushed since) blocks `next` and
`claim` until you address it via `scripts/agent resume <N>` (see `/fix-prs`). After pushing,
comment on the PR with what you addressed; the Reviewer re-queues it from your commits.
`resume` also takes the PR's `fixing:<Machine>` work lock so a coder on another machine
cannot start the same fix round; if it answers `LOCKED: PR #N is being fixed by <Machine>`,
stop and return `BLOCKED`, do not fix. The lock is released by the fix-round
`scripts/agent comment <N>` (or `scripts/agent release <N>`).
```bash
scripts/agent mine            # your open PRs and their state
scripts/agent next            # lists agent-ready, unclaimed issues in the current milestone, ordered by wave
scripts/agent claim 123       # label claimed, comment, create branch feat/123-slug from fresh origin/main
```
Check the issue's **Dependencies** section. If a dependency is not merged, do not start;
pick another or comment asking the owning agent.

## While working
- Keep to the issue's **Scope** and **Files touched**. If you must touch files outside it,
  say so in the PR body.
- `npm run lint` and `npm run build` before every commit (the pre-commit hook runs lint for
  you when source is staged); `npm test` once FAB-004 has set up the runner. Check the page
  in the browser with `npm run dev` for anything visual.
- Conventional commits: `feat(content): minutes index from src/data (#123)`.
- Update docs in the same PR when behaviour changes.
- Content is files: JSON/Markdown under `src/data/`, images under `public/images/`. Do not
  introduce a runtime data source.

## Opening the PR
In the automated flow, Paul runs `/work` and the orchestrator spawns a fresh coder per issue
or fix round and a fresh reviewer per PR. Workers never carry context between units of
work; the orchestrator holds only queue state and asks Paul for decisions. A coder ends with
`/submit-pr`. A fresh worker per unit is cheaper than a long-lived one.

Under the hood:
```bash
scripts/agent pr [body|@file|-]   # pushes, opens PR from template, fills Agent and Fixes lines
```
Pass the body as the argument (write it to a file and pass `@path/to/body.md` for anything
longer than a line) so the template's placeholder sections are replaced with real content;
this is the only sanctioned way to set PR body content (never `gh pr edit` or `gh api -f
body=@file`). PR body must contain:
- `Fixes #123` (repeat the keyword per issue).
- `Agent: <AGENT_NAME>`.
- What changed, how verified (which npm scripts ran, what was checked in the browser), out of scope.
- `Handoff:` one paragraph the next agent needs.

Never merge your own PR. Never force-push after review starts. The Reviewer picks your PR up
oldest-first; if it requests changes, the must-fix list is on the PR and mirrored on the
issue, and pushing new commits re-queues it automatically.

## Ending a session
```bash
scripts/agent handoff "shipped minutes index PR #40; news page next; hero image still 404 on /about"
```
This comments on the pinned **Status handoff** issue with your name and timestamp.
Required even for a two-line session.

## Machine roles

| Where | Can do | Cannot do |
|---|---|---|
| Paul's Macs | Everything, including Netlify, DNS, club CDN access | |
| Cloud sessions (claude.ai, fresh clone) | Code, content, docs, tests: anything that needs no secrets | Deploys, DNS, anything needing `.env` |
| CI | Lint, build, checks | Merge and deploy (Netlify deploys `main` itself) |

Secrets are never in issues, PRs, or chat. Cloud agents assume they have none.

## Waves and parallelism
Issues carry a `wave:N` label (1 to 4). Everything in one wave can run in parallel; wave
N+1 depends on wave N. `scripts/agent next` orders by milestone then wave so agents
naturally pick non-conflicting work. Milestones: M0 Stabilise, M1 Content by PR, M2
M2 retired (staying on Netlify), M3 Polish. When two agents must touch the same file, the issue says which one
owns it.

## Escalation
Blocked on a decision only Paul can make: label `needs-paul`, comment with the options and
your recommendation, move on to another issue. Do not wait.
