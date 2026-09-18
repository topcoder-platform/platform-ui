# Sales (PM-6343, PM-6363, PM-6364)

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

## Date range filter (PM-6364)

A date range section at the top of the page filters the report by **Created
Date** for pipeline generation, or by **Close Date** for revenue projection.
The Filter type dropdown lists the report's own `date`/`datetime` columns rather
than hard-coded Salesforce field IDs, and opens on the Created Date column when
the report has one. From date and To date are inclusive and either may be left
empty for an open-ended range.

Unlike the search and column filters, the range is only sent when **Apply
filter** is pressed, and **Reset filter** clears it without disturbing search,
column filters or sorting. Clearing the report filters likewise leaves the range
intact. An inverted range is reported inline and never sent. A report with no
date columns disables the section.

The Reports API applies the range across the whole received snapshot before
paginating, so a filtered count is the real matching count and not a per-page
figure.

## Filtered totals (PM-6364)

Summary tiles above the report show the metrics the current filters produce over
every matching record: opportunity count, a total per numeric column (pipeline
value and revenue projections), and a breakdown per category column such as
Stage. The API computes them, so they never describe only the visible page.
Totals show their shared currency; a total that sums different currencies is
rendered as a plain number and labelled as mixed. Tiles are hidden when the API
returns no `summary`, which keeps the page working against an API that predates
this feature.

Report metadata determines every displayed column, including grouped Stage.
Search and column substring filters apply automatically as the user types (debounced); headers sort globally
before server pagination. Changing a filter, sort or page size starts at page
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
