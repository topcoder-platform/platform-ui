# Thrive

The Thrive sub-application ports the public community-app experience to platform-ui. It reads only the
Payload CMS Contentful-compatibility API at `https://cms.topcoder-dev.com` and renders migrated media only
from `https://assets.topcoder-dev.com`.

## Routes

- `/thrive`
- `/thrive/tracks`
- `/thrive/search`
- `/thrive/articles/:slug`

## Configuration

Set `REACT_APP_PAYLOAD_CMS_EDU_ACCESS_TOKEN` to the Payload delivery credential for retained space
`piwi0eufbb2g`. The token is sent as a bearer credential and is never placed in a query string. Missing or
rejected credentials produce a visible page error; there is deliberately no Contentful, Octana, or
community-app proxy fallback.

External article redirects, article cards, and video links all use the shared
CMS safe-link policy. Unsafe schemes and retired Contentful, CTF Assets, or
Octana hosts are never exposed; unsafe card targets fall back to the local
article route, while a direct unsafe external-article route fails closed with
an in-page unavailable state.

## Voting

Article pages show like/dislike buttons (`ThriveVoteButtons`) in place of the former read-only totals.
They call the Topcoder website runtime API at `WEBSITE_API_URL` (default `https://www.<domain>/__api`)
with the refreshed member token:

- `GET /thrive/articles/:id/vote` loads the member's vote and the current totals.
- `POST /thrive/articles/:id/vote` with `{ "vote": "up" | "down" | null }` records, switches, or clears it.

The website API keeps one vote per member per article and publishes server-computed totals to Payload, so
the browser never supplies counts or holds the CMS write token. Visitors are sent to login with the article
as the return URL. Thrive is served on the website host, so these calls are same-origin; other hosts are not
in the website API's CORS allow list.

## Live Preview

Payload's Thrive article editor previews `/thrive/articles/:slug?payloadLivePreview=1` on the website origin.
The website's viewer-request function serves those marked URLs from its own `/thrive-preview` host, which
renders the unsaved draft with the same Markdown rules as this app. Unmarked article URLs remain served here.
