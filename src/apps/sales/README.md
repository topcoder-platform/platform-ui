# Sales (PM-6343, PM-6363, PM-6364, PM-6392)

Read-only Salesforce reporting for Administrators and Talent Managers. Available
at `sales.topcoder.com` / `sales.topcoder-dev.com`, `/sales` on the combined host,
and the **Sales** tab inside Work (`/sales` on the Work host, `/work/sales` on the
combined host). Route guards and the Reports API independently enforce access.

The page calls `GET {REPORTS_API}/sales` with the signed-in user's token, and
`GET {API.V6}/projects/salesforce/opportunities/{id}` for the opportunity popup.
All Salesforce credentials stay in the server APIs. No machine credentials or
direct Salesforce API calls exist in the UI.

Administrators also see **Sync SF Data** immediately to the right of **Read only**.
It calls `POST {API.V6}/billing-accounts/salesforce-sync` with the signed-in user's
JWT to copy the extra client and billing-account metadata (including opportunity
IDs) into the platform. The report remains read-only; Salesforce is never modified.
The action is disabled while running, shows completion counts or a recoverable
error, and then refreshes page data with `refresh=true` while preserving filters.
Any open opportunity popup closes so its next lookup reads the updated metadata.
Talent Managers do not see the action. The API independently requires an
administrator role; M2M scopes do not grant access. Deploy the billing API endpoint
and configure its Salesforce client credentials before enabling this UI release.
The request allows six minutes for the API's five-minute transaction; the API
gateway/proxy must allow this duration as well.

Report cells whose value is a Salesforce opportunity id (the `006` key prefix)
render the opportunity name as a button. Opening it shows a popup with the
opportunity description first, followed by the customer, SMU, close date and
stage when Salesforce provides them, plus a link to the record. The popup closes
with its Close button or the X icon; obsolete lookups are aborted.
The popup is 860px wide, capped at the viewport width minus 32px on smaller
screens, with scrolling retained for long descriptions.

When the opportunity has a local billing account, the popup also shows its
current ID/name, a **View project … in Work** link to
`{WORK_APP}/projects/{projectId}/challenges`, and a **Past billing accounts** list
with each account's ID/name. The Projects API resolves the account from
`BillingAccount.opportunity`, the project from `Project.billingAccountId`, and
`relatedBillingAccounts` from all unique billing account IDs referenced by that
project's challenges (all statuses, including inactive accounts). The popup
excludes the current account from the past-account list; the response retains it
when a challenge references it. An empty past list displays “No past billing
accounts found.” Missing names display “Name unavailable” alongside the ID.

All new fields are hidden when `billingAccount` is null or absent. An account
without a matching project still displays its details, with no Work link.
Links use the active environment's Work host. Deploy the Billing Accounts API
`opportunity` filter, then the Projects API response expansion, before the UI.

## Multiple values and amount filters (PM-6639)

Select multiple stage tiles to show opportunities in any selected stage. Clicking
a selected tile removes only that stage; **Clear stages** removes all selections.
The summary cards retain the existing overview behavior. For other report fields,
use **Add OR value** beside **Contains** (up to 25 values); empty inputs are ignored.
Delete an input's text to stop matching that value. Commas remain literal text.

Choose an **Amount field** and enter **Greater than**, **Less than**, or both.
For example, Amount greater than `100000` filters amounts strictly above 100,000.
Both bounds are exclusive, support decimals and zero, and compare raw amounts in
the selected column's units. The lower bound must be less than the upper bound.
Clear both bounds to remove the range. These controls debounce like search and
apply immediately on Enter. **Clear** resets search, column values, amounts and
sorting while preserving the independent date range and selected stages.

The Reports API applies OR values and amount ranges to the full received snapshot
before pagination, combining independent filters with AND. Amounts also narrow
summary totals; stage selections continue to narrow only the returned rows.
Multiple values use repeated query parameters. Deploy the PM-6639 Reports API
change before this UI. Tests cover OR selection/removal, strict numeric bounds,
combined filters, pagination resets, clearing, refresh and request serialization.

