---
name: submit-pr
description: Pre-flight and open the PR for the current branch (a coder's last step, or a human working by hand). Does not review; the /work orchestrator spawns the reviewer. Use when an issue is finished and the branch is ready.
---

1. Pre-flight: `npm run lint`, `npm run build`, `npm test` if tests exist, and the issue's
   acceptance checks (including anything to look at in the browser with `npm run dev`).
   Do not submit red.
2. `scripts/agent pr [body|@file|-]`: pushes, opens the PR from the template with Agent and
   Fixes filled. Pass the body as the second argument (write it to a file first for anything
   longer than a line, then pass `@path/to/body.md`) so the real "What changed" / "How
   verified" / "Out of scope" / "Handoff" content lands in the PR; this is the only
   sanctioned way to set real PR body content. Do not call it with no argument and rely on
   filling the template in afterwards with `gh pr edit`.
3. `scripts/agent handoff "<one line>"`.
4. If you are a coder subagent, return `PR: #N`. If you are a human session, the orchestrator
   (`/work`) or Paul (`/review-prs`) reviews it; do not merge your own PR.
