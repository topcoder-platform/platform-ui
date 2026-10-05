
## Website publishing

Administrators can open **Website Publishing** and select **Publish Website** after approved
content has been promoted and published in the target CMS. The page calls the CMS publication
endpoint using the existing Topcoder bearer token. Production platform-ui uses the production CMS;
other app environments use the development CMS. The server fixes the website project and branch.
No CircleCI credential is stored in the browser.

The page disables repeated requests while a publication is active, polls the actual workflow
status, and remembers its pipeline ID for the browser session so reloads resume observation.
A successful queue response does not mean deployment succeeded. A workflow failure remains visible
with a details link. If submission fails with an uncertain response, check CircleCI before retrying.

This action publishes changed routes and shared artifacts, including removals. It does not copy
content between CMS environments or publish editorial drafts. A website code change or missing
baseline requires an engineer to run one full release. Setup requires the companion CMS's
`WEBSITE_CIRCLECI_TOKEN`, `EnableWebsitePublishing` infrastructure setting and exact system-admin
origin in `PAYLOAD_CORS_ORIGINS`. The page reports when publishing is disabled.