## Dashboard layout (PM-6392)

The page reads as an executive dashboard rather than one long column:

1. Page title and refresh controls.
2. Four summary statistic cards, left to right.
3. A two-column row: the stage breakdown on the left, the date range filter on
   the right, each about half the width. Below 1100px they stack.
4. The opportunity table.

## Summary statistic cards (PM-6392)

The four cards report **Total Opportunities**, **Total Amount**, **Total
Expected Revenue** and **Total WON SOW Signed**, in that fixed order. They read
the API's snapshot-wide `summary`, so they describe every record the current
search, column filter and date range match, not the visible page.

Total Amount and Total Expected Revenue resolve their column by label, accepting
the converted variant so a report that provides only `Amount (converted)` still
fills the card with the single-currency figure `displayedAmounts` prefers. Total
Amount falls back to the report's first non-converted total if no column is
named Amount. Total WON SOW Signed is the Amount total of the `Won - SOW Signed`
stage taken from the breakdown. A card whose column the report does not provide
shows an em dash rather than disappearing, so the row stays four wide.

The cards deliberately ignore the selected stage: they are the overview the
stage tiles are read against. See the drilldown note below.

## Stage breakdown (PM-6392)

The stage breakdown is a compact grid of clickable tiles, one per stage, each
showing that stage's opportunity count, Amount and Expected Revenue. The stages
are ordered down the pipeline — Prospecting, Qualification, Proposal, Contracts,
Closing, Won SOW Signed — and a stage the pipeline adds later follows them,
ordered by value as the API returned it.

Clicking a tile adds that stage to the table filter; selected tiles are highlighted
and carry `aria-pressed`. Clicking a selected tile again removes only that stage;
**Clear stages** removes all selections. The selection travels as the Reports API
`drilldownColumn` plus repeated `drilldownValue` parameters, which narrow the returned
rows with OR matching only, so `summary` still covers every stage and the breakdown
does not collapse to the selected stages. The stage selection is independent of the report's own
search and Filter field controls, and clearing those leaves it in place, exactly
as it leaves the date range in place.

## Table columns (PM-6392)

The table shows ten columns, in this order: Stage, Opportunity Name, Account
Name, Subcontracting End Customer, Reporting SMU, Amount, Expected Revenue,
Created Date, Close Date, Opportunity Owner. Reporting Account, Close Month,
Expected Revenue (Converted), Amount (Converted) and Forecast Alert are not
shown.

Selection and ordering are a **display** concern in `sales.utils.ts`: columns are
matched by label, the API response and the WIN contract are unchanged, and a
column the Salesforce report adds later is kept and shown behind the ordered
ones rather than silently dropped. Each displayed column keeps the cell index it
has in `row.cells`, so reordering headers never reorders row data. The Filter
field dropdown offers the displayed columns only.

Currency and numeric cells are right-aligned and never wrap, date cells never
wrap, and padding and font sizes are tightened so the ten columns fit a standard
laptop width. The focusable horizontal scroll region remains as a fallback for
narrow windows and unusually wide values.

## Date range filter (PM-6364, moved in PM-6392)

The date range panel, now the right half of the two-column row, filters the
report by **Created Date** for pipeline generation, or by **Close Date** for
revenue projection.
The Filter type dropdown lists the report's own `date`/`datetime` columns rather
than hard-coded Salesforce field IDs, and opens on the Created Date column when
the report has one. From date and To date are inclusive and either may be left
empty for an open-ended range.

Like the search and column filters, the range applies automatically (debounced)
as the Filter type, From date or To date change. **Clear** empties it without
disturbing search, column filters or sorting, and clearing the report filters
likewise leaves the range intact. An inverted range is reported inline and never
sent. A report with no date columns disables the panel.

The Reports API applies the range across the whole received snapshot before
paginating, so a filtered count is the real matching count and not a per-page
figure.

