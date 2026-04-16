---
name: gh-r
description: >-
  Creates a GitHub release with an incremental semver tag (major, minor, or
  patch) and triggers the Build Release workflow. Use when the user says
  "gh-r", "/gh-r", "create a release", "cut a release", or wants to tag and
  publish a new version.
---

# gh-r - Create Release

Create a new GitHub release with an incremented version tag and trigger
`.github/workflows/release.yml` (Build Release). The workflow runs when the
release is published and uploads firmware assets to the release.

## Prerequisites

- GitHub CLI (`gh`) is installed and authenticated.
- Run commands from the repository root.
- Uncommitted changes are allowed, but the tag should point at the intended
  release commit or ref.
- Existing tags follow `vMAJOR.MINOR.PATCH` or
  `vMAJOR.MINOR.PATCH-prerelease`, such as `v1.0.25` or `v1.0.25-beta.2`.

## Workflow

1. Determine the bump type.

   If the user already said `major`, `minor`, or `patch`, use that. Otherwise
   ask: "What kind of release: major, minor, or patch?"

2. Resolve the next version.

   Fetch tags first when possible, then list tags by version sort. Include
   prerelease tags when finding the latest tag, but strip the prerelease suffix
   before bumping.

   ```bash
   git fetch --tags origin
   LATEST=$(git tag -l 'v*' --sort=-v:refname | head -1)
   BASE=${LATEST%%-*}
   V=${BASE#v}
   IFS=. read -r MAJOR MINOR PATCH <<< "$V"
   ```

   If no tags exist, treat the current version as `0.0.0`. Use the requested
   bump type, except when no type was provided and the user wants the default:
   use patch for `v0.0.1`.

   Compute the next version:

   ```bash
   case "$BUMP" in
     patch) NEXT="${MAJOR}.${MINOR}.$((PATCH+1))" ;;
     minor) NEXT="${MAJOR}.$((MINOR+1)).0" ;;
     major) NEXT="$((MAJOR+1)).0.0" ;;
   esac
   TAG="v${NEXT}"
   ```

3. Create and push an annotated tag.

   ```bash
   git tag -a "$TAG" -m "Release $TAG"
   git push origin "$TAG"
   ```

   If the user wants the tag on a different branch or commit, create and push
   the tag from that ref.

4. Create and publish the GitHub release.

   Creating a published release triggers the Build Release workflow configured
   with `release: types: [published]`.

   ```bash
   gh release create "$TAG" --title "$TAG" --generate-notes
   ```

   Use `--prerelease` for beta or alpha releases when requested. Use
   `--notes "..."` or `--notes-file FILE` if the user provides release notes.
   Do not use `--draft` when the goal is to trigger the workflow and upload
   firmware, because the workflow runs only after the release is published.

5. Confirm and optionally watch.

   Tell the user the release URL and that the Build Release workflow was
   triggered. Offer to watch the workflow, or watch it directly if the user
   requested that.

   ```bash
   gh run list --workflow=release.yml --limit=1
   gh run watch <run-id>
   ```

## Summary

1. Ask for `major`, `minor`, or `patch` if the user has not already specified
   the bump type.
2. Compute the next `vMAJOR.MINOR.PATCH` from the latest semver tag.
3. Create and push an annotated tag.
4. Create a published GitHub release, not a draft, so the release workflow runs.
