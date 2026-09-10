#!/usr/bin/env bash
# Point git at the repo's hooks: commits/pushes to main are refused, eslint runs on staged
# source and `npm run typecheck` on the project at commit time, and commit messages must be
# Conventional Commits.
set -e
cd "$(dirname "$0")/.."
git config core.hooksPath .githooks
echo "hooks active: commits and pushes to main are blocked on this clone"
echo "hooks active: eslint on staged files, npm run typecheck (warn-only until FAB-003) and conventional-commit checks run on commit"
