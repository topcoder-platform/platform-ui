# Gigs

This sub-app ports the public community-app Gig Work flow into platform-ui:

- `/gigs`: open jobs, search by name/skills/country/duration, country filter,
  featured-first created/updated ordering, hotlist and ten jobs per result page.
- `/gigs/:slug`: compensation, location, duration, weekly hours, timezone,
  required skills (displayed as `N/A` when Recruit has none), description,
  eligibility notes and application handoff. Entering a Gig detail route resets
  inherited list-page scroll so its header is always visible.
- `/gigs/:slug/apply`: sign-in with the full return URL, candidate prefill,
  resume upload, skill autocomplete/custom skills, weekly pay expectation,
  referral source, availability confirmations, policy dialogs and application
  submission/retry/success states. Already placed candidates and fulfilled jobs
  cannot apply. Profile and job changes remount the form so input cannot leak
  between members or gigs.

The app reuses platform navigation, profile/auth context, buttons, modal, spinner,
icons, skills autocomplete service, and the scoped 2026 design tokens. Figtree
headings, Nunito Sans body text, semantic surfaces/teal actions and responsive
cards follow the platform design system. The reference was the August 2026 Figma
file `C2cA6508RhpjWJDp7MLKbO`, Color page `1:54`, with design context retrieved
from `674:8828`. Layout retains the legacy listing/detail/form hierarchy while
adapting to the platform components. Styles apply only inside `.gigs-app`.
The listing search, location and sort controls use the same teal focused border
and ring as the other 2026 opportunity filters instead of inheriting the browser's
blue outline. Keyboard focus retains a real teal outline, with a system Highlight
fallback in forced color modes.
The Gig Work resources callout opens its external community guide in a new tab
with the opener relationship removed.

## Data and behavior

`gigs.service.ts` uses the environment's community-app `/api/recruit` endpoints.
Public listings, details and candidate lookup need no member token; candidate
lookup accepts both Recruit's current direct array and its legacy `{ data }`
envelope. Applications use the refreshed platform token and preserve the existing
multipart `form`/`resume` contract and Recruit custom field IDs 1, 2, 13 and 14. A saved
resume may be reused; otherwise PDF/DOCX up to **8,000,000 bytes** is required to
match the server's multer limit. Recruit's populated assignment response and its
idempotent `{ success: true }` response both confirm submission; empty, explicitly
unsuccessful, HTTP-error and HTTP-200 error-envelope responses reject. Candidate
searches return an existing profile from either
response shape. A bare `[]` or `{ data: [] }` means no existing candidate and
opens the application form with the member's Topcoder profile. Candidate lookup
failures still block prefill/submission and expose a retry.

Candidate Terms and the Equal Employment Opportunity Policy load on demand
from the existing Payload compatibility endpoint using the original modal IDs.
Descriptions and policy bodies are sanitized before display. Styling, scripts,
unsafe URLs and embedded form controls cannot affect the surrounding application.
Policy dialogs size to their content, center their titles and provide both the
standard dismiss icon and a visible Close action.

Search, country, sort and page are URL parameters. Updating filters preserves
unrelated parameters such as `ref`, and resets the result page. The selected
latest-added or latest-updated order applies to both the hotlist and the main
results. Missing salary metadata remains unspecified; zero is not mistaken for
missing compensation.
The detail sidebar's profile, correctly spelled Gig Work forum and opportunity
links open in a separate tab with opener isolation. Primary Gig navigation and
`mailto:` links retain their expected in-page and email-client behavior.

Members cannot track application status in this app. The listing and submission
confirmation do not link to My Gigs, and the app does not request application
counts or display application history. Submission confirmation directs members
back to the gigs list and explains that suitable applicants will be contacted
by email. The legacy UI's Optimizely experiments and Chatlio script are not included;
platform analytics and navigation remain owned by the shared shell.

## Verification

Use Node from `.nvmrc` and the repository's Yarn installation:

```sh
nvm use
yarn lint
yarn build
yarn test:no-watch --runInBand --watch=false --runTestsByPath \
  src/apps/gigs/src/gigs.utils.spec.ts \
  src/apps/gigs/src/gigs.service.spec.ts \
  src/apps/gigs/src/components/GigApplicationForm.spec.tsx \
  src/apps/gigs/src/pages/GigDetailsPage.spec.tsx \
  src/apps/gigs/src/pages/GigsPage.spec.tsx \
  src/apps/gigs/src/pages/GigApplyPage.spec.tsx
```

The tests cover discovery rules, detail-route scroll restoration, salary fallbacks, legacy validation copy,
required fields, consent and availability, upload limits, legacy payload mapping, Recruit assignment responses,
policy close actions, HTTP-200 error envelopes,
expired authentication, empty candidate search responses, candidate lookup retry,
prefill, submission retry and already-placed candidates.
Also verify the listing, detail and anonymous apply route against real Recruit
reads in a browser at desktop and mobile widths. Authenticated submission tests
use mocks so verification does not create real candidates or send recruiter
notifications. Deployment and domain routing are documented in
[`infrastructure/gigs-routing`](../../../infrastructure/gigs-routing/README.md).
