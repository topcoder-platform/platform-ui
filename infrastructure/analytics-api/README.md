# Topcoder analytics API

This directory contains the development infrastructure and Lambda code for the
role-gated Analytics UI. The API is a read-only adapter over the existing AWS
Clickstream Redshift reporting views; it is not an ingestion endpoint.

## Architecture and security boundary

```text
Platform UI
  -> API Gateway HTTP API JWT authorizer
  -> Lambda exact analytics-role check and fixed queries
  -> Redshift Data API
  -> analytics_api_reader database role
  -> approved reporting views
```

API Gateway validates the configured Auth0 issuer, audience, signature, and
standard JWT time claims. Lambda then requires `analytics` in the configured
namespaced roles claim. The handler accepts only three fixed `GET` routes,
strict dates, and bounded UTM/surface tokens. SQL is server-owned and uses Data
API named parameters; callers cannot provide SQL, object names, sort clauses,
or result limits.

Reports are limited to 366 inclusive days and 2,000 decoded rows. Query waits
leave time for a sanitized response, concurrency and API throttles cap warehouse
pressure, and successful responses use `Cache-Control: private, no-store`.
Logs contain request IDs and service-owned error categories only.

## Files

- `template.yaml` provisions the API, JWT authorizer, Lambda, least-privilege
  query role, logs, custom domain, and Route 53 record.
- `src/handler.py` validates and shapes filter, campaign, and general reports.
- `bootstrap.sql` creates the read-only Redshift database role and grants only
  the reporting objects required by the handler.
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
5. Deploy `template.yaml` with `CAPABILITY_NAMED_IAM` and the exact workgroup,
   wildcard certificate, public hosted zone, code bucket, and code key.
6. Run `bootstrap.sql` through the Data API using the Redshift namespace's
   managed administrator secret. On reapplication, omit `CREATE ROLE` if the
   role already exists and run the idempotent `GRANT` statements.
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
valid token with analytics    -> 200 aggregate JSON
```

Also verify an invalid date returns `400`, an unsupported route returns `404`,
responses are `private, no-store`, and CloudWatch logs do not contain tokens,
filters, SQL, or record values.

## Production promotion

Provision production as a separate stack and database role. Change the domain,
hosted zone, certificate, workgroup, database, Auth0 issuer, audience, and role
claim to production values. Do not reuse the development Clickstream project,
app ID, S3 prefixes, Redshift namespace, Lambda role, or collector hostname.
