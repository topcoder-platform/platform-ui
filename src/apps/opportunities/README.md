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
newest-first list. Anonymous visitors receive an in-page sign-in handoff; no
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
is sent through the Challenge API `search` parameter; Competitions does not
render a second skills/technologies field. Other opportunity domains retain
their owner-specific skill facet where supported.

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

Long card titles expose their complete value in the authored dark tooltip.
When a card has more skills than fit in its visible skill row, its `+n` control
exposes the hidden skill names in the corresponding bullet-list tooltip. The
Engagement role filter uses the authored four-row keyboard-accessible listbox
while preserving the Engagement API's Designer, Software Developer, Data
Scientist, and Data Engineer enum values.

## Competition card contract

Competition list cards consume the Challenge API v6 list response directly;
they do not make per-card follow-up requests. Track catalog values drive the
Figma Design, Development, Data Science, AI, and QA pill palettes. Challenge,
First2Finish, Marathon Match, and Task catalog values map to their authored
subtype icons and member-facing labels.

- “Open for registration” requires an `ACTIVE` challenge and an open
  `Registration` phase (or legacy combined `Open` phase). `ACTIVE` by itself
  is not treated as an open registration window. The server-filtered “My
  competitions” result marks those cards Registered without per-card calls.
- The prize footer uses only the `PLACEMENT` prize set and preserves its API
  order as first, second, and third place. Checkpoint, copilot, and reviewer
  payments are not mixed into competitor prizes.
- `currentPhase` is preferred for the phase chip. Older responses fall back to
  the latest-started open phase. Progress uses actual then scheduled dates,
  clamps to 0–100%, and may derive the end from the phase duration in seconds.
  Competition pages revalidate once a minute and when focus returns; cards
  with no open phase omit the phase display instead of inventing one.
- The right rail shows submissions and registrants from Challenge API. It also
  reserves the Figma Posts row; until Challenge API publishes `numOfPosts`, the
  value is an em dash rather than a fabricated discussion or forum count.

## Challenge detail timeline

The expanded challenge timeline follows the Challenge API phase order between
the synthetic Launch and Winners boundaries. Launch uses the challenge start,
each authored phase displays its actual (then scheduled fallback) start and end
on separate rows, and Winners uses the top-level challenge end. Only responses
without a valid challenge end fall back to the latest valid phase end.

Open phase flags, `currentPhase`, and `currentPhaseNames` can mark overlapping
phases current. Ended phases and boundaries render complete, future milestones
remain upcoming, and all timestamps use the browser's local time with its IANA
timezone displayed below the rail. Phase names select the corresponding Figma
glyph; unfamiliar phase names deliberately use the generic Review glyph.

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
  `requiredSkills` IDs only as a fallback for older API deployments.
- Copilot opportunities: Projects API, where the Figma track facet maps to the
  opportunity `type` enum (`dev`, `qa`, `design`, `ai`, `datascience`).
- Review opportunities: Review API metadata search. The application action
  uses `defaultApplicationRole` or a role selected from `applicationRoles`.

Challenge registration and registrant displays resolve the canonical
Submitter resource role and exclude copilot, reviewer, observer, and manager
resources. The Registrants tab requests bounded Resource API pages and uses its
pagination headers instead of truncating a fixed bucket. “My competitions”
resolves that same role and sends `memberId` plus
`resourceRoleId` to Challenge API so role narrowing happens before the other
filters, global sorting, counts, and pagination. The terms modal similarly
filters Challenge API references to the
Submitter role and loads complete v5 Terms API records before an electronic
agreement. Passive “Review challenge terms” mode never registers or agrees on
a member's behalf.
DocuSign-template terms expose the Terms API recipient flow and return to the
challenge route after signing; registration remains blocked until the service
reports that every external agreement is complete.

Design challenges with `submissionsViewable=true` use the private-submission
gallery from the Figma flow. Authenticated members receive the protected
submission metadata needed for locked cards, while the public-safe
`GET /v6/submissions/previews?challengeId=...` response overlays only previews
that Review API has released. Anonymous visitors receive only that public page.
Review API remains authoritative for group, whitelist, screening, and
review-phase release checks; absent previews render as locked placeholders.
Design challenges without the flag retain the authored submission-list state.

The standard Submissions tab follows community-app's authenticated-member
gate; registration is required only for My Submissions and authored actions.
Review API submissions and Marathon Match review summations own provisional
and final scores. Final Marathon Match values remain hidden while a submission
phase is open, then appear after Review closes or Review API publishes a final
result. Non-Marathon final scores appear only for completed challenges. The
Figma keeps separate Provisional Score and Final Score columns and uses `-`
when a final value is not yet available. Winners use Review API's canonical
`GET /v6/projectResult` member-and-placement result instead of inferring a
score from Challenge API winners or a sibling submission; protected winner
scores are requested only for authenticated members.

Registered members submit without leaving challenge details. The My
Submissions flow accepts one `.zip` archive up to 500MB, requires the authored
declaration, reports live multipart progress, and posts the file directly to
`POST /v6/submissions`. The active phase selects `CONTEST_SUBMISSION`,
`CHECKPOINT_SUBMISSION`, or `STUDIO_FINAL_FIX_SUBMISSION`; Review API remains
authoritative for registration, phase, winner, submission-limit, and file
validation. Design shows the four expected inner deliverables, while
Development, Marathon Match, and Quality Assurance direct members to their
Requirements content. Successful uploads expose the created submission ID and
refresh challenge counts without leaving the confirmation state.

Challenge Discussion reads and writes use the authenticated
`/v6/forums` API. Topic creation, comments and nested replies, owner edits and
soft deletes, watch state, and read state remain inside the challenge detail
page. Topic summaries expose bounded starter excerpts, participant snapshots,
unique authenticated view counts, and current-member watch state. The
environment-specific Vanilla URL is retained only as a recovery link when the
v6 API is unavailable or the member is signed out. Unregistered administrators
receive the registered read and monitoring tabs, including Submissions, the
metadata-enabled Marathon Dashboard, and Forum, while My Submissions and upload
actions remain registration-only. Administrators may create ordinary topics or
official announcements and can reply throughout every challenge forum.

The Report an Issue dialog preserves the Figma subject, category,
1000-character description, and required attachment fields. Files upload
through the shared Filestack support-ticket pipeline with a 2MB-per-file UI
limit. Because support-api-v6 accepts only `challengeId` and Markdown
`description`, the client serializes the subject, category, body, and uploaded
links into that description without inventing unsupported request fields.

The challenge rail parses case-insensitive `fileTypes`, `submissionLimit`,
`environment`, and `codeRepo` metadata, shows safe Challenge API discussions
and attachments, and fails closed for unsafe or retired-host URLs. Positive
legacy screening and review scorecard IDs link through the environment-specific
`ADMIN.ONLINE_REVIEW_URL`; Review App remains the primary authenticated review
handoff.
