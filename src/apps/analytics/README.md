# Analytics app

The Analytics app is the first-party reporting UI for Topcoder's AWS
Clickstream data. It is bundled with Platform UI and is available at
`/analytics` on the combined Platform UI host or at the root of the dedicated
`analytics.<domain>` host.

## Access control

Every Analytics route requires an authenticated profile with the exact
`analytics` role. The browser guard controls navigation only; the analytics API
also validates the Auth0 JWT issuer and audience and independently checks the
verified Topcoder roles claim before running a query.

The route tree is:

```text
/analytics
  -> /analytics/campaigns
  /campaigns
  /general
```

On `analytics.<domain>`, the same children are `/campaigns` and `/general`.

## Reports

Campaign Analytics uses UTM attribution and an ordered cohort funnel. Its
totals answer how many distinct landing visitors clicked, then registered for
a challenge after clicking, then submitted after registering. It also shows
campaign and landing-page breakdowns plus aggregate click locations by semantic
element fields and ten-percentage-point viewport buckets.

General Analytics shows page views, distinct visitors, clicks, and distinct
clickers. Page views, visitors, and clicks use separate daily area charts, and
the ranked page table is paginated twenty rows at a time. Traffic-source and
page breakdowns remain available; the application-surface breakdown is not
shown.

Counts are daily aggregates from the AWS Clickstream reporting views. Date
ranges are inclusive and limited to 366 days. The UI displays the warehouse's
`dataThrough` value because the development transform currently runs daily.
Empty dates in a series are not inferred as provider outages.

Development includes a clearly labeled synthetic campaign named
`aws_analytics` with UTM ID `dev_fixture_20260902`. Its verified ordered funnel
contains 30 landing visitors, 22 clickers, 14 registrations, and 8 submissions,
plus multiple landing paths and click placements. Treat it as UI test data, not
member traffic.

Redshift Serverless can take longer than one HTTP request after an idle period.
The UI opts into resumable queries and transparently polls `202` responses with
the server-issued query token. The report spinner stays in a contained region
below the filters, leaving filters and Analytics navigation usable. Polling is
bounded to twelve requests (roughly five minutes at the API's maximum query
wait); after that, or after a genuine failure, the explicit retry action is
shown.

## Privacy

The UI receives aggregate counts only. It never receives member IDs,
pseudonymous analytics IDs, handles, email addresses, rendered click text, form
values, raw destination queries, or raw click coordinates. API errors are
mapped to safe categories before display, and last-good data remains visible if
a refresh fails.

## Configuration

Set the following build variable for each provisioned environment:

```text
REACT_APP_ANALYTICS_API_URL=https://api.<domain>/v1/analytics
```

Leave it empty where the API has not been provisioned. Authenticated requests
use Platform UI's global XHR client, which attaches the current access token.

The event collector is a separate public ingestion endpoint configured through
`REACT_APP_AWS_ANALYTICS_ENDPOINT`; in development it is
`https://events.topcoder-dev.com/collect`. Do not point the reporting UI at the
collector or reuse development resources in production.

## Verification

From the Platform UI project directory:

```bash
nvm use
yarn lint
CI=true yarn test --watchAll=false --runTestsByPath \
  src/apps/analytics/src/config/routes.config.spec.ts \
  src/apps/analytics/src/analytics-app.routes.spec.tsx \
  src/apps/analytics/src/pages/AnalyticsPages.spec.tsx \
  src/apps/analytics/src/lib/services/analytics.service.spec.ts \
  src/apps/analytics/src/lib/utils/analytics.utils.spec.ts \
  src/apps/analytics/src/lib/hooks/useAnalyticsResource.spec.ts
yarn run build
```

The AWS API source, database grants, deployment sequence, and operational
checks are documented in
[`../../../infrastructure/analytics-api/README.md`](../../../infrastructure/analytics-api/README.md).
