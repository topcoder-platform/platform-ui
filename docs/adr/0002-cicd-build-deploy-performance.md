# ADR 0002 — CI/CD build & deploy performance

- **Status:** Proposed — for review
- **Date:** 2026-08-27
- **Repos affected:** `platform-ui` (CI config, build tooling) and `tc-deploy-scripts` (deploy-time S3/CloudFront upload logic — read-reviewed for this ADR; the actual fix is a companion change in that repo, tracked here in Decision 7/Implementation Phase 4, not authored as part of this ADR).
- **Related:**
  - `.circleci/config.yml` — the pipeline this ADR analyzes and proposes changes to; also the pin point for `tc-deploy-scripts`'s version (`install_deploysuite`, `git clone --branch v1.4.17 ...`, line 29).
  - `craco.config.js` — the CRA/webpack override layer this ADR proposes tuning.
  - `package.json` — `build`/`build:dev`/`lint` scripts, and the 115 dependency + 85 devDependency tree driving `node_modules` size.
  - `tc-deploy-scripts/master_deploy.sh` — `deploy_s3bucket()` (lines 750-809) and `invalidate_cf_cache()`/`check_invalidation_status()` (lines 811-845), read at `/media/kiril/1a8f4bfd-4f19-4a00-abfb-de03a319c7c5/home/kiril/dev/tc-deploy-scripts` — the actual per-asset S3 upload and CloudFront invalidation logic this ADR's Decision 7 targets. This script is generic across deployment types (`ECS`/`EBS`/`CFRONT`/`LAMBDA`) and versioned by git tag (currently up to `v1.4.21+` in that repo; `platform-ui` pins the older `v1.4.17` in `.circleci/config.yml`), strongly suggesting it is shared by other `topcoder-platform` services beyond `platform-ui` — see Open questions.

## Context

### What the pipeline looks like today

`platform-ui` builds via Create React App (`react-scripts@5.0.1`) wrapped in `craco`, and ships to CloudFront/S3 via CircleCI (`.circleci/config.yml`). The source tree is a single bundle of **20 sub-apps** under `src/apps/*` (`dev-center` 8.2M, `work` 6.2M, `admin` 4.2M, `review` 4.0M, `learn` 3.5M, plus 15 smaller apps — 40MB source, 4,272 files total), pulling in **115 runtime + 85 dev dependencies** that resolve to a **5.5GB `node_modules`** (`yarn.lock` is 965KB). All 20 apps are compiled and shipped as one artifact — the previous production `build/` output measured 53MB, with a 2.8MB minified `main.js` entry chunk plus a 2.5MB and a 1.1MB chunk.

Every push to a filtered branch runs `lint-dev` and/or one of `build-dev`/`build-qa`/`build-prod` (branch-gated: `build-dev` on non-master/qa branches, `build-qa` on `qa`, `build-prod` on `master`), each a **fresh `node:22.13` container**, followed by the matching `deploy*` job (`master_deploy.sh -d CFRONT`, cloned from `tc-deploy-scripts` on every run via `install_deploysuite`).

### Where the time actually goes

Reading `.circleci/config.yml` and `craco.config.js` directly (not assumed) surfaces several concrete, compounding inefficiencies:

