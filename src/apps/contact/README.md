# Contact

Administrator-only member email management at `contact.topcoder-dev.com` (or
`/contact` on the combined Platform UI host). Both the route and Contact API
require the `administrator` role. The infrastructure additionally uses the
system-admin WAF IP allowlist for administrative routes. Public unsubscribe,
preferences, browser copies, and tracking routes are served by the API and must
remain reachable to recipients.

## Service integration

`CONTACT_API_URL` overrides the default `${API.V6}/contact` URL. The application
uses the shared authenticated Platform UI HTTP client. Transport shapes and
endpoints are documented in `contact-api-v6/docs/api-contract.md` in the v6
workspace. No production records, audience counts, costs, or outcomes are mocked.
Analytics campaign suggestions use the existing analytics filters endpoint. An
administrator without analytics permission can enter the existing campaign name
and ID directly; email links still receive the campaign's UTM attribution.
Tokens preserve the downstream analytics character contract: at most 100 letters,
numbers, dots, underscores, tildes, or hyphens. Unsupported suggestions are flagged
and never silently normalized.

Campaign drafts contain newsletter HTML, optional plain text, and GrapesJS project
JSON (`editorDesign`) so visual layouts can be edited again. Saves include the
server revision; concurrent writes are rejected by the API. Editing anything
invalidates the current audience and preview. Audience preparation polls the
same durable server snapshot token until it is ready. A transient polling failure
retries that token. Pending, expired, empty, or edited snapshots cannot be sent.
The final approval submits exactly the count and token displayed during review.
Later opt-outs, suppression, and inactive-account checks can lower actual sends;
these exclusions appear in recipient outcomes.

SES pricing comes from `/config` and snapshot cost calculations come from the
API. The estimate includes configured email/data rates and excludes infrastructure
and optional services; it is not an invoice guarantee. The current tenant's
service plan determines its rate, so the UI never hardcodes the conventional SES
base rate. Scheduling accepts local time and displays the resulting UTC instant.
Test requests contain no recipient field: the service sends only to the signed-in
administrator's member email.

## Email editor and preview

