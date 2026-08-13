# Blog

The Blog sub-application ports the community-app list, pagination, post, and related-post experience to
platform-ui. It reads only the Payload CMS Contentful-compatibility API at `https://cms.topcoder-dev.com`
and renders migrated media only from `https://assets.topcoder-dev.com`.

## Routes

- `/blog`
- `/blog/page/:page`
- `/blog/post/:slug`
- `/blog/:page` and `/blog/:slug` (community-app-compatible aliases)

## Configuration

Set `REACT_APP_PAYLOAD_CMS_DEFAULT_ACCESS_TOKEN` to the Payload delivery credential for retained space
`b5f1djy59z3a`. The browser client sends it as a bearer credential. Missing or rejected credentials produce
a visible page error; there is deliberately no Contentful, Octana, or community-app proxy fallback.
