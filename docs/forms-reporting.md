# Forms reporting

The Reports portal includes an administrator-only Forms tab at `/reports/forms`
on the combined host and `/forms` on the dedicated Reports host. The API continues
to enforce its own Administrator / Forms Reporter / `read:forms-submissions`
authorization. Talent Manager access does not expose submission PII.

Select a named form (the contact form is `Let’s talk`) to load 25 submissions
per page, newest first (submission time descending, then UUID descending for ties).
Let’s talk uses responsive cards with contact details, member ID and UTM values
above the full-width inquiry, preserving line breaks and wrapping long text/URLs.
The cards omit source page, form version, Leadsource, Landing Page Link, Lead Source
For Campaign C, Primary Campaign C and Insta Page Name C. Other forms retain tables
with every field across published and retired revisions and submission metadata.
Drafts are excluded from the selector. Empty forms and failed requests have explicit UI states.

Start/end dates include the entire UTC day. Either boundary may be omitted. Changing
forms or dates resets pagination; reversed ranges are rejected locally and by the
API. Stale responses are ignored after navigation or filter changes. Previous/Next
navigate with API cursors and the result shows the total matching submissions.

**Export all CSV** ignores date inputs; **Export filtered CSV** applies them. Both
export all matching submissions regardless of the current table page. The API
retains all fields in CSV, including those hidden from the contact cards, in newest-first order. It
streams batches with one header and spreadsheet-safe escaping. The browser receives
the result as a Blob, so very large downloads are bounded by browser memory.

`forms.service.ts` uses the shared authenticated HTTP client and `EnvironmentConfig.API.V6`:

- `GET /forms/reports/directory` (follows all directory pages)
- `GET /forms/:key/submissions` (inclusive dates, limit, cursor)
- `GET /forms/:key/submissions/export` (dates only)

Deploy the companion forms-api-v6 reporting change before the portal. Add the exact
Reports/combined portal origins to the API CORS allowlist; website-only CORS is
insufficient. No new UI secrets or environment variables are needed.
Deploy the companion website change to capture URL UTM values and authenticated
member IDs on new Let’s talk submissions. Previously missing values remain empty.

Validation: `yarn lint`, `yarn run build`, and focused Forms page/service and Reports
navigation/route tests via `yarn test:no-watch --runInBand --testPathPattern=apps/reports/src`.
