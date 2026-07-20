# Status app

## Document status

The administrator-only Status app is registered in Platform UI and implements
the ECS, API, SendGrid, and Database views described below. It uses only
read-only `GET /v6/status/*` calls, lazy route/section fetching, explicit
refresh, and last-good-data retention. The cross-project design and API
contract are in
[`../../../../status-api-v6/IMPLEMENTATION_PLAN.md`](../../../../status-api-v6/IMPLEMENTATION_PLAN.md).

The Status UI ships as part of the normal Platform UI bundle. Deploying the
bundle and provisioning an optional `status.<domain>` alias are environment
operations outside this directory.

## Local development

The local environment routes `/v6/status` to the Status API on port 3000. Start
`status-api-v6` first, then run the normal Platform UI development server:

```bash
nvm use
yarn start
```

## Outcome

Add a standalone, administrator-only Status application to Platform UI with
four tabs:

- ECS
- API
- SendGrid
- Database

The app follows Review's visual language and responsive behavior. It must use
shared `libs` components or status-local components; it must not import private
components from Review or Admin.

## Authorization

The root Platform route must contain both:

```ts
authRequired: true,
rolesRequired: [UserRole.administrator],
```

Do not use `adminReportsAccessRoles`. The system-admin root grants additional
Product Manager and Talent Manager roles, which would violate the requirement
that Status is administrator-only.

The shared restricted-route role comparison is case-sensitive. Use the existing
`UserRole.administrator` enum value rather than a new string.

The UI guard is defense in depth and navigation control. Every API call still
requires the Status API to verify the administrator JWT independently.

## Route tree

Use a dedicated `AppSubdomain.status = 'status'` and the same conditional-root
pattern as Review/Reports. This gives `/status/...` on the combined Platform UI
host and `/...` if a `status.<domain>` alias is provisioned later.

```text
/status
  -> /status/ecs
  /ecs
  /api
  /api/:serviceId
  /api/:serviceId/endpoints/:endpointId
  /sendgrid
  /database
```

Drill-downs are routes rather than modal-only state so browser back/forward,
refresh, bookmarks, and deep links work. Server-issued IDs are opaque; the UI
does not construct arbitrary resource ARNs or log groups.

## Existing patterns to follow

### Structure and authentication

- `src/apps/reports/src/reports-app.routes.tsx` for a standalone,
  subdomain-aware authenticated app.
- `src/apps/review/src/ReviewApp.tsx` for app context/layout/outlet composition.
- `src/apps/review/src/config/routes.config.ts` for conditional root routes.
- `src/apps/review/src/review-app.routes.tsx` for lazy-loaded route entries.

### Layout and visual language

- `src/apps/review/src/lib/components/Layout` for constrained content and
  responsive spacing.
- `src/apps/review/src/lib/components/NavTabs` and its separate tab config for
  desktop/mobile navigation driven by `useLocation`.
- `src/apps/review/src/lib/components/PageWrapper` for titles, breadcrumbs,
  back navigation, actions, and safe external links.
- `src/apps/review/src/lib/styles/index.scss` for neutral background, teal
  active state, Nunito Sans table typography, and Review table treatments.
- `src/libs/ui/lib/components/table/Table.tsx` for declarative columns, sorting,
  expandable rows, clicks, and `rowClassName`.
- Review's active-review table styling as the visual reference for critical red
  rows and health/status pills.

Review currently imports some private Admin components. Status must not extend
that coupling. If Pagination, TableMobile, or TableLoading is genuinely reusable,
move it to `src/libs/ui` in a separately reviewable change with tests and
documentation; otherwise create a status-local wrapper.

## App shell and navigation

`StatusApp` should:

1. Register child routes from the platform router.
2. Add/remove a status-specific body class.
3. Provide only app-wide presentation/query defaults, not eager provider data.
4. Render the Review-style `Layout`, `NavTabs`, and child route outlet.

The tab config contains four always-visible entries for an already authorized
administrator. Do not run a second broad role calculation that can drift from
the root route.

On narrow screens, use Review's dropdown/menu treatment. The selected tab is
derived from the URL and updates when navigation changes.

## Shared Status components

Implement small status-local components over `libs/ui`:

