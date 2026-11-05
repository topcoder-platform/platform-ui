# Platform UI deployment

CircleCI validates every branch. Merges to `dev` build and publish the development
site. Merges to `master` build the production artifact and stop at `approve-prod`;
an operator must approve that workflow before `deploy-prod` can publish it.
Other branches and tags do not deploy. The production environment is named `prod`; its source branch is `master`.

## Authentication and configuration

The jobs use CircleCI OIDC V3 directly with AWS STS. They do not use an Auth0
client ID, a shared deployment role, static AWS keys, or Parameter Store.
Trust is restricted to this CircleCI project, repository, and both the checkout
and configuration branch. Separate empty CircleCI contexts enforce the same
project/branch restrictions and disallow SSH reruns and API-supplied configuration.

`config-dev`/`config-prod` can read only the exact S3 object version pinned in
the corresponding manifest. Its SHA-256 is checked before use. These are reviewed
browser settings: Filestack settings and read-only CMS delivery tokens, including
values that become public in the JavaScript bundle. Preview/admin tokens and
server secrets must never be added. The allowlist in `site.py` rejects other keys.

The build process receives those settings and a minimal environment, without AWS
credentials or OIDC tokens. A separate deploy role can publish only to the site's
S3 bucket and invalidate its CloudFront distribution. Both roles explicitly deny
Parameter Store, Secrets Manager, KMS decryption, role chaining, and object deletion.
IAM templates, permissions boundaries, and installation evidence live in the
private [v6-services-iac repository](https://github.com/topcoder-platform/v6-services-iac/tree/main/services/platform-ui).

Node, the AWS executor, and deployment helpers are pinned. The helpers use
`tc-deploy-scripts` v2.0.9, verified against commit
`dc06de730f068a230efa9d5f4d4d9c80782d3bfb`. `site.py` adds the static-site flow;
it does not invoke the ECS deployment command.

## Publishing and rollback

The build records the source revision, configuration digest, and every artifact
file's digest. Deployment checks these before assuming its role. It verifies the
CloudFront origin and requires S3 versioning, uploads assets first, and publishes
`asset-manifest.json`, `index.html`, and the `/gigs/index.html` alias last.
Old assets are retained. Hashed files under `static/` have long-lived caching;
entry points and other files require revalidation.

The job waits for CloudFront invalidation and checks that the public HTML matches
the approved artifact. If promotion or verification fails after entry-point
publication begins, it attempts to restore the previous entry points and invalidate
again. S3 versions retain the prior objects for operator recovery. A successful
job stores a deployment receipt with source, prior entry-point versions, and the
verified public HTML digest. Investigate failed rollback/invalidation before
retrying; a failed job is not evidence of a healthy site.

## First rollout

1. Merge this change to `dev` and verify the CircleCI release, login, CMS-backed
   pages, and `/gigs` routing at the development site.
2. Open and review a `dev` → `master` PR, including application changes since the
   production baseline. Merge it only after dev validation. This replaces the
   legacy workflow on `master` with the approved OIDC workflow.
3. The production build stops at `approve-prod`. Approve that job when ready to
   publish the reviewed artifact; merging alone does not publish production.
4. Retire shared credentials as part of the coordinated legacy-role removal.
   No separate `prod` branch is needed. Production OIDC trust, CircleCI context
   restrictions, the manifest and runtime branch validation all require `master`.

The new workflow replaces the old QA, arbitrary branch, and `dev-*` tag deployment
paths; `yarn deploy:dev` is removed. CMS and asset origins now follow
`REACT_APP_HOST_ENV`: production builds use production CMS resources.

To change browser configuration, an operator publishes a new reviewed JSON object
version, updates the build role and its boundary in private IaC, and updates the
manifest's version ID and SHA-256 in a reviewed application PR. CI cannot select
an arbitrary object or fetch server configuration.

## Validation

With the pinned helpers checked out at `/tmp/tc-deploy-scripts`:

```sh
python3 -m unittest discover -s deploy/tests -v
yarn install --frozen-lockfile --non-interactive
yarn lint
CI=true yarn test:no-watch --runInBand --watch=false --runTestsByPath \
  src/libs/cms/cms.client.spec.ts src/config/environments/react-env.spec.ts
```

The release build uses `python3 -I deploy/site.py build --manifest deploy/dev.json`
with the verified browser configuration and CircleCI source metadata. Local
application development continues to use the existing `.environments` setup.
