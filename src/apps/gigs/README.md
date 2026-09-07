# Gigs

This sub-app ports the public community-app Gig Work flow into platform-ui:

- `/gigs`: open jobs, search by name/skills/country/duration, country filter,
  featured-first created/updated ordering, hotlist and ten jobs per result page.
- `/gigs/:slug`: compensation, location, duration, weekly hours, timezone,
  required skills, description, eligibility notes and application handoff.
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

## Data and behavior

`gigs.service.ts` uses the environment's community-app `/api/recruit` endpoints.
Public listings/details need no member token. Candidate lookup and applications
use the refreshed platform token. Applications preserve the existing multipart
`form`/`resume` contract and Recruit custom field IDs 1, 2, 13 and 14. A saved
resume may be reused; otherwise PDF/DOCX up to **8,000,000 bytes** is required to
match the server's multer limit. No success state appears without an explicit
`success: true` response. HTTP errors and Recruit error envelopes returned with
HTTP 200 both reject. Candidate lookup failures block prefill/submission and
expose a retry instead of being interpreted as new candidates.

Candidate Terms and the Equal Employment Opportunity Policy load on demand
from the existing Payload compatibility endpoint using the original modal IDs.
Descriptions and policy bodies are sanitized before display. Styling, scripts,
unsafe URLs and embedded form controls cannot affect the surrounding application.

Search, country, sort and page are URL parameters. Updating filters preserves
unrelated parameters such as `ref`, and resets the result page. Missing salary
metadata remains unspecified; zero is not mistaken for missing compensation.

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
  src/apps/gigs/src/components/GigApplicationForm.spec.tsx
```

The tests cover discovery rules, salary fallbacks, required fields, consent and
availability, upload limits, legacy payload mapping, HTTP-200 error envelopes,
expired authentication, prefill, submission retry and already-placed candidates.
Also verify the listing, detail and anonymous apply route against real Recruit
reads in a browser at desktop and mobile widths. Authenticated submission tests
use mocks so verification does not create real candidates or send recruiter
notifications. Deployment and domain routing are documented in
[`infrastructure/gigs-routing`](../../../infrastructure/gigs-routing/README.md).
