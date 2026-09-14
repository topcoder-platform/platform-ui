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
