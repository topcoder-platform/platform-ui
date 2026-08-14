# Opportunities

The Opportunities app replaces the legacy community-app challenge discovery,
challenge detail, and reviewer-opportunity detail experiences. The main route
is `/opportunities`; domain tabs use `/opportunities/:kind`, challenge details
use `/opportunities/challenge/:challengeId`, and review details use
`/opportunities/review/:reviewOpportunityId`.

The four headline metrics come from one `GET /v6/opportunities/summary`
request. List content is requested lazily from its owning API as members switch
tabs, filter, sort, or paginate. Do not prefetch bucket-sized list payloads.

The Competitions sidebar follows the authored Figma filter with one Search
control and the helper text “Search skills, technologies, projects.” Its value
is sent through the Challenge API `search` parameter; Competitions does not
render a second skills/technologies field. Other opportunity domains retain
their owner-specific skill facet where supported.

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

Design preview galleries use the public-safe
`GET /v6/submissions/previews?challengeId=...` endpoint rather than the
protected general submissions list. Review API remains authoritative for group,
whitelist, and review-phase release checks and returns only released Payload
asset URLs; an absent preview is rendered as a pending placeholder.

Forum links are composed from the environment-specific
`VANILLA_FORUM.V2_URL` origin, so development routes stay on the development
Vanilla instance and production routes stay on production.

The challenge rail parses case-insensitive `fileTypes`, `submissionLimit`,
`environment`, and `codeRepo` metadata, shows safe Challenge API discussions
and attachments, and fails closed for unsafe or retired-host URLs. Positive
legacy screening and review scorecard IDs link through the environment-specific
`ADMIN.ONLINE_REVIEW_URL`; Review App remains the primary authenticated review
handoff.
