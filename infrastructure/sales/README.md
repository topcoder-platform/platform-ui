# Sales dev route

PM-6343 serves the branch build only on `sales.topcoder-dev.com`. The shared
Platform UI S3 root and other app builds are preserved.

| Resource | Dev value |
| --- | --- |
| AWS account / region | `811668436784` / `us-east-1` |
| CloudFront distribution | `EFA7R1KH3UX5M` (`d10303ypawq4ub.cloudfront.net`) |
| S3 bucket / prefix | `platform-mvp.topcoder-dev.com` / `sales-app/` |
| Route 53 public hosted zone | `Z2CIRG3R0ZSGFQ` |
| Host | `sales.topcoder-dev.com` |
| Viewer request function | `platform-sales-dev-viewer-request` |

Build with `nvm use` followed by
`LOGICAL_ENV=dev PUBLIC_URL=/sales-app yarn run build`. Upload build files under
the prefix without deleting shared objects. Give hashed assets immutable cache
headers and `sales-app/index.html` `no-cache,no-store,max-age=0`.

`dev-viewer-request.js` includes the existing Contact and Accounts routing from
the live distribution. Its Sales branch rewrites navigation requests to
`/sales-app/index.html` while allowing prefixed assets through. Test Sales root,
deep links and assets, Contact and Accounts, and unrelated Work/Reports hosts
before publishing. Re-read the live function when applying later changes to
avoid overwriting newer routing. Attach the published function to the default
behavior's viewer-request event, preserving every other association.

Add the Sales alias to the existing distribution. Its ACM certificate already
covers `*.topcoder-dev.com`. Add a Route 53 A alias (and AAAA when IPv6 is enabled)
to the same distribution, preserving all existing DNS records. Invalidate only
`/sales-app/*`. Authentication continues through the standard Platform UI login.

Deploy the reports-api-v6 PM-6343 branch to dev with its normal `dev-PM-6343` tag
workflow. Server-only Salesforce configuration is documented in that repo's
`SALES.md`. The Sales page uses `/v6/reports/sales`; WIN uses the separate
`/v6/reports/win/sales` endpoint and requires an M2M grant for `reports:sales`.

Rollback: remove the Sales alias/DNS entries and restore the prior viewer-request
function association, leaving shared settings intact. The isolated S3 prefix can
be retained for investigation. Restore the prior Reports API ECS task revision
if rolling back the backend. No database migration is involved.
