# Sales (PM-6343)

Read-only Salesforce reporting for Administrators and Talent Managers. Available
at `sales.topcoder.com` / `sales.topcoder-dev.com`, `/sales` on the combined host,
and the **Sales** tab inside Work (`/sales` on the Work host, `/work/sales` on the
combined host). Route guards and the Reports API independently enforce access.

The page calls `GET {REPORTS_API}/sales` with the signed-in user's token. All
Salesforce credentials stay in `reports-api-v6`. No create, update, delete,
export, machine credentials or direct Salesforce API calls exist in the UI.

Report metadata determines every displayed column, including grouped Stage.
Search and column substring filters apply on **Apply**; headers sort globally
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

Run `nvm use` in platform-ui before `yarn lint`, `LOGICAL_ENV=dev yarn run build`,
and `CI=true yarn test:no-watch --runInBand --watch=false sales`.
