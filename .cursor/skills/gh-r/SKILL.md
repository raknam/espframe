---
name: gh-r
description: >-
  Creates a GitHub release with an incremental semver tag (major, minor, or patch)
  and triggers the Build Release workflow. Use when the user says "gh-r", "/gh-r",
  "gh-release", "create a release", "cut a release", or wants to tag and publish a new version.
---

# gh-r — Create Release

Create a new GitHub release with an incremented version tag and trigger `.github/workflows/release.yml` (Build Release). Publishing the release runs the workflow and uploads firmware to the release.

## Prerequisites

- GitHub CLI (`gh`) installed and authenticated (`gh auth status`)
- Repo at repo root; tags are created from the **current HEAD** of the branch you're on (default branch is typical)
- Existing tags: `vMAJOR.MINOR.PATCH` or `vMAJOR.MINOR.PATCH-prerelease` (e.g. `v1.0.25`, `v1.0.25-beta.2`)

## Steps

### 1. Determine bump type

- If the user **already said** major, minor, or patch → use that.
- Otherwise **ask**: “What kind of release? **major**, **minor**, or **patch**?” and use their answer.

### 2. Resolve next version

- Latest tag (prerelease suffix stripped for bump base):

```bash
LATEST=$(git tag -l 'v*' --sort=-v:refname | head -1)
BASE=${LATEST%%-*}   # v1.0.25-beta.2 -> v1.0.25
V=${BASE#v}
IFS=. read -r MAJOR MINOR PATCH <<< "$V"
```

- No tags? Use `0.0.0` → patch bump gives `v0.0.1` (or ask for initial version).
- Next version:
  - **patch**: `NEXT="${MAJOR}.${MINOR}.$((PATCH+1))"`
  - **minor**: `NEXT="${MAJOR}.$((MINOR+1)).0"`
  - **major**: `NEXT="$((MAJOR+1)).0.0"`

- Tag: `v${NEXT}`.

### 3. Confirm before creating

- Tell the user: “Next release will be **v${NEXT}** (${bump} bump from ${BASE}). Proceed?”
- If they say no or want a different bump, re-ask or recompute and confirm again.
- Optionally check: `git status` (uncommitted changes are allowed; tag will point at current HEAD).

### 4. Create tag and push

```bash
git tag -a "v${NEXT}" -m "Release v${NEXT}"
git push origin "v${NEXT}"
```

- For a different ref: create/push the tag from that branch or commit.

### 5. Create and publish the release

- **Publishing** triggers the workflow (draft releases do not):

```bash
gh release create "v${NEXT}" --title "v${NEXT}" --generate-notes
```

- Add `--prerelease` for beta/alpha; use `--notes "..."` or `--notes-file FILE` if the user provides notes.
- Do **not** use `--draft` if you want the workflow to run and attach firmware.

### 6. Confirm and optionally watch

- Share the release URL and that Build Release was triggered.
- Optionally: `gh run list --workflow=release.yml --limit=1` then `gh run watch <run-id>`.

## Edge cases

- **Tag already exists**: `git push origin "v${NEXT}"` will fail; tell the user and suggest a different bump or deleting the tag if intentional.
- **Prerelease (e.g. v1.0.26-beta.1)**: Create tag `v1.0.26-beta.1` and use `gh release create ... --prerelease`. Bump is still computed from the latest tag’s base version (e.g. 1.0.25 → 1.0.26), then add `-beta.1`; if the user wants “next beta after v1.0.26-beta.2”, ask or infer and set the tag accordingly.
- **Build-only without release**: Use `gh workflow run release.yml` (workflow_dispatch). Build runs but firmware is not uploaded to a release (upload step is `if: github.event_name == 'release'`).
