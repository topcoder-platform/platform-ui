# Sales dev route

`sales.topcoder-dev.com` is served by the shared Platform UI root build that
CircleCI deploys on every `dev` merge, like Work, Customer and Reports. The build
detects the `sales` subdomain at runtime (`EnvironmentConfig.SUBDOMAIN`) and
renders the Sales page at `/`, so no Sales-specific build or upload is needed.

| Resource | Dev value |
| --- | --- |
| AWS account / region | `811668436784` / `us-east-1` |
| CloudFront distribution | `EFA7R1KH3UX5M` (`d10303ypawq4ub.cloudfront.net`) |
| S3 bucket | `platform-mvp.topcoder-dev.com` (root build, shared with other hosts) |
| Route 53 public hosted zone | `Z2CIRG3R0ZSGFQ` |
| Host | `sales.topcoder-dev.com` |
| Viewer request function | `platform-sales-dev-viewer-request` |

`dev-viewer-request.js` mirrors the live viewer-request function. It has no Sales
branch: Sales requests pass through unchanged and deep links fall back to the root
`/index.html` through the distribution's 403/404 custom error responses. The
function still routes the Contact and Accounts hosts to their isolated
`contact-app/` and `accounts-preferences-app/` shells. Re-read the live function
before publishing later changes to avoid overwriting newer routing, test with
`aws cloudfront test-function` against the DEVELOPMENT stage, then publish.

The distribution alias and Route 53 A/AAAA records for the Sales host point at the
same distribution; its ACM certificate covers `*.topcoder-dev.com`. Authentication
continues through the standard Platform UI login.

The former isolated `sales-app/` S3 prefix (PM-6343) is no longer referenced and
can be deleted once the shared root route is confirmed.

Deploy the reports-api-v6 PM-6343 branch to dev with its normal `dev-PM-6343` tag
workflow. Server-only Salesforce configuration is documented in that repo's
`SALES.md`. The Sales page uses `/v6/reports/sales`; WIN uses the separate
`/v6/reports/win/sales` endpoint and requires an M2M grant for `reports:sales`.

Rollback: remove the Sales alias/DNS entries, leaving shared settings intact.
Restore the prior Reports API ECS task revision if rolling back the backend.
No database migration is involved.
