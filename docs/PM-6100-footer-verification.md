# PM-6100: universal navigation footer colors

Verified against `dev` at `9d879b43d` on 2026-09-13.

The reported green footer links are already corrected in this revision. The
ticket screenshot shows `/challenges` in the Work app. Both Work and Opportunities
load the shared 2026 foundations, so the investigation covers both layouts.

## Cause and existing fixes

The 2026 foundations originally applied `body.work-app a { color: #00797a; }`.
Because the universal footer is also inside `body`, that rule overrode the white
color inherited from the footer navigation sections.

- `cb108c147a` (2026-09-09, PM-6091) added the scoped
  `#footer-nav-el a:not([class*='cta'])` override for normal, hover, and keyboard
  focus states. It leaves the white CTA's dark text intact.
- `9321313974` (2026-08-15) placed Opportunities' theme on its content wrapper,
  `.opportunities-app.tc-2026`, and changed its body marker to
  `opportunities-page`. `AppFooter` is a sibling of the platform route container,
  so Opportunities' teal anchor default cannot select footer links.
- The explicit theme allowlist remains scoped when its stylesheet persists
  during client-side navigation. Removing only an import would not be sufficient.

No additional CSS override is needed on current `dev`.

## Verification

An isolated Chromium fixture compiled the actual shared reset, 2026 foundation,
and installed universal-navigation footer Sass. It retained the content/footer
sibling layout and the footer component's selectors. Checks at 1440 px and
390 px widths covered normal, hover, and focus states while changing the body
class from Opportunities to Work and back. All 18 checks passed:

| Element | Computed color |
| --- | --- |
| Opportunity content link | `rgb(0, 121, 122)` |
| Footer navigation link | `rgb(255, 255, 255)` |
| Footer CTA text | `rgb(11, 61, 86)` |

`yarn lint` and `NODE_OPTIONS=--max-old-space-size=16384 yarn run build`
also passed under Node 22.13.0. The initial build exhausted Node's default heap;
the larger heap completed the unchanged production build.

This verifies the CSS cascade and app scoping; it is not a live deployment test.
For release QA, open Work's challenge listing and Opportunities at desktop and
mobile widths, hover and keyboard-focus footer links, then navigate between the
apps without reloading. Footer links should remain white, content links teal,
and the "Talk to an expert" CTA should retain readable dark text.
