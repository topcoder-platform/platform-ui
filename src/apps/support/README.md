# Support

The Support subapp lets authenticated Topcoder members open requests, follow
their status, and reply to the Topcoder Support Team. Users with the exact
`Topcoder Support Team` role can see all tickets, assign themselves, search
closed tickets, and reply to or close resolved requests assigned to them.
Closed ticket details identify the Support Team user who closed the request.

## Routes

On a combined Platform UI host the app uses:

- `/support` — open tickets
- `/support/closed` — closed tickets
- `/support/tickets/:ticketId` — ticket conversation

On `support.topcoder.com` (and the equivalent environment domains), the same
routes are `/`, `/closed`, and `/tickets/:ticketId`.

All routes require authentication. Ticket visibility and every staff mutation
must also be authorized by support-api-v6; UI role checks only control what is
shown.

## API and local development

The app calls `${EnvironmentConfig.API.V6}/support`. Local Platform UI rewrites
the `/v6/support` prefix to `http://localhost:3014`, so run support-api-v6 on
that port before starting Platform UI.

Ticket and response fields use the shared Review `FieldMarkdownEditor`, but
attachments use the Support-owned `uploadSupportAttachment` client. It posts
one `file` field as authenticated multipart form data to
`POST /v6/support/attachments`; support-api-v6 then uses the standard hosted
upload flow and returns the canonical HTTPS URL inserted into Markdown. The
browser never connects directly to the configured storage bucket. Both the UI
and API enforce a 2 MiB limit. The Support editor and API share the exact
extension/MIME allowlist: `.7z`, `.bmp`, `.csv`, `.doc`, `.docx`, `.gif`, `.gz`,
`.jpeg`, `.jpg`, `.json`, `.log`, `.pdf`, `.png`, `.ppt`, `.pptx`, `.rar`,
`.tar`, `.tgz`, `.tif`, `.tiff`, `.txt`, `.webp`, `.xls`, `.xlsx`, `.xml`, and
`.zip`; the declared MIME type must match its extension. Active formats such as
SVG and HTML are not offered by the file picker and remain rejected by the API.
Display uses `react-markdown` with GFM and line breaks; raw HTML is deliberately
disabled.

## Domain infrastructure follow-ups

Application routing alone does not provision `support.topcoder.com`. Before the
dedicated host is enabled, operations must configure the CloudFront alternate
domain and SPA fallback, ACM certificate, Route 53 alias, authentication return
URL allowlist, and API CORS for each environment. Notification links should use
an environment-specific Support base URL rather than a hard-coded production
host.
