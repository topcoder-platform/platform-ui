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
   [disnadiji in development](https://profiles.topcoder-dev.com/disnadiji) or
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

The 2026-10-21 follow-up verified [PR #2534](https://github.com/topcoder-platform/platform-ui/pull/2534)
(`df652a1b2`), which added the 24px offset, in `origin/dev` and on the live
development profile. The latest QA rejection (October 20 at 03:33 UTC)
preceded that PR's creation (04:35 UTC) and merge (21:04 UTC); no later QA
rejection was present when checked. Preserve this fix when retesting.

Fresh Chromium sessions, at 100% zoom, loaded these profile chunks:

| Environment | JavaScript | CSS |
| --- | --- | --- |
| Development | `/static/js/1717.7da82929.chunk.js` | `/static/css/1717.aa3db4d4.chunk.css` |
| Production | `/static/js/1717.c6a593de.chunk.js` | `/static/css/1717.1a1af487.chunk.css` |

On development's `disnadiji` profile, five hovers at each of 1280px and 375px
viewport widths, alternating the badge and audience label and including quick
re-entry, consistently measured a 24px offset, 8px box-to-card clearance, and
approximately 2.3px arrow-to-card clearance. The tooltip remained centered.
The current component also passed local browser checks for hidden initial
positioning and modal suppression/reopening at both widths.

Production's `wleite` profile still measured a 16px offset, zero box-to-card
clearance, and approximately 5.7px of arrow overlap on all five hovers at
1280px. The clearance commit was absent from `origin/master`. Production
therefore still needs the existing fix released through the normal deployment
process, followed by the same hover checks. This follow-up did not deploy or
change the working tooltip implementation. Asset names change between builds;
record the current loaded URLs when repeating verification.

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