The app bundles [GrapesJS](https://github.com/GrapesJS/grapesjs) and its
[BSD-3-Clause newsletter preset](https://github.com/GrapesJS/preset-newsletter).
There is no paid SDK, editor account, or third-party content store. The preset
provides one/two/three-column email table layouts, text formatting, headings,
images, buttons, links, dividers, imported HTML, responsive preview, and inline
CSS export. Contact adds social links, a video-link block (email clients generally
do not play embedded video), and a personalized greeting block. The starter
layout uses Topcoder typography/colors with a date field. Reusable templates save HTML and editor project state independently of campaign
recipients. Select a saved template to replace the current content, or duplicate
a full campaign to reuse its settings. The API supplies the mandatory address,
browser-view, preferences, and unsubscribe footer for every recipient.

Use fields such as `{{handle}}`, `{{firstName|there}}`, `{{name|member}}`, and
`{{date}}`. The API validates supported merge fields, escapes member data,
sanitizes authored HTML, and renders personalization. Before hydration, the UI
additionally strips script fields, unsafe attributes/tags/URLs, and active HTML
from stored GrapesJS project data with bounded depth and traversal limits. Preview HTML always runs in
an iframe with an empty sandbox, including mobile/desktop preview. Raw draft KB
are a quick estimate; preview and audience results show rendered size including
service content against the configured clipping threshold.

## Segments and subscriptions

Segments query existing members rather than creating contacts. Country, joined
and active date ranges, skills, gigs availability, groups, rating ranges and
track/type IDs, and languages are supported. Skill and group name lookups resolve
actual IDs from the existing services; administrators may also enter IDs directly.
All criteria combine with AND. Every selected skill must match; multiple country,
group, and language values match any selection.
Upper date inputs include the entire selected UTC calendar day and serialize as
the next midnight because the API upper bound is exclusive. Reloaded filters
convert that exclusive instant back to the selected date.
The segment table lists name, UTC creation date, creator handle and matching member
count. Add and Edit open a focused criteria modal; cancel discards the local draft.
Delete requires confirmation and removes only the saved definition, leaving member
records and filters already copied into campaigns intact. View members opens a
paginated handle/email table backed by `GET /segments/:id/members?limit=25&offset=0`.
All dialogs use the shared accessible modal with focus trapping, Escape/close and
focus restoration; writes prevent dismissal until their outcome is known. Failed
requests preserve edits or expose retry, and late member-page responses are ignored.

`SegmentManager` refreshes metadata after confirmed writes; a failed refresh can be
retried without repeating a successful create/update/delete. Segment actions remain
disabled during refresh and after a refresh error until a successful retry, preventing
stale criteria from reopening and overwriting a saved update. Confirmed saves and
deletions immediately reconcile the parent inventory, so tab switches retain the
authoritative result even after a refresh failure. A request generation guard prevents
older list responses from restoring superseded criteria or deleted definitions. `SegmentEditorModal`
sends only `{name, filter}` to POST/PATCH. `SegmentDeleteModal` uses the authenticated
`contactDelete` helper and accepts an empty 204 response. `SegmentMembersModal`
requests one page at a time and displays server totals, loading, empty and error states.
Function inputs, return values and failure behavior are documented in source.

Segment counts represent all matching active/nondeleted canonical member IDs, before
marketing consent, email deduplication or delivery suppression. They are not an exact
send audience; that is calculated for the saved campaign and subscription type before
sending. A campaign may also exclude recipients with no recorded email engagement
within a selected period.

Contact tabs use the Reviews app's underline style with keyboard navigation. Every
panel uses the same workspace width. Toolbar rows align labeled inputs/selects and
action buttons at the bottom, then stack on mobile screens. Tables and the email
editor scroll within the workspace on narrow screens. Reserved scrollbar space
prevents short and tall panels from shifting the workspace horizontally.

Subscription categories can be created, activated, or deactivated. A member
lookup shows explicit category preferences and delivery suppression. Changes
require audit provenance. Bulk updates of current preferences accept JSON batches
of at most 500 rows shaped as `{memberId, subscriptionTypeId, subscribed}`. These
updates take effect now and replace each listed member/category's current choice.
All rows are validated before writes. Writes proceed sequentially and stop on
first failure, reporting the exact completed count for review/retry. The confirmation
explicitly authorizes applying the current choices now. Updates never infer consent
or create contacts.

Historical HubSpot records must use the reviewed process documented in
`contact-api-v6/docs/subscription-migration.md`, which preserves original timestamps
and opt-outs. The bulk UI performs
current-time updates and does not preserve historical timestamps.

## Onboarding sequences

The Automations tab saves ordered onboarding steps from existing campaign drafts
in the same subscription category. Delays are cumulative hours since member join.
Activation freezes the template content/criteria, requires an explicit maximum
email count per day, and shows the corresponding configured SES message charge
plus data and infrastructure caveats. Only members joining after the activation
cutoff with recorded category consent can enroll. Pause stops new cohorts and
queued sequence campaigns; already accepted SES messages cannot be recalled.
Existing sequences can be copied to create a new version with changed content.

## Reporting and validation

Reports display actual sends, delivery, opens, clicks, bounces, complaints,
unsubscribes, skipped/failed/uncertain outcomes, rates, observed devices, and link
click counts. Recipients are paginated in groups of 100 and can be filtered by
outcome. Privacy proxies affect open/device accuracy; time spent reading is not
reported because email clients cannot reliably supply it.

Run `nvm use` in `platform-ui` before the package manager commands:

- `yarn lint`
- `yarn run build`
- `yarn test:no-watch --runInBand --watchAll=false src/apps/contact`

For the isolated development deployment, build with
`LOGICAL_ENV=dev PUBLIC_URL=/contact-app yarn run build` and publish the artifact
only under the approved `contact-app/` object prefix. The Contact host rewrite
serves that prefix without replacing the shared Platform UI index or assets.
The Accounts preference changes require a separate coordinated deployment of the
shared account-settings bundle before they appear on its existing host.

Workflow tests cover the administrator route, completed audience gating,
two-step confirmation with an exact frozen recipient count, invalidation after
edits, saving a new revision before an own-account test request, preserving comma
separators in segment fields, retrying the same durable snapshot token, sandboxed
preview isolation, and unsafe editor project hydration. Browser smoke validation
uses real GrapesJS with a mocked API; it verifies templates, snapshots, preview,
and schedule approval without sending emails or asserting live authentication.