| Component | Purpose |
| --- | --- |
| `HealthBadge` | Critical/warning/healthy/unknown icon, label, and accessible text |
| `DataFreshness` | Source names, “as of” timestamp, incomplete warnings |
| `MetricCard` | Label, value, unit, trend/context, loading/unknown states |
| `StatusTable` | Shared desktop/mobile behavior and failure row class |
| `TimeWindowSelect` | Server-supported windows only |
| `RetryableErrorState` | Safe error plus Retry action |
| `IncompleteDataNotice` | Visible warning when API metadata is incomplete |
| `ExternalAwsLink` | Validated URL, new tab, `noopener noreferrer` |

Red must not be the only failure signal. Critical state also uses icon, badge
text, row accessible label, and a visible reason.

## ECS page

### Default view

Display a filterable service/task table. The default rows are failure-first
service parents; expanding a service or switching to the task view enumerates
its actual running, pending, and retained recent stopped tasks.

Service parents show:

- Severity.
- Cluster and service.
- Desired/running/pending task counts.
- Latest deployment status/time.
- Deployment counts for the last 24 hours and seven days.
- Current task-definition family/revision linked to AWS.
- Latest recent failure summary and time.
- Task/log actions.

Every task child row shows its opaque task ID, actual status/health, launch or
stop time, deployment association, container state, and the task-definition
family/revision taken from that task's own ARN. This matters during rolling
deployments, when one service can temporarily run multiple revisions. Recent
stopped tasks are paginated; the UI does not collapse the inventory to only the
latest failure.

Filters:

- Text across cluster/service/task-definition.
- Cluster.
- Service and task status.
- Task-definition family/revision.
- Severity/state.
- Optional “issues only”.

Fetch the server's already failure-first list once and filter ordinary text
locally. If a server filter is needed for a large catalog, debounce or require
Apply; do not request on every keystroke.

The dedicated “Expanded task definition” filter applies to the lazy inventory
request and never removes service parents. This preserves access to retained
tasks running an older revision when the service's current task definition has
already advanced. When stopped-task history is warming or unavailable,
`recentStoppedCount` is rendered as unknown and the latest-failure cell states
that history is incomplete rather than claiming that no failures occurred.

### Sorting and highlighting

The API owns canonical severity. The UI uses it as the primary sort and cannot
place a healthy row before a critical row because a user selected another
column. Secondary sorting may operate within a severity group.

Critical failure/error-redeployment rows use Review's red-row treatment. An
evidenced error-driven redeployment inside the configured recent window stays
red even if capacity has recovered. Warnings use a distinct warning treatment,
including unexplained repeated replacements. Normal recent deployments are
visible but not red unless the API supplies error/rollback/failure evidence.

### Failure detail

An expandable row or routed drawer/page shows:

- ECS stop code and sanitized reason.
- Container and exit code.
- Generic exit interpretation explicitly labelled “generic”.
- Stopped time and source completeness.
- Task-definition and CloudWatch links.

Unknown exit codes say no generic interpretation is available; the UI never
invents a cause.

## API pages

### API overview

Show time-window controls and summary cards for:

- Total requests.
- 2xx success ratio.
- 4xx ratio.
- 5xx ratio.
- p50 and p95 response latency.
- Unhealthy ALB targets.

Keep 3xx visible in the service table even if it is not a headline card.

The service table contains request counts, 2xx/3xx/4xx/5xx ratios, p50/p95/p99
latency, target health, and source completeness. Selecting a service navigates
to its endpoint page.

The UI honors the API's `dataComplete` flag independently on the global,
service, and endpoint aggregates. Incomplete traffic counts, ratios, and
latencies render as unknown instead of displaying parser fallback zeroes. ALB
target health remains independently visible when its source is complete.

### Endpoint page

Group by stable method + route template. Do not display raw identifier-bearing
paths as endpoint identities. Columns:

- Method and route template.
- Requests.
- 2xx/4xx/5xx ratios.
- p50/p95/p99 application/Gateway latency with the source labelled.
- Recent failure count.

Selecting an endpoint navigates to its failure page or expands a routed detail.

