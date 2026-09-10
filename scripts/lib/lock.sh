#!/usr/bin/env bash
# Per-PR work lock shared by scripts/review and scripts/agent.
#
# Why: two machines running /work at once can both review and both fix the same PR, because
# nothing records "someone is already on this". The lock is a label on the PR:
#   reviewing:<Machine>   a reviewer holds the PR (taken by `scripts/review checkout|claim`)
#   fixing:<Machine>      a fix-round coder holds it (taken by `scripts/agent resume`)
# The machine word comes from AGENT_NAME ("FAB <Machine> ..."), so every worker on one
# machine shares a lock and two machines never collide. Labels ride along on the PR list the
# queue already fetches, so showing a lock costs no extra REST call.
#
# Staleness: a crashed worker leaves its label behind. A lock older than LOCK_STALE_HOURS
# (default 3) may be taken over with a warning; LOCK_STEAL=1 takes over regardless. The queue
# shows a stale lock as the PR's underlying state plus a "(stale ...)" note, so the
# orchestrator spawns a worker as usual and that worker's lock_take does the takeover.
# Race: two takers can both see "free" and both add a label. After adding, the taker re-reads
# the PR's `labeled` events; if another machine's lock event is older, it loses, removes its
# own label and fails.
#
# Requires: $REPO, $AGENT_NAME, and scripts/lib/gh-rest.sh already sourced.
set -uo pipefail

LOCK_STALE_HOURS="${LOCK_STALE_HOURS:-3}"

# machine_of <agent-name> -> second word of "FAB <Machine> ..."; empty if it cannot be determined
machine_of() { local n="${1:-}" m; m="${n#FAB }"; [ "$m" != "$n" ] && [ -n "$m" ] || { echo ""; return; }; m="${m%% *}"; echo "$m"; }

# lock_kind_ok <kind> -> fails unless kind is reviewing|fixing
lock_kind_ok() { case "${1:-}" in reviewing|fixing) return 0;; *) echo "lock kind must be reviewing|fixing" >&2; return 1;; esac; }

# lock_holder_from_labels <kind> <comma-separated labels> -> machine holding <kind>, or empty
lock_holder_from_labels() {
  local kind="$1" labels="${2:-}"
  printf '%s\n' "$labels" | tr ',' '\n' | { grep -E "^$kind:" || true; } | head -1 | sed "s/^$kind://"
}

# lock_holder <N> <kind> -> machine holding <kind> on PR N, or empty (one REST read)
lock_holder() {
  local n="$1" kind="$2" labels
  labels=$(rest_get "issues/$n" -q '[.labels[].name] | join(",")')
  lock_holder_from_labels "$kind" "$labels"
}

# lock_age_hours <N> <label> -> whole hours since <label> was last added to N. Prints nothing
# when the age cannot be established (events call failed, or no labeled event found): callers
# must treat "unknown" as "fresh", so an API hiccup never turns into stealing a live lock.
lock_age_hours() {
  local n="$1" label="$2" events at now since
  # gh's -q cannot take --arg, so pipe the (paginated, one array per page) response into jq
  events=$(rest_get "issues/$n/events?per_page=100" --paginate) || { echo ""; return; }
  at=$(printf '%s' "$events" | jq -r -s --arg l "$label" 'add // [] | [.[] | select(.event=="labeled" and .label.name==$l)] | last | .created_at // ""' 2>/dev/null)
  [ -n "$at" ] || { echo ""; return; }
  since=$(lock_epoch "$at"); now=$(date +%s)
  [ "$since" -gt 0 ] || { echo ""; return; }
  echo $(( (now - since) / 3600 ))
}

# lock_is_stale <age-hours-or-empty> -> rc 0 when a lock that old may be taken over
lock_is_stale() { [ -n "${1:-}" ] && [ "$1" -ge "$LOCK_STALE_HOURS" ]; }

# lock_epoch <iso8601 UTC> -> epoch seconds (macOS and GNU date)
lock_epoch() {
  local iso="${1%Z}"
  date -u -j -f '%Y-%m-%dT%H:%M:%S' "$iso" +%s 2>/dev/null || date -u -d "${1}" +%s 2>/dev/null || echo 0
}

# lock_ensure_label <label> -> creates the repo label if missing (one read; a create only once per machine)
lock_ensure_label() {
  local label="$1" color
  case "$label" in reviewing:*) color=1d76db;; *) color=fbca04;; esac
  if ! gh api --method GET "repos/$REPO/labels/$label" >/dev/null 2>&1; then
    mutate api --method POST "repos/$REPO/labels" -f "name=$label" -f "color=$color" \
      -f "description=work lock: a worker on this machine holds the PR" 2>/dev/null || true
  fi
}

# lock_take <N> <kind> -> takes <kind>:<Machine> on PR N. Exit 0 = held by you (new or already).
# Exit 1 = another machine holds a fresh lock (message names the holder), or you lost the race.
lock_take() {
  local n="$1" kind="$2" me holder label age other
  lock_kind_ok "$kind" || return 1
  me=$(machine_of "$AGENT_NAME")
  [ -n "$me" ] || { echo "lock: cannot determine machine from AGENT_NAME='$AGENT_NAME' (format 'FAB <Machine> ...')" >&2; return 1; }
  label="$kind:$me"
  holder=$(lock_holder "$n" "$kind")
  if [ "$holder" = "$me" ]; then echo "lock: PR #$n already $kind by $me (this machine)"; return 0; fi
  if [ -n "$holder" ]; then
    age=$(lock_age_hours "$n" "$kind:$holder")
    if [ "${LOCK_STEAL:-0}" != 1 ] && ! lock_is_stale "$age"; then
      echo "LOCKED: PR #$n is being ${kind/ing/ed} by $holder (${age:+${age}h ago, < ${LOCK_STALE_HOURS}h}${age:-age unknown; treated as fresh}). Skip it; another machine has it." >&2
      return 1
    fi
    echo "lock: taking over stale $kind lock on PR #$n from $holder (${age}h old)" >&2
    rest_remove_label "$n" "$kind:$holder"
  fi
  lock_ensure_label "$label"
  rest_add_label "$n" "$label"
  [ "${DRY_RUN:-}" = 1 ] && { echo "lock: PR #$n $kind by $me"; return 0; }
  # Race check: if another machine's <kind> label was added before ours, back off.
  other=$(rest_get "issues/$n/events?per_page=100" --paginate \
    | jq -r -s --arg k "$kind:" 'add // [] | [.[] | select(.event=="labeled" and (.label.name | startswith($k)))] | sort_by(.created_at) | .[0].label.name // ""')
  if [ -n "$other" ] && [ "$other" != "$label" ] \
     && rest_get "issues/$n" -q '[.labels[].name] | join(",")' | tr ',' '\n' | grep -qx "$other"; then
    rest_remove_label "$n" "$label"
    echo "LOCKED: PR #$n was taken by ${other#$kind:} a moment before you; backing off." >&2
    return 1
  fi
  echo "lock: PR #$n $kind by $me"
}

# lock_release <N> <kind> -> removes this machine's <kind> label (no-op if absent or held elsewhere)
lock_release() {
  local n="$1" kind="$2" me
  lock_kind_ok "$kind" || return 1
  me=$(machine_of "$AGENT_NAME"); [ -n "$me" ] || return 0
  rest_remove_label "$n" "$kind:$me"
}
