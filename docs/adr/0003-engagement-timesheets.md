# ADR 0003 — Engagement timesheets (member entry, manager approval, admin override)

- **Status:** Proposed — for review
- **Date:** 2026-09-15
- **Requirements:** [`docs/timesheet-app.requirements.md`](../timesheet-app.requirements.md)
- **Repos affected:**
  - `engagements-api-v6` — owns the timesheet data model, workflow state machine, manager registry, audit trail, and all authorization decisions (the bulk of the work)
  - `platform-ui` — new `/timesheets` route in the `engagements` app (member/manager/admin views), a `Managers` field and `View Timesheet` link in the `work` app, and timesheet-driven hours in the payment modal (Phase 2)
  - `tc-finance-api` — **no schema change**; payment/timesheet traceability is carried in the existing `winnings.external_id` / `winnings.attributes` fields
- **Related code:**
  - `engagements-api-v6/prisma/schema.prisma` — `EngagementAssignment` already carries `standardHoursPerDay`, `ratePerHour`, `paymentCycle`; timesheets hang off this row.
  - `engagements-api-v6/src/engagements/engagements.controller.ts` — controller/scope/DTO conventions the new module follows; `GET /engagements/assignments/:assignmentId/context` is the nearest prior art for a cross-app, per-assignment read.
  - `engagements-api-v6/src/auth/guards/permissions.guard.ts`, `src/app-constants.ts` — scope + privileged-role gate that the new scopes plug into.
  - `engagements-api-v6/src/integrations/event-bus.service.ts`, `src/integrations/assignment-offer-email.service.ts` — the notification pattern §10 will reuse.
  - `platform-ui/src/apps/engagements/src/engagements.routes.tsx`, `src/pages/my-assignments/MyAssignmentsPage.tsx` — route registration and the Active-assignment list that gains the **Timesheet** button.
  - `platform-ui/src/apps/work/src/pages/engagements/EngagementPaymentPage/EngagementPaymentPage.tsx` — the page titled "&lt;engagement&gt; Assignees" that §7 and §8.4 refer to as *Work App → Engagement Assignees*.
  - `platform-ui/src/apps/work/src/lib/components/PaymentFormModal/PaymentFormModal.tsx` — already collects From/To date + `hoursWorked` and derives amount from `ratePerHour`; Phase 2 only changes where `hoursWorked` comes from.

## Context

The requirements ask for a timesheet capability spanning three roles, two front-end apps, and a payment system. Before choosing a design, three things about the existing platform matter.

**The assignment row is already the natural anchor.** `EngagementAssignment` is a per-(engagement, member) row that carries exactly the fields a timesheet needs for display and payment: `standardHoursPerDay` (§4.1), `ratePerHour` (§8.2), `memberHandle`, `startDate`/`endDate`, and `status` (§3 gates on Active engagements). Anchoring timesheet entries on `engagementAssignmentId` rather than on `(engagementId, memberId)` means the uniqueness rule in §4.4 becomes a single database constraint, and the payment rate lookup in §8.2 is a single join.

**There is no manager concept yet.** Nothing in `EngagementAssignment` or `Engagement` records who may approve work for an assignee. `app-constants.ts` has *platform* manager roles (`Topcoder Project Manager`, `Task Manager`, `Talent Manager`), but §5.1 needs *engagement-level* authority — "any assigned manager may approve" — which is per-assignment data, not a JWT role. This is net-new state and it is the hinge of the whole authorization story.

**§7 asks for bidirectional sync, but there is only one store.** The requirement says a manager added in the Engagements Portal must appear in the Work App and vice versa. Both of those are `platform-ui` apps reading the same `engagements-api-v6`. There is no second system of record to reconcile, so "sync" here is a UI requirement, not a data-replication one — provided both apps write through the same endpoint.

**Payments already accept hours.** `PaymentFormModal` collects a date range and hours worked and computes the amount from the assignment's hourly rate; `payments.service.ts` posts a winning to `tc-finance-api` with `hoursWorked` and an `attributes.assignmentId`. Phase 2 (§8) therefore does not need a new payment pipeline — it needs the hours field to be *derived and locked* instead of typed, plus a record of which entries were consumed.

## Scope

**In scope (Phase 1):** the timesheet data model, workflow, and audit trail in `engagements-api-v6`; the engagement-manager registry and its API; the `/timesheets` page in `platform-ui` with member, manager, and administrator views; the **Timesheet** button on My Assignments; the **Managers** field and **View Timesheet** link in the Work App.