## Filtered totals (PM-6364, restated in PM-6392)

The API computes every total over all matching records, so they never describe
only the visible page. A total whose converted counterpart the report also
provides, such as Amount beside Amount (converted), is treated as redundant and
the converted figure is used. Totals show their shared currency, and a
single-currency total the report leaves uncoded is shown in US dollars to match
the converted columns; a total that sums different currencies is rendered as a
plain number and labelled as mixed. The cards and the stage breakdown are hidden
when the API returns no `summary`, and a `summary` whose buckets predate the
PM-6392 per-bucket `amounts` still renders, using the primary bucket total.

Report metadata determines every available column, including grouped Stage.
Search and column substring filters apply automatically as the user types
(debounced); a stage tile applies at once, because a click is already a
deliberate single action. Headers sort globally before server pagination. Changing a filter, sort or page size starts at page
one. Clear resets filters and sorting. Null display values use an em dash.
Search sales, Filter field and Contains use persistent labels above equal-height
controls, aligned in the desktop filter row and stacked on mobile.
The semantic HTML table provides keyboard sorting, `aria-sort`, and a focusable
horizontal scroll region for wide reports; the shared Table component performs
client sorting and is intentionally not used for this server-paginated report.

Refresh preserves filters and sorting. The page loads on entry and when view
controls change; the Refresh button requests fresh Salesforce data. Obsolete
requests are aborted and ignored. Failed refreshes keep the prior snapshot visibly marked as stale;
401/403 responses remove it. Loading, retry, empty and upstream truncation states
are explicit. `allData: false` warns that filters and totals cover only received
rows, because Salesforce Analytics caps report details at 2,000 records.

