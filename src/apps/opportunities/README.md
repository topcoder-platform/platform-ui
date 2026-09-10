# Opportunities

The Opportunities app replaces the legacy community-app challenge discovery,
challenge detail, and reviewer-opportunity detail experiences. The main route
is `/opportunities`; domain tabs use `/opportunities/:kind`, challenge details
use `/opportunities/challenge/:challengeId`, and review details use
`/opportunities/review/:reviewOpportunityId`.

The four headline metrics come from one `GET /v6/opportunities/summary`
request. List content is requested lazily from its owning API as members switch
tabs, filter, sort, or paginate. Do not prefetch bucket-sized list payloads.

The August 2026 masthead has two destinations. Browse Opportunities renders
the four dark category cards and the active owner-backed listing. My Work
renders the four light member-summary cards and combines the authenticated
member's competitions, engagements, copilot work, and review work into one
shared sortable list. Anonymous visitors receive an in-page sign-in handoff; no
member-scoped request is issued until a profile ID is available.

My Work requests at most the first 100 member records from each owning API in
parallel, then applies its shared opportunity-type and track facets, global
sorting, and pagination in the client. Owner-specific lifecycle values are
normalized to All, Active, and Past. Competition cards read Registered;
approved, accepted, or selected non-competition applications read Accepted;
the remaining member applications read Applied. Summary counts retain the
owner-reported totals even when an owner has more than 100 records. Once the
authenticated profile is available, four count-only owner requests load those
totals independently of the selected Browse/My Work destination. The masthead
therefore never uses a fabricated member-work fallback; it shows an em dash
until the complete count is available and keeps the same total while filters
or destinations change.

The Competitions sidebar follows the authored Figma filter with one Search
control and the helper text “Search skills, technologies, projects.” Its value
is mirrored in the shareable `search` query parameter and sent through the
Challenge API `search` parameter; Competitions does not render a second
skills/technologies field. Challenge-detail skill tags link back to
`/opportunities/competitions?search=<skill>` so the destination input and
owner-backed results are filtered immediately. Other opportunity domains
retain their owner-specific skill facet where supported.
On mobile, Search, ownership, and Status remain immediately visible while the
Track, Type, or Role facets sit behind the accessible More filters control.
Desktop keeps every available facet expanded.

On narrow layouts, Browse keeps the member's decision flow in document order:
the title is followed by filters, then the sort/view toolbar, and finally the
results. Desktop presents the same controls in the authored two-column grid,
with the toolbar above the results and the filter panel beside them.

Review opportunity tags and standardized skill chips use the same accessible
card control and shareable `search` parameter. Review API resolves that value
against challenge names, authored tags, and standardized skills before its
server-side pagination, so selecting a chip returns every matching review
opportunity rather than filtering only the currently loaded page.

Copilot card skills retain that same shareable `search` route and visible
sidebar value. While the deployed Projects API rejects its JSON-backed
`search` and `skills` queries with an HTTP 500, the client uses the existing
bounded compatibility loader and filters the complete supported result window
locally. A safe owner-side `projectName` query is unioned with those public rows
because public list payloads omit project names; status and canonical
opportunity-type facets remain intact across both result sets. This avoids
issuing the known-broken filtered request and keeps skill and project selection
functional until that owner query is repaired.

## List and grid views

Every domain toolbar exposes the same accessible List/Grid selector from the
Figma. List remains the default. The selected presentation is held above the
keyed domain listing, so it remains stable while a member moves among
Competitions, Engagements, Copilot Opportunities, and Review Opportunities.
Changing the presentation is client-only: it reuses the current owner API page
and does not issue another list request or create per-card requests.

At the authored 1200px desktop content width, Grid uses two 439px cards with a
16px gutter inside the 894px results column. Cards retain each owner's content:
competition prizes and phase progress stack above a horizontal metric footer;
engagement, copilot, and review metrics move to a vertical footer below the
card content. The responsive grid uses the same cards and automatically drops
to one column when two authored-width cards no longer fit. Both selector
buttons remain keyboard accessible and expose their active state with
`aria-pressed`.