**In scope (Phase 2, §8):** approved-hours aggregation endpoint; auto-populated, read-only hours in the Work App payment modal; entry-to-payment linkage and double-payment prevention.

**Deferred (§10, "Probably V3"):** email notifications. The workflow emits bus events from day one (cheap, and the audit trail needs the same hooks), but no email templates are built in Phase 1.

**Explicitly out of scope (confirmed 2026-09-16):** a timesheet approval *rejection* path. There is no Rejected status and none is planned for this release. Disagreement is handled by the two paths the requirements already define — the member edits a Submitted row, which resets it to draft (§4.6), or an administrator intervenes (§6.2). The state machine is therefore exactly the three statuses in §9, and `TimesheetEntryStatus` has no `REJECTED` member.

## Decision

### 1. Timesheets live in `engagements-api-v6`, in a new `timesheets` module

Not a new service, and not in `tc-finance-api`. The authorization question every timesheet request must answer — *is this caller the assignee, an assigned manager, or an administrator for this assignment?* — is answerable only from engagement data. Putting timesheets anywhere else means replicating assignment and manager state across a service boundary for every read. `tc-finance-api` stays a payment ledger; it learns about timesheets only through an opaque reference string.

### 2. Data model: four new Prisma models

```prisma
enum TimesheetEntryStatus {
  DRAFT       // rendered as "-" in the UI
  SUBMITTED
  APPROVED
}
// Three statuses are final for this release: no rejection path (confirmed 2026-09-16).

enum TimesheetAuditAction {
  CREATED
  UPDATED
  SUBMITTED
  UNSUBMITTED        // §4.6 edit-after-submit reset
  APPROVED
  REOPENED           // §6.2 administrator reopen
  ADMIN_OVERRIDE
  PAYMENT_LINKED
  MANAGER_ASSIGNED
  MANAGER_REMOVED
}

model EngagementTimesheetEntry {
  id                     String               @id @default(uuid())
  engagementAssignmentId String
  workDate               DateTime             @db.Date
  hoursWorked            Decimal              @db.Decimal(5, 2)
  remarks                String?
  status                 TimesheetEntryStatus @default(DRAFT)

  submittedAt            DateTime?
  submittedBy            String?
  approvedAt             DateTime?
  approvedBy             String?              // manager user id
  approvedByHandle       String?
  approvalComment        String?
  reopenedAt             DateTime?

  paidPaymentReference   String?              // set when consumed by a payment (§8.3)
  paidAt                 DateTime?

  createdAt              DateTime             @default(now())
  createdBy              String
  updatedAt              DateTime             @updatedAt
  updatedBy              String?

  assignment             EngagementAssignment @relation(fields: [engagementAssignmentId], references: [id], onDelete: Restrict)
  auditRecords           EngagementTimesheetEntryAudit[]

  @@unique([engagementAssignmentId, workDate])          // §4.4 duplicate prevention
  @@index([engagementAssignmentId, status])
  @@index([engagementAssignmentId, workDate])
  @@index([status, workDate])
}

model EngagementTimesheetEntryAudit {
  id              String                   @id @default(uuid())
  timesheetEntryId String
  action          TimesheetAuditAction
  previousValues  Json?                    // { hoursWorked, remarks, status }
  updatedValues   Json?
  actorUserId     String
  actorHandle     String?
  actorRole       String                   // MEMBER | MANAGER | ADMINISTRATOR | MACHINE
  comment         String?                  // approval comment or override reason
  createdAt       DateTime                 @default(now())

  entry           EngagementTimesheetEntry @relation(fields: [timesheetEntryId], references: [id], onDelete: Cascade)

  @@index([timesheetEntryId, createdAt])
  @@index([actorUserId])
}

model EngagementManager {
  id             String     @id @default(uuid())
  engagementId   String
  managerUserId  String
  managerHandle  String
  managerName    String?
  createdAt      DateTime   @default(now())
  createdBy      String
  removedAt      DateTime?  // soft delete: audit history must survive removal
  removedBy      String?

  engagement     Engagement @relation(fields: [engagementId], references: [id], onDelete: Cascade)

  @@unique([engagementId, managerUserId])   // §7 duplicate-assignment prevention
  @@index([managerUserId, removedAt])        // "which engagements may I approve?"
}
```

Four decisions embedded here are worth calling out.