The app opts into scoped shared 2026 foundations, using Figtree headings, Nunito
Sans body text, semantic color tokens, shared buttons and loading controls, and
explicitly labelled native filter controls. Source design guidance:
[Topcoder Design System — August 2026](https://www.figma.com/design/C2cA6508RhpjWJDp7MLKbO/Topcoder-Design-System---Aug-2026?node-id=1-54).

Aggregates and the date range both cover received rows only, so `allData: false`
limits them exactly as it limits the record count.

Run `nvm use` in platform-ui before `yarn lint`, `LOGICAL_ENV=dev yarn run build`,
and `CI=true yarn test:no-watch --runInBand --watch=false sales`.


## Stage progression (CORE-2658)

The Sales page has **Pipeline** and **Stage progression** tabs on both the Sales
and Work hosts. The pipeline behavior is unchanged. Tab selection supports arrow,
Home and End keys; switching tabs cancels the inactive report request. Returning
to a tab starts its default view.

Stage progression calls `GET {REPORTS_API}/sales/progression` using the signed-in
user's token, with required inclusive `dateFrom`/`dateTo` calendar dates and
optional exact `fromStage`/`toStage` filters. It starts with this month through
today. **Apply filters** submits the pending dates/stages together, with a maximum
of 366 inclusive days. Dates refer to the history event, in the reporting timezone
displayed by the API, not the opportunity's current close or creation date.

Four cards show distinct opportunities progressed, forward transitions, distinct
opportunities won, and entries into won. The **Show** selector switches the table
between forward movement and entering won; it does not change the summary cards.
All cards and rows respect the applied period and stage filters. Distinct counts
come from Salesforce's grand totals: one opportunity moving several times counts
once in a card, but can appear in several stage-pair rows. The two opportunity
metrics can overlap.

Forward movement follows the API's explicitly configured open-stage order,
including entry from an open stage into any configured won stage. Regressions,
reopenings, transitions into lost/other stages, unknown open stages, and initial
stage assignments do not count as forward movement. A win is a transition from
an existing non-won stage into a won stage. Moving between won stages is not a
new win; reopening and winning again adds an event but not another distinct
opportunity within the selected period. The configured order is shown below the
cards so the interpretation is visible.

The history endpoint returns complete summaries without downloading individual
opportunity history. Refresh reuses the API's one-minute response cache. Failed
refreshes explicitly label previous data as stale; changing filters clears old
results, obsolete responses are ignored, and 401/403 clears protected results.
Empty complete responses show zero totals. Missing setup and incomplete/upstream
responses show recoverable errors rather than misleading zero or partial counts.

Deploy the Reports API change first and configure the separate Salesforce
Opportunity History report and `SALESFORCE_SALES_HISTORY_CONFIG` as documented in
`reports-api-v6/SALES.md`. No database migration or stored opportunity snapshots
are required. The history tab remains unavailable until that setup is complete;
the pipeline remains independently available.

## Monthly dashboards

The Sales portal's **Monthly dashboards** tab and the Reports portal's
**Sales dashboards** navigation entry render the same `SalesDashboardsPage`.
The Reports route is `/reports/sales-dashboards` on the combined host and
`/sales-dashboards` on the Reports host. Existing pipeline/progression reports
and platform dashboards retain their routes and behavior.

The pipeline, revenue, member payments and flexible talent sections each call
`/sales-dashboard/:section` on the Reports API independently,
with inline loading, failure/retry and pending-source states. Refresh reloads all
sections. Changing Close date / Created date reloads only pipeline data. Source
requests are aborted on unmount or control changes.

Charts cover the latest six UTC calendar months. Opportunity size, expected
revenue and pipeline stages include three months back through six months ahead;
Closed Won remains historical and counts the `Won - SOW Signed` stage, as the
pipeline's Total WON SOW Signed card does. The API replaces the Salesforce
reports' saved fiscal-year filter for each dashboard run, so months either side of
a fiscal-year boundary are not left empty. Charts include expandable monthly data
tables, currency/count units, and gaps for unknown values. Y-axis ticks use compact
labels such as `$1.5M`. Source notices remain visible above the charts.

### Headlines

As in the executive overview attachment, each chart opens with a headline: the current
UTC month's value in full, its change from the full previous month, and a caption.
`chartHeadline` in `SalesDashboardChart.tsx` derives it from the monthly data, so the
API is unchanged.

- Stacked charts headline their stack total. For the stacked count chart (members paid
  by type) the caption notes that the series are summed, so a member paid in two types
  counts twice.
- Single-series charts headline their value. Other multi-series charts headline each
  series separately, because their series can't be added; Flexible talent shows newly
  assigned, completed and ongoing.
- Changes are relative percentages, or percentage points for percent charts. No
  change is shown when either month is unknown or the previous value is zero.
- The caption reads "Current month, including expected closes" for pipeline charts
  grouped by close date that extend past this month, and "Current month to date"
  otherwise.
- When nothing is recorded for the current month yet, the latest month with data is
  headlined, compared with the month before it and named in the caption. Revenue
  needs this because it is recognized at month end.

Sales passes `portal=sales` so the API removes TaaS, Topcoder and unlinked customer
payments before computing any payment totals or customer rankings. Reports
passes `portal=reports`. Flexible talent counts newly assigned, completed and
ongoing members by month. Gross margin is on hold per the PM-6632 clarification:
neither portal renders or requests that section, including on refresh.

Revenue uses the confirmed SFDC report `00O1K000009GxBtUAK` ("Accounts Monthly
revenue File"), with its verified Date and Gross Amount columns as API defaults. It
renders monthly revenue, then the same revenue stacked by offering (Type) and by
account category. A pending notice appears only when reports-api-v6 is pointed at
another report without column settings. See that repository's `SALES.md` for source
definitions, settings and API parameters.

Tests: `SalesDashboardsPage.spec.tsx` covers portal scope, gross margin remaining
hidden and unrequested in both portals, independent failures,
retry, refresh, date-basis changes, request cancellation, keyboard navigation,
accessible percentage/missing-value tables, compact axis labels and headlines
(totals, per-series figures, percentage points, expected closes and the
latest-recorded-month fallback). Reports route/navigation tests cover
the new entry point.