Track tags share the same foreground and background palettes across Browse
and My Work cards in both views: blue for Design, green for Development,
orange for Data Science, purple for AI, and pink for QA. Unknown tracks use
the neutral gray palette. Short `DEV` and `QA` API values use the same colors
as their full track names.

Opportunity cards preserve same-tab navigation. External role-learning links
open in a separate tab and include `rel="noreferrer"`.

Every domain exposes the same four product-authored options: `Newest first`,
`Prize high to low`, `Prize low to high`, and `Title A-Z`. Challenge API owns
global competition prize/title ordering, Engagements owns title ordering, and
Review API owns payment ordering. For Engagement and Copilot prize sorts, the
client combines bounded owner pages before sorting and then restores the
requested page, so ordering remains correct across page boundaries. Missing
numeric compensation remains after priced opportunities in both directions.
Copilot aggregation requests at most 200 rows per Projects API page, matching
that endpoint's validated page-size contract while retaining global ordering.
Copilot rows marked with the Standard payment type remain unpriced for sorting;
an obsolete `otherPaymentType` value retained by Projects API must not move a
Standard row among numeric custom payments.
Selecting a different result page scrolls the browser back to the top so the
new page begins at its heading rather than at the prior page's footer.

Review cards present the first-submission total: the first role's fixed
`payments[].payment` (or legacy `basePayment`) plus one
`incrementalPayment`. The detail compensation card applies that same formula
to the selected reviewer role and keeps the incremental amount as the payment
for each additional submission. Missing card amounts are labeled `TBD` rather
than presented as free work.

Approved applications, rather than pending applications, consume reviewer
capacity. When `remainingPositions` reaches zero, eligible reviewers can still
use the “Apply to be a reviewer (waitlist)” detail CTA; the page explains that
outcome before submission and confirms that Support will contact the applicant
if another reviewer cannot complete the review. Review API persists these
applications as `PENDING`. Browse and My Work cards render that caller state as `Waitlisted`
while capacity remains full, then naturally return to `Applied` if a position
reopens or to `Approved` when the reviewer is selected.

Long card titles expose their complete value in the authored dark tooltip.
When a card has more skills than fit in its visible skill row, its `+n` control
exposes the hidden skill names in the corresponding bullet-list tooltip. The
Engagement role filter uses the authored four-row keyboard-accessible listbox
while preserving the Engagement API's Designer, Software Developer, Data
Scientist, and Data Engineer enum values.

## Competition card contract

Competition list cards consume the Challenge API v6 list response directly.
Completed pages make one batched Members API projection request for the winner
IDs in that page; they do not make per-card follow-up requests. Track catalog
values drive the Figma Design, Development, Data Science, AI, and QA pill
palettes. Challenge, First2Finish, Marathon Match, and Task catalog values map
to their authored subtype icons and member-facing labels.

- “Open for registration” requires an `ACTIVE` challenge and an open
  `Registration` phase (or legacy combined `Open` phase). `ACTIVE` by itself
  is not treated as an open registration window. “Active competitions” uses
  Challenge API's `hasCurrentPhase` filter so scheduled challenges remain
  hidden while Submission, Review, and every other open phase remain visible.
  “My competitions” uses the member's complete Challenge resource membership
  so active work remains visible to Submitters, Copilots, and challenge
  Managers. The separate member-registration request keeps the Registered card
  state limited to actual Submitter resources.
- The prize footer uses only the `PLACEMENT` prize set and preserves its API
  order as first, second, and third place. Checkpoint, copilot, and reviewer
  payments are not mixed into competitor prizes. Its first three glyphs use
  the authored yellow, light-blue, and peach placement assets at their native
  14×18px size; the dark second- and third-place podium variants are reserved
  for the Winners presentation.