1. **Dependency caching is defined but never wired up.** `restore_cache_settings_for_build` (line 35) and `save_cache_settings` (line 38) are declared as YAML anchors, keyed on `{{ checksum "yarn.lock" }}` — the correct key — but **neither anchor is referenced by any job's `steps` list**. `lint_steps` (line 81) and `build_steps` (line 86) both go straight from `checkout` to installing dependencies with no `restore_cache`/`save_cache` step in between. Every one of `lint-dev`/`build-dev`/`build-qa`/`build-prod` runs `yarn install` against a 5.5GB dependency tree from a cold cache, every single run, regardless of whether `yarn.lock` changed.
2. **`setup_remote_docker` runs in every lint and build job** (`lint_steps` line 83, `build_steps` line 88) despite the fact that nothing in this pipeline builds or runs a Docker image — there is no `Dockerfile` anywhere in the repo, and the deploy step ships static assets to CloudFront/S3 (`master_deploy.sh -d CFRONT`), not a container registry. `setup_remote_docker` provisions a remote Docker Machine, which is pure per-job overhead here.
3. **Redundant global eslint install.** `running_yarn_eslint` (line 43) runs `yarn add eslint@8.57.0 -g` before `yarn lint`, even though `eslint@^8.57.1` is already declared in `package.json`'s `devDependencies` (line 190) and would already be on `PATH` via `node_modules/.bin` after a normal install. This is a second, unnecessary network-bound package install per lint run, and a version-drift risk (`8.57.0` global vs. `^8.57.1` local).
4. **No `resource_class` is set on any job**, so every job defaults to CircleCI's `medium` (2 vCPU / 4GB RAM) — thin for a `yarn install` over 5.5GB of packages followed by a webpack production build (with `fork-ts-checker`/`eslint-webpack-plugin` type-checking and linting inline) across 4,272 source files.
5. **Source maps are not disabled for production builds.** `GENERATE_SOURCEMAP` is never set anywhere in `.env.production`, `.environments/*`, or the `build`/`build:dev` scripts in `package.json` — CRA's default (`true`) applies, so every prod build pays the source-map generation cost, one of the more expensive single steps in a CRA production build at this scale.
6. **No persistent build cache.** `craco.config.js`'s `webpack.configure` (`configureWebpack`, line 130) only adjusts `watchOptions` for dev-server polling; it does not enable webpack 5's filesystem cache (`cache: { type: 'filesystem' }`), so every build recompiles every module from nothing, whether or not it changed since the last run.
7. **Yarn Classic (`1.22.22`, confirmed via `yarn --version`), not Berry or pnpm.** Classic's installer and global cache reuse are materially slower than modern package managers at this dependency count, independent of the CI-caching gap in (1).
8. **Architecturally, all 20 apps are one deployable.** A one-line change to `src/apps/dev-center` (8.2M, the largest app) triggers the exact same full `yarn install` + full webpack build + full CloudFront deploy as a change touching all 20 apps at once. There is no per-app build/deploy boundary.

None of the above is a guess — each is a direct reading of `.circleci/config.yml`, `craco.config.js`, `package.json`, and the built `build/` output as they exist in this repo today.

### Where deploy time actually goes: `tc-deploy-scripts`'s CFRONT upload path

The user's own observation — that deploy time is dominated by uploading individual assets to S3/CloudFront — is confirmed by reading `deploy_s3bucket()` in `tc-deploy-scripts/master_deploy.sh` directly (lines 750-809), and it is worse than a naive "many small files" cost: it's a serial, per-file shell loop that never needed to be one.

**The function does two very different things for two file groups:**

1. **Non-`.js`/`.txt`/`.css` files** (HTML, fonts, images, `.map` files, etc.) go through a single `aws s3 sync` call (line 772) — the AWS CLI's own diff-and-parallelize logic, one process, only-changed-files transferred. This part is already reasonably efficient.
2. **`.js`/`.txt`/`.css` files** — in this repo's `build/` output, **202 of 591 total build files** (confirmed by `find build -name '*.js' -o -name '*.css' -o -name '*.txt' | wc -l`) — explicitly bypass `sync` and instead go through a `for syncfilepath in $(find ...)` loop (lines 784-808) that, **per file**, serially:
   - shells out to `file "$syncfilepath"` (line 789) — one subprocess fork just to sniff the file's encoding;
   - runs `aws s3 cp --dryrun ...` (line 800) — a **second, full AWS CLI process** whose output is only echoed, never checked or acted on (`result=` on the next line re-runs the real command regardless) — pure waste, one full AWS CLI invocation thrown away per file;
   - runs `aws s3 cp ...` for real (line 801) — a **third** AWS CLI process for the actual upload.

   That's up to **~600 serial subprocess invocations for 202 files** in this repo's build alone (`file` + wasted `--dryrun` + real `cp`, none of them parallelized, all in a single-threaded bash loop), each paying full AWS CLI/Python interpreter startup and auth-handshake overhead, versus the one-process, internally-parallel `aws s3 sync` already used for every other file type two lines above it.

