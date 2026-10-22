# DEV Machine Access

The `machine-access` administrator route and tab appear only with an explicit
`dev`/`local` environment on a DEV hostname. Production has neither route nor tab,
and the API adapter independently rejects production use. The fixed backend is
`https://keycloak.topcoder-dev.com/m2m/admin`; member sign-in stays on the existing
Auth0 session. The backend verifies Administrator permission on every request.

The page lists clients, allows metadata and approved/default scope edits, creates
catalog scopes, replaces credentials, disables clients, and displays audit
intent/outcome records. Defaults must be a subset of allowed scopes. Mutation
requests include a reason, current revision, and idempotency key. Concurrent edits
return conflict; pending/failed operations are shown without claiming completion.

New secrets appear once in a component-local panel. They are not placed in URLs,
local/session storage, logs, or application analytics. Dismissing/leaving the page
removes the value. Credential replacement returns a new client ID with identical
saved grants and a 24-hour overlap; update both ID and secret in the workload.
Disablement blocks new issuance. Already-issued JWTs can remain valid for up to
15 minutes plus clock skew. There is no automatic Auth0 fallback.

`machineRequest` uses the existing auth initialization flow, a fixed HTTPS origin,
no cookies, no response caching, a bounded timeout, and sanitized error messages.
It keeps raw HTTP/provider errors out of telemetry. Backend operations and recovery
are documented in `keycloak-dev-v6/m2m/README.md` in the migration workspace.

Validation: use `nvm use`, `yarn lint`, and `yarn run build`. For this large app,
`NODE_OPTIONS=--max-old-space-size=8192 GENERATE_SOURCEMAP=false LOGICAL_ENV=dev`
was used for the successful build. Targeted tests cover environment/host gating,
allowed/default scopes, one-time secret dismissal, explicit disable confirmation,
audit reasons, and the existing admin tab navigation. The browser integration was
unavailable in this session, so interactive visual QA remains a manual review item.

No production configuration or existing application service deployment is changed
by this branch. Merge `keycloak_m2m` into DEV after reviewing the new route. Existing
admin tab order and landing behavior are preserved.

Permission names preserve exact case and support existing bare grants such as `auth0`,
including `read:usersRole` and `challengesRAG:admin`. Catalog names and client
grants remain exact matches; whitespace and wildcards are rejected.