**`workDate` is a `@db.Date`, not a timestamp.** A timesheet row is a calendar day in the member's frame of reference, not an instant. Storing it as `Date` makes the `@@unique` constraint mean what §4.4 says it means, and removes an entire class of "the 7th became the 6th in UTC" bugs. All API payloads use `YYYY-MM-DD` strings; the `DD-MM-YYYY` display format in §4.3 is purely a formatting concern in the UI.

**`hoursWorked` is `Decimal(5,2)`, not `Float`.** Hours are summed and multiplied by a rate to produce money (§8.2). `EngagementAssignment.standardHoursPerDay` is a `Float` today, which is fine for a display-only field, but approved hours become a payment amount and must sum exactly.

**There is no separate "timesheet" parent row.** A timesheet is a *query* over entries for an assignment and a date range or status, not an entity. Introducing a header row would force a decision about what happens when a submission spans two headers, and §4.6's per-row status reset already tells us the row is the unit of workflow.

**`EngagementManager` is soft-deleted.** §11 requires the audit trail to name the user and role performing each action, and §5.5 requires managers to see entries approved by *any* authorized manager. Hard-deleting a removed manager would strand approval attributions. `removedAt IS NULL` is the authority predicate.

### 3. Rows are created on submit, not on date-range selection

§4.2 says selecting a range "must generate one timesheet row for each calendar date." We generate those rows **in the browser**, as unsaved view models, and persist only what the member actually fills in and selects.

This is the single most consequential design choice in the ADR, so the reasoning matters. Persisting a row per selected date would mean:

- A member browsing September creates 30 empty `DRAFT` rows as a side effect of looking. The administrator list in §6.1 then has to distinguish "empty rows nobody intends to fill" from real drafts, and the §4.4 unique constraint starts firing on innocent range overlaps.
- "Total Days" in §4.5 becomes ambiguous — rows that exist versus rows with hours.

With client-side generation, a date without an entry simply has no row, and the server-side rule is clean: `PUT /timesheets/entries` upserts on `(assignmentId, workDate)`. A row's existence means someone entered hours for that day. The 31-day cap in §4.2 is enforced in both the UI and the API.

### 4. Server-side status transitions, computed from values — never trusted from the client

§4.6 says that editing a Submitted row's `hoursWorked` or `remarks` resets it to draft. The service compares the incoming values against the stored row and derives the transition itself:

| Stored status | Incoming change | Result |
| --- | --- | --- |
| `DRAFT` | any | stays `DRAFT`, audit `UPDATED` |
| `SUBMITTED` | `hoursWorked` or `remarks` differs | → `DRAFT`, `submittedAt`/`submittedBy` cleared, audit `UNSUBMITTED` |
| `SUBMITTED` | no material change | no-op |
| `APPROVED` | any, by member or manager | `409 Conflict` (§4.7) |
| `APPROVED` | any, by administrator with `overrideReason` | applied, audit `ADMIN_OVERRIDE` |

Unchanged sibling rows are untouched, satisfying §4.6's "other unchanged submitted rows must retain their existing status". Because the transition is derived, a stale client that still believes a row is `SUBMITTED` cannot talk the server into an illegal state.

### 5. Approval is a conditional bulk update, which makes §5.1 fall out for free

§5.1 requires that one manager's approval is sufficient and that a second manager cannot re-approve. Rather than locking rows or polling, `POST /timesheets/approve` issues a single conditional update:

```ts
// inside a transaction, per approve request
const result = await tx.engagementTimesheetEntry.updateMany({
  where: { id: { in: entryIds }, status: 'SUBMITTED' },   // the guard
  data:  { status: 'APPROVED', approvedBy, approvedByHandle, approvedAt, approvalComment },
});
```

If `result.count` is less than `entryIds.length`, some rows were approved or edited by someone else in the meantime. The endpoint returns `207`-style partial detail — `{ approved: [...], skipped: [{ id, currentStatus }] }` — and the UI reports "3 of 5 approved; 2 were already approved by maryj" and refreshes. No pessimistic locking, no lost updates, and the second manager's UI converges on the truth.

### 6. Authorization is resolved per assignment on the server; the client renders what it is told

§11's "direct URL manipulation must not provide access to unauthorized timesheets" rules out any design where the UI decides which view to show and the API trusts it. Every timesheet endpoint resolves the caller's relationship to the target assignment before doing anything:

