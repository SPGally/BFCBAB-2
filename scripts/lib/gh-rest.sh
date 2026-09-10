#!/usr/bin/env bash
# Shared REST (gh api) helpers for scripts/agent and scripts/review.
#
# Why: GraphQL-backed `gh` commands (`gh pr list`, `gh issue list`, `gh pr view --json
# comments/commits`, `gh pr comment`, `gh issue comment`, `gh pr create`, `gh pr/issue edit
# --add-label`) share a separate, smaller GraphQL point budget from the 5,000/hour REST
# budget and content-creation (comments/issues/PRs) is additionally capped at 500/hour per
# user. When the GraphQL budget is exhausted every one of those commands fails with
# "API rate limit already exceeded" while plain `gh api` REST calls keep working. These
# helpers do everything over REST instead, with a bounded retry on 403.
#
# Requires $REPO (owner/name) to be set before sourcing. Honours $DRY_RUN like scripts/agent
# and scripts/review's own `run`: mutating calls print `+ gh api ...` instead of executing.
set -uo pipefail

# gh_retry <gh api args...>  -- runs a *read* call, retrying a bounded number of times on a
# 403 rate-limit response. Never gated by DRY_RUN: reads are safe to run under DRY_RUN=1.
GH_RETRY_MAX_TRIES="${GH_RETRY_MAX_TRIES:-3}"
GH_RETRY_MAX_WAIT="${GH_RETRY_MAX_WAIT:-60}"
gh_retry() {
  local tries=0 out err errfile rc wait
  while :; do
    errfile=$(mktemp)
    out=$(gh "$@" 2>"$errfile"); rc=$?
    err=$(cat "$errfile"); rm -f "$errfile"
    if [ $rc -eq 0 ]; then
      # Keep stdout clean for callers piping into jq; any stderr (release notices,
      # deprecation warnings) is logged separately rather than merged into $out.
      [ -n "$err" ] && printf '%s\n' "$err" >&2
      printf '%s' "$out"
      return 0
    fi
    tries=$((tries + 1))
    if [ "$tries" -ge "$GH_RETRY_MAX_TRIES" ] || ! printf '%s' "$err" | grep -qiE 'rate limit|HTTP 403|secondary rate limit'; then
      printf '%s\n' "$err" >&2
      return "$rc"
    fi
    wait=$(printf '%s' "$err" | grep -oiE 'retry-after: *[0-9]+' | grep -oE '[0-9]+' | head -1)
    if [ -z "$wait" ]; then
      local reset now
      reset=$(gh api rate_limit -q '.resources.core.reset' 2>/dev/null || echo "")
      now=$(date +%s)
      if [ -n "$reset" ]; then wait=$((reset - now)); else wait=5; fi
    fi
    [ "$wait" -gt 0 ] 2>/dev/null || wait=1
    [ "$wait" -gt "$GH_RETRY_MAX_WAIT" ] && wait="$GH_RETRY_MAX_WAIT"
    echo "rate-limited, retry $tries/$GH_RETRY_MAX_TRIES after ${wait}s" >&2
    sleep "$wait"
  done
}

# mutate <gh api args...> -- a content-creating/label call. Prints "+ gh ..." under
# DRY_RUN instead of running it; otherwise runs it through gh_retry and discards the
# response body (callers that need the body use gh_retry directly, e.g. rest_create_pr).
mutate() {
  if [ "${DRY_RUN:-}" = 1 ]; then echo "+ gh $*"; return 0; fi
  gh_retry "$@" >/dev/null
}

rest_get() { # path [jq-args...]  -> REST GET, always executed (safe read)
  gh_retry api --method GET "repos/$REPO/$1" "${@:2}"
}

