# Public forums

The Forums app is available at `/forums` on the platform host and at `/` when
`EnvironmentConfig.SUBDOMAIN` is `forums`. Its single domain root contains the
category and thread routes so deep links work on both hosts. `ForumsApp` renders
the child routes through the platform router context, matching the sub-app routing
contract (a bare React Router `Outlet` does not render these declarations). Hosting must serve
the Platform UI SPA for the forums hostname and its nested routes.

The design source is [Forums in Figma](https://www.figma.com/design/I45k1Djt2XkYY692wopp3C/Forums?node-id=14382-6451).
The pages use Figtree headings and Nunito Sans body text, the 1200 px page width,
280 px sidebar, 32 px column gap, 32/40 px title typography, supplied Figma SVG
assets, and the existing universal header/footer. Forum controls use a scoped
border-box reset so their Figma dimensions do not depend on another app's CSS.
Typography and paragraph defaults use low-specificity selectors so shared card
titles, action buttons, and Markdown keep their own styles. Mobile stacks the
sidebar and content at 767 px, uses 28/36 px headings, and shows the compact
breadcrumb and category creation card on thread pages. Desktop headings remain
32/40 px. My Drafts is intentionally omitted.

`ForumsPage` renders the category index, category topic list, search, Watching,
thread details and creation flow. The index hides the migrated **Legacy forums**
root (every category the forums API Jive migration authored as
`legacy-jive:migration`) and instead shows a sidebar card linking to `/legacy`
(`legacyForumsPath`, `/forums/legacy` on the platform host). `ForumsPage` with the
`legacy` prop renders that archive: the root's namespace groups without the root
header, with the content-less `Jive / Jive2` wrapper replaced by its own groups,
and a sidebar card linking back to the current forums. Breadcrumbs and the back
button on archived categories return to `/legacy` rather than to the hidden
wrapper. Searching from the archive runs on the main index because the API
searches every forum. It reads `/v6/forums/public/categories` and
`/v6/forums/public/topics`; normal topic/post commands are shared with challenge
forums. Search, pagination, watches and category visibility are enforced by the
API. Authenticated response cache keys include the member ID and roles. Legacy
non-login author IDs retain their handle/initials and are excluded from numeric
member-profile lookup batches.

Guest pages require no login. Interaction controls send guests through the
existing login flow with the current URL as their return location. Signed-in
members see creation/reply controls according to API permissions; locks still
apply. Author editing, administrator deletion, announcements, reactions and
watching use the existing services rather than separate public implementations.

The exported `ForumMember`, `ParticipantGroup`, `ForumTopicCard`,
`ForumTopicView`, `ForumTopicEditModal` and `MarkdownEditor` components in
Opportunities are shared. Public detail uses `contentOnly` to supply its own
Figma header/sidebar and `onSignIn`/`onWatch` callbacks for guest interaction and
thread-wide watching. This keeps rated handles, mentions, nested replies,
quoting, sanitized Markdown, previews and moderation behavior consistent.

The common Markdown toolbar also supports headings, lists, strike-through,
restricted text sizes/alignment, links, images, tables, mentions and expanding
the editor. `uploadForumAttachment(file)` uses the existing environment's
Filestack API key/CNAME/security configuration, enforces a 25 MiB limit and
returns escaped Markdown using an HTTPS URL. Files upload when selected; failures
stay beside the editor. Raster image formats render inline; SVG/other files use
download links. A deployment must supply a valid `FILESTACK_API_KEY` (and the
existing security policy/signature where required). Imported attachment links
continue to use their original Filestack URLs.

Deploy the companion forums-api-v6 public-forums change before enabling this
app. It adds inherited category permissions, optional public reads, catalog
endpoints and the insert-only Vanilla migration. A denied category must remain
denied in the API even when a user enters its URL directly.

From this project folder, run `nvm use`, `yarn lint`, `yarn run build`, and:

```sh
CI=true yarn test:no-watch --runInBand \
  --testPathPattern='ForumsApp.spec|ForumsPage.spec|forums.routes.spec|ChallengeForum.spec|ForumMarkdown.spec|forum.service.spec|forum-attachments.service.spec|forum-mention|member-profile.service'
```

On memory-constrained build runners use `NODE_OPTIONS=--max-old-space-size=8192`
for the production build. Before production cutover, compare the index,
category, thread and composer screens in a connected desktop/mobile browser;
verify guest login return paths and real Filestack uploads with configured keys.