Show attributed-request coverage and any `EDGE_UNATTRIBUTED` failure count above
the table. Gateway/ALB failures that never reached application routing are
assigned only when the API's safe edge route catalog supplies a template; the
UI never derives an endpoint from a raw path. Any unattributed edge failure
makes endpoint ratios visibly incomplete.

### Failure page

Show at most the API-provided bounded set:

- Timestamp and request ID.
- Status code/class.
- Safe error code/type/summary.
- Response and integration/application latency with source labels.
- CloudWatch link.

Do not render raw log messages, request/response bodies, headers, query strings,
source IPs, user agents, stack traces, or unknown HTML. Treat all summaries as
plain text.

## SendGrid page

Show one row/card per fixed cumulative window: 15 minutes, 1, 3, 6, 12, and 24
hours.

Each shows:

- Recipient messages accepted by SendGrid after any retries.
- Recipient messages that permanently failed after retry exhaustion.
- Success/failure ratio weighted by safe numeric recipient counts.
- Accepted/failed logical send-operation counts as secondary diagnostics.
- Last terminal send time.
- Source/completeness warning.

The first release does not show a pending count: its safe aggregate source
contains terminal completion events, and the Status API does not read the email
service's PII-bearing attempt database. A provider `processed` state may appear
in the separately labelled recent-activity section, but it is not mixed into
the terminal acceptance ratio. Retries share one opaque send-operation ID and
recipient count, and must not double-count messages as both failed and accepted.
The UI never receives recipient addresses from this aggregate source.

Use the exact label “SendGrid API acceptance” so it is not confused with final
recipient delivery.

A collapsed “Recent provider activity” section must always be available and
fetch up to 50 sanitized records only when opened. It displays masked recipient,
provider status, and event time; subject/body are omitted. If the provider
result is capped or rate limited, display the incomplete warning and last
successful refresh time.

Do not auto-refresh this section faster than the API/provider policy.

## Database page

Show:

- RDS instance identifier/engine/status.
- Allocated, used, and free storage, with used percentage.
- Logical database size only when the separately approved read-only aggregate
  exporter is configured.
- Latest, average, and peak connection counts for the selected window.
- Recent RDS infrastructure events.
- Sanitized PostgreSQL warning/error entries and CloudWatch/RDS links.

Label the storage metric “RDS storage used” and explain that it is allocated
minus free, not a logical `pg_database_size` query.

The product owner must approve whether that infrastructure-storage value meets
the requested “total database size” requirement. If exact logical database size
is required, show the exporter-backed value separately; until it exists, render
that field as incomplete rather than relabelling infrastructure usage as logical
size.

Missing/stale CloudWatch samples are unknown, not zero. PostgreSQL engine logs
remain visibly incomplete until export is enabled and the API says the source
is complete.

## Data service and hooks

Create a typed read-only `status.service.ts` using only `xhrGetAsync` with base:

```ts
`${EnvironmentConfig.API.V6}/status`
```

Do not add a dedicated environment base unless there is a demonstrated need;
the v6 base and `/status` path match existing routing.

Keep:

- Wire DTOs in `models`.
- Pure display transforms/sorting in `utils`.
- Request lifecycle, stale-response suppression, and retry in hooks.
- Page layout/rendering in pages/components.

Recommended hooks:

- `useEcsStatus`
- `useEcsTaskDetail`
- `useApiStatus`
- `useApiEndpointStatus`
- `useApiFailures`
- `useSendgridStatus`
- `useSendgridMessages`
- `useDatabaseStatus`

Each hook runs only when its route/section is active and all IDs are ready.
Review's SWR defaults (mount fetch, no focus revalidation, no polling) are a good
baseline. Expose explicit Refresh/Retry and show generated/source timestamps.

Do not load all four tabs in a global context and do not add hidden polling in
the initial release.

## Implemented file structure

```text
src/apps/status/
  README.md
  index.ts
  src/
    index.ts
    StatusApp.tsx
    status-app.routes.tsx
    status-app.routes.spec.tsx
    config/
      routes.config.ts
    lib/
      components/
        Layout/
        NavTabs/
        StatusTable/
        StatusUi/
      hooks/
      models/
      services/
        status.service.ts
        status.service.spec.ts
      styles/
        index.scss
      utils/
    pages/
      api/
      database/
      ecs/
      sendgrid/
```

