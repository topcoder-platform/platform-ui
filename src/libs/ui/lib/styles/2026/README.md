# Topcoder 2026 styles

This folder contains the scoped foundations for the August 2026 Topcoder design
system. The shared theme is imported only by the internal Work, System Admin,
Calendar, Procurement, and Reports applications, plus Support, Opportunities,
and Gigs.

Engagements, the Copilots Portal, Review, and other non-migrated apps do not opt
into these shared foundations. Their existing app and component styles continue
to apply. Importing `_tokens.scss` alone supplies Sass values without applying
the shared theme.

`_tokens.scss` is the source for the 2026 color, type, radius, and elevation
tokens. `_scope.scss` exposes matching custom properties and base element styles
under explicit internal app and Support body classes, and the low-specificity
`:where(.opportunities-app)` and `:where(.gigs-app)` content containers.
Opportunities and Gigs must not apply their theme classes to `body`, so their
shared navigation retains the legacy styles.

Keep the allowlist explicit: adding an unscoped `body`, heading, form, or table
rule would change apps that must remain on the legacy platform-ui style system.
Removing an app's import alone is insufficient because another app can load the
shared stylesheet and leave it active after client-side navigation. Apps outside
the rollout must also be absent from `_scope.scss`.

Application component styles should prefer the `--tc-2026-*` custom properties
when a runtime value is useful, or import `_tokens.scss` for Sass calculations.
Figtree is reserved for headings and labels; Nunito Sans is the body and control
font.
