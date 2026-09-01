# Topcoder 2026 styles

This folder contains the scoped foundations for the August 2026 Topcoder design
system. It is imported only by Opportunities and the explicitly migrated Work,
Review, Support, System Admin, Calendar, Copilots, Engagements, Procurement, and
Reports applications.

`_tokens.scss` is the source for the 2026 color, type, radius, and elevation
tokens. `_scope.scss` exposes matching custom properties and base element styles
under explicit app body classes. Keep those selectors explicit: adding an
unscoped `body`, heading, form, or table rule would change apps that must remain
on the legacy platform-ui style system.

Application component styles should prefer the `--tc-2026-*` custom properties
when a runtime value is useful, or import `_tokens.scss` for Sass calculations.
Figtree is reserved for headings and labels; Nunito Sans is the body and control
font.