**The `file`-sniffing gzip logic this loop exists for is dead code in current usage.** Its purpose (lines 789-797) is to decide whether to add `--content-encoding gzip` to the upload — but it only does so when `file` reports the content as *not* ASCII/UTF/empty, i.e., only when the file is already gzip-compressed on disk. CRA's build output is plain text: `file build/static/js/main.228a94cb.js` on this repo's build reports `"JavaScript source, ASCII text, with very long lines"` — confirmed directly, not assumed. So for every `.js`/`.css` file this repo's build produces, the condition is always true, `S3_OPTIONS=""` is always chosen, and no gzip content-encoding is ever actually applied. The `file` subprocess and the branch it guards currently buy nothing — they only protect against mislabeling already-gzipped bytes, a case that doesn't occur here because nothing in this build pipeline pre-gzips output.

**CloudFront invalidation is unconditional, full-distribution, and blocks the pipeline.** `invalidate_cf_cache()` (lines 833-845) always calls `aws cloudfront create-invalidation --paths '/*'` (line 841) — invalidating the *entire* distribution on every single deploy, even though webpack's content-hashed filenames (`main.228a94cb.js`, `355.1897c4f2.chunk.js`, etc.) are immutable by construction and never need invalidating; only non-hashed entry points (`index.html`, `asset-manifest.json`) actually change identity on deploy. Worse, `check_invalidation_status()` (lines 811-831) then **blocks the deploy job** on that invalidation completing: an unconditional `sleep 60` (line 815) followed by polling every 15s up to `COUNTER_LIMIT` (12) times (line 825) — up to **180 additional seconds** of guaranteed wait, so **1-4 minutes of blocking wait on every deploy**, regardless of how small the actual change was.

## Scope

**In scope:**
- CircleCI pipeline changes: wiring the existing (unused) cache anchors into the actual job steps, removing `setup_remote_docker` from lint/build jobs, removing the redundant global eslint install, setting an explicit `resource_class` on build jobs.
- Build-time changes: disabling source maps for `qa`/`prod` builds, enabling webpack's persistent filesystem cache in `craco.config.js`, and caching that filesystem cache directory in CircleCI alongside `node_modules`.
- **Analysis and a concrete proposed fix for `tc-deploy-scripts`'s `deploy_s3bucket()`/`invalidate_cf_cache()`** (Decision 7) — the per-file upload loop and unconditional full-distribution invalidation identified above. The fix itself is scoped as a companion PR against `tc-deploy-scripts`, since that repo is versioned/tagged independently and (per its generic `ECS`/`EBS`/`CFRONT`/`LAMBDA` shape) likely shared by other services — this ADR specifies *what* should change and *why*, not a direct edit made from `platform-ui`.
- **Removing the retired `qa` environment entirely** (Decision 8) — its `build-qa`/`deployQa` CI jobs, `.environments/.env.qa`, and any remaining `qa`/`QA` references — since it no longer exists and every push to that branch currently still pays for a full extra build+deploy cycle nobody uses.
- A documented, sequenced plan for the longer-term structural changes (bundler migration, package-manager migration, per-app build/deploy splitting) — decisions on *whether and when* to execute these, not the execution itself.

**Out of scope (deferred, not rejected):**
- Direct edits to `tc-deploy-scripts` from this repo/ADR — Decision 7 specifies the change; landing it is a separate PR in that repo, coordinated with whoever owns it, given the shared-infra risk noted in Open questions.
- `buildenv.sh`/`awsconfiguration.sh`/`psvar-processor.sh` — read as part of understanding the pipeline but no performance issue was found in them; only `deploy_s3bucket()`/`invalidate_cf_cache()` in `master_deploy.sh` are addressed here.
- Migrating off CRA/react-scripts to a different bundler (Vite, esbuild, swc) — named as a long-term option below, not decided here.
- Migrating from Yarn Classic to Yarn Berry or pnpm — named as a long-term option below, not decided here.
- Splitting the 20-app monolith into independently built/deployed micro-frontends — named as a long-term option below, not decided here; a decision of this size needs its own ADR once the quick wins below are measured.
- Adding a test job to CI — noted as a gap encountered during this analysis (no `test`/`test:no-watch` job exists in `.circleci/config.yml` today), but orthogonal to build/deploy *speed* and not addressed here.

## Decision

### 1. Wire up the dependency cache that already exists (quick win)

