# Topgear dev hosting

`topgear.topcoder-dev.com` uses the shared Platform UI build in
`platform-mvp.topcoder-dev.com` through CloudFront `EFA7R1KH3UX5M`
(`d10303ypawq4ub.cloudfront.net`). Its existing Route 53 A alias in public zone
`Z2CIRG3R0ZSGFQ` targets that distribution. The certificate covers this host.
Universal Navigation's dev CORS policy already includes the Topgear origin;
its repository template includes that origin for both environments.

The shared [viewer-request function](../sales/dev-viewer-request.js),
`platform-sales-dev-viewer-request`, redirects only dev Topgear `/challenges`
and `/challenges/` to `/opportunities/challenge`. Repeated filter parameters
and percent encoding are preserved. Other hosts, challenge details, static
assets, and Contact/Accounts routing retain their behavior.

Deploy the Topgear Universal Navigation bundle before the Platform UI build.
Build Platform UI with `LOGICAL_ENV=dev yarn build` and the standard dev environment
configuration, then use the normal dev deployment. Publish the edge function
only after testing its DEVELOPMENT stage and comparing with the live code to
preserve concurrent changes. Run `node --test infrastructure/topgear/routing.test.cjs`
for the routing regression checks.

Verify all three logos, Home and Challenges links, the absence of Leaderboard
and the hero banner, group-filtered challenges, and the HTTP redirect on the dev
host. Production DNS and `/challenges` must stay on community-app until the
production rollout is explicitly scheduled.

Rollback the function to its saved prior code and republish. Roll back the
navigation and Platform UI build using the normal deployment process. There is
no database change and no new DNS change needed for this dev rollout.

The edge redirect only canonicalizes the URL. Authentication and Wipro - All
membership are checked by Platform UI before any Topgear route is mounted,
including direct visits that bypass `/challenges`. Do not infer membership from
cookie presence or an email suffix at CloudFront. Verify anonymous login handoff,
non-member denial, membership service failures, and authorized member access.
