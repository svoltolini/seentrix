#!/usr/bin/env bash
# Seentrix nightly auto-push to main.
#
# Fired by launchd from `~/Library/LaunchAgents/com.seentrix.autopush.plist`
# at 23:58 local time daily. Mirrored by a Claude Code cron at 23:57 — the
# launchd path is the durable safety net (survives reboots, sleep, terminal
# close, anything that takes the Claude session down).
#
# The script is idempotent: running it manually is safe. It skips and
# logs rather than pushing whenever ANY of these is true:
#
#   - the worktree has uncommitted changes
#   - the main repo has uncommitted changes
#   - the main repo isn't on `main`
#   - the worktree branch has no commits ahead of origin/main
#   - main has commits the worktree branch doesn't (divergence)
#
# Logs one line per run to `~/Library/Logs/seentrix-autopush.log` in the
# format `YYYY-MM-DD HH:MM:SS [STATUS] message`. Tail the log to audit.

set -u

# launchd doesn't inherit a shell PATH, so we explicitly include the
# common Homebrew + system git locations.
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"

WORKTREE_PATH="$HOME/Desktop/Seentrix/.claude/worktrees/affectionate-perlman-e89dc3"
MAIN_PATH="$HOME/Desktop/Seentrix"
LOG_FILE="$HOME/Library/Logs/seentrix-autopush.log"

mkdir -p "$(dirname "$LOG_FILE")"
touch "$LOG_FILE"

log() {
  local status="$1"
  shift
  printf '%s [%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$status" "$*" >> "$LOG_FILE"
}

# --- Resolve the worktree branch -------------------------------------------

if [[ ! -d "$WORKTREE_PATH/.git" && ! -f "$WORKTREE_PATH/.git" ]]; then
  log SKIP "worktree at $WORKTREE_PATH not found"
  exit 0
fi

BRANCH="$(git -C "$WORKTREE_PATH" branch --show-current 2>/dev/null || true)"
if [[ -z "${BRANCH:-}" ]]; then
  log SKIP "could not resolve branch name in worktree"
  exit 0
fi

# --- Worktree must be clean ------------------------------------------------

if [[ -n "$(git -C "$WORKTREE_PATH" status --porcelain 2>/dev/null || true)" ]]; then
  log SKIP "worktree '$BRANCH' has uncommitted changes"
  exit 0
fi

# --- Main repo must be clean and on `main` ---------------------------------

if [[ ! -d "$MAIN_PATH/.git" ]]; then
  log SKIP "main repo at $MAIN_PATH not found"
  exit 0
fi

MAIN_BRANCH="$(git -C "$MAIN_PATH" branch --show-current 2>/dev/null || true)"
if [[ "${MAIN_BRANCH:-}" != "main" ]]; then
  log SKIP "main repo is on '${MAIN_BRANCH:-(none)}', not 'main'"
  exit 0
fi

if [[ -n "$(git -C "$MAIN_PATH" status --porcelain 2>/dev/null || true)" ]]; then
  log SKIP "main repo has uncommitted changes"
  exit 0
fi

# --- Fetch + compare -------------------------------------------------------

if ! git -C "$MAIN_PATH" fetch --all --prune --quiet 2>/dev/null; then
  log ERROR "git fetch failed"
  exit 1
fi

AHEAD="$(git -C "$MAIN_PATH" rev-list --count "origin/main..origin/$BRANCH" 2>/dev/null || echo 0)"
if [[ "$AHEAD" == "0" ]]; then
  log SKIP "branch '$BRANCH' has no commits ahead of origin/main"
  exit 0
fi

BEHIND="$(git -C "$MAIN_PATH" rev-list --count "origin/$BRANCH..origin/main" 2>/dev/null || echo 0)"
if [[ "$BEHIND" != "0" ]]; then
  log SKIP "origin/main has $BEHIND commits not on '$BRANCH' (manual merge needed)"
  exit 0
fi

# --- Fast-forward main + push ---------------------------------------------

if ! git -C "$MAIN_PATH" pull --ff-only origin main --quiet 2>/dev/null; then
  log ERROR "git pull --ff-only main failed"
  exit 1
fi

if ! git -C "$MAIN_PATH" merge --ff-only "origin/$BRANCH" --quiet 2>/dev/null; then
  log ERROR "git merge --ff-only origin/$BRANCH failed"
  exit 1
fi

if ! git -C "$MAIN_PATH" push origin main --quiet 2>/dev/null; then
  log ERROR "git push origin main failed"
  exit 1
fi

SHA="$(git -C "$MAIN_PATH" rev-parse --short HEAD)"
log OK "fast-forwarded main to $SHA ($AHEAD new commits from $BRANCH)"
exit 0
