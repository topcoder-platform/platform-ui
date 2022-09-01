# Dev Center Configuration

See the [main app README](/README.md#developer-center-contentful-api-key-and-space-id) for info regarding the environment variables required to run the DEV Center.

## Landing page

We can configure up to 5 articles shown on the landing page. The articles can be from Topcoder Thrive and/or Topcoder Blog.

The configuration file is located at [/src-ts/tools/dev-center/dev-center-pages/community-app/landing-page/dev-center-articles-section/articles.config.ts](/src-ts/tools/dev-center/dev-center-pages/community-app/landing-page/dev-center-articles-section/articles.config.ts).

We can configure the image carousel on the landing page, the configuration file is located at [/src-ts/tools/dev-center/dev-center-pages/community-app/landing-page/dev-center-header/carousel-content.config.ts](/src-ts/tools/dev-center/dev-center-pages/community-app/landing-page/dev-center-header/carousel-content.config.ts).

The local images for the carousel should be put in [/src-ts/tools/dev-center/carousel-images](/src-ts/tools/dev-center/carousel-images).

## Getting Started page

The content of the getting started page is from a Markdown text, the source is located at [/src-ts/tools/dev-center/dev-center-pages/community-app/getting-started/GettingStartedGuide.md](/src-ts/tools/dev-center/dev-center-pages/community-app/getting-started/GettingStartedGuide.md).

The local images for the markdown should be put in [/src-ts/tools/dev-center/images](/src-ts/tools/dev-center/images).
