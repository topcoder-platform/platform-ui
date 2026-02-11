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

`config/routes.config.ts` contains route ids and the `rootRoute` resolver based on the active subdomain.

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