```
resolveTimesheetRole(authUser, assignment) →
  ADMINISTRATOR  if authUser has a PrivilegedUserRoles role or the manage scope
  MEMBER         if assignment.memberId === authUser.userId
  MANAGER        if an EngagementManager row exists for assignment.engagementId
                    with managerUserId === authUser.userId and removedAt IS NULL
  otherwise      404 (not 403 — do not confirm the assignment exists)
```

The resolved role is returned to the client as `viewerRole` on every timesheet response, and `/timesheets` is a **single route** that renders the member, manager, or administrator view from that value. One route means §2's "page and available actions must be displayed based on the logged-in user's role" has exactly one implementation, and a member who hand-edits the URL to another member's assignment gets a 404 from the API rather than a client-side guard they could bypass.

`PrivilegedUserRoles` is the confirmed definition of *administrator* for timesheets (2026-09-16) — `Administrator` plus the Topcoder Project, Task, and Talent Manager platform roles. Those roles therefore carry the full §6.2 override set, including approve-on-behalf, reopen, and manager assignment. No timesheet-specific role list is introduced, so the existing `PermissionsGuard` admin check is reused as-is and there is one definition of administrator across the service.

Note the deliberate asymmetry this creates: a platform manager role grants administrator power but **not** manager power. Approval authority as a *manager* comes only from an `EngagementManager` row, exactly as §7 specifies ("the synchronized manager list will determine who has timesheet approval authority"). A Topcoder Project Manager with no `EngagementManager` row acts on a timesheet as an administrator — override reason required, `ADMIN_OVERRIDE` audit action — not as an approving manager. That distinction is what keeps §6.2's audit requirements from being sidestepped by a role that happens to be named "manager".

### 7. §7's "bidirectional sync" is satisfied by a shared endpoint, not a sync process

`EngagementManager` in `engagements-api-v6` is the single system of record. The Engagements Portal timesheet page (§6.3) and the Work App Assignees page both read and write it through `GET/POST/DELETE /engagements/:id/managers`. A manager added in either app is visible in the other on next load, because there is only one list.

Building an actual replication job between the two `platform-ui` apps would be inventing a distributed-systems problem out of a shared-backend one. Handle validation (§7: handle exists, account is active, no duplicates) happens once, server-side, in the POST handler using the existing `MemberService.getMemberUserIdByHandle` — not twice in two front ends.

### 8. Phase 2: hours are derived and locked; consumption is recorded on the entry

`tc-finance-api` gets no new tables. Instead:

1. The Work App payment modal calls `GET /engagements/:id/assignments/:assignmentId/timesheets/summary?fromDate&toDate`, which returns `{ totalDays, totalHours, ratePerHour, entryIds, alreadyPaidEntryIds }` over `APPROVED` entries only (§8.2).
2. `hoursWorked` in `PaymentFormModal` becomes **read-only**, populated from `totalHours`, with the amount derived as today. This is what enforces §8.3's "prevent payment against pending or unsubmitted hours" and "prevent payment hours from exceeding the approved timesheet hours" — an operator cannot type a larger number, so no server-side ceiling check is needed in the finance path.
3. After the winning is created, the Work App calls `POST /timesheets/entries/payments` with `{ entryIds, paymentReference }`. The service stamps `paidPaymentReference` / `paidAt` and writes a `PAYMENT_LINKED` audit record. Entries already carrying a reference are rejected, which is §8.3's "prevent the same approved timesheet entry from being paid more than once", and the summary endpoint excludes them from subsequent ranges.
4. Traceability (§8.3) runs both directions: `winnings.external_id` carries the assignment id as it does today and `winnings.attributes` gains the entry ids; `paidPaymentReference` points back from each entry.

The link-after-create ordering means a crash between steps 3 and 4 leaves a payment whose entries are unmarked — recoverable, and strictly safer than marking first and having payment creation fail, which would strand hours as unpayable.

### 9. Administrator reopen sets `DRAFT` + `reopenedAt`, not a fourth status

§9 leaves this open ("return to `-` or another explicitly defined status such as Reopened"). We choose `DRAFT`, because a fourth status would have to answer every question the other three already answer — can a member edit it, can a manager approve it — with the same answers `DRAFT` gives. The distinction that actually matters operationally, *this row was once approved*, is preserved by `reopenedAt` plus the `REOPENED` audit record, and the UI can badge it "Reopened" from that field without the state machine growing a branch.

### 10. Alternatives rejected

