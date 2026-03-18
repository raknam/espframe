---
name: gh-r
description: >-
  Creates a GitHub release with an incremental semver tag (major, minor, or patch)
  and triggers the Build Release workflow. Use when the user says "gh-r", "/gh-r",
  "create a release", "cut a release", or wants to tag and publish a new version.
---

# gh-r — Create Release

Create a new GitHub release with an incremented version tag and trigger `.github/workflows/release.yml` (Build Release). The workflow runs when the release is **published** and uploads firmware assets to the release.

## Prerequisites

- GitHub CLI (`gh`) installed and authenticated
- Repo at repo root; uncommitted changes are allowed (tag points at current commit of the default branch unless specified)
- Existing tags follow `vMAJOR.MINOR.PATCH` or `vMAJOR.MINOR.PATCH-prerelease` (e.g. `v1.0.25`, `v1.0.25-beta.2`)

## Steps

### 1. Determine bump type

- If the user **already said** major, minor, or patch → use that.
- Otherwise **ask**: “What kind of release? **major**, **minor**, or **patch**?” and use their answer.

### 2. Resolve next version

- List tags and take the latest by version sort (prerelease tags like `v1.0.25-beta.2` are included; the base version is used for bumping):

```bash
LATEST=$(git tag -l 'v*' --sort=-v:refname | head -1)
# Strip prerelease suffix (e.g. v1.0.25-beta.2 -> v1.0.25)
BASE=${LATEST%%-*}
V=${BASE#v}
IFS=. read -r MAJOR MINOR PATCH <<< "$V"
```

- If no tags exist, treat as `0.0.0` and use **patch** → `v0.0.1` (or ask for an initial version).
- Compute next version from bump type:

  - **patch**: `NEXT="${MAJOR}.${MINOR}.$((PATCH+1))"`
  - **minor**: `NEXT="${MAJOR}.$((MINOR+1)).0"`
  - **major**: `NEXT="$((MAJOR+1)).0.0"`

- Tag name: `v${NEXT}` (e.g. `v1.0.26`).

### 3. Create tag and push

- Create an annotated tag (so the release can use `--notes-from-tag` if desired):

```bash
git tag -a "v${NEXT}" -m "Release v${NEXT}"
git push origin "v${NEXT}"
```

- If the user wants the tag on a different branch or commit, create/push the tag from that ref.

### 4. Create and publish the release

- Creating the release **and publishing it** triggers the Build Release workflow (`release: types: [published]`):

```bash
gh release create "v${NEXT}" --title "v${NEXT}" --generate-notes
```

- Use `--prerelease` for beta/alpha, or `--notes "..."` / `--notes-file FILE` if the user provides notes.
- Do **not** use `--draft` if the goal is to trigger the workflow and upload firmware; the workflow runs only when the release is published.

### 5. Confirm and optionally watch

- Tell the user the release URL and that the Build Release workflow was triggered.
- Optionally run `gh run list --workflow=release.yml --limit=1` and `gh run watch <run-id>` to report success or failure.

## Summary

1. **Ask** bump type (major/minor/patch) if not already specified.
2. Compute next `vMAJOR.MINOR.PATCH` from latest tag.
3. Create annotated tag `v${NEXT}`, push to `origin`.
4. Run `gh release create "v${NEXT}" ...` and **publish** (no `--draft`) so the release workflow runs and attaches firmware.
