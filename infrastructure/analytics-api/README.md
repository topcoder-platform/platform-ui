# Topcoder analytics API

This directory contains the development infrastructure and Lambda code for the
role-gated Analytics UI. The API is a read-only adapter over the existing AWS
Clickstream Redshift reporting relations; it is not an ingestion endpoint.

## Architecture and security boundary

```text
Platform UI
  -> api.<domain> shared CloudFront/API Gateway HTTP API
  -> analytics-route JWT authorizer
  -> Lambda exact analytics-role check and fixed queries
  -> Redshift Data API
  -> analytics_api_reader database role
  -> approved reporting views and materialized projection
```

API Gateway validates the configured Auth0 issuer, audience, signature, and
standard JWT time claims. Lambda then requires `analytics` in a verified
Topcoder roles claim. The handler accepts only four fixed `GET` routes,
strict dates, bounded UTM/surface tokens, and an exact query-free path. SQL is server-owned and uses Data
API named parameters; callers cannot provide SQL, object names, sort clauses,
or result limits.

Reports are limited to 366 inclusive days and 2,000 decoded rows, with an additional
allowance of four rows per selected day for SpaceTech’s daily source metrics. Query waits
leave time for a sanitized response. A failed or aborted statement is retried
once within the same deadline. Clients can opt into resumable requests with
`async=true`. If Redshift Serverless needs longer than one HTTP request, the API
returns `202`, `Retry-After`, and a server-generated query token. The browser
polls with that token until the original statement completes instead of
starting another warehouse query. Tokens are accepted only for the exact SQL,
validated parameters, retry attempt, and the current or preceding fifteen
one-minute windows. New requests reuse a completed Data API statement for at
most one minute; a pending request keeps its original token while polling, so
slow warehouse startup does not restart work at each minute boundary. The
in-process report and filter caches also expire after 60 seconds. Consequently,
loaded data appears in a newly requested report within approximately two minutes,
plus query execution time. Processing runs hourly in both dev and production;
collection continues between batches.

The existing four-hour EventBridge schedule still prepares the default Campaigns
report, filter-option query, and `/opportunities` route report. Interactive requests
refresh independently of that schedule. Browser polling is
bounded. Concurrency and API throttles cap warehouse pressure, and successful
responses use `Cache-Control: private, no-store`. Logs contain request IDs and
service-owned error categories only.

The General report applies an inclusive timestamp range and uses Redshift
`GROUPING SETS` to calculate its summary, daily, page, traffic-source, and
surface sections in one scan of the reporting view. This avoids repeating the
view's JSON-derived field work for each section while preserving exact visitor
counts and the existing response contract.

The Route report reads an auto-refreshed, timestamp-sorted materialized
projection containing only its approved event types and fields. Replicated
distribution keeps the report's repeated session and funnel joins local and
avoids re-extracting JSON fields from the wide Clickstream table. The response
continues to expose `dataThrough` so consumers can see the latest included route
page-view date while Redshift schedules incremental refreshes.

## Files

- `template.yaml` registers protected analytics routes on the shared API and
  provisions the JWT authorizer, Lambda, least-privilege query role, scheduled
  default-report prewarm, and logs.
  The former dedicated API remains during the cutover observation window.
- `src/handler.py` validates and shapes filter, campaign, general, and exact-route reports.
- `bootstrap.sql` creates the read-only Redshift database role and grants only
  the reporting objects required by the handler. Its route event view and
  materialized projection expose only timestamp, pseudonymous join key,
  session, source group, semantic click, challenge join key, and form lifecycle
  fields; the Lambda role cannot select the raw event table.
- `collector-host-migration.yaml` creates `events.<domain>` on the existing
  ingestion ALB so `analytics.<domain>` can become the reporting UI host.
- `tests/test_handler.py` verifies authorization, validation, parameterization,
  privacy-safe click shaping, and response contracts without AWS access.

## Development deployment order

Use `us-east-1` and account `811668436784`. Resolve every ARN and hosted-zone ID
from AWS immediately before deployment; do not paste credentials or managed
secret values into parameters, source files, or shell history.

1. Validate both templates and run the local tests.
2. Deploy `collector-host-migration.yaml` against the existing HTTPS listener
   and ingestion target group.
3. Verify `https://events.topcoder-dev.com/ping?appId=topcoder_web` and a browser
   preflight/request to `/collect` before changing either client configuration.
