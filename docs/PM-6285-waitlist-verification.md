# PM-6285: review waitlist and badge verification

Verified platform-ui `origin/dev` at `9d879b43d` and review-api-v6
`origin/develop` at `41d6853`. The ticket's changes are already present: platform
commit `5aed5245b` (merged PR #2255) added the waitlist clock and corrected track
colors. Later QA copy changes retain the capacity and status behavior. This new
PR records verification without duplicating the existing implementation.

## Coverage

| Requirement | Current implementation |
| --- | --- |
| Full opportunity can accept a waitlist application | Eligible reviewers receive `canApply: true`; the POST persists `PENDING` even when approved reviewers fill capacity. |
| Capacity excludes pending applications | Review API reports approved count and clamps remaining positions at zero on both list and detail responses. |
| Waitlisted status | Caller-owned `PENDING` plus zero remaining positions becomes `Waitlisted` in Browse, My Work, and the detail CTA. An explicit future `WAITLISTED` status is also understood. |
| Later application decisions | Approval and rejection keep their distinct statuses. If capacity reopens, a pending application's derived label returns to `Applied`. |
| Clear application flow | The full-capacity CTA reads “Apply to be a reviewer (waitlist)” and explains Support's replacement-reviewer process before and after submission. |
| Eligibility remains enforced | Closed/expired opportunities, inactive/inaccessible challenges, invalid roles, and duplicate applications remain rejected. The unique database key also prevents concurrent duplicates. |
| Waitlist administration | Existing approval/rejection endpoints operate on pending applications. Approval creates the reviewer resource, publishes its event, and sends the notification. Selection remains manual. |
| Status appearance | Open is neutral; Applied/Waitlisted use green outlines with check/clock icons; Approved uses the solid green accepted style; Rejected uses red and an X. |
| Track backgrounds | Design `#d0e2ff`, Development `#a7f0ba`, AI `#e8daff`, Data Science `#ffd9be`, consistently selected through the shared track class mapping. |

The backend intentionally has no persisted `WAITLISTED` enum: pending
applications are the waitlist, and live approved capacity determines the label.
An old API response explicitly denying capacity remains disabled, because that
server cannot honor a waitlist POST. The deployed API and UI must both contain
the already-merged contract.

## Validation

- 57 frontend tests pass across review opportunity utilities, cards, My Work,
  and details, including full-capacity submission, disabled legacy responses,
  caller waitlist state, and track class mapping.
- 31 backend tests pass across opportunity service, application service, and
  application controller, including aggregated capacity, lifecycle/privacy,
  full-capacity pending creation, and concurrent duplicate rejection.
- 18 Chromium checks of the compiled repository Sass pass at 1440px and 390px,
  covering the five status appearances and four requested track backgrounds.

The browser checks use a reduced fixture with the actual stylesheet and waitlist
SVG; they are not a live authenticated application test. The verification found
no additional runtime change required by PM-6285.