| Alternative | Why not |
| --- | --- |
| A standalone `timesheets-api-v6` service | Every request needs assignment + manager data to authorize. A new service replicates engagement state or makes a synchronous call per request, for no isolation benefit. |
| Timesheets in `tc-finance-api` | It is a payment ledger with no engagement-authorization model; §11's role rules would have to be rebuilt there. |
| Persist a row per selected calendar date | Empty drafts pollute the admin list and the "Total Days" summary; see §3. |
| Per-entry approval endpoints | §5.4 approves a selected *set* with one comment; N calls means N audit comments and partial failures with no atomic story. |
| A replication job for manager lists (literal §7) | Both apps share one backend; see §7. |
| Row-level locking for concurrent approval | The conditional `updateMany` in §5 is atomic, cheaper, and yields a better UI message. |
| Trusting a client-sent status on update | §4.6's reset and §4.7's immutability are only enforceable server-side; see §4. |

## Implementation plan

**Phase 0 — `engagements-api-v6`, data layer.** Prisma migration for the four models, the two enums, and the `EngagementManager` relation on `Engagement`. Regenerate both generator outputs (`@prisma/client` and `packages/engagements-prisma-client`); `platform-ui` consumes the API over HTTP and needs no generated types.

**Phase 1 — `engagements-api-v6`, managers.** `EngagementManager` CRUD with handle validation via `MemberService`, soft-delete on removal, `MANAGER_ASSIGNED`/`MANAGER_REMOVED` audit records, and the `managers` field added to engagement and assignment-context responses.

**Phase 2 — `engagements-api-v6`, timesheet core.** `timesheets` module with `resolveTimesheetRole`, the upsert endpoint with derived transitions, submit, the conditional-update approve, admin override/reopen, and the audit writer. Every mutation writes its audit record inside the same transaction as the change — an audit trail that can be skipped by a failure is not an audit trail.

**Phase 3 — `engagements-api-v6`, listing and access.** The role-aware engagement/assignee list backing §4, §5.2, and §6.1, including the administrator filters (title, assignee, manager, status, date range) and pagination following `pagination.dto.ts`.

**Phase 4 — `platform-ui`, engagements app.** Models, service layer, the `/timesheets` route, the shared timesheet grid, the three role views, the two confirmation modals, and the **Timesheet** button on My Assignments gated on Active status.

**Phase 5 — `platform-ui`, work app.** `Managers` field with handle search on the Assignees page, and the **View Timesheet** link.

**Phase 6 — Phase 2 payment integration.** Summary endpoint, read-only derived hours in `PaymentFormModal`, the payment-link call, and the double-pay guard.

**Phase 7 — Notifications (V3).** `postEvent` calls on submit/unsubmit/approve/manager-change/override, then email services following `assignment-offer-email.service.ts`.

Phases 0–3 gate everything in `platform-ui`; Phase 4 and Phase 5 are independent of each other; Phase 6 needs Phase 2 and Phase 4.

## File-level mapping

**`engagements-api-v6`**

| Path | Change |
| --- | --- |
| `prisma/schema.prisma` | Four models, two enums, `Engagement.managers` + `EngagementAssignment.timesheetEntries` relations |
| `prisma/migrations/<ts>_add_engagement_timesheets/` | New migration |
| `src/app-constants.ts` | `ReadTimesheets`, `WriteTimesheets`, `ApproveTimesheets`, `ManageTimesheets` scopes |
| `src/timesheets/timesheets.module.ts`, `.controller.ts`, `.service.ts` | New module |
| `src/timesheets/timesheet-access.service.ts` | `resolveTimesheetRole` |
| `src/timesheets/timesheet-audit.service.ts` | Transactional audit writer |
| `src/timesheets/dto/` | Upsert, submit, approve, override, query, response, summary DTOs |
| `src/engagements/managers/` | Manager registry controller + service |
| `src/engagements/dto/engagement-response.dto.ts`, `assignment-context-response.dto.ts` | Add `managers` |
| `docs/` | Timesheet workflow + authorization matrix doc, alongside `ASSIGNMENT_STATUS_FLOW.md` |

**`platform-ui`**