- Completed cards replace registration and stale phase-progress states with the
  explicit Completed state and the design-system double-check icon. Up to three
  actual winner photos appear beside the placement prizes with the existing
  podium medals; missing or failed photos retain a handle-initial fallback. The
  complete avatar-and-medal affordance opens that challenge's Winners tab.
- `currentPhase` is preferred for the phase chip. Older responses fall back to
  the latest-started open phase. Progress uses actual then scheduled dates,
  clamps to 0–100%, and may derive the end from the phase duration in seconds.
  Competition pages revalidate once a minute and when focus returns; cards
  with no open phase omit the phase display instead of inventing one. The
  compact mobile card keeps the remaining-time value on the same heading row
  as the current phase, matching the authored design above its progress rail.
- The right rail shows submissions and registrants from Challenge API. It also
  reserves the Figma Posts row; until Challenge API publishes `numOfPosts`, the
  value is an em dash rather than a fabricated discussion or forum count.

## Challenge detail timeline

The expanded challenge timeline follows chronological phase order between the
synthetic Launch and Winners boundaries. Launch uses the challenge start, each
authored phase displays its actual (then scheduled fallback) start and end on
separate rows, and Winners uses the top-level challenge end. Only responses
without a valid challenge end fall back to the latest valid phase end. When
Registration and another phase share the same valid start, Registration is
shown first so overlapping Checkpoint Submission schedules match the authored
challenge flow rather than being ordered by their different end dates.

Open phase flags, `currentPhase`, and `currentPhaseNames` can mark overlapping
phases current. Ended phases and boundaries render complete, future milestones
remain upcoming, and all timestamps use the browser's local time with its IANA
timezone displayed below the rail. Phase names select the corresponding Figma
glyph; unfamiliar phase names deliberately use the generic Review glyph.
At phone widths, the timezone moves above a vertical timeline: phase nodes and
progress connectors occupy the left rail while each phase name and its dates
remain in an aligned, content-sized row to the right. Each mobile row owns its
marker and connector, so wrapped dates and enlarged text grow the rail instead
of overlapping the following milestone. The mobile prize/action card follows
the expanded timeline instead of interrupting it. Wider layouts retain the
horizontal timeline and its overflow fallback for tablet-sized screens.

On phone viewports, Registrants preserves its semantic table while presenting
each API row as the Figma key/value card. Registration Date remains a
server-backed sort and moves above the card so members do not need to pan a
desktop-width table to find it. The visually clipped table heading remains a
noninteractive semantic label, avoiding a duplicate hidden keyboard stop.

All Submissions and My Submissions use the same responsive record-card
contract. Every track-specific field and action receives a visible mobile key,
while Submission Date sorting stays above the card and continues to request
owner-sorted pages.
Marathon My Submissions retains its wider score columns and horizontal overflow
on larger screens, while phone record cards fit the available content width.

The My Submissions heading keeps its Review App handoff, but phone layouts
stack that action below the heading copy at full content width so neither the
title nor its description is compressed or overlaid.

Task challenges omit an Iterative Review phase once its deadline has elapsed,
matching the legacy participant timeline, and keep Registration ahead of the
remaining chronological milestones. Task detection accepts the canonical
catalog type and the legacy `task.isTask` and `legacy.pureV5Task` flags.

## Challenge Markdown table of contents

Challenge descriptions are safe Markdown. Authors create the generated table
of contents with level-two and level-three ATX headings:

```markdown
## Challenge Summary

Summary content.

### Required Deliverables

Deliverable content.
```

- `##` creates a top-level table-of-contents entry.
- `###` creates a nested entry.
- `#` is reserved for the page title and is not included.
- Duplicate headings are supported; stable source-line suffixes keep their
  fragment links unique.
- GFM tables and hard line breaks are supported. Raw HTML is not rendered.