4. Package `src/handler.py` as a versioned zip in the encrypted Clickstream
   templates bucket.
5. Run `bootstrap.sql` through the Data API using the Redshift namespace's
   managed administrator secret before deploying code that reads a new
   reporting relation. On reapplication, omit existing `CREATE ROLE` and
   `CREATE MATERIALIZED VIEW` statements, then run the replaceable view and
   idempotent `GRANT` statements. Also apply `spacetech-form-status.sql` to
   create/grant the narrow form-lifecycle view before deploying the form-status
   Lambda change. It is additive and safe to reapply; no historical data is changed.
6. Deploy `template.yaml` with `CAPABILITY_NAMED_IAM`, the shared HTTP API ID,
   and the exact workgroup, wildcard certificate, public hosted zone, code
   bucket, and code key.
7. Exercise Lambda directly with missing, wrong, and exact role claims, then
   exercise the public API with no token, an unauthorized token, and an
   authorized token. A direct invocation does not replace the positive public
   JWT test.
8. Add `analytics.topcoder-dev.com` to the Platform UI CloudFront distribution,
   deploy the verified Platform UI build, and only then change its Route 53
   alias from the ingestion ALB to CloudFront.
9. Keep the former collector listener rules during the observation window.
   Remove them only after both clients use `events.topcoder-dev.com` and ALB
   traffic confirms the old host is idle.

The collector move and reporting-host cutover are deliberately separate. If
the new collector fails, leave `analytics.topcoder-dev.com` on the ALB and roll
the client endpoint back. If the UI deployment fails after the collector move,
the `events` hostname can remain active without changing reporting DNS.

## Validation commands

```bash
python3 -m unittest discover -s infrastructure/analytics-api/tests -v
python3 -m py_compile infrastructure/analytics-api/src/handler.py
aws cloudformation validate-template \
  --template-body file://infrastructure/analytics-api/collector-host-migration.yaml
aws cloudformation validate-template \
  --template-body file://infrastructure/analytics-api/template.yaml
```

After deployment, expected public authorization behavior is:

```text
no or malformed bearer token -> 401 from API Gateway
valid token without analytics -> 403 from Lambda
valid token with analytics    -> 200 aggregate JSON, or 202 until the query completes
```

The canonical development endpoint is
`https://api.topcoder-dev.com/v1/analytics`. Preserve existing shared-stage
route settings when adding 5 requests/second, burst 10, detailed metrics for
the four `GET` routes and the public `OPTIONS /v1/analytics/{proxy+}` route.

`GET /v1/analytics/route` requires `path=/...` and supports the same inclusive
date range and optional surface as General Analytics. It returns only aggregate
route totals, mutually exclusive visitor-source buckets, new/returning counts,
semantic click locations, form lifecycle totals, abandonment field IDs, and an
ordered challenge funnel. Bounce is defined as a one-page entrance session,
average time is focused engagement per page view, and conversion is a unique
form completer or a visitor who registers for the exact challenge clicked from
the route, divided by route visitors. Submission likewise requires the same
challenge ID and follows that registration.
Winner attribution is intentionally null until a trusted challenge-results
event is added upstream.

Also verify an invalid date returns `400`, an unsupported route returns `404`,
an opted-in cold query returns resumable `202` responses instead of `504`,
responses are `private, no-store`, and CloudWatch logs do not contain tokens,
filters, SQL, or record values.

## Production promotion

Provision production as a separate stack and database role. Change the shared
API ID/domain, workgroup, database, Auth0 issuer, audience, and role claim to
production values. Do not reuse the development Clickstream project, app ID,
S3 prefixes, Redshift namespace, Lambda role, or collector hostname.

## SpaceTech campaign (PM-6712)

`GET /v1/analytics/spacetech` accepts inclusive `from`/`to` dates (up to
366 days) and exact source, medium and campaign filters. The legacy content
parameter remains accepted for API compatibility, but content no longer splits
campaign rows or appears in the UI. Distinct visitors are recomputed across all
content values, rather than summing distinct counts. `filterOptions` contains
available source/medium/campaign values for the date range independently of
selected UTM filters. The campaign starts on November 5, 2026 at 00:00 UTC.
Overlapping requests use that date as their earliest start. Requests ending
before launch return HTTP 400. The SpaceTech tab defaults to up to 90 days.

