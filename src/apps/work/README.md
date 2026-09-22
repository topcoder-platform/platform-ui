# Work App

The Work app provides work management capabilities for:
- challenges
- projects
- TaaS engagements
- users
- groups

## Routing

`work-app.routes.tsx` defines the app root and child routes:
- `challenges`
- `projects`
- `taas`
- `users`
- `groups`
- `role-error` (shown when the user is authenticated but missing a required Work role)
- root-level authentication and role restriction for Work Manager access

`config/routes.config.ts` contains route ids and the `rootRoute` resolver based on the active subdomain.

## Navigation styles

The Work subnavigation uses regular black text and a bold active item on desktop
and mobile. Project section tabs use black text with a bold teal active label and
underline. These component styles override the shared theme's general link color.
System Admin dropdown links similarly inherit their menu row color: black by
default and white on a teal hover background.

## Providers

`WorkApp.tsx` composes these providers:
- `WorkAppContextProvider`: authentication token and derived role/access flags
- `SWRConfigProvider`: shared SWR fetch configuration for the app

## Extending The App

1. Add feature routes under `work-app.routes.tsx` children.
2. Implement pages/components inside `src/lib` or feature folders.
3. Reuse `WorkAppContext` and `SWRConfigProvider` for shared state/data access.

## Private engagement assignments

The engagement editor autosaves while the form is dirty and valid, and it also
reseeds itself whenever the page hands it a freshly fetched engagement. Both
paths call `reset()`, which replaces every form value with the API's view of the
engagement.

A private engagement's member slots are filled in two steps: pick a member in a
slot, then complete that member's assignment details in the Assign Member
dialog. Until the details exist, the API has nothing to return for the slot, so
an unguarded `reset()` in the middle of that flow erases the handle the user just
picked and the member can never be added.

`EngagementEditorForm` therefore:

- suspends autosave and defers engagement-driven resets while
  `EngagementPrivateSection` reports its Assign Member dialog as open, and
- runs `mergePendingAssignmentSlots()` on every reset so a slot whose member is
  not yet represented in the saved engagement survives the round trip.

The deferred reset is applied once the dialog closes, but only when the incoming
engagement, lead prefill, or project actually changed, so closing the dialog
never discards unrelated edits.

## Legacy Reference

Original implementation reference:
- `work-manager/`

## Sales

The Sales tab opens the read-only Salesforce report for Administrators and Talent
Managers. It is also available on the dedicated Sales host. Search, column
filters, sorting, pagination and refresh use `reports-api-v6`; all edits remain
in Salesforce. See [Sales app documentation](../sales/README.md).