Challenges declaring `descriptionFormat: "html"` use the legacy HTML path;
the HTML is DOMPurify-sanitized before rendering and does not produce a
Markdown table of contents. When Challenge API returns `privateDescription`,
the page renders it under “Registered User Additional Information” using the
same declared format. Challenge API remains authoritative for whether that
field is present for the caller.

## Owning API contracts

- Competitions: Challenge API, including `currentPhase`,
  `currentPhaseNames`, phase schedules, `PLACEMENT` prize sets, plural
  `tracks` and `types`, and canonical Challenge catalog values.
- Engagements: Engagements API, including top-level `durationWeeks` or
  `durationMonths` and `IMMEDIATE`, `FEW_DAYS`, or `FEW_WEEKS` anticipated
  start values. Cards display hydrated `skills[].name` values and retain
  `requiredSkills` IDs only as a fallback for older API deployments. An empty
  title/description search resolves matching standardized skill IDs and retries
  through the API's `requiredSkills` filter so skill and technology terms stay
  discoverable without weakening normal project search. The authored `My
  engagements` view sends both `appliedByMe=true` and `includePrivate=true` so
  accepted or assigned private work remains visible to the current member.
  Public engagement cards hydrate the caller's status from that same complete
  member-scoped feed, retaining terminal rejected-offer assignments that the
  narrower `my-assignments` collection intentionally excludes.
- Copilot opportunities: Projects API, where the Figma track facet maps to the
  opportunity `type` enum (`dev`, `qa`, `design`, `ai`, `datascience`). During
  rollout, a legacy list that rejects `applied` is filtered locally and its
  authenticated per-opportunity application lists supply My Copilot state in
  bounded batches.
- Review opportunities: Review API metadata search. The application action
  uses `defaultApplicationRole` or a role selected from `applicationRoles`.
  Because AI is an exact-tag synthetic Challenge API facet rather than a
  persisted Review track, Review searches resolve AI challenge IDs through
  Challenge API and combine them with selected catalog tracks before paging.
  Open listings rely on Review API to exclude opportunities whose challenge or
  review window has ended; the client deliberately does not discard rows after
  server pagination because that would make totals and pages incorrect.

Review detail navigation resets the viewport for each opportunity ID. The
header reads the persisted review-opportunity `createdAt` value as “Posted” and
uses the start-date label only as a compatibility fallback for an older Review
API response. Its date, open-position, and review-period metrics use the
authored outline glyphs, while the Thrive card reuses the authored book asset.
The two Thrive actions open the published Topcoder Review Process and Topcoder
Challenges Explained articles rather than an unfiltered search page.

The review-header ring decoration remains a dark-header background layer rather
than a child of the compensation card. At phone and small-tablet widths it moves
below and to the right of the content and remains clipped by the header, keeping
breadcrumbs, title, tags, metadata, payment copy, and actions unobstructed.

Review challenge chips merge tags, legacy technologies, and standardized
skills. List pages batch-hydrate missing skill names from Challenge API; a
detail response missing `challengeData.skills` performs the equivalent single
challenge compatibility lookup and remains usable if that optional request is
unavailable. Application rows use an API-provided `maxRating` when present and
otherwise batch public Members API profiles so handles follow Topcoder's rating
palette. Application Date starts newest-first and its keyboard-accessible
header toggles ascending/descending order while resetting local pagination.
On phone viewports, each application becomes a labeled Handle, Role, and
Application Date record within the same semantic table; its date sort moves
above the white card and retains the desktop ordering behavior. The clipped
column header exposes its sort state without leaving its desktop button in the
phone tab order.

Challenge details load the authenticated Review API
`GET /v6/ai-review/configs/:challengeId` contract to render the Review Style
rail. `AI_ONLY` and `AI_GATING` map to their Figma labels and expose the
configuration's Instant Review state; a missing configuration or an anonymous
viewer uses the manual Community Review Board presentation.

