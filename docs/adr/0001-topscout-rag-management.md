# ADR 0001 — TopScout RAG Management admin page

- **Status:** Proposed — for review
- **Date:** 2026-08-27
- **Repos affected:** `platform-ui` (this ADR, admin UI), `tc-ai-api` (two new HTTP endpoints — companion implementation work tracked here since the UI cannot ship without them)
- **Related:**
  - `tc-ai-api` ADR 0004 — role-based access control for agents/workflows/tools (Proposed, same date). Restricts `challenge-ingestion`/`challenge-bulk-ingestion` to `roles: ['administrator']` / `scopes: ['challengesRAG:admin']` by default and introduces the reusable `checkAccess`/`toAuthenticatedCaller` policy core this ADR depends on.
  - `tc-ai-api/src/mastra/agents/challenge/challenge-search-agent.ts` — the TopScout agent this page's index feeds.
  - `tc-ai-api/src/mastra/workflows/challenge/challenge-ingestion-workflow.ts`, `challenge-bulk-ingestion-workflow.ts` — the two workflows this page drives.
  - `platform-ui/src/libs/shared/lib/services/ai-workflows.tsx` — existing shared workflow-run/poll helper, already used for single-challenge ingestion.
  - `platform-ui/src/apps/admin/src/lib/components/ChallengeList/ChallengeList.tsx` — existing single-challenge "Upsert for TopScout" action (toast-driven), the nearest prior art in this repo.
  - `platform-ui/src/apps/admin/src/ai/review-workflows/AiReviewWorkflowsPage.tsx` — page-shell precedent this ADR follows (list + filter + confirm-modal architecture).
  - `platform-ui/src/apps/customer-portal/src/pages/talent-search/TalentSearchPage/TalentSearchPage.tsx` — loading-state precedent for a blocking AI action (`isExtractingSkills` boolean + label swap), reused for the bulk-ingestion "run" state.

## Context

### What TopScout's RAG pipeline looks like today

`challenge-search-agent` (id `challenge-search-agent`) answers questions by querying a PgVector index (`PgVector`, `@mastra/pg`) whose default name is **`challenge_embeddings`**, in schema `ai` (`MASTRA_DB_SCHEMA`, default `ai`), created and dimension-guarded lazily by `ensureChallengeIndex()` (`tc-ai-api/src/mastra/vector/challenge-vector-store.ts`). One challenge produces many rows — one per description chunk — each row's `metadata` JSONB carrying `challengeId`, `name`, `type`, `track`, `skills`, `groups`, `projectId`, `chunkIndex`/`totalChunks`, `text`, `ingestedAt`. `type`/`track` are free-form strings, never enum-validated (`rag.config.ts`'s D12), though `rag.config.ts` does export an *informational* `KNOWN_TYPES`/`KNOWN_TRACKS` pair for readability. `metadataIndexes: ['challengeId', 'projectId', 'track']` are the only three JSONB paths currently btree-indexed.

Two Mastra workflows populate this index:
- `challenge-ingestion` (id `challenge-ingestion`) — one challenge, by id or inline record: resolve → chunk/embed the **public** description only → `store.upsert({ ..., deleteFilter: { challengeId } })` (atomic per-challenge replace).
- `challenge-bulk-ingestion` (id `challenge-bulk-ingestion`) — paginates `searchChallengesTool` over a filter (`status`, `projectId`, `types`, `tracks`, `tags`, `groups`, `updatedDateStart`), fans out `challenge-ingestion` per match (bounded concurrency), aggregates a report (`processed`/`succeeded`/`failed`/`skipped`/`totalChunks`/`forceSplits`/per-challenge `results[]`).

Both are exposed over Mastra's native HTTP surface (`POST /v6/ai/workflows/:workflowId/create-run` → `.../start?runId=` → poll `GET /v6/ai/workflows/:workflowId/runs/:runId`), and `tc-ai-api` ADR 0004 (Proposed) is independently restricting both to `administrator`/`challengesRAG:admin` by default, precisely because a bulk run "re-embeds and rewrites the shared vector index for every challenge matching a filter."

