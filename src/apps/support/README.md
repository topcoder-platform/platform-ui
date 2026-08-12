# Support

The Support subapp lets authenticated Topcoder members open requests, follow
their status, and reply to the Topcoder Support Team. Users with the exact
`Topcoder Support Team` role can see all tickets, assign themselves, search
closed tickets, reply to tickets assigned to them, and close resolved requests.

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

Ticket and response fields use the shared Review `FieldMarkdownEditor` and
`uploadReviewAttachment`. Uploads are grouped under the `support-ticket` or
`support-ticket-response` category. Display uses `react-markdown` with GFM and
line breaks; raw HTML is deliberately disabled.

## Domain infrastructure follow-ups

Application routing alone does not provision `support.topcoder.com`. Before the
dedicated host is enabled, operations must configure the CloudFront alternate
domain and SPA fallback, ACM certificate, Route 53 alias, authentication return
URL allowlist, and API CORS for each environment. Notification links should use
an environment-specific Support base URL rather than a hard-coded production
host.