# read_body <text|@file|-> -> prints the body text. `@path` reads the file (gh's own `-F`
# does this but `-f` does not, which is how literal "@/private/tmp/..." comments got posted);
# `-` reads stdin. Fails on a missing file or an empty body rather than posting junk.
read_body() {
  local arg="$1" text
  case "$arg" in
    @*)  local f="${arg#@}"; [ -r "$f" ] || { echo "read_body: cannot read $f" >&2; return 1; }; text=$(cat "$f");;
    -)   text=$(cat);;
    *)   text="$arg";;
  esac
  [ -n "${text//[[:space:]]/}" ] || { echo "read_body: empty body" >&2; return 1; }
  printf '%s' "$text"
}

rest_comment() { # number <body|@file|->  -- body is expanded via read_body
  local text; text=$(read_body "$2") || return 1
  mutate api --method POST "repos/$REPO/issues/$1/comments" -f "body=$text"
}

rest_add_label() { # number label
  mutate api --method POST "repos/$REPO/issues/$1/labels" -f "labels[]=$2"
}

rest_remove_label() { # number label -- tolerates the label already being absent
  mutate api --method DELETE "repos/$REPO/issues/$1/labels/$2" 2>/dev/null || true
}

# rest_create_pr <title> <head> <base> <body> -> prints "NUMBER<TAB>URL" on success
rest_create_pr() {
  if [ "${DRY_RUN:-}" = 1 ]; then
    echo "+ gh api --method POST repos/$REPO/pulls -f title=$1 -f head=$2 -f base=$3" >&2
    printf '0\t(dry-run)\n'
    return 0
  fi
  gh_retry api --method POST "repos/$REPO/pulls" -f "title=$1" -f "head=$2" -f "base=$3" -f "body=$4" \
    -q '"\(.number)\t\(.html_url)"'
}

# rest_find_open_pr <head-branch> -> "NUMBER<TAB>URL" for the open PR already on that
# branch, or nothing (empty output, rc 0) if there is none.
rest_find_open_pr() {
  rest_get "pulls?state=open&head=${REPO%%/*}:$1&per_page=1" -q '.[] | "\(.number)\t\(.html_url)"'
}

# rest_update_pr_body <number> <body> -> PATCHes an existing PR's body (replaces
# `gh pr edit`/a raw `gh api -f body=...` call -- same REST-not-GraphQL rationale as every
# other helper here). Used by `scripts/agent pr` to recover a PR that was already created
# with the template's unfilled placeholder body (e.g. a first `pr` call with no body
# argument), never to bypass `build_pr_body`'s own Handoff-line validation, which runs
# before this is ever reached.
rest_update_pr_body() {
  mutate api --method PATCH "repos/$REPO/pulls/$1" -f "body=$2"
}

# rest_pr_files <number> -> newline list of "status<TAB>filename" for changed files (replaces
# `gh pr diff --name-only`). status is GitHub's per-file status: added, modified, removed,
# renamed, copied, changed or unchanged.
rest_pr_files() {
  rest_get "pulls/$1/files?per_page=100" --paginate -q '.[] | "\(.status)\t\(.filename)"'
}

# rest_merge_pr <number> <head-branch> -> merges with a merge commit and deletes the head
# branch, both over REST (replaces `gh pr merge --merge --delete-branch`). Prints the merge
# call's stdout/stderr on failure so callers can report it; branch deletion is best-effort
# and only attempted after a successful merge.
rest_merge_pr() {
  local n="$1" branch="$2"
  if [ "${DRY_RUN:-}" = 1 ]; then
    echo "+ gh api --method PUT repos/$REPO/pulls/$n/merge -f merge_method=merge"
    echo "+ gh api --method DELETE repos/$REPO/git/refs/heads/$branch"
    return 0
  fi
  local out status=0
  out=$(gh_retry api --method PUT "repos/$REPO/pulls/$n/merge" -f merge_method=merge 2>&1) || status=$?
  if [ "$status" -eq 0 ]; then
    gh_retry api --method DELETE "repos/$REPO/git/refs/heads/$branch" >/dev/null 2>&1 || true
  else
    printf '%s' "$out" >&2
  fi
  return "$status"
}