**What's missing, concretely:**
- No bulk-ingestion trigger anywhere in `platform-ui` — only the single-challenge path exists (`ingestChallengeInRag()` in the shared `ai-workflows.tsx`, wired into `ChallengeList.tsx`'s row-action dropdown as "Upsert for TopScout," toast-driven, one challenge at a time).
- No visibility into what's actually indexed. `PgVector` has no "list distinct challenges" API — it's a chunk-grained key-value/vector store, not a relational read model — so nothing today can answer "which challenges are in the RAG index, for which project, how many chunks."
- No delete path. `PgVector.deleteVectors({ indexName, filter })` (metadata-filtered delete) already exists in the SDK the code depends on, but nothing in `tc-ai-api` calls it, and there's no HTTP route to reach it. A challenge that's cancelled, deleted, or re-scoped in the source system stays searchable by TopScout indefinitely with no way to remove it short of a manual DB operation.

### Where this page belongs

`platform-ui`'s admin app already has a system-admin "AI" tab group (`aiRouteId = 'ai'` in `src/apps/admin/src/config/routes.config.ts`) with two children — Review Workflows (`aiReviewWorkflowsRouteId`) and Review Templates (`aiReviewTemplatesRouteId`) — registered as an `<Ai />`-wrapped `children` block in `admin-app.routes.tsx`, gated by `rolesRequired: administratorOnlyRoles` on that parent node, and surfaced in `SystemAdminTabsConfig` (`src/apps/admin/src/lib/components/common/Tab/config/system-admin-tabs-config.ts`) gated a second time by `isAdministrator(roles)` in `getSystemAdminTabs()`. This is the exact shape the user's requested location (`/system-admin/ai/TopScout-RAG`) already matches — a third child under the same `aiRouteId` node, inheriting the same `administrator`-only gate with zero new frontend authorization code. (This ADR normalizes the path segment to `topscout-rag`, lower-kebab-case, matching the sibling `review-workflows`/`review-templates` convention rather than the mixed-case form in the request.)

### Access control is a genuine cross-repo dependency, not a UI nicety

The two capabilities this page adds — bulk-(re)ingest and delete-from-index — are at least as sensitive as `challenge-bulk-ingestion` itself (same shared-index blast radius; delete is one-way against the only copy of that data). `tc-ai-api` ADR 0004's own enforcement design only recognizes `/v6/ai/agents/:id/*`, `/v6/ai/workflows/:id/*`, and `/v6/ai-chat/:agentId` shapes in its URL-pattern matcher (`authorizeAccessPolicy`) — a plain custom route like `/v6/ai/challenge-embeddings/*` falls through that matcher's "no match → true" branch and would be **authenticated-but-unrestricted** by default if nothing else is done, exactly the kind of silent gap ADR 0004 itself flags as a standing footgun for future resources. This ADR does not relitigate ADR 0004's design; it reuses its policy primitives directly at the two new route handlers' call sites (see Decision 2), the same way ADR 0004 itself wraps tools at their own export site rather than relying purely on the HTTP-boundary matcher.

## Scope

**In scope:**
- A new admin page, `TopScout RAG` (`/system-admin/ai/topscout-rag`), as a third child of the existing `aiRouteId` system-admin tab.
- **Ingestion panel**: trigger a single-challenge or filtered bulk-ingestion run against `challenge-ingestion`/`challenge-bulk-ingestion`, monitor it to completion via the existing poll helper, and present a completion summary (counts, per-challenge failures) or a clear error.
- **Indexed-challenges panel**: a paginated, filterable (project, track, type), searchable list of what `challenge_embeddings` currently holds, with a per-row Delete action (confirm-modal gated) that removes that challenge's vectors from the index.
- Exactly two new `tc-ai-api` HTTP endpoints, both under the existing `/v6/ai` prefix:
  - `DELETE /v6/ai/challenge-embeddings/:challengeId`
  - `GET /v6/ai/challenge-embeddings` (list + count + filtering + search — the single "stats/count" endpoint requested; see Decision 2 for why this is one endpoint, not a separate stats/facets endpoint)
- Extending the shared `platform-ui` workflow-run service with bulk-ingestion support, and a small new admin-app service for the two new endpoints.
- Reusing (not redefining) `tc-ai-api` ADR 0004's access-control primitives to gate the two new endpoints with the same default policy as the two ingestion workflows.

**Out of scope (deferred, not rejected):**
- Automatic re-ingestion (e.g., a challenge-update webhook calling `challenge-ingestion`) — this page is manual/on-demand only.
- Scheduled/cron-driven bulk ingestion.
- A resolved project-name picker for the project filter — v1 filters by bare project id (see Decision 4); TopScout's own agent treats `projectId` as an opaque, never-dereferenced reference (D10) for the same reason, and this page follows that precedent rather than adding a new projects-api dependency for a filter control.
- In-place editing of an indexed challenge's content — re-ingestion is the only way to change what's indexed; this page never writes challenge content itself.
- Any change to ADR 0004's own decisions — this ADR is a consumer of that policy core, not a revision of it (see Decision 2 and Open Questions for sequencing).

## Decision

### 1. Page placement and route wiring (`platform-ui`)

- `src/apps/admin/src/config/routes.config.ts`: add `export const topScoutRagRouteId = 'topscout-rag'`.
- `src/apps/admin/src/admin-app.routes.tsx`: lazy-load `TopScoutRagPage` (`./ai/topscout-rag/TopScoutRagPage`) and add it as a third entry in the existing `aiRouteId` block's `children` array, alongside `AiReviewWorkflowsPage`/`AiReviewTemplatesPage` — no new `rolesRequired` needed; it inherits the parent `aiRouteId` node's `administratorOnlyRoles`.
- `src/apps/admin/src/lib/components/common/Tab/config/system-admin-tabs-config.ts`: add `{ id: `${aiRouteId}/${topScoutRagRouteId}`, title: 'TopScout RAG' }` to the existing `aiRouteId` tab's `children` array (next to "AI Review Workflows"/"AI Review Templates").
- Page files: `src/apps/admin/src/ai/topscout-rag/TopScoutRagPage.tsx` (+ `.module.scss`, `index.ts`), following `AiReviewWorkflowsPage.tsx`'s shell exactly: `PageWrapper` wrapping (a) the ingestion panel and (b) `TableLoading` / `TableNoRecord` / `TableWrapper` / `Table` / `TableMobile` for the indexed-challenges list, all pulled from the admin app's existing `../../lib` barrel — no new shared UI primitives required.

### 2. `tc-ai-api`: exactly two new endpoints, and why not three

The request asks for delete-by-id plus "a stats/count endpoint which should provide the list of challenges, count and project, [with] filtering... and searching." That is one endpoint doing list+count+filter+search, not a separate facets endpoint for populating filter dropdowns. To keep it at exactly two endpoints:

- **Project filter**: plain project-id text/number input, not a resolved picker (Scope, Decision 4) — no facet needed.
- **Type/Track filter options**: sourced from a small duplicated constant in `platform-ui` (`TOPSCOUT_RAG_KNOWN_TYPES`/`TOPSCOUT_RAG_KNOWN_TRACKS`, mirroring `tc-ai-api`'s `rag.config.ts` `KNOWN_TYPES`/`KNOWN_TRACKS` values verbatim, with a comment pointing at that file as source of truth) rather than a live `SELECT DISTINCT` facet query. This is safe specifically because `rag.config.ts` already documents these two lists as **informational only, not enforced** (D12) — a stale dropdown option is a minor UX gap (an admin can't filter by a value that predates this constant list), never a correctness bug, since the list/search query itself matches whatever free-form value a row actually has regardless of what the dropdown offers. (Note this dropdown is intentionally broader than the vector-*search* tool's own type enum — `challenge-search-agent`'s instructions restrict its search-time `type` filter to only `"Challenge"`/`"Marathon Match"` — because this page browses everything that was ever indexed, not just what the chat agent can query by type.)

New module `tc-ai-api/src/mastra/vector/challenge-embeddings-admin.ts` (co-located with the existing `challenge-vector-store.ts`, reusing its lazy `getChallengeVectorStore()`/`ensureChallengeIndex()` singleton):

```ts
export async function deleteChallengeEmbeddings(challengeId: string): Promise<{ deletedChunks: number }> {
  const config = getRagConfig();
  const store = await ensureChallengeIndex();
  const { rows } = await store.pool.query(
    `SELECT COUNT(*)::int AS n FROM "${schemaIdent(config)}"."${config.vectorIndexName}" WHERE metadata->>'challengeId' = $1`,
    [challengeId],
  );
  const deletedChunks = rows[0]?.n ?? 0;
  if (deletedChunks > 0) {
    await store.deleteVectors({ indexName: config.vectorIndexName, filter: { challengeId } });
  }
  return { deletedChunks };
}

export async function listChallengeEmbeddings(params: {
  projectId?: string; track?: string; type?: string; search?: string;
  page: number; perPage: number;
}): Promise<{ items: ChallengeEmbeddingSummary[]; total: number }> {
  // GROUP BY metadata->>'challengeId', with a parameterized WHERE built from
  // the optional filters (never string-concatenated — only the validated
  // schema/index identifiers are interpolated; every filter *value* is a
  // bound $n param); a second COUNT(DISTINCT metadata->>'challengeId')
  // query (same WHERE, no GROUP BY / LIMIT) for `total`.
}
```

`PgVector.deleteVectors({ indexName, filter, ids, namespace })` and the public `pool: pg.Pool` field are both already part of the installed `@mastra/pg@1.22.0` surface — confirmed by reading `dist/vector/index.d.ts` directly rather than assumed. `deleteVectors` gives the atomic metadata-filtered delete the DELETE endpoint needs for free; `pool` is the only way to do the chunk-grained-to-challenge-grained `GROUP BY` aggregation the list endpoint needs, since `PgVector` itself has no "distinct records" query shape.

Two follow-on, additive, idempotent changes this decision requires:
- `ensureChallengeIndex()`'s existing `metadataIndexes: ['challengeId', 'projectId', 'track']` gains `'type'`, so the new list/filter query isn't an unindexed scan on the one JSONB path it's missing. `createIndex()` is already called unconditionally on every boot per that function's own doc comment ("safe to call every time"), so this is a one-line, zero-migration addition.
- The schema name (`MASTRA_DB_SCHEMA`, default `ai`) is validated with the same `validateSqlIdentifier()` regex `rag.config.ts` already applies to `VECTOR_INDEX_NAME`, at the point this new module builds its raw SQL identifiers — `rag.config.ts` itself does not currently validate `schemaName`, and this module is the first place in the codebase to interpolate it directly into a SQL string, so it must not inherit that gap silently.

**Route registration** (`tc-ai-api/src/mastra/index.ts`, `server.apiRoutes` array, alongside the existing `chatRoute(...)` entry): both new routes are registered via Mastra's `registerApiRoute` (`@mastra/core/server`) under `${API_PREFIX}/challenge-embeddings` (GET, list) and `${API_PREFIX}/challenge-embeddings/:challengeId` (DELETE). Both are automatically **authenticated** by `apiAuthLayer`'s existing `protected: ['${API_PREFIX}/*']` blanket rule — no change needed there. Neither is automatically **authorized** by ADR 0004's `authorizeAccessPolicy`, since its path matcher only recognizes `/agents/`, `/workflows/`, and chatRoute shapes (Context, above). Each handler therefore calls the same policy check ADR 0004 exports, at the top of its own body — mirroring how ADR 0004 wraps tools at their *own* export site rather than relying solely on the HTTP boundary:

```ts
// inside each of the two new route handlers
if (process.env.DISABLE_AUTH !== 'true') {
  const user = /* from context, same as resourceIdMiddleware's resolution */;
  const policy = resolveAccessPolicy('route', 'challenge-embeddings-admin'); // new AccessCategory
  if (!user || !checkAccess(toAuthenticatedCaller(user), policy)) {
    return c.json({ error: 'Forbidden' }, 403);
  }
}
```

This adds one new entry to ADR 0004's own `DEFAULT_ACCESS_POLICIES` registry — a third `AccessCategory` (`'route'`) alongside `agent`/`workflow`/`tool` — rather than a silently-hardcoded, unregistered check, so the new capability stays visible in the same reviewable place ADR 0004 established:

```ts
route: {
  'challenge-embeddings-admin': { mode: 'restricted', roles: ['administrator'], scopes: ['challengesRAG:admin'] },
},
```

Both the list (`GET`) and delete (`DELETE`) endpoints use the **same** restricted policy — the list endpoint is not left `public` even though it's read-only, because it lets a caller enumerate every currently-indexed challenge (name/project/track/type) in one shot, which is a wider disclosure surface than the per-challenge, already-public data `challenge-vector-query` exposes one hit at a time. This mirrors ADR 0004's own choice to restrict both ingestion workflows uniformly rather than splitting by read/write.

**Response shape** (`GET`): body is a **plain array** of `{ challengeId, name, type, track, projectId, groups, skills, chunkCount, ingestedAt }`; pagination rides on `X-Page`/`X-Per-Page`/`X-Total`/`X-Total-Pages` **response headers** — already present in `tc-ai-api`'s existing CORS `exposeHeaders` list (`src/mastra/index.ts`) and exactly what `platform-ui`'s existing `xhrGetPaginatedAsync` (`src/libs/core/lib/xhr/xhr-functions/xhr.functions.ts`, reading `x-page`/`x-per-page`/`x-total`) already parses. The frontend needs zero new pagination-parsing code for this endpoint — only a new URL and query params.

### 3. `platform-ui`: service layer

- `src/libs/shared/lib/services/ai-workflows.tsx`: add `ingestChallengesBulkInRag(filters, workflowId?)`, mirroring `ingestChallengeInRag`'s existing shape (`startWorkflowRun` → `pollWorkflowRunStatus`, both already generic over any workflow id) and a new `normalizeChallengeBulkIngestionResult()`/`ChallengeBulkIngestionResult` type mirroring the workflow's own `bulkReportSchema` (`processed`/`succeeded`/`failed`/`skipped`/`totalChunks`/`results[]`). No changes to `startWorkflowRun`/`pollWorkflowRunStatus` themselves — both are already workflow-agnostic.
- New env var `RAG_CHALLENGE_BULK_INGESTION_WORKFLOW_ID` (`default.env.ts` + `global-config.model.ts`), defaulting to **`'challenge-bulk-ingestion'`** — the workflow's own `.id`. This is a deliberate departure from the sibling `RAG_CHALLENGE_INGESTION_WORKFLOW_ID`'s existing default (`'challengeIngestionWorkflow'`, the Mastra *registry key*, not the `.id`) already shipped in this codebase: per ADR 0004's own documented footgun, keying on the registry key instead of `.id` only happens to work today because `Mastra.getAgentById()`/workflow routing falls back from `.id` to registry key on a miss — it is not something a new addition should copy forward as if it were the correct convention.
- New `src/apps/admin/src/lib/services/challenge-embeddings.service.ts`, matching the existing `ai-workflows.service.ts` pattern in the same directory: `getChallengeEmbeddings(params)` via `xhrGetPaginatedAsync<ChallengeEmbeddingSummary[]>(...)`, `deleteChallengeEmbeddings(challengeId)` via `xhrDeleteAsync`.

### 4. Page behavior

**Ingestion panel** — a small form: either a single free-text challenge-id field, or the bulk filter set (`projectId`, `track`, `type`, `status`, `updatedDateStart` — mirroring `challenge-bulk-ingestion`'s own `bulkInputSchema`), mutually exclusive the same way `challenge-ingestion`'s own resolve step requires exactly one source (challengeId XOR inline record) — the page enforces the analogous rule client-side (single-id field XOR any filter field) before allowing Run. A "Dry run" toggle passes straight through to the workflow's existing `dryRun` input (chunk+embed, skip the upsert) — useful for previewing a bulk run's scope before committing it. Flow on Run:
1. `ConfirmModal` (bulk ingestion mutates the shared index for every match — the same reason ADR 0004 restricts it server-side; the UI asks before firing, not as a substitute for that server-side enforcement, but because it's a slow, hard-to-abort action worth a deliberate click).
2. `isRunning` boolean disables the form and swaps the button label (`"Ingesting…"` / `"Running bulk ingestion…"`), matching `TalentSearchPage.tsx`'s `isExtractingSkills` idiom — no separate blocking modal is needed, since `pollWorkflowRunStatus` already blocks the returned promise until the run resolves.
3. On resolve: a per-run **completion summary** stays visible in the panel (processed / succeeded / failed / skipped / total chunks, plus an expandable list of `results.filter(r => r.status === 'failed')` with each failure's message) — richer than a toast alone, since a bulk run has much more to report than the single-challenge case. `toast.success`/`toast.error` still fires for the at-a-glance case, matching `ChallengeList.tsx`'s existing toast idiom for the single-ingest action.
4. A successful run (bulk or single) triggers a refetch of the indexed-challenges list below, so newly (re-)ingested challenges show up without a manual refresh.

**Indexed-challenges panel** — `getChallengeEmbeddings({ page, perPage, projectId, track, type, search })` on mount and on any filter change; columns: Challenge (name, linking to `${EnvironmentConfig.ADMIN.CHALLENGE_URL}/${challengeId}`, matching `ChallengeList.tsx`'s existing external-link convention), Type, Track, Project (bare id, per Decision 4/Scope), Chunks, Ingested At, and a Delete action. Delete opens the same `ConfirmModal` pattern `AiReviewWorkflowsPage.tsx` already uses for its activate/deactivate confirmation, calls `deleteChallengeEmbeddings(challengeId)`, toasts on result, and removes the row (or refetches the current page) on success.

## Implementation plan

### Phase 0 — `tc-ai-api`: data-layer additions
- `challenge-vector-store.ts`: add `'type'` to `metadataIndexes`.
- New `challenge-embeddings-admin.ts`: `deleteChallengeEmbeddings()`, `listChallengeEmbeddings()`, schema-identifier validation at the point of use.
- Unit tests mirroring `challenge-vector-store.test.ts`'s existing conventions: delete removes exactly the matched challenge's rows and reports an accurate `deletedChunks` (including the "nothing matched" / `0` case); list respects each filter independently and in combination; search matches by name substring and by exact challengeId; pagination math (`total`, `page`/`perPage` boundaries) is correct against a seeded multi-challenge, multi-chunk fixture.

### Phase 1 — `tc-ai-api`: routes and access control
- Extend ADR 0004's `AccessCategory`/`DEFAULT_ACCESS_POLICIES` with the `route` category and the `challenge-embeddings-admin` entry (Decision 2). If ADR 0004 has not yet merged when this phase starts, land the equivalent inline `checkAccess`/`toAuthenticatedCaller` call directly in the two new handlers with the hardcoded restricted policy, and switch to the shared registry in a follow-up once ADR 0004 ships — sequencing note, not a blocker (see Open Questions).
- Register the two routes in `mastra/index.ts`'s `apiRoutes`.
- Tests mirroring ADR 0004's own planned `resourceIdMiddleware.test.ts` cases: member without `administrator` → 403; member with it → 200; M2M without `challengesRAG:admin` → 403; M2M with it → 200; `DISABLE_AUTH=true` bypasses both.

### Phase 2 — `platform-ui`: service layer
- `ai-workflows.tsx`: `ingestChallengesBulkInRag()`, `ChallengeBulkIngestionResult`.
- `default.env.ts` / `global-config.model.ts`: `RAG_CHALLENGE_BULK_INGESTION_WORKFLOW_ID`.
- New `challenge-embeddings.service.ts` in the admin app.

### Phase 3 — `platform-ui`: page
- Route/tab wiring (Decision 1).
- `TopScoutRagPage.tsx` — ingestion panel + indexed-challenges panel, per Decision 4.
- Manual smoke test in a real environment (per this repo's own "verify against the running system, don't assume" precedent): run a small bulk ingestion with a narrow filter, confirm the summary matches what actually landed in the index, confirm a subsequent list-page fetch shows it, delete it, confirm it disappears from the list and TopScout itself can no longer surface it in a follow-up chat query.

### Phase 4 — Documentation
- `tc-ai-api README.md`: document the two new routes next to the existing workflow/agent route documentation.
- `platform-ui`: no README currently documents the admin AI tab group's routes; none added here either, consistent with the existing sibling pages.

## File-level mapping

| Repo | File | Change |
| --- | --- | --- |
| tc-ai-api | `src/mastra/vector/challenge-vector-store.ts` | Modified — add `'type'` to `metadataIndexes` |
| tc-ai-api | `src/mastra/vector/challenge-embeddings-admin.ts` | New — `deleteChallengeEmbeddings`, `listChallengeEmbeddings` |
| tc-ai-api | `src/mastra/vector/challenge-embeddings-admin.test.ts` | New |
| tc-ai-api | `src/config/access-control.config.ts` | Modified (ADR 0004 dependency) — `route` category, `challenge-embeddings-admin` policy entry |
| tc-ai-api | `src/mastra/index.ts` | Modified — register the two new `apiRoutes` |
| tc-ai-api | `README.md` | Modified — document the two new routes |
| platform-ui | `src/libs/shared/lib/services/ai-workflows.tsx` | Modified — `ingestChallengesBulkInRag`, `ChallengeBulkIngestionResult` |
| platform-ui | `src/config/environments/default.env.ts` | Modified — `RAG_CHALLENGE_BULK_INGESTION_WORKFLOW_ID` |
| platform-ui | `src/config/environments/global-config.model.ts` | Modified — same |
| platform-ui | `src/apps/admin/src/lib/services/challenge-embeddings.service.ts` | New |
| platform-ui | `src/apps/admin/src/config/routes.config.ts` | Modified — `topScoutRagRouteId` |
| platform-ui | `src/apps/admin/src/admin-app.routes.tsx` | Modified — new lazy route under `aiRouteId` |
| platform-ui | `src/apps/admin/src/lib/components/common/Tab/config/system-admin-tabs-config.ts` | Modified — new child tab |
| platform-ui | `src/apps/admin/src/ai/topscout-rag/TopScoutRagPage.tsx` (+ `.module.scss`, `index.ts`) | New |
| platform-ui | `src/apps/admin/src/lib/components/ChallengeList/ChallengeList.tsx` | **Unchanged** — its existing single-ingest action is independent of this page and stays as-is |

## Consequences

**Positive**
- Admins get a real operational surface for the RAG pipeline — bulk backfill/re-ingest, visibility into what's actually indexed, and a way to remove stale entries — none of which exists today short of a manual DB operation.
- Reuses, rather than duplicates, three separate pieces of prior art in this codebase: the shared workflow-run/poll service, the admin app's existing list-page shell (`AiReviewWorkflowsPage.tsx`), and the existing `xhrGetPaginatedAsync` header-based pagination contract — net-new frontend code is small.
- The two new endpoints stay inside `tc-ai-api`'s existing route/auth/CORS conventions (same `apiPrefix`, same `exposeHeaders`, same `apiRoutes` registration point as `chatRoute`) rather than introducing a parallel pattern.
- Explicitly re-uses ADR 0004's access-control model instead of inventing a second one, keeping "who can touch the RAG index" answerable from one registry.

**Negative / risk**
- **Two-repo dependency for one feature.** This page cannot function until both new `tc-ai-api` endpoints ship; sequencing must be tracked explicitly (see Implementation plan phasing) rather than assumed.
- **Depends on an ADR that is itself still Proposed.** If ADR 0004's shape changes before it merges, Decision 2's `route` category / registry entry needs to move with it. Mitigated by keeping the inline-fallback option explicit in Phase 1 rather than hard-blocking on ADR 0004 merging first.
- **`KNOWN_TYPES`/`KNOWN_TRACKS` duplication is a manually-maintained mirror**, not a shared import (the two repos don't share a package for this). A future addition to `rag.config.ts`'s lists won't automatically appear in this page's filter dropdown. Accepted per Decision 2's reasoning (informational-only, non-enforced, UX-only staleness) rather than adding a third endpoint to keep them in sync live.
- **Raw SQL against `store.pool`** is new surface in a codebase that otherwise only talks to Postgres through `PgVector`'s own methods. Every filter/search *value* is a bound parameter; only the already-validated `vectorIndexName`/`schemaName` identifiers are ever interpolated — but this is still the first hand-written SQL in the vector layer, worth an explicit review pass, not just a "matches existing patterns" assumption.
- **Delete is irreversible.** There is no soft-delete or undo — removing a challenge's vectors means the next chat query about it returns nothing until it's re-ingested. The confirm-modal step is the only guard; this ADR does not add an audit trail beyond `tc-ai-api`'s existing `tcAILogger` usage (matching ADR 0004's own "single structured log line" precedent for denials — an actual delete, not just a denial, should log at `info` with the challengeId and caller for the same reason).

## Open questions

- **Sequencing with ADR 0004**: does this ADR's `tc-ai-api` work land before, after, or alongside ADR 0004's own implementation? Phase 1 above describes both orders; whichever happens first should not block the other, but the final registry shape (Decision 2) is only settled once ADR 0004 itself is no longer Proposed.
- Should the project filter graduate from a bare-id input to a resolved project-name picker once real admin usage shows bare ids are hard to work with? Deferred per Scope; revisit with actual usage feedback rather than speculatively building it now.
- Should `type`/`track` filter options move from the duplicated constant to a live facet query if the two lists drift in practice? Deferred per Decision 2/Consequences; only worth the extra endpoint if the duplication actually causes friction.
- Does a future webhook-driven auto-(re)ingestion pipeline reduce this page's bulk-ingestion panel to a "manual override / backfill only" tool? Out of scope here either way, but worth naming so a future ADR doesn't have to rediscover the relationship.

## Prerequisites to confirm before implementation starts

- The `administrator` role / `challengesRAG:admin` M2M scope convention from `tc-ai-api` ADR 0004 must actually exist in the relevant Auth0 tenant before either new endpoint's restriction is meaningful — this ADR reuses that prerequisite rather than re-verifying it independently.
- Confirm `challenge-bulk-ingestion` is reachable by its own `.id` (`RAG_CHALLENGE_BULK_INGESTION_WORKFLOW_ID`'s default) against a real deployed `tc-ai-api` — expected to work per Mastra's documented `.id`-first routing, but this ADR's own Decision 3 calls out that a sibling env var's default currently relies on registry-key fallback instead, so a live smoke test is cheap insurance rather than a formality.
- Reviewer sign-off on: adding a third `route` category to ADR 0004's access-control registry from a second ADR (Decision 2) rather than that decision living entirely inside ADR 0004 itself; the "duplicate the two known-value constants instead of a third facets endpoint" trade-off (Decision 2/Consequences); and the "list endpoint is restricted, not public" choice given it's read-only (Decision 2).