Co-locate focused component/hook/utility tests with their source.

## Integration files

- `src/config/constants.ts` defines `AppSubdomain.status` and `ToolTitle.status`.
- `src/apps/platform/src/platform.routes.tsx` registers `statusRoutes` before
  the root route.
- `src/config/environments/local.env.ts` routes local `/v6/status` calls to port
  3000.
- The root `README.md` lists the hosted Status app.
- Environment/global config models only if implementation proves a separate
  `STATUS_API` base is required.

Platform UI deploys as one bundle; the existing CircleCI deployment should not
need a Status-specific deploy job. Add CI test execution if the repository still
does not enforce `yarn test:no-watch` when implementation begins.

## Loading, empty, error, and partial states

Every page must distinguish:

- Initial loading.
- Refreshing with existing data.
- Complete empty/zero traffic.
- Partial/incomplete source.
- Stale data.
- Authorization failure.
- Provider timeout/throttling.
- General retryable failure.

Never use the same “No data” view for a complete zero and an unavailable source.
Retain the last successful response during a refresh failure, mark it stale, and
offer Retry.

## Accessibility and responsive behavior

- Keyboard-accessible tabs, filters, table rows/actions, and disclosures.
- Proper headings and page titles.
- Accessible names for icon-only refresh/external-link controls.
- Text/icon state in addition to color.
- Sufficient contrast for red/warning rows and badges.
- Desktop table and a readable mobile card/table treatment without hiding the
  failure reason or source completeness.
- Respect reduced-motion preferences for loading/refresh affordances.

## Tests

Minimum tests:

### Routes/auth

- Root redirects to ECS.
- All child/drill routes render through the Status root.
- `authRequired` and exact administrator role are present.
- Non-admin role does not render the app.
- Dedicated/combined host root resolution is correct.

### Services/hooks

- Every service call uses GET and `/v6/status`.
- Query windows/IDs are encoded and no arbitrary ARN/log group is constructed.
- Hooks do not fetch before route IDs are ready.
- Inactive tabs and collapsed SendGrid detail do not fetch.
- Stale response suppression and Retry work.

### Pages/components

- Critical ECS rows always precede healthy rows and have non-color labels.
- Normal deployments are not falsely red.
- Loading, refreshing, complete empty, incomplete, stale, timeout, and error
  states render distinctly.
- Zero-request ratios render as unavailable rather than divide-by-zero values.
- Unattributed edge failures remain separate and mark endpoint coverage
  incomplete.
- AWS links include `target="_blank"` and `rel="noopener noreferrer"`.
- API nested drill-down works across refresh/back navigation.
- SendGrid acceptance semantics and fixed windows are labelled correctly.
- Database used-storage explanation and incomplete engine-log state render.
- Responsive/accessibility behavior meets the shared UI standard.

## Implementation gate

From `platform-ui`, after every code change:

```bash
nvm use
yarn lint
yarn test:no-watch
yarn run build
```

Fix every reported issue. New/changed functions, methods, and classes require
the documentation mandated by the root `AGENTS.md`.

## UI acceptance checklist

- [x] Only an authenticated `administrator` can enter any Status route.
- [x] ECS, API, SendGrid, and Database tabs exist and are responsive.
- [x] Only the active tab reads data.
- [x] ECS failures/error redeployments are first, red, and text/icon labelled.
- [x] Expanded task inventory shows each task's own task-definition revision,
      including mixed revisions during a rolling deployment.
- [x] Task-definition and CloudWatch links are safe and usable.
- [x] API service and endpoint drill-down survives refresh/back/deep link.
- [x] Response ratios and p50/p95/p99 latencies are clearly sourced.
- [x] Recent failures show safe reasons without raw request/log data.
- [x] All six SendGrid windows and their acceptance semantics are visible.
- [x] Bounded, sanitized recent SendGrid provider activity loads on demand.
- [x] Database storage, connections, RDS events, and engine warning/error state
      are visible.
- [x] The approved database-size definition is shown; any required logical-size
      source remains explicitly incomplete until its exporter is available.
- [x] Incomplete/stale/capped sources never appear as healthy zeroes.
- [x] No mutation request or UI action exists.
- [x] Status-focused tests, repository lint, and the production build pass.
