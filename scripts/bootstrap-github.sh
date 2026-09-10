#!/usr/bin/env bash
# Create (or update) the GitHub repo, labels, milestones, handoff issue and every issue in
# backlog/issues.yaml. Idempotent: safe to re-run after editing the backlog. Paul runs this
# by hand; agents never do. Usage: scripts/bootstrap-github.sh OWNER/REPO
#
# Needs: gh (authenticated), jq, and node/npx (backlog/issues.yaml is converted to JSON with
# `npx --yes js-yaml`, so no repo dependency is added for a one-off script).
set -euo pipefail
REPO="${1:?usage: bootstrap-github.sh OWNER/REPO}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
command -v jq >/dev/null || { echo "need jq (brew install jq)"; exit 1; }
command -v npx >/dev/null || { echo "need node/npx"; exit 1; }

echo "== repo"
if ! gh repo view "$REPO" >/dev/null 2>&1; then
  gh repo create "$REPO" --private --description "Barnsley FC Fan Advisory Board website (fab.barnsleyfc.co.uk)"
else
  gh repo edit "$REPO" --description "Barnsley FC Fan Advisory Board website (fab.barnsleyfc.co.uk)" >/dev/null
fi
if [ ! -d "$ROOT/.git" ] && [ ! -f "$ROOT/.git" ]; then
  git -C "$ROOT" init -b main >/dev/null
  git -C "$ROOT" remote add origin "https://github.com/$REPO.git"
fi

echo "== labels"
mklabel() { gh label create "$1" --repo "$REPO" --color "$2" --description "$3" --force >/dev/null; }
mklabel claimed           "0e8a16" "An agent is on it (see comment for who)"
mklabel agent-ready       "1d76db" "Spec complete; safe to pick up cold"
mklabel needs-spec        "fbca04" "Missing Context/Scope/Tests; not claimable"
mklabel needs-paul        "d93f0b" "Blocked on a decision or action only Paul can take"
mklabel paul-only         "b60205" "Requires secrets, DNS, Netlify/Cloudflare or club access"
mklabel blocked           "000000" "Waiting on a dependency"
mklabel handoff           "5319e7" "Pinned status log"
mklabel changes-requested "fbca04" "Reviewer requested changes; push commits to re-queue"
mklabel direct-push       "e11d21" "Opened by guard-main when main was pushed directly"
mklabel bug               "d73a4a" "Behaviour contradicts the docs or the obvious intent"
mklabel improvement       "a2eeef" "Works as designed, could be better"
for a in content site tooling docs deploy ci; do mklabel "area:$a" "c5def5" "Area: $a"; done
for w in 1 2 3 4; do mklabel "wave:$w" "bfd4f2" "Parallel wave $w within a milestone"; done
for s in S M L; do mklabel "size:$s" "ededed" "Size $s"; done

echo "== milestones"
ms_title() { case "$1" in M0) echo "Stabilise";; M1) echo "Content by PR";; M2) echo "Cloudflare";; M3) echo "Polish";; esac; }
for m in M0 M1 M2 M3; do
  t="$m $(ms_title "$m")"
  gh api "repos/$REPO/milestones?state=all" --paginate -q ".[] | select(.title==\"$t\") | .number" | grep -q . \
    || gh api "repos/$REPO/milestones" -f title="$t" >/dev/null
done

echo "== handoff issue"
HANDOFF=$(gh issue list --repo "$REPO" --label handoff --state open --json number -q '.[0].number' || true)
if [ -z "$HANDOFF" ]; then
  HANDOFF=$(gh issue create --repo "$REPO" --title "Status handoff (pin me)" --label handoff \
    --body "Every agent comments here before ending a session and after any merge. Sign with your AGENT_NAME. Use scripts/agent handoff." \
    | grep -oE '[0-9]+$')
  gh issue pin "$HANDOFF" --repo "$REPO" >/dev/null 2>&1 || true
fi
echo "handoff issue #$HANDOFF"
echo "$HANDOFF" > "$ROOT/.github/HANDOFF_ISSUE"

echo "== issues from backlog"
# backlog/issues.yaml -> JSON array (empty file or header-only file -> [])
items=$(npx --yes js-yaml "$ROOT/backlog/issues.yaml" 2>/dev/null || echo "null")
[ "$items" = "null" ] && items="[]"
count=$(printf '%s' "$items" | jq 'length')
if [ "$count" -eq 0 ]; then
  echo "no entries in backlog/issues.yaml; nothing to create"
else
  # existing FAB-NNN issues, keyed by id -> number
  existing=$(gh issue list --repo "$REPO" --state all --limit 500 --json number,title \
    | jq -c '[.[] | select(.title | test("^FAB-[0-9]+ ")) | {key: (.title | split(" ")[0]), value: .number}] | from_entries')
  numbers='{}'
  for i in $(seq 0 $((count - 1))); do
    it=$(printf '%s' "$items" | jq -c ".[$i]")
    id=$(printf '%s' "$it" | jq -r .id)
    title="$id $(printf '%s' "$it" | jq -r .title)"
    ms="$(printf '%s' "$it" | jq -r .milestone) $(ms_title "$(printf '%s' "$it" | jq -r .milestone)")"
    labels=$(printf '%s' "$it" | jq -r '[("area:" + .area), ("wave:" + (.wave|tostring)), ("size:" + .size), (if .paul_only then "paul-only" else "agent-ready" end)] | join(",")')
    body=$(printf '%s' "$it" | jq -r '(.body | rtrimstr("\n")) + "\n\n## Dependencies\n" + (if (.depends // []) | length > 0 then ((.depends | map("- " + .) | join("\n"))) else "- none" end) + "\n"')
    n=$(printf '%s' "$existing" | jq -r --arg id "$id" '.[$id] // empty')
    if [ -n "$n" ]; then
      gh issue edit "$n" --repo "$REPO" --title "$title" --body "$body" --milestone "$ms" --add-label "$labels" >/dev/null
      echo "updated #$n $title"
    else
      url=$(gh issue create --repo "$REPO" --title "$title" --body "$body" --milestone "$ms" --label "$labels")
      n="${url##*/}"
      echo "created #$n $title"
    fi
    numbers=$(printf '%s' "$numbers" | jq -c --arg id "$id" --argjson n "$n" '. + {($id): $n}')
  done
  # second pass: rewrite dependency ids as issue links so scripts/review queue can see them
  for i in $(seq 0 $((count - 1))); do
    it=$(printf '%s' "$items" | jq -c ".[$i]")
    deps=$(printf '%s' "$it" | jq -r '(.depends // []) | length')
    [ "$deps" -gt 0 ] || continue
    id=$(printf '%s' "$it" | jq -r .id)
    n=$(printf '%s' "$numbers" | jq -r --arg id "$id" '.[$id]')
    body=$(printf '%s' "$it" | jq -r --argjson nums "$numbers" '(.body | rtrimstr("\n")) + "\n\n## Dependencies\n" + (.depends | map("- " + . + " (#" + ($nums[.] | tostring) + ")") | join("\n")) + "\n"')
    gh issue edit "$n" --repo "$REPO" --body "$body" >/dev/null
  done
  echo "done $count issues"
fi

echo
echo "Next: commit .github/HANDOFF_ISSUE on a branch and open a PR (never push to main)."
