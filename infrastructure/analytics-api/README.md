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

Reports are limited to 366 inclusive days and 2,000 decoded rows. Query waits
leave time for a sanitized response. A failed or aborted statement is retried
once within the same deadline. Clients can opt into resumable requests with
`async=true`. If Redshift Serverless needs longer than one HTTP request, the API
returns `202`, `Retry-After`, and a server-generated query token. The browser
polls with that token until the original statement completes instead of
starting another warehouse query. Tokens are accepted only for the exact SQL,
validated parameters, retry attempt, and current or previous four-hour window.
The four-hour window remains below the Data API's eight-hour idempotency
retention and permits one complete boundary-crossing window without making
tokens reusable for other reports. An EventBridge schedule invokes the default
Campaigns report, filter-option query, and `/opportunities` route report at each
new window, allowing their statements to finish before an interactive request
while preserving Redshift Serverless idle cost controls. Browser polling is
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
   idempotent `GRANT` statements.
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
