# Gigs routing

The public routes `/gigs` and `/gigs/*` belong to platform-ui. Both apex and `www`
website aliases use the same website CloudFront distribution. This additive
CloudFormation change preserves the site's apex-to-www redirect, including encoded
and repeated query parameters. On the canonical host, it serves the platform-ui
S3 `gigs/index.html` with a signed origin request. The browser retains its path and query, so React handles listing,
details, and applications. Other routes, particularly `/api/recruit/*` and the
Payload compatibility API, retain their existing origins. The website's existing
`/static/*`, `/global.css`, and manifest handoffs serve the platform assets.

`route-template.py` transforms the **current** website stack template instead of
checking a stale copy of that stack into this repository. It adds two exact path
behaviors, one S3 origin, an origin access control, and a small request function.
`prepare.py` discovers the platform bucket and validates the environment, then
writes local before/after templates, policies and a manifest. `apply.py` checks
for stale state and limits execution to the reviewed routing resources. Python 3,
PyYAML, and AWS CLI are required. Use a session for the intended account. Never
commit credentials or generated account snapshots.

The deployment pipeline copies its built shell to `gigs/index.html` only after
the normal asset deployment and platform invalidation finish. This keeps the
uncached Gigs route on a complete release while the existing deployment script
uploads the next release's assets. The website needs no shell invalidation for
subsequent UI releases. Keep the dedicated shell when pruning old build files.

## Release sequence

1. Run platform-ui lint, build, Gigs tests and browser checks. Publish the `gigs`
   branch, open its PR to `dev`, and deploy the resulting platform-ui build using
   the existing deployment pipeline. The routing must not move until that build
   actually includes the Gigs routes. Production needs its production build and
   credentials; do not reuse a development build or session.
2. Prepare the routing artifacts with the account's website stack and platform
   distribution. Development uses `topcoder-website-dev` and `EFA7R1KH3UX5M`:

   ```sh
   python3 infrastructure/gigs-routing/prepare.py \
     --stack topcoder-website-dev --platform-distribution EFA7R1KH3UX5M \
     --output /tmp/gigs-routing-plan
   python3 -c 'import json; p="/tmp/gigs-routing-plan/"; open(p+"template-deploy.json","w").write(json.dumps(json.load(open(p+"template-after.json")),separators=(",",":")))'
   aws cloudformation create-change-set --stack-name topcoder-website-dev \
     --change-set-name gigs-routing --change-set-type UPDATE \
     --template-body file:///tmp/gigs-routing-plan/template-deploy.json \
     --parameters file:///tmp/gigs-routing-plan/parameters.json \
     --capabilities CAPABILITY_NAMED_IAM
   ```

3. Inspect `describe-change-set`. Expected changes are the two new Gigs resources,
   the website distribution (no replacement), and its derived distribution-domain
   SSM parameter. Existing API functions, bucket policies, roles, and the original
   viewer functions must not change. The separate platform-bucket grant allows
   the website distribution to read **only `gigs/index.html`**, preserving all existing
   grants and the deny-insecure-transport statement.
4. Execute the reviewed plan after the platform release is verified:

   ```sh
   python3 infrastructure/gigs-routing/apply.py \
     --artifacts /tmp/gigs-routing-plan --changeset gigs-routing
   aws cloudformation describe-stacks --stack-name topcoder-website-dev \
     --query 'Stacks[0].StackStatus'
   aws cloudfront create-invalidation --distribution-id E3P6DRXC192WA \
     --paths '/gigs' '/gigs/*'
   ```

5. Wait for `UPDATE_COMPLETE`, CloudFront `Deployed`, and invalidation completion.
   Verify HTTPS apex and `www` `/gigs`, `/gigs/`, a real job, its `/apply` URL, and
   a search query. Check that the shell and its referenced JS/CSS all return 200
   with the expected content types (an HTML fallback is not a valid JS response),
   browser routing works, a fulfilled gig is not applicable, and `/api/recruit/jobs`
   still returns JSON. Check an unrelated website page and `/opportunities`.

The website stack is the infrastructure owner. Apply this same transform to its
source template when updating that stack from topcoder-website; a future stack
update from an older template would otherwise remove the Gigs routing resources.
Routine website content releases do not replace the stack template.

## Rollback

Create and inspect a CloudFormation change set using `template-before.json` and
`parameters.json`, then execute it and wait for completion. Restore the platform
bucket's `bucket-policy-before.json` only after comparing the current policy with
the prepared after-policy; if other grants changed, remove only the matching
`AllowWebsiteGigsPublishedShell` statement. Invalidate `/gigs` and `/gigs/*` again. This
restores the community-app handoff without removing platform assets or changing
Recruit data. Preserve prior platform deployment artifacts for application-level
rollback using the normal deployment process.

## Checks

```sh
nvm use
python3 -m unittest discover -s infrastructure/gigs-routing -p 'test_*.py'
```

The transform tests prove route isolation, preservation of existing behaviors,
idempotency, rejection of conflicting route ownership, and canonical redirects
without losing or double-encoding query parameters. The request test uses Node
from `.nvmrc` to execute the generated edge handler. The change-set review
and live browser checks remain necessary because unit tests cannot prove an AWS
account's actual deployment state.