Add `restore_cache: *restore_cache_settings_for_build` immediately after `checkout` and before dependency installation in both `lint_steps` and `build_steps`, and add `save_cache: *save_cache_settings` immediately after the install step, before the build/lint step runs. The anchors are already correctly keyed on `{{ checksum "yarn.lock" }}` — this is a steps-list change only, no new anchors needed.

```yaml
lint_steps: &lint_steps
    - checkout
    - restore_cache: *restore_cache_settings_for_build
    - run: *running_yarn_eslint
    - save_cache: *save_cache_settings

build_steps: &build_steps
    - checkout
    - run: *install_build_dependency
    - run: *install_deploysuite
    - run: *build_configuration_fetch
    - restore_cache: *restore_cache_settings_for_build
    - run: *running_yarn_build
    - save_cache: *save_cache_settings
    - persist_to_workspace: *workspace_persist
```

This is the single highest-leverage change in this ADR: it turns every `yarn install` from a cold 5.5GB fetch-and-link into a cache hit whenever `yarn.lock` is unchanged (the common case — most commits touch `src/`, not dependencies).

### 2. Remove `setup_remote_docker` from lint/build jobs

Neither job builds or uses a Docker image; the line is dead weight inherited from a template. Drop it from both `lint_steps` and `build_steps` (see the step lists above — it is simply absent). If a future need for Docker-in-CI arises (e.g., containerized builds), it should be re-added deliberately at that point, not carried forward unused.

### 3. Remove the redundant global eslint install

Change `running_yarn_eslint` from:
```yaml
command: |
    yarn add eslint@8.57.0 -g
    yarn lint
```
to:
```yaml
command: yarn lint
```
`yarn lint` (`package.json` line — `eslint --quiet -c ./src/.eslintrc.js 'src/**/*.{ts,tsx,js,jsx}'`) already resolves `eslint` from the local `node_modules/.bin` once dependencies are installed (Decision 1 ensures they are, from cache). This removes a second network-bound install per lint run and eliminates the `8.57.0` (global) vs. `^8.57.1` (local, `package.json` line 190) version mismatch.

### 4. Set an explicit `resource_class` on build jobs

Add `resource_class: large` to `build-dev`/`build-qa`/`build-prod` (leave `lint-dev` on the default `medium` — linting is far less CPU-bound than a full webpack production build). This is a config-only change; verify actual wall-clock impact against the `xlarge` tier once `large` is measured, per the Implementation plan's before/after measurement step.

### 5. Disable source maps for `prod` builds