The API retains its JWT/analytics-role gate, parameterized queries, 60-second
cache and resumable-query protocol. `dataThrough` is now the UTC timestamp of
the latest included SpaceTech event, not just its calendar date. It is an event
timestamp, not proof that traffic has occurred recently.

### Warehouse and freshness rollout

Apply the `spacetech_events_mv_v2` materialized projection, SELECT grant and
`refresh_spacetech_report()` procedure/GRANT at the end of `bootstrap.sql` before
deploying the Lambda and hourly EventBridge refresh rule in `template.yaml`.
The dev refresh runs at :30 UTC, after the existing :18 ingestion normally
finishes its warehouse load around :24. A late load is picked up next hour.
On existing installations, skip existing CREATE ROLE/materialized-view statements;
create v2 alongside v1. Retain v1 until the rollback window closes. The existing
logical view can also be updated for reconciliation.

The narrow, timestamp-sorted projection preserves the earlier performance fix
and avoids repeatedly extracting JSON from the wide raw event table. It selects
only marketing-site `/space-tech` events (with optional trailing slash) and
`topcoder:space_tech_challenge` form events. Automatic incremental refresh remains
enabled; the explicit hourly refresh removes dependence on workload-dependent
automatic scheduling. The SECURITY DEFINER procedure contains only a fully
qualified, fixed REFRESH statement. PUBLIC execute is revoked. The API database
role can SELECT approved projections and call this procedure, but cannot read
raw event tables, lead answers or administrator credentials. The maintenance
handler requires the exact scheduled-event envelope; no HTTP refresh route exists.
Scheduled refreshes may wait up to 150 seconds for a cold warehouse within the
180-second Lambda timeout; HTTP queries retain their 24-second wait and resumable
202 behavior. Scheduled failures raise for Lambda retries rather than returning
HTTP errors.

Development ingestion already runs hourly. With hourly ingestion, hourly report
refresh and the one-minute API cache, the normal end-to-end target is under three
hours (usually substantially less). Failed processing jobs can exceed this target;
inspect EMR, the load workflow, refresh-rule invocations and Lambda errors when
investigating delay. This is not a guarantee during outages. Submitted lead rows
come directly from Forms API and are available without waiting for the warehouse.

For country data, enable the bundled
`software.aws.solution.clickstream.IPEnrichmentV2` alongside TransformerV3 and
UAEnrichmentV2 in the Clickstream processing stack's
`TransformerAndEnrichClassNames` parameter. Use the previous template and preserve
all other parameter values, including `ScheduleExpression=rate(1 hour)` and
`DataFreshnessInHour=72` (the accepted event-age window, not the processing delay).
The bundled GeoLite2 file must remain in the Spark `--files` configuration.
Development stack: `Clickstream-DataProcessing-ead9a39a35334fafb77428073704ad7b`,
account `811668436784`, region `us-east-1`. This parameter update is separate from
the analytics API stack. If the Clickstream control plane recreates the stack,
carry the enrichment selection into that pipeline configuration.