Challenge registration and registrant displays resolve the canonical
Submitter resource role and exclude copilot, reviewer, observer, and manager
resources. The Registrants tab requests bounded Resource API pages and uses its
pagination headers instead of truncating a fixed bucket. “My competitions”
resolves that same role and sends `memberId` plus
`resourceRoleId` to Challenge API so role narrowing happens before the other
filters, global sorting, counts, and pagination. The terms modal similarly
filters Challenge API references to the
Submitter role and loads complete v5 Terms API records before an electronic
agreement. Registration content stays unmounted until that request resolves
and unmounts immediately on close, so unresolved fallback terms cannot flash
during the modal transition. Passive “Review challenge terms” mode never
registers or agrees on a member's behalf. Terms API HTML retains its semantic
structure and safe links, but document-authored inline styles are removed so
modal-scoped Figtree headings, Nunito Sans body copy, and spacing remain
authoritative.
DocuSign-template terms expose the Terms API recipient flow and return to the
challenge route after signing; registration remains blocked until the service
reports that every external agreement is complete.

Task challenges are assignment-only work. Their details preserve Requirements,
Registrants, and Winners for visibility, but do not request or expose voluntary
registration, member submission, dashboard, or in-app Forum workflows. Task
detection accepts current nested flags, flattened Challenge API records, the
Task catalog type, and the legacy pure-v5 marker.

Registration and unregistration update the header count and invalidate the
Registrants table immediately instead of waiting for a page reload. Once a
registered member has submitted, Unregister stays disabled; a pending or failed
submission-count check also fails closed so a transient read cannot expose a
destructive action. Registrant and submission rating cells use the same public
member rating bands as their handles.

Design challenges with `submissionsViewable=true` use the private-submission
gallery from the Figma flow. Authenticated members receive the protected
submission metadata needed for locked cards, while the public-safe
`GET /v6/submissions/previews?challengeId=...` response overlays only previews
that Review API has released. Anonymous visitors receive only that public page.
Review API remains authoritative for group, whitelist, screening, and
review-phase release checks; absent previews render as locked placeholders.
Design challenges without the flag keep challenge-wide submissions private and
render the explicit private state. A registered member's My Submissions table
remains available independently of that public release flag.

Opportunity detail tabs keep their page header and tab navigation mounted while
the selected panel changes. Lazy challenge panels use a panel-scoped loading
state, so loading Registrants, Submissions, Dashboard, Forum, or a forum topic
never replaces or masks the surrounding detail page. Full-page loading states
are reserved for the initial detail-route request. Review and copilot detail
tabs likewise switch in place, and engagement detail background checks render
inside their owning section.

The standard non-Design Submissions tab follows community-app's
authenticated-member gate; registration is required only for My Submissions
and authored actions. Registrants and standard submission tables order newest
dates first and expose accessible date headers that toggle the owning API's
ascending or descending ordering.
Marathon Match Submissions always use the Figma table with provisional and
final score columns. The score graph is rendered only in the separate Dashboard
tab, and that tab exists only when Work Manager enables its challenge metadata.
Review API submissions and Marathon Match review summations own provisional
and final scores. Active My Submissions pages periodically revalidate so an
asynchronous AI decision score appears without requiring the member to reload
the page; failed score requests do not enter an automatic retry loop. Final
Marathon Match values remain hidden while a submission
phase is open, then appear after Review closes or Review API publishes a final
result. Non-Marathon final scores appear only for completed challenges. The
member's own current AI decision score is the intentional active-challenge
exception. Scores retain the full numeric precision available from the API
without display rounding across Submissions, My Submissions, Winners,
submission history, and Marathon Match dashboard tooltips and accessible data.
Thousands separators, valid zero, and negative scorer sentinels retain their
established handling. The wide My Submissions scorer table scrolls within its
card so those full-precision values cannot overlap adjacent score or action
columns.
The Figma keeps separate Provisional Score and Final Score columns and uses
`-` when a final value is not yet available. Winners use Review API's canonical
`GET /v6/projectResult` member-and-placement result instead of inferring a
score from Challenge API winners or a sibling submission; protected winner
scores are requested only for authenticated members. Marathon winner cards
prefer an exact-member final Review Summation when legacy project-result rows
contain a zero placeholder. Their separators use the corresponding podium
placement color. The remaining-winners table initially orders available final
scores high-to-low, matching its downward sort indicator, and the accessible
Final Score header toggles low-to-high; unavailable scores remain after scored
rows in either direction and the three-card podium remains placement-ordered.
Winner stats use the Members API top-level track totals; Development does not
add the nested AI Engineering value a second time. Quality Assurance winner
cards use the compact `QA` label and always include member ratings, including
the two- and three-winner podium layouts.
An empty Winners tab reflects the challenge lifecycle: cancelled challenges
state that no winners were selected, drafts explain that judging has not run,
and active challenges retain the ongoing-review guidance.