Add `GENERATE_SOURCEMAP=false` to `.environments/.env.prod` (the file `CracoEnvPlugin` already loads per `craco.config.js`'s `envDir: './.environments'` config), or export it directly in the `running_yarn_build` CircleCI step for the `prod` job specifically. Leave source maps enabled for `dev` (`.environments/.env.dev`) where they aid debugging. (`qa` is out of scope here — see Decision 8, which removes that environment entirely rather than tuning it.)

### 6. Enable webpack's persistent filesystem cache

Extend `configureWebpack` in `craco.config.js` (currently only touching `watchOptions`, line 130) to also set:
```js
webpackConfig.cache = {
    type: 'filesystem',
    buildDependencies: {
        config: [__filename],
    },
};
```
Then cache the resulting `node_modules/.cache/webpack` directory in CircleCI (a second `save_cache`/`restore_cache` pair, keyed similarly to `yarn.lock` plus a source-tree-sensitive key, since webpack's own cache invalidates per-module internally and a stale directory is safe to restore). This turns unchanged-module recompilation into a cache hit both locally (already true for repeat local builds) and in CI (net new).

### 7. Fix `tc-deploy-scripts`'s per-file S3 upload loop and full-distribution invalidation (companion PR, `tc-deploy-scripts`)

Replace `deploy_s3bucket()`'s two-tier logic (one `sync` call, then a 200+ file serial `cp` loop) with **two `aws s3 sync` calls, split by cache lifetime, not by file extension**:

```bash
# Content-hashed, immutable static assets (JS/CSS chunks, media under /static/)
# — safe to cache forever, since a content change always produces a new filename.
aws s3 sync "$AWS_S3_SOURCE_SYNC_PATH/static" "s3://${AWS_S3_BUCKET}/static" \
    --cache-control "public,max-age=31536000,immutable"

# Everything else (index.html, asset-manifest.json, favicon, etc.)
# — non-hashed entry points; keep the existing short/no-cache behavior.
aws s3 sync "$AWS_S3_SOURCE_SYNC_PATH" "s3://${AWS_S3_BUCKET}" \
    --exclude "static/*" \
    ${S3_CACHE_OPTIONS}
```

This removes the per-file `for` loop entirely: no `file` subprocess, no wasted `--dryrun` call, no per-file `aws s3 cp` — two `sync` invocations instead of up to ~600 serial subprocess calls, with `sync`'s own internal parallelism and only-upload-what-changed diffing doing the work. It also fixes a real (if currently dormant) correctness gap: the existing code applies the *same* short-lived cache-control (`S3_CACHE_OPTIONS`, `max-age=0,s-maxage=86400` or `no-store`) to immutable, content-hashed chunk files as it does to `index.html` — those hashed files should be cached by browsers for a year, since a new deploy always ships a new filename for changed content; the current uniform policy just means browsers needlessly re-fetch unchanged chunks more often than necessary. If gzip pre-compression is wanted, it should become a deliberate build-time step (e.g., `compression-webpack-plugin` emitting `.js.gz`/`.css.gz` alongside the originals, uploaded with a real `--content-encoding gzip`) rather than the current dead runtime sniff — see Long-term options.

Separately, scope `invalidate_cf_cache()` to only the paths that can actually change identity across a deploy — `/index.html`, `/asset-manifest.json`, and any other non-hashed root-level file — instead of `/*`:

```bash
aws cloudfront create-invalidation --distribution-id "$AWS_CLOUD_FRONT_ID" \
    --paths '/index.html' '/asset-manifest.json'
```

Content-hashed files under `/static/` never need invalidating — their filename *is* the cache key. This also makes the case for revisiting whether `check_invalidation_status()`'s blocking `sleep 60` + poll-up-to-180s (lines 815-828) needs to block the CI job at all, versus firing the invalidation and letting the job succeed without waiting on propagation — nothing downstream in `master_deploy.sh`'s `CFRONT` branch depends on the invalidation having completed before the script exits.

### 8. Remove the QA environment entirely (`platform-ui`)

The `qa` logical environment no longer exists — this pipeline should stop building, deploying, and configuring for it rather than continuing to pay its cost (a full extra `build-qa` job — its own cold `yarn install`, its own webpack build — plus a `deployQa` job, on every push to the `qa` branch) for an environment nobody uses. Confirmed still present in `.circleci/config.yml` today:

- `build-qa` job (lines 137-143) and `deployQa` job (lines 163-170).
- Workflow entries: `build-qa` (lines 209-215), `deployQa` (lines 237-245, which also uniquely lists a `profiles-app` branch alongside `qa` — that branch's filter needs an explicit decision, not a silent drop, since removing `deployQa` entirely would also stop deploying `profiles-app`).
- `build-dev`'s branch filter explicitly `ignore`s `qa` (line 205) — this exclusion becomes dead once the `qa` branch no longer triggers anything, but is harmless to leave or remove.
- `.environments/.env.qa` (`REACT_APP_HOST_ENV=qa`) — the environment file `CracoEnvPlugin` loads for `LOGICAL_ENV=qa` builds, now orphaned.

**Proposed removal**, once the `profiles-app` question (Open questions) is resolved:
- Delete the `build-qa` and `deployQa` job definitions from `.circleci/config.yml`.
- Delete the `build-qa` and `deployQa` entries from the `workflows.build.jobs` list.
- Remove `qa` from `build-dev`'s branch `ignore` list (line 205) — no longer meaningful once the `qa` branch has no jobs of its own.
- Delete `.environments/.env.qa`.
- Grep the rest of the repo (`README.md`, any onboarding docs, `EnvironmentConfig`/`global-config.model.ts` defaults, and any `LOGICAL_ENV`/`DEPLOY_ENV`/`REACT_APP_HOST_ENV` conditionals in `src/`) for lingering `qa`/`QA` references and remove or update each one rather than leaving a partial cleanup — an environment that's half-removed (e.g., app code that still branches on `HOST_ENV === 'qa'`) is worse than one left fully in place, since it's silently unreachable dead code instead of visibly-still-active config.
- This also **simplifies Decision 5**: with `qa` gone, `GENERATE_SOURCEMAP=false` only needs deciding for `.environments/.env.prod` — the earlier "confirm with whoever owns `qa` debugging workflows" question (previously a Prerequisite) is moot and removed below.

## Implementation plan

### Phase 0 — Baseline measurement
- Record current wall-clock time for `build-dev`/`build-qa`/`build-prod` and `lint-dev` from CircleCI's own job timing, for the last 10 runs of each, as the "before" baseline every change below is measured against. Without this, "quick wins" changes 1–6 cannot be verified.

### Phase 1 — Pipeline quick wins (`.circleci/config.yml`)
- Decision 1: wire up `restore_cache`/`save_cache` in both `lint_steps` and `build_steps`.
- Decision 2: drop `setup_remote_docker` from both step lists.
- Decision 3: drop the global `yarn add eslint -g` line.
- Decision 4: add `resource_class: large` to the three build jobs.
- Decision 8: remove `build-qa`/`deployQa` and their workflow entries, once the `profiles-app` branch question (Open questions) is resolved; remove `qa` from `build-dev`'s branch-ignore list; delete `.environments/.env.qa`; sweep the repo for lingering `qa`/`QA` references.
- Re-measure against the Phase 0 baseline; this phase alone is expected to produce the largest single improvement (cold `yarn install` elimination, plus one fewer job class running per push to the former `qa` branch).

### Phase 2 — Build-output quick wins
- Decision 5: `GENERATE_SOURCEMAP=false` for `qa`/`prod`.
- Decision 6: webpack filesystem cache in `craco.config.js` + a second CircleCI cache pair for `node_modules/.cache/webpack`.
- Re-measure; confirm production bundle output is unchanged aside from the absence of `.map` files (verify `qa`/`prod` deploys still serve correctly without them — Consequences below).

### Phase 3 — `tc-deploy-scripts`: fix the CFRONT upload path (companion PR, separate repo)
- Decision 7: replace `deploy_s3bucket()`'s per-file loop with the two split `aws s3 sync` calls; scope `invalidate_cf_cache()`'s `--paths` to non-hashed entry points instead of `/*`.
- Cut a new `tc-deploy-scripts` version tag once merged and reviewed by that repo's owner(s) (see Open questions on shared-usage coordination).
- Bump `.circleci/config.yml`'s `install_deploysuite` (`git clone --branch v1.4.17 ...`, line 29) to the new tag in a `platform-ui` follow-up commit — the fix has no effect until this pin moves.
- Re-measure deploy job wall-clock time specifically (not build time) against the Phase 0 baseline; this is expected to be the largest single improvement to *deploy* latency in this ADR, separate from the build-time improvements in Phases 1-2.

### Phase 4 — Decide on structural changes (own ADR, not this one)
- With Phase 1/2 numbers in hand, decide whether the remaining time is still dominated by webpack compilation itself (→ bundler migration becomes worth its cost) or by dependency count/install (→ package-manager migration becomes worth its cost) or by the monolith's sheer size (→ splitting becomes worth its cost). This ADR intentionally stops short of committing to any of the three long-term options below without that data.

## Long-term options (named here, not decided)

- **Bundler migration**: move off `react-scripts`/webpack to Vite (or add `esbuild`/`swc`-based loaders under `craco`). Highest potential speedup for compile-heavy workloads at this file count; highest migration effort and regression risk given 4,272 source files and CRA-specific tooling (`craco`, `.babelrc.json`, jest config) throughout.
- **Package-manager migration**: Yarn Classic → Yarn Berry or pnpm, for faster installs and better cross-run cache reuse independent of CI-level caching. Moderate effort (lockfile migration, CI script updates), low regression risk.
- **Per-app build/deploy splitting**: extract the largest, most independently-changed apps (`dev-center`, `work`, `admin`, `review`, `learn`) into separately built/deployed units (module federation, or separate CloudFront distributions/paths), so a change to one app no longer forces a full rebuild/redeploy of all 20. Highest effort and highest architectural risk (routing, shared-dependency versioning, cross-app auth/state); highest long-run payoff as the app count keeps growing.
- **Deliberate gzip/brotli pre-compression**: add `compression-webpack-plugin` to `craco.config.js` to emit `.js.gz`/`.css.gz` (or Brotli `.br`) alongside build output, and have `tc-deploy-scripts` upload them with a correct `--content-encoding`. This would make the currently-dead gzip branch in `deploy_s3bucket()` (Context, above) actually do something, rather than just deleting it — worth deciding once Decision 7 ships and the baseline (no compression) is measured against.

## File-level mapping

| Repo | File | Change |
| --- | --- | --- |
| platform-ui | `.circleci/config.yml` | Modified — wire `restore_cache`/`save_cache` into `lint_steps`/`build_steps`; remove `setup_remote_docker` from both; remove global `yarn add eslint -g`; add `resource_class: large` to `build-dev`/`build-prod`; add a second cache pair for the webpack filesystem cache directory; bump `install_deploysuite`'s `tc-deploy-scripts` tag once Phase 3 ships; **delete `build-qa`/`deployQa` jobs and their workflow entries; remove `qa` from `build-dev`'s branch-ignore list** |
| platform-ui | `craco.config.js` | Modified — `configureWebpack` gains `cache: { type: 'filesystem', ... }` |
| platform-ui | `.environments/.env.qa` | **Deleted** — `qa` environment retired (Decision 8) |
| platform-ui | `.environments/.env.prod` | Modified — `GENERATE_SOURCEMAP=false` |
| tc-deploy-scripts | `master_deploy.sh` | Modified — `deploy_s3bucket()` replaced with two split `aws s3 sync` calls (immutable `/static/*` vs. short-lived-cache entry points); `invalidate_cf_cache()`'s `--paths` scoped to non-hashed entry points instead of `/*` |

## Consequences

**Positive**
- Cold-cache `yarn install` (currently paid on every single CI run against a 5.5GB tree) becomes a cache hit on any run where `yarn.lock` didn't change — the majority of commits.
- Removes two forms of pure waste (`setup_remote_docker` with no Docker usage; a redundant global eslint install) with zero functional change to what's built or deployed.
- Disabling source maps for `qa`/`prod` shrinks both build time and deploy payload (fewer/smaller files uploaded to S3, less for CloudFront to serve) for the two environments that don't need them.
- **Decision 7 collapses up to ~600 serial subprocess invocations per deploy into two `aws s3 sync` calls**, and removes the unconditional 1-4 minute blocking wait on a full-distribution invalidation that content-hashed filenames never needed in the first place — directly addressing the deploy-time bottleneck the user identified, independent of anything in Phases 1-2.
- **Decision 8 removes an entire redundant build+deploy cycle** (`build-qa` + `deployQa`) that currently still runs, cold-cache, on every push to the `qa` branch for an environment nobody uses — pure elimination, not just optimization, of that CI cost. It also removes a source of confusion for anyone reading the pipeline fresh (a `qa` job class implies a `qa` environment exists).
- All eight quick-win changes (seven in `platform-ui`, one in `tc-deploy-scripts`) are independently revertible — none is an all-or-nothing architectural bet.

**Negative / risk**
- **`resource_class: large` costs more per CI minute** than `medium` — expected to be offset by shorter run times, but should be confirmed against actual CircleCI billing after Phase 1, not assumed.
- **Disabling source maps for `qa` removes a debugging aid** the team may currently rely on when triaging issues that only reproduce in that environment. If `qa` debugging via source maps turns out to be load-bearing, only disable for `prod` and keep `qa` as-is.
- **Webpack's filesystem cache can go stale in ways that are hard to detect** (a known class of webpack-5-cache bug where a build dependency change isn't correctly detected). The `buildDependencies: { config: [__filename] }` entry covers `craco.config.js` changes specifically; a `yarn.lock` change already busts the CircleCI cache layer above it. Mitigation: Phase 2 must confirm output parity (asset hashes, functional smoke test) on a cache-hit build, not just a faster wall-clock time.
- **`master_deploy.sh` is shared, generic infrastructure** (`ECS`/`EBS`/`CFRONT`/`LAMBDA` deployment types all in one script, independently versioned by git tag) — Decision 7's change to `deploy_s3bucket()`/`invalidate_cf_cache()` only affects the `CFRONT` path, but any other `CFRONT` consumer of this script beyond `platform-ui` inherits the same behavior change. This must be coordinated with that repo's owner(s) before merging, not treated as a `platform-ui`-only decision — see Open questions.
- **The new immutable cache-control policy (`max-age=31536000,immutable` on `/static/*`) is a real behavior change**, not just a speed fix: browsers will cache those files for a year. This is safe *because* webpack content-hashes those filenames (a content change always produces a new filename), but it should be verified against this repo's actual `build/static/` output structure before rollout — confirm nothing under `/static/` is ever served under a stable, non-hashed filename that could then get stuck cached.
- **Scoping CloudFront invalidation away from `/*`** means a bug in `tc-deploy-scripts` that ever changes a *non-hashed* filename's content without renaming it (unlikely with CRA's default hashing, but not structurally impossible) would no longer self-correct via a full invalidation. Mitigation: keep `index.html` and `asset-manifest.json` (the actual entry points) in the invalidation list, exactly as Decision 7 proposes — only the already-immutable hashed assets are excluded.
- **Decision 8's `deployQa` removal also removes `profiles-app`'s only deploy path**, since that job's branch filter currently lists `profiles-app` alongside `qa` (`.circleci/config.yml` lines 237-245) — deleting the job wholesale would silently stop deploying that branch too. This must be resolved explicitly (retarget `profiles-app` to an existing job, e.g. `deployDev`, or confirm it's equally retired) before Decision 8 is merged, not discovered after the fact — see Open questions.