| Path | Change |
| --- | --- |
| `src/apps/engagements/src/engagements.routes.tsx` | `timesheets` and `timesheets/:assignmentId` routes, `authRequired: true` |
| `src/apps/engagements/src/pages/timesheets/` | Router page + `MemberTimesheetView`, `ManagerTimesheetView`, `AdminTimesheetView` |
| `src/apps/engagements/src/components/timesheet-grid/` | Shared grid: selection, hours/remarks inputs, status column, totals footer |
| `src/apps/engagements/src/components/timesheet-submit-modal/`, `timesheet-approve-modal/` | §4.5 and §5.4 confirmations |
| `src/apps/engagements/src/components/engagement-managers/` | Manager list + Add Manager (admin view, §6.3) |
| `src/apps/engagements/src/lib/models/Timesheet.model.ts`, `EngagementManager.model.ts` | New models |
| `src/apps/engagements/src/lib/services/timesheets.service.ts`, `engagement-managers.service.ts` | New services |
| `src/apps/engagements/src/lib/utils/timesheet.utils.ts` | Range generation, 31-day cap, totals, `DD-MM-YYYY` formatting |
| `src/apps/engagements/src/pages/my-assignments/MyAssignmentsPage.tsx` | **Timesheet** button, Active-only |
| `src/apps/engagements/src/config/constants.ts` | `TIMESHEET_MAX_RANGE_DAYS = 31`, `TIMESHEET_MAX_HOURS_PER_DAY` |
| `src/apps/work/src/pages/engagements/EngagementPaymentPage/EngagementPaymentPage.tsx` | `Managers` field + **View Timesheet** link per assignee |
| `src/apps/work/src/lib/components/PaymentFormModal/PaymentFormModal.tsx` | Derived read-only hours (Phase 2) |
| `src/apps/work/src/lib/services/payments.service.ts` | Post-payment entry linking (Phase 2) |

## Consequences

**Good.** Authorization has one server-side implementation and the UI cannot bypass it. `@@unique([engagementAssignmentId, workDate])` makes §4.4's duplicate rule unforgeable rather than a validation anyone can forget. Multi-manager approval races resolve correctly without locks. The audit trail is transactional with the data it describes. `tc-finance-api` is untouched, so Phase 2 carries no ledger-migration risk. Phase 2 is genuinely deferrable: nothing in Phase 1 assumes it.

**Costs and risks.** `engagements-api-v6` grows a second substantial domain; the timesheet module must stay self-contained to keep that manageable. Client-side row generation means the member view holds unsaved state, so navigation guards and an explicit save story matter more than usual — this is the main UI complexity the choice buys. The `DRAFT`-on-reopen decision means a reopened row is indistinguishable from a never-submitted one in the `status` column alone; the UI must read `reopenedAt` to badge it. The audit table grows unbounded and will need a retention policy before it becomes a problem, not after. Finally, the payment-link step in Phase 2 is a second call after winning creation — a crash between them leaves unmarked entries that need an operational recovery path.

**Not addressed by this design.** Timezone semantics are punted to "the date the member picks is the date stored"; a member and manager in different zones see the same calendar date, which is almost certainly what §4.2 intends but is not stated. Nothing here prevents a member from logging hours outside the assignment's `startDate`/`endDate` — see Open Questions.

## Open questions

1. **Hours ceiling.** §4.4 forbids negative hours but sets no maximum. `EngagementAssignment.standardHoursPerDay` is displayed in §4.1 — should it be enforced as a cap, warned against, or purely informational? Proposed default: a hard cap at 24 and a soft warning above `standardHoursPerDay`.
2. **Dates outside the assignment window.** Should entries be rejected outside `startDate`/`endDate`? Proposed default: allow, since assignment dates are often set loosely, and flag in the administrator view.
3. **Multi-assignee manager view.** §5.2 says each assignee "may be displayed as a separate record". Confirming that as a requirement rather than a suggestion, since it determines whether the list is keyed by assignment or engagement.
4. **Partial approval UX.** When the conditional update approves 3 of 5, the proposal is to report and refresh. Confirm that beats failing the whole batch.
5. **Payment reference shape.** Phase 2 stores `paidPaymentReference` as an opaque string. Confirm whether the `winnings.winning_id` or the external payment id is the durable identifier to keep.

## Prerequisites to confirm before implementation starts

- ~~Rejection path and administrator role source~~ — both resolved 2026-09-16: no rejection path, and `PrivilegedUserRoles` is the administrator definition. Nothing blocking remains on the API surface.
- `engagements.topcoder.com` is confirmed as the host for `/timesheets` (§2), and the `engagements` subdomain routing in `engagements.routes.tsx` needs no gateway change for a new top-level path.
- `packages/engagements-prisma-client` is republished alongside the API migration. No consumer of it was found in the repos checked out here, so the list of downstream services that need the new models needs confirming before the migration ships.
- Audit-retention expectations are stated, so the table is designed once rather than migrated later.