No increase to ingestion frequency, EMR capacity or Redshift RPUs is required.
The hourly narrow-view refresh adds 24 bounded queries/day; with the live 4-RPU base and a one-minute billing floor, an isolated hourly
wakeup would add about 12 compute hours/month (about $18 at $1.50/hour).
Overlap with the existing hourly warehouse load lowers that estimate; longer
queries or autoscaling can increase it. This is not a billing cap. See
[AWS pricing](https://aws.amazon.com/redshift/pricing/).
Country lookup runs inside existing hourly jobs; monitor their runtime/cost.

Country uses `event_v2.geo_country`; previously processed nulls stay Unknown.
No historical raw data is rewritten. Device reporting maps PC/Desktop and
recognized desktop OS values (when the parser returned Other) to Desktop,
preserves Mobile/Tablet, and leaves unrecognized devices Unknown. Country is
never inferred from language and unknown devices are never assumed to be desktop.

### Metrics and leads

Counts include page views, distinct visitors, starts, accepted submissions,
form-section viewers, CTA clicks and FAQ opens. Submission rate is submission
events divided by distinct page visitors; repeats can exceed 100%. Engagement
is foreground milliseconds converted to seconds and divided by page views.
Daily series include quiet days. A visitor can appear in several campaign rows
if they use several links.

The SpaceTech page also loads private leads through the existing Forms API,
independently of the aggregate response. Forms reporters/administrators can see
Date Submitted, Name, Work Email, Company, Problem, utm_source, utm_medium,
utm_campaign and form_status. All columns support sorting and independent text
filters; date/UTM filters also apply. Complete pagination is fetched before
filtering/sorting. The same table remains in Reports → Forms, whose CSV export
retains its server-generated date-range behavior. No reporting permission is
expanded. A denied Forms request leaves aggregate analytics usable.

Saved lead rows are Submitted. The SpaceTech analytics response also includes
`formActivity`, anonymous unfinished attempts with only start time, source, medium,
campaign and status. The lead table combines these with Forms-authorized submissions;
partial names, emails and answers remain blank. Reports → Forms and its CSV export
remain submission-only.

Apply `spacetech-form-status.sql` before deploying the updated Lambda. Its narrow
view reads the existing start, abandonment and completion events, including
historical events, without granting access to the raw event table. No collector,
form schema or historical data changes are required. The UI explicitly reports
activity as unavailable when connected to an older API without `formActivity`.

Started means a start was observed without completion or abandonment. Incomplete
means an abandonment was observed without completion. Completion takes precedence
and removes the anonymous attempt; the submitted lead comes only from Forms.
Attempts are correlated by pseudonymous visitor and session, from each start until
the next start. Visitor/session IDs stay in SQL and never enter the API response.
The selected dates and UTM filters apply to the start; terminal events are checked
even after the selected end date or with changed UTM values. The mixed table labels
its date column Date Submitted / Started. Attribution comes from the start event.
Missing abandonment events are not guessed from elapsed time, so a Started row
is not a promise that the visitor is still online. Simultaneous tabs cannot be
unambiguously distinguished without a future per-form-instance tracking ID.

Activity follows warehouse ingestion, while submitted lead details remain
immediate. The response row limit still fails explicitly rather
than silently truncating activity. Historical FAQ opens and form-section exposure
cannot be reconstructed without the corresponding website instrumentation.

Rollback: redeploy the previous Lambda CodeKey and template; restore the previous
processing enrichment parameter if needed. Leave the additive v2 projection and
procedure in place until no deployment uses them. No data deletion is needed.

### SpaceTech source dashboard (PM-6775)

The endpoint returns `personas` (full-period totals), `dailyPersonaSeries` (daily metrics),
and `personaSeries` (weekly metrics) for Topcoder, George, Anita and Tony. The persona is the
fourth underscore-delimited token in `customer_spacetech_[period]_[persona]_…`,
matched case-insensitively from **utm_campaign only**. Source, medium and content
never assign a persona. Unknown names and unattributed traffic remain in the
existing totals and Details breakdowns, but do not enter the four-source comparison.

Each source's visitors and form-section viewers are distinct across all its
campaign links within the aggregation period; the same visitor can appear under
multiple sources. Rates use aggregate numerators/denominators, never sums or
averages of daily/campaign rates. Submissions/visitors can exceed 100%; zero
denominators yield zero. Weekly buckets start Monday at 00:00 UTC, and first/last
weeks include only events inside the requested inclusive dates. Quiet weeks and
missing sources are zero-filled. Daily buckets follow the same attribution and date filters. The SpaceTech query
allows four extra rows per selected day, up to 1,464 extra rows for a 366-day range.

Deploy the updated `handler.py` to the existing development analytics Lambda
using a versioned S3 zip and the stack's `CodeKey` parameter. No warehouse DDL,
refresh schedule, IAM, ingestion, Forms API or reports-api change is required.
The response additions are backward compatible. Deploy the API before the UI;
an older API produces an explicit dashboard-unavailable message, while Details
remains usable. Rollback uses the prior `CodeKey` with the previous template.

Run the SQL regression tests as well as the handler tests:

```bash
python3 -m pip install -r infrastructure/analytics-api/tests/requirements.txt
python3 -m unittest discover -s infrastructure/analytics-api/tests -v
```

The SQL tests run real aggregates on synthetic repeated-visitor events using
DuckDB, adapting only named parameters and `DATEADD`. Verify the unmodified
report query through the Redshift Data API before deploying: Redshift does not
support every query form accepted by local SQL engines.