## Open questions

- **Who else consumes `tc-deploy-scripts`'s `CFRONT` deployment type, and does Decision 7's change need their sign-off?** The script's generic, multi-deployment-type shape and independent tagging strongly suggest other `topcoder-platform` services use it too. This needs an answer before Phase 3 can land — either from that repo's own usage/owners, or by grepping other services' `.circleci/config.yml` for `-d CFRONT`.
- **Should `lint-dev` also get a `resource_class` bump**, or is `medium` sufficient once it's no longer paying for `setup_remote_docker` and a redundant global install? Recommend deciding after Phase 1 measurement rather than guessing.
- **Is there an appetite for the Phase 4 structural changes at all**, given their effort/risk, or is the team's bar "make the existing pipeline fast," full stop? This materially changes whether Phase 4 ever starts. Worth an explicit answer before any long-term option is scoped into its own ADR.
- **No CI test job exists today** (`test`/`test:no-watch` scripts exist in `package.json` but are not wired into `.circleci/config.yml`). Not a speed problem, but surfaced during this analysis — worth a separate, deliberate decision rather than silently staying absent.
- **Should `check_invalidation_status()`'s blocking wait be removed entirely** (fire the invalidation, don't wait on it) once invalidation is scoped to two paths instead of the whole distribution, or is there a downstream reason (e.g., a smoke test that assumes the new `index.html` is already live) that still needs it to block? Named in Decision 7 but left as a follow-up rather than bundled into the same PR, to keep that PR's diff reviewable.
- **Where should the `profiles-app` branch deploy once `deployQa` is removed** (Decision 8 / Consequences)? Options: retarget it to `deployDev`'s filter, give it no automatic deploy job at all if that branch is itself stale, or confirm with whoever owns it that it's fine to drop entirely. Must be answered before Decision 8 merges — this is the one part of the QA cleanup that isn't a pure no-op removal.

## Prerequisites to confirm before implementation starts

- Confirm CircleCI project settings permit the `large` resource class (org-level plan/quota) before Decision 4 is merged — a job requesting an unavailable class fails outright rather than degrading gracefully.
- Identify and get sign-off from `tc-deploy-scripts`'s owning team before Decision 7 lands — confirm no other `CFRONT` consumer depends on the current uniform cache-control or full-distribution invalidation behavior, and agree on the new version tag / release process for that repo.
- Resolve the `profiles-app` branch question (Open questions) before Decision 8's `deployQa` removal merges.
- Reviewer sign-off on: Phase 1/2 as an immediately-mergeable, low-risk batch within `platform-ui`; Decision 7 as a correctly-scoped but cross-repo change requiring external coordination before Phase 3 starts; Decision 8 as a straightforward removal contingent only on the `profiles-app` answer; the Phase 4 long-term options as directional-only (no commitment).