Registered members submit without leaving challenge details. My Submissions
also exposes the environment-specific Review App handoff before and after an
upload. File-backed rows expose the authorized download action for every
challenge track, while authored external-URL rows omit that file action. The
browser requests a short-lived URL from
`GET /v6/submissions/:submissionId/download-url` instead of using submission
list URLs; Review API remains authoritative for access and signs only clean
storage, so pending DMZ and quarantined files cannot be downloaded. Work
Manager's case-insensitive `submission_type=url` challenge
metadata selects the URL experience; every other value, including missing or
malformed metadata, retains the standard ZIP experience. URL submissions
require a confirmed absolute HTTP(S) link and send that link directly to
`POST /v6/submissions` without invoking Filestack. ZIP submissions accept one
`.zip` archive up to 500MB and report live upload progress. The browser uploads
the archive to Filestack's S3 endpoint using the environment's canonical
submissions DMZ bucket, then sends the resulting storage URL to the same Review
API endpoint. Both modes require the authored declaration and revalidate the
member's registration before submission. The active phase selects `CONTEST_SUBMISSION`,
`CHECKPOINT_SUBMISSION`, or `STUDIO_FINAL_FIX_SUBMISSION`; Review API remains
authoritative for registration, phase, winner, submission-limit, and file
validation. Design shows the four expected inner deliverables, while
Development, Marathon Match, and Quality Assurance direct members to their
Requirements content in ZIP mode; URL mode replaces file-specific guidance
with link accessibility reminders. Successful submissions expose the created
submission ID and refresh challenge and member submission counts without
leaving the confirmation state. The declaration opens the public Topcoder
Terms of Use in a new tab. While either request is active, the detail tabs and
every form action that would unmount the submission are disabled. The explicit
cancel control remains available, aborts its request, clears the selected file
or URL, and then unlocks normal navigation.
Marathon Match attempts fall back to Review submission, virus-scan, and scoring
lifecycle fields when test metadata is absent, preserving truthful Failed, In
progress, and completed states. Virus-scan and quarantine failures are reported
as Failed in the Provisional process with explicit 0% progress; later review
failures remain System failures. Their actions include the clean submission,
scorer artifacts, and submission history, while the single page-level button
owns the Review App handoff.
The Marathon Match My Submissions table reserves enough width for the complete
submission timestamp and keeps its date heading and sort icon on one line,
aligned with the dates beneath it. Score columns remain right aligned.
Submission history replaces the unreliable status field with Final Score. At
phone widths, each attempt becomes a compact stacked label/value card in the
legacy Submission, Final Score, Provisional Score, and Time order, avoiding
horizontal clipping. The dialog also exposes the latest-submission summary and
compact close action only at that breakpoint. History requests include the
selected member ID;
Review API returns every attempt to that member and authorized challenge staff,
while ordinary viewers receive only the selected entrant's latest attempt.
Design submissions can be deleted only while Submission or Checkpoint
Submission is open. Successful deletion updates both the challenge and member
submission counts as well as the current list. Replacing a Design submission
without reloading therefore preserves accurate totals, and deleting the
member's last submission clears the submission-based Unregister restriction.
Failed or cancelled deletions leave the counts unchanged; Review API remains
authoritative for submission limits.

