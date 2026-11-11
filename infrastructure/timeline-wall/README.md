# Timeline Wall migration

The `timeline-wall` sub-app replaces community-app's timeline UI. Public reads
and authenticated writes continue to use `/v5/timeline-wall`; the API's
`auth/currentUser` response controls moderator UI. Backend authorization remains
mandatory. No event or media data is migrated.

Development exposes `https://timeline.topcoder-dev.com/` and
`https://topcoder-dev.com/timeline-wall` (also `www`). The legacy
`/community/timeline-wall` path returns a 301 to `/timeline-wall`, preserving
encoded and repeated query parameters. The platform router includes a client
redirect as well. Production routing is not changed by this development rollout.

## Routing ownership

`route_template.py` adds the five scoped behaviors and request function to the
**current** `topcoder-website-dev` CloudFormation template. Existing origins,
functions, routes, policies, and API resources are preserved. Apply the same
transform to that stack's source template before any future infrastructure
redeployment from topcoder-website. Content-only website deployments do not
replace the stack template.

- Website distribution: `E3P6DRXC192WA`; existing `PlatformUiOrigin` and OAC.
- Platform distribution: `EFA7R1KH3UX5M`; add `timeline.topcoder-dev.com` to aliases.
- Existing wildcard ACM certificate covers the new host.
- Add `https://timeline.topcoder-dev.com` to the existing Universal Navigation
  CloudFront CORS response-headers policy `860b79bb-1e6a-47f0-b10b-354194fa2b79`.
  Preserve every existing allowed origin and header setting. Verify that
  `https://uni-nav.topcoder-dev.com/v1/tc-universal-nav.js` returns
  `Access-Control-Allow-Origin: https://timeline.topcoder-dev.com` for that origin;
  otherwise the platform header's cross-origin script is blocked.
- Public Route 53 zone: `Z2CIRG3R0ZSGFQ`; alias A points to
  `d10303ypawq4ub.cloudfront.net` (CloudFront zone `Z2FDTNDATAQYW2`).
- Add `platform-host-fragment.js` immediately after the existing platform viewer
  function's host lookup. Preserve its existing Contact, Accounts, and TopGear
  routing. Never replace the function with only this fragment.
- Grant the website distribution `s3:GetObject` on only
  `platform-mvp.topcoder-dev.com/timeline-wall/index.html` and
  `platform-mvp.topcoder-dev.com/timeline-wall-preview/*`, retaining all existing
  bucket policy statements.

## Release sequence

1. Validate TypeScript, lint, timeline interaction/transport/route tests, Python
   routing tests, and deployment tests. Build with the pinned dev browser config.
2. For a pre-merge isolated dev deployment, build with
   `PUBLIC_URL=/timeline-wall-preview`, upload build assets under that prefix,
   then publish its HTML to `timeline-wall/index.html`. Never replace the shared
   root HTML for a feature preview. Upload assets before HTML and keep old assets.
3. Capture current CloudFormation template, parameters, distributions, function
   code/config/ETag, bucket policy and DNS state outside the repository. Transform
   the current website template and prepare a change set. Expected changes:
   `TimelineWallViewerRequestFunction` (add), `WebsiteDistribution` (modify,
   no replacement), and `DistributionDomainDeployParameter` (modify).
4. Apply the narrow bucket grant, publish the updated platform viewer function
   using its current ETag, append the alias using the distribution's current ETag,
   execute the reviewed website change set, and create the DNS alias. Re-read
   before each write and reject stale snapshots.
5. Wait for stack `UPDATE_COMPLETE`, distributions `Deployed`, DNS `INSYNC` and
   invalidations `Completed`. Verify both URLs, the redirect with repeated/encoded
   queries, live event reads, media rendering, mobile layout and unchanged
   unrelated website/platform routes.

After merge, `deploy/site.py` promotes `timeline-wall/index.html` alongside the
shared and Gigs shells after uploading assets. It restores this shell too if
public verification fails. The preview prefix can remain for open browser tabs;
normal releases use root `/static/` assets, which the existing website routing
already supports.

## Rollback

Revert the website stack using the captured before-template and unchanged
parameters. Remove only the added timeline alias/DNS record and marked platform
function block, checking for concurrent changes. Remove only the timeline bucket
policy statement and the one added navigation CORS origin. Invalidate the timeline
and legacy paths. Retain deployed assets
for clients with open tabs. Restoring the previous website template restores the
legacy community-app handoff without changing timeline events.

## Checks

```sh
yarn eslint -c src/.eslintrc.js 'src/apps/timeline-wall/**/*.{ts,tsx}'
yarn tsc --noEmit
yarn craco test --watchAll=false --runInBand --runTestsByPath \
  src/apps/timeline-wall/src/timeline-wall.spec.tsx \
  src/apps/timeline-wall/src/timeline-wall.service.spec.ts \
  src/apps/timeline-wall/src/timeline-wall.routes.spec.tsx
python3 -m unittest discover -s infrastructure/timeline-wall -v
python3 -m unittest discover -s deploy/tests -p test_site.py -v
```
