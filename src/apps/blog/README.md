# Blog

The Blog sub-application ports the community-app Blog experience to platform-ui. It reads only the
Payload CMS Contentful-compatibility API at `https://cms.topcoder-dev.com` and renders media only when
it resolves to `https://assets.topcoder-dev.com`.

## Routes

- `/blog`
- `/blog/page/:page`
- `/blog/post/:slug`
- `/blog/:page` and `/blog/:slug` (community-app-compatible aliases)

## Payload contract

Blog content is in retained website space `xooissnm36jt`, environment `uat`. The list queries
`pageContentArticle`, ordered by `-fields.publishedDate`, in pages of 12 with a three-column desktop and
one-column mobile layout. It then performs one batched `page` query using
`fields.content.sys.id[in]` so each article is paired with its authored URL without changing list order
or total count.

Article detail routes query both `/blog/<slug>` and `/<slug>`, prefer the `/blog` Page, and render only a
resolved `pageContentArticle`. `body` and `snippet` are Contentful-compatible Rich Text JSON documents;
they are rendered with a fixed React element allowlist and are never interpreted as Markdown or raw
HTML. `cardImage` and `heroMedia -> componentImage -> image` assets are rejected unless their final URL
uses `assets.topcoder-dev.com`.

The Blog root and Page Cards retained IDs are `iz7zIybJoja037o8NM676` and
`xGSJ2gbb4NTY7wQUoZgdf`. When that included Page Cards configuration provides author, category, or topic
relationships, explicit articles, a limit, page size, snippet visibility, or responsive `cardsPerRow`,
those authored controls are applied to the article query and card grid. Defaults remain 12 articles per
page and `{ "xs": 1, "md": 3 }` cards per row. An authored `limit` is a total cap and intentionally
disables pagination; when both `limit` and `pageSize` exist, the list requests the full limited set.

Rich Text URL links and resolved Entry links are scheme checked. Resolved `componentImage` blocks render
their approved Asset, optional Page/external link, and caption. Inline/text components recursively render
their Rich Text; unsupported resolved entries fail closed to safe text instead of executing CMS markup.

## Configuration

Set `REACT_APP_PAYLOAD_CMS_WEBSITE_ACCESS_TOKEN` to the Payload delivery credential for website space
`xooissnm36jt`. The browser client sends it as a bearer credential. Missing or rejected credentials
produce a visible page error; there is no Contentful, Octana, or community-app proxy fallback.