Challenge Discussion reads and writes use the authenticated
`/v6/forums` API. Topic creation, comments and nested replies, owner edits,
administrator topic deletes, and authored comment deletes use in-app dialogs
rather than browser prompts; per-member
thumbs-up/thumbs-down reactions, watch state, and read state remain inside the
challenge detail page. The Markdown editor continues ordered and unordered
lists on Enter; safe Markdown styling is retained in topic excerpts and full
posts. Each visible post shows shared
reaction counts and the current member's selected state; clicking the selected
thumb again removes it, while clicking the other thumb switches it. Topic
summaries expose bounded starter excerpts, participant snapshots, unique
authenticated view counts, and current-member watch state. The
environment-specific Vanilla URL is retained only as a recovery link when the
v6 API is unavailable or the member is signed out. Forum counts come from the
complete API result, including topics created by the current member.
Unregistered administrators
receive the registered read and monitoring tabs, including Submissions, the
metadata-enabled Marathon Dashboard, and Forum, while My Submissions and upload
actions remain registration-only. Administrators and assigned challenge
copilots may create ordinary topics or official announcements and reply
throughout every challenge forum. Topic authors may edit their own unlocked
topics, but deletion remains administrator-only to match the legacy forum.

The Report an Issue dialog preserves the Figma subject, category, and
1000-character description while keeping attachments optional. Files upload
through the authenticated `POST /v6/support/attachments` multipart endpoint
with a 2 MiB-per-file UI limit, so the browser does not connect directly to an
S3 bucket. Because support-api-v6 accepts only `challengeId` and Markdown
`description` when creating the ticket, the client serializes the subject,
category, body, and any uploaded links into that description without inventing
unsupported request fields.

Attachment gateway, network, and timeout failures display a readable error and
preserve the report fields. A failed attachment blocks sending until the member
removes it; the member can then drop or select it again to retry, or send the
report without it. Successful uploads remain attached throughout this recovery.

The challenge rail parses case-insensitive `fileTypes`, `allowStockArt`,
`submissionLimit`, `environment`, and `codeRepo` metadata, shows safe Challenge
API discussions and attachments, and fails closed for unsafe or retired-host
URLs. Design source-file labels appear only when authored and never synthesize
Figma; the stock-photography allowance appears only when Work Manager explicitly
enables it. Positive
legacy screening and review scorecard IDs link through the environment-specific
`ADMIN.ONLINE_REVIEW_URL`; Review App remains the primary authenticated review
handoff. Review Style uses the authored document-search rail icon. Development
challenges omit Challenge Links, Source files, and Submission limit while
adding the published AI Reviewers help and Usable Code rules to Educational
Materials. Quality Assurance challenges add the published Bug Hunt and QA
competition-type guides. Marathon Matches retain only their dedicated
competition guide even when the challenge track is Development; the latter two
submission sections remain Design-only. Learning arrows flow immediately after
wrapped labels. The Design link reads “How to
approach checkpoint feedback” and keeps “feedback” and its arrow together when
wrapping. The AI Exponential promo keeps a distinct gap before its action and
routes through the configured Topcoder environment to the AI Exponential League
hub.
Marathon Match challenges replace the general AI Exponential promo with the
Marathon Match Tournament heading and copy. Its Explore the program link opens
the environment's Marathon Match
Tournament page in a new tab, while the Educational Materials link retains the
published competition guide.

Opening a different challenge-detail route scrolls the page to the top. When no
phase is active, the header keeps Challenge API's authored Draft, Cancelled, or
other lifecycle status rather than calling the challenge completed; Draft,
cancelled, and completed states retain the Register and Submit controls in their
disabled presentation. Fun-challenge prize copy is centered and wraps inside
the prize card at every supported width. The prize summary uses the light
second- and third-place card illustrations, while Winners continues to use the
dark podium medals.
