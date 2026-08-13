# Payload CMS client

This library is the browser-side CMS boundary for the migrated Thrive and Blog apps. It calls only
`https://cms.topcoder-dev.com` and accepts media only from `https://assets.topcoder-dev.com`; it has
no Contentful, Octana, or community-app proxy fallback.

Payload's read-only compatibility facade deliberately retains the old response schema so migrated
content can be rendered without changing its field model. Configure the per-space delivery
credentials as build-time variables:

- `REACT_APP_PAYLOAD_CMS_EDU_ACCESS_TOKEN` for the `piwi0eufbb2g` Thrive space.
- `REACT_APP_PAYLOAD_CMS_WEBSITE_ACCESS_TOKEN` for the `xooissnm36jt` website
  space's `uat` environment used by Blog.
- `REACT_APP_PAYLOAD_CMS_DEFAULT_ACCESS_TOKEN` for retained default-space content.

The values are sent only in an `Authorization: Bearer` header. They are never appended to a URL.
The facade returns links plus an `includes` envelope; `PayloadCmsClient` resolves those links before
returning records to page components.

The Payload/CloudFront deployment must allow each platform-ui origin and the `Authorization` header in
its CORS policy. The client intentionally has no same-origin or community-app proxy fallback.
