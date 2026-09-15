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

## Legacy Reference

Original implementation reference:
- `work-manager/`
