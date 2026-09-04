# ADR 0002: AWS-native product analytics

- Status: Accepted
- Date: 2026-08-30
- Owners: Platform and website engineering

## Context

Topcoder needs one first-party analytics path across topcoder-website and
platform-ui. It must attribute page views and clicks to standard UTM values and
measure the same person's progression from a marketing landing page through
challenge registration and submission. The development deployment should
normally remain below USD 200 per month and the production design below USD 400
per month.

All prior product-analytics and survey integrations are removed. Existing
operational error logging remains out of scope and is not an event source for
product analytics.

## Decision

Use AWS Guidance for Clickstream Analytics on AWS, version 1.2.1, in us-east-1.
The control plane provisions a regional ingestion service on ECS with EC2
capacity, stores raw events in S3, runs the built-in transformer on a
daily EMR Serverless schedule, loads modeled data into Redshift Serverless, and
exposes direct-query datasets to Amazon QuickSight.

One Clickstream project and one web app ID are shared by the two UI surfaces in
each environment. The global surface attribute distinguishes platform_ui from
topcoder_website. Production must use a separate project, application,
ingestion endpoint, S3 prefixes, and Redshift namespace; production clients must
never send data to the development project.

The browser integration uses the AWS Clickstream Web SDK directly in each host
application. Universal Navigation owns only first-touch UTM persistence and
signup-link propagation. It must not initialize another SDK instance because
that would double-count every host page.

## Development topology and cost controls

| Layer | Development setting | Production starting point |
| --- | --- | --- |
| Ingestion | One active ECS/EC2 instance, scale to two | Two instances, scale to four |
| Delivery | Direct S3 sink, 10 MB or 300 second buffering | Same |
| Network | Existing VPC and NAT gateway; no Global Accelerator | Reuse an existing production VPC/NAT |
| Logs | Default service logs; no ALB access-log bucket | Enable only when an operational need justifies it |
| Processing | Built-in transform plus user-agent enrichment once per day | Daily; increase only after a freshness review |
| Location enrichment | Disabled | Disabled unless approved for a documented use case |
| Warehouse | Redshift Serverless at the 8 RPU minimum | Start at 8 RPU and observe workload |
| Reporting | One QuickSight Enterprise author, direct query, no SPICE | Add readers/authors only as needed |
| Storage | Expire temporary artifacts; retain raw and modeled data to approved policy | Same with production retention policy |

The deployed development environment is in AWS account 811668436784 in
us-east-1. Project topcoder_web_dev and app topcoder_web are active at
https://events.topcoder-dev.com/collect. The pipeline ID is
ead9a39a35334fafb77428073704ad7b. It uses the existing development VPC, a
dedicated second private ingestion subnet in a supported availability zone,
the existing Redshift/QuickSight subnets, daily processing, and the S3 bucket
topcoder-clickstream-data-dev-811668436784. A synthetic SDK-format event was
accepted by the collector before the client configuration was enabled. A
second event with source codex, medium integration, and campaign aws_analytics
was then processed through S3 and EMR and verified in both Athena and Redshift.

The collector's durable client hostname is
https://events.topcoder-dev.com/collect. The original
analytics.topcoder-dev.com ingestion alias remains available only during the
cutover observation window; that hostname now belongs to the reporting UI.

The development control-plane API has a narrow patch over upstream v1.2.1:
endpoint security-group discovery treats a gateway VPC endpoint without a
Groups array as an empty list. This fixes project provisioning in a VPC that
contains S3 gateway endpoints. CloudFormation does not own this code change, so
an upgrade or stack repair can overwrite it; either carry the patch forward or
upgrade only after the upstream implementation handles gateway endpoints.

