# Retired Vanilla discussions redirect

`discussions.topcoder.com` (the retired Vanilla forums) only returns permanent
redirects. `viewer-request.js` mirrors the live viewer-request function, which
answers every request before CloudFront contacts its origin.

| Resource | Production value |
| --- | --- |
| AWS account / region | `409275337247` / `us-east-1` |
| CloudFront distribution | `E1PCI0WVJ2HCEF` (alias `discussions.topcoder.com`, not CloudFormation-managed) |
| Viewer request function | `discussions-topcoder-retirement-redirect` (`cloudfront-js-2.0`) |

| Legacy URL | Redirect |
| --- | --- |
| `/categories/<challenge UUID>` | `https://topcoder.com/opportunities/challenge/<UUID>?tab=forum` |
| `/categories/<migrated URL code>` (optional `/pN`, trailing slash) | `https://forums.topcoder.com/category/<forums ID>` |
| `/discussion/<migrated DiscussionID>/...` | `https://forums.topcoder.com/thread/<forums ID>` |
| Anything else (unmigrated or group threads, comments, profiles, unknown codes) | `https://forums.topcoder.com/` |

Incoming query parameters are appended unchanged. Category URL codes are matched
case-insensitively after percent-decoding. Before PM-6614 every non-challenge
category (for example the Marathon Match Tournament **Forums** link,
`/categories/marathon-match-tournament-2026`) was sent to the challenge page and
showed "Competition not found", and every thread went to the forums home.

## Mapping data

The forums-api-v6 public Vanilla import gives each row the deterministic ID
`publicImportId(type, sourceId)`: `pf` plus the first 12 base64url characters of
SHA-256 of `vanilla-public-v1:<type>:<sourceId>`. The function computes the same
ID, so it embeds only Vanilla source IDs:

- `CATEGORIES`: URL code to Vanilla CategoryID for the 57 migrated categories
  (`PublicForumCategory.legacySlug` / `legacyId` where `legacyId > 0`; negative
  IDs are Jive categories).
- `THREADS`: the 1,357 migrated public DiscussionIDs
  (`PublicForumImportRecord` rows with `entityType = 'discussion'`), sorted and
  encoded as fixed-width, three-digit base-36 values for a binary search. Challenge
  discussions were imported into challenge forums and group discussions were not
  imported, so those IDs fall back to the forums home rather than to a missing thread.

The Vanilla import is complete and Vanilla is retired, so this data is static.
If the public import is ever rerun, regenerate both values from read-only queries
against the production forums schema and keep the file under the 10 KB function
size limit (the tests enforce this). Migrated category ACLs still apply. For
example, Marathon Match Tournament 2026 sits under Data Science, which requires
sign-in.

## Deploy

Run `node --test infrastructure/discussions-redirect/routing.test.cjs`. Then, with
production credentials:

1. Save the live code for rollback: `aws cloudfront get-function --name
   discussions-topcoder-retirement-redirect --stage LIVE live-before.js`. Compare
   it with this source to preserve concurrent changes.
2. `aws cloudfront update-function` with this file, the existing comment and runtime,
   and the `describe-function` ETag. This updates only the DEVELOPMENT stage.
3. `aws cloudfront test-function --stage DEVELOPMENT` for a challenge category,
   `/categories/marathon-match-tournament-2026`, `/discussion/7407/topcoderpride`
   and an unknown path. Then run `publish-function`.
4. Verify with `curl -I https://discussions.topcoder.com/categories/marathon-match-tournament-2026`.
   Expect `location: https://forums.topcoder.com/category/pfOG6mUrt7yvr3`. Responses
   are cacheable for five minutes.

Rollback: update the function with `live-before.js` and publish again. No
distribution, DNS or database change is involved.
