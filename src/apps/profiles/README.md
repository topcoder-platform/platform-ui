# Instructions for Running the Member Profiles Tool Locally

## Member Profiles

### Rating tooltip verification (PM-5266)

The accepted design keeps the standard tooltip arrow size. As agreed in the
[ticket](https://topcoder.atlassian.net/browse/PM-5266), the tooltip is centered
over the percentile text. The tooltip uses a 24 CSS pixel offset: 16px for the
card's top padding plus 8px of clearance above the card.

[PR #2477](https://github.com/topcoder-platform/platform-ui/pull/2477) used only
the 16px card padding. That left the box flush with the card and the arrow
overlapping it. The previous verification instructions checked the gap above
the badge and incorrectly treated zero clearance above the card as sufficient.
The later visibility fix prevented an unpositioned first mount, but did not
change that settled geometry. Following QA's October 20 report, check the
separation from the **card**, on every hover.

To check a deployed profile:

1. Open a rated member's profile, such as
   [wleite in production](https://profiles.topcoder.com/wleite), and hover over
   the `Top X%` badge or its audience label.
2. Check that the tooltip box's bottom edge sits 8 CSS pixels above the dark
   card's top edge. The unchanged standard arrow extends approximately 5.7px
   below the box, leaving approximately 2.3px of visible space above the card
   and 18.3px above the badge.
3. Check that the tooltip, badge, and audience label share a horizontal center,
   and that both tooltip lines are center-aligned. Repeat at a mobile viewport
   width. Compare at the same browser zoom; screenshot pixels can differ from
   CSS pixels.
4. Move the pointer away and hover again several times, including a quick
   re-entry. The first hover and later hovers should have the same geometry.
   The tooltip must remain hidden until react-tooltip has calculated its
   position and applied `react-tooltip__show`. The rating styles set opacity
   to zero otherwise, overriding the shared tooltip's default opacity. An
   unconditional `opacity: 1 !important` exposed the unpositioned first mount
   and bypassed the closing state, while later hovers reused a cached position.
5. Click the badge to open the rating information modal. The tooltip should
   disappear while the modal is open.

If development looks correct but production appears different, disable the
browser cache in the Network panel and reload. Inspect the profile JavaScript
and CSS chunks actually loaded by the page, rather than relying only on a
merged PR or a successful build. The rating tooltip should use `offset: 24`
and `place: 'top'`; the percentile wrapper should use `align-items: center` and
`justify-self: start`; the tooltip content should use `text-align: center`.
Check both the production build and deployment jobs before treating a merge as
a deployed fix. Record the URL, viewport, zoom, loaded asset URLs, and a hover
screenshot if the checks above fail.

On 2026-10-16, the follow-up investigation found the original fix in both
`origin/dev` and `origin/master`, and the two environments served identical
profile chunks:

| Asset | Path on both profile hosts |
| --- | --- |
| JavaScript | `/static/js/1717.c6a593de.chunk.js` |
| CSS | `/static/css/1717.1a1af487.chunk.css` |

These historical assets contained the original 16px offset and centering rules,
not the current 24px clearance fix. The production
[build](https://circleci.com/gh/topcoder-platform/platform-ui/18023) and
[deployment](https://circleci.com/gh/topcoder-platform/platform-ui/18024) for
`c436bc10d` succeeded on October 15. Asset names change on subsequent builds;
use the page's current Network requests when repeating this check. This
confirms the original assets were available in production, but does not establish
which assets QA's browser loaded when the issue was reported.

Run the existing focused regression tests from the `platform-ui` project root:

```sh
nvm use
CI=true yarn test:no-watch --runInBand Tooltip.spec.tsx MemberRatingCard.spec.tsx MemberRatingCard.styles.spec.ts
```

The rating card regression uses the real shared Tooltip and react-tooltip
event handling, with Floating UI layout and observers mocked for jsdom. It
checks the 24px offset reaches positioning on repeated hovers and after closing
the rating modal. The shared tooltip tests preserve the default for other
tooltips. The stylesheet test
compiles the shared and rating SCSS and checks computed opacity before opening
and across repeated open/close states. Jest mocks layout, so the deployed visual
checks above are also required for QA.
