# Sales (PM-6343, PM-6363, PM-6364, PM-6392)

Read-only Salesforce reporting for Administrators and Talent Managers. Available
at `sales.topcoder.com` / `sales.topcoder-dev.com`, `/sales` on the combined host,
and the **Sales** tab inside Work (`/sales` on the Work host, `/work/sales` on the
combined host). Route guards and the Reports API independently enforce access.

The page calls `GET {REPORTS_API}/sales` with the signed-in user's token, and
`GET {API.V6}/projects/salesforce/opportunities/{id}` for the opportunity popup.
All Salesforce credentials stay in `reports-api-v6` and `projects-api-v6`. No
create, update, delete, export, machine credentials or direct Salesforce API
calls exist in the UI.

Report cells whose value is a Salesforce opportunity id (the `006` key prefix)
render the opportunity name as a button. Opening it shows a popup with the
opportunity description first, followed by the customer, SMU, close date and
stage when Salesforce provides them, plus a link to the record. The popup closes
with its Close button or the X icon; obsolete lookups are aborted.

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

Clicking a tile filters the table below to that stage; the tile is highlighted
and carries `aria-pressed`. Clicking it again, or the **Clear stage** control in
the panel header, removes the filter. The selection travels as the Reports API
`drilldownColumn`/`drilldownValue` pair, which narrows the returned rows only,
so `summary` still covers every stage and the breakdown does not collapse to the
one stage being examined. The stage selection is independent of the report's own
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

Refresh preserves filters and sorting. Visible tabs poll every 60 seconds and
refresh on returning from a hidden tab; obsolete requests are aborted and
ignored. Failed refreshes keep the prior snapshot visibly marked as stale;
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
