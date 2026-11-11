# Public statistics migration

`src/apps/statistics` restores the public community statistics page in Platform UI.
The General, Development, Design, QA, SRM, and Marathon Match categories use the
existing public `/v6/reports/statistics` endpoints. Totals, sortable/filterable
reports, member profile links, pagination, empty states, and retry are available
without signing in. SRM/MM reports are historical snapshots, as in the API.

## Routes and release

- `statistics.topcoder-dev.com` / `statistics.topcoder.com`: Platform UI distribution
  aliases, covered by the existing wildcard ACM certificates. Public Route 53 A
  aliases target the respective platform distribution; add AAAA only when IPv6 is enabled.
- `topcoder-dev.com/statistics` / `topcoder.com/statistics` (including `www` and
  category paths): website viewer function selects the existing private Platform UI
  origin and requests `/statistics/index.html`. Apex canonicalizes to `www`.
- `/community/statistics` and descendants: permanent redirects to `/statistics`,
  retaining category suffixes and encoded/repeated query parameters. Platform UI
  also supplies a client redirect for SPA navigation, retaining the fragment.
- Insert `platform-host-fragment.js` after the host lookup in the **current** platform
  viewer function. Preserve all existing Contact, Accounts, TopGear, and Timeline logic.
- Add the new statistics origin to the existing Universal Navigation CORS policy.
  The reports API already permits public browser requests.
- Grant the website distribution `s3:GetObject` on only `statistics/index.html`
  in the existing platform bucket, retaining all other policy statements.

The website source change belongs to `topcoder-website/infra/aws/site.yml`.
Apply its narrow function change to the current deployed CloudFormation template,
retaining independently installed Timeline/Gigs behaviors and all unrelated resources.
Review a change set before execution. Never replace a live template with a stale checkout.

Build each environment with its pinned browser configuration. Upload immutable
`static/` assets first and publish only `statistics/index.html` for an isolated
pre-merge release; preserve shared root HTML and existing assets. After merge,
`deploy/site.py` promotes and rolls back the statistics shell alongside the other
entry points. Existing website `/static/` routing serves the assets from Platform UI.

Before activation, capture templates/parameters, functions/configuration/ETags,
bucket policies, navigation CORS policy, distribution aliases, and DNS. Re-read
before each write and preserve concurrent changes. Wait for CloudFormation
`UPDATE_COMPLETE`, CloudFront `Deployed`, DNS `INSYNC`, and completed invalidations.
Verify all host/path variants, deep links, queries, categories, API responses,
mobile layout, and unrelated website/platform smoke checks.

## Rollback

Restore the prior statistics HTML object version, remove only the added host aliases
and DNS records, and revert the marked statistics function code and website function
change with current ETags. Remove only the statistics bucket grant and navigation
CORS origin. Preserve assets for open tabs. Invalidate the statistics and legacy paths.

## Validation

```sh
yarn tsc --noEmit
yarn eslint src/apps/statistics src/config/constants.ts src/apps/platform/src/platform.routes.tsx
yarn craco test --watchAll=false --runInBand src/apps/statistics
python3 -m unittest discover -s infrastructure/statistics-routing
python3 -m unittest discover -s deploy/tests
```

The website viewer tests cover both environments and retirement modes. The related
reports-api change prevents service-account member IDs from breaking first-time
submitter reports; its PostgreSQL regression checks preserve earliest-submission
and maximum-rating semantics.