The upstream v1.2.1 Redshift schema also creates six PL/Python UDFs. Redshift
[stopped allowing new PL/Python UDFs on 2025-10-30](https://docs.aws.amazon.com/redshift/latest/mgmt/behavior-changes.html),
so the original schema run failed before creating the merge procedures. The
development database uses the compatibility Lambda
topcoder-clickstream-redshift-udf-dev for only those six preserved functions.
The Redshift-associated role has permission to invoke only that Lambda, and the
Lambda execution role can write only its logs. Redshift administrator access
uses the namespace's managed Secrets Manager secret rather than a copied
password. The secret adds a small fixed monthly charge; Lambda invocation cost
at the daily processing frequency is negligible relative to ingestion and
Redshift.

The patched 114-statement installer is stored at the version-labeled prefix
s3://topcoder-clickstream-data-dev-811668436784/clickstream/topcoder_web_dev/data/load-workflow/tmp/topcoder_web_dev/sqls/topcoder_web-20260830T030115510Z-lambda-udf-v2/.
The rebuild scripts, deployed package, external-function definitions,
checksums, patched SQL, and runbook are archived at
s3://topcoder-clickstream-templates-dev-811668436784/custom-fixes/redshift-lambda-udf/v1/.
These resources are tagged and encrypted. CloudFormation does not own this
repair; reapply it after a Clickstream schema or application upgrade unless the
new release has removed the PL/Python dependency. Start a new load execution
with a unique name after repair because the v1.2.1 parent redrive reuses child
names and collides with their prior executions.

At low event volume, the design target is approximately USD 130–190 per month
for development and USD 240–360 per month for production. These are operating
guardrails, not an invoice guarantee: ingestion traffic, EMR runtime, Redshift
query duration, log volume, cross-AZ transfer, and additional QuickSight users
are variable. Resources use Application, Environment, and CostCenter tags.
After the payer account activates those cost-allocation tags, review Cost
Explorer by tag weekly during the first month and create tag-scoped budgets.
The linked development account cannot activate those tags or create the
tag-scoped payer budget itself. Investigate development at USD 160 forecast and
stop nonessential processing before USD 200; use USD 320 and USD 400 as the
equivalent production thresholds.

Do not increase the ingestion minimum, processing frequency, Redshift base RPU,
or QuickSight user count without recording the expected monthly delta.

## Identity and attribution

The clients create a random tc_analytics_id first-party cookie with a one-year
lifetime. On topcoder.com, topcoder-dev.com, and topcoder-qa.com it is scoped to
the registrable domain, allowing a landing-page visit and a later platform-ui
conversion to use the same Clickstream user ID. It is pseudonymous and contains
no member data.

After authentication, platform-ui adds member_id as a global event attribute.
It does not send handle, name, email, form values, or rendered click text.

Universal Navigation stores the first valid visit containing any of these
standard parameters in the tc_utm cookie for 30 days:

- utm_source
- utm_medium
- utm_campaign
- utm_id
- utm_term
- utm_content

Values are restricted to 100 characters and the characters A-Z, a-z, 0-9,
period, underscore, tilde, and hyphen. The two clients map them to Clickstream's
traffic_source columns, preferring values on the current URL and otherwise using
the first-touch cookie.

## Event contract

| Event | Producer | Required dimensions | Meaning |
| --- | --- | --- | --- |
| _page_view | AWS SDK in both apps | surface, environment, traffic source | A browser route became active |
| _user_engagement | AWS SDK in both apps | surface, environment, traffic source | Foreground engagement of at least one second |
| ui_click | Both apps | page_path, element_type, click_x_percent, click_y_percent | A click on an interactive element |
| ui_click | Both apps, when available | element_id, placement, destination_host, destination_path | Semantic click location and query-free destination |
| challenge_registered | platform-ui after API success | challenge_id, challenge_track, member_id | The Submitter resource was successfully created |
| challenge_submitted | platform-ui after API success | challenge_id, challenge_track, member_id, submission_type | The Review API successfully created a submission |

Clickable conversion controls should have stable data-analytics-id and
data-analytics-placement attributes. Do not derive element_id from rendered
copy, because copy changes and may contain user-provided text.

The AWS SDK adds its reserved current-page URL to events. UTM query values are
therefore present in raw/modelled events as well as normalized traffic-source
columns. Application routes must not place credentials, email addresses, or
other secrets in query parameters. The custom ui_click destination fields
deliberately omit destination queries.

Global Privacy Control and Do Not Track prevent SDK initialization. Analytics
errors are swallowed so collection can never block navigation, registration, or
submission.

## Funnel definition

The product_analytics_events_v1 Redshift view normalizes the event contract.
The challenge_funnel_daily_v1 view counts distinct coalesced
user_id/user_pseudo_id values, grouped by traffic source and first landing page,
with these ordered stages:

1. A _page_view event with surface topcoder_website.
2. A ui_click event on that surface.
3. A challenge_registered event after the click.
4. A challenge_submitted event after registration.

The challenge_conversion_daily_v1 view groups a person's first registration
and later submission by challenge_id. The click_location_daily_v1 view groups
clicks by stable placement and element dimensions, query-free destination, and
10-percentage-point viewport buckets. All three reporting views enforce the
event contract centrally; simple independent event counts would overstate
conversion.

QuickSight dashboard topcoder_product_analytics_dev_v1 provides landing users,
landing clickers, registrations after a click, submissions after registration,
the ordered UTM funnel, challenge conversion, and click-location tables. It
uses the direct-query datasets topcoder_challenge_funnel_v1,
topcoder_challenge_conversion_v1, and topcoder_click_location_v1, so it does not
create a SPICE copy. The reporting SQL, dataset requests, dashboard request, and
runbook are archived at
s3://topcoder-clickstream-templates-dev-811668436784/custom-assets/product-analytics/v1/.

Platform UI also provides an operator-facing application at
https://analytics.topcoder-dev.com. Every app route requires an authenticated
profile with the exact analytics role. Its read-only HTTP API is exposed at
https://api.topcoder-dev.com/v1/analytics. API Gateway validates the
development Auth0 issuer and human-client audience; Lambda independently checks
a verified Topcoder roles claim before issuing fixed, parameterized, bounded
Redshift Data API queries through the analytics_api_reader database role. The
API returns aggregate data only and marks every response private and
non-cacheable.

The Campaigns tab exposes the ordered landing, click, registration, and
submission funnel with UTM, landing-page, and privacy-safe click-location
breakdowns. Click locations are ranked and paginated twenty rows at a time;
the API combines viewport-position buckets for the same semantic item, and the
table does not display position.
The General tab exposes page views, visitors, and clicks in
separate daily charts plus paginated page and traffic-source tables. Both
report warehouse freshness and limit callers to 366 inclusive days. QuickSight
remains the AWS native exploratory dashboard; the Platform UI app is the
narrowly scoped daily operational interface.

To avoid making a user wait for Redshift Serverless to resume after idle, an
EventBridge rule starts the default Campaigns and filter-option statements at
the beginning of each four-hour Data API idempotency window. Interactive
requests reuse the completed statements by their query fingerprint. This adds
only bounded scheduled queries and does not keep development RPUs continuously
active.

## Configuration

Platform UI reads:

- REACT_APP_AWS_ANALYTICS_APP_ID
- REACT_APP_AWS_ANALYTICS_ENDPOINT

topcoder-website reads:

- NEXT_PUBLIC_AWS_ANALYTICS_APP_ID
- NEXT_PUBLIC_AWS_ANALYTICS_ENDPOINT

The values are public ingestion configuration, not AWS credentials. Store them
in each deployment environment and leave them empty to disable analytics in
local or unprovisioned environments. Never expose the control-plane login,
Redshift credentials, or AWS credentials to either client.

Development uses app ID topcoder_web and endpoint
https://events.topcoder-dev.com/collect. QA and production remain empty and
disabled until their separate projects and endpoints are provisioned.

## Validation and operations

For each environment:

1. Open a landing URL with a unique test UTM campaign.
2. Confirm tc_utm and tc_analytics_id are first-party cookies.
3. Click a challenge CTA, register, and submit with a test account.
4. After the daily processing run, verify all four ordered stages share the same
   user identity and traffic-source values in Redshift.
5. Verify the QuickSight funnel and UTM breakdown against the Redshift counts.
6. Repeat with Global Privacy Control or Do Not Track enabled and confirm no
   browser requests reach the ingestion endpoint.
7. Review failed ingestion responses, EMR jobs, Redshift load state, S3 growth,
   and the monthly cost forecast.
8. Verify the reporting API returns `401` without a JWT, `403` for a verified
   account without the analytics role, and aggregate JSON for an authorized
   account; confirm that its logs contain no tokens, filters, SQL, or records.

The deployment smoke test completed this path on 2026-08-30. Both synthetic
events are present in event_v2; the tagged event retained codex, integration,
and aws_analytics while the control event remained Direct. The default AWS
Clickstream dashboard, Topcoder reporting dashboard, Redshift data source, and
all three custom datasets reported successful creation status.

On 2026-09-02, the development collector received a larger pseudonymous fixture
for campaign `aws_analytics` and UTM ID `dev_fixture_20260902`. The standard
transform and Redshift load completed successfully, and both the reporting view
and role-gated API returned an ordered 30 landing visitors, 22 clickers, 14
registrations, and 8 submissions. Three landing paths and three semantic click
placements provide non-empty table data. These aggregates are synthetic UI
test data and must not be interpreted as member traffic.

On 2026-09-04, the same standard pipeline loaded a second pseudonymous fixture,
UTM ID `dev_fixture_multiday_20260904`, into the September 2 and 3 cohorts. The
reporting views verified 38 landing visitors, 29 clickers, 19 registrations, and
13 submissions across those dates, plus 29 distinct semantic clicked items.
Combined with the original fixture, `aws_analytics` now spans three reporting
dates and contains 68 landing visitors, 51 clickers, 33 registrations, and 21
submissions. The expanded click set intentionally exercises the Campaigns
table's twenty-row pagination. These aggregates are also synthetic UI test data.

If the daily pipeline misses its freshness objective, first inspect failures and
job duration. Increasing processing frequency is a cost-bearing design change,
not the default incident response.
