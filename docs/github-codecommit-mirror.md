# GitHub backup mirror to AWS CodeCommit

The [`codecommit-mirror.yml`](../.github/workflows/codecommit-mirror.yml) workflow maintains a secondary Git copy of `topcoder-platform/platform-ui` in a dedicated AWS CodeCommit repository. It is disabled until the repository variable `CODECOMMIT_MIRROR_ENABLED` is set to `true`.

AWS returned CodeCommit to full general availability, including new customers, on 24 November 2025. See [The Future of AWS CodeCommit](https://aws.amazon.com/blogs/devops/aws-codecommit-returns-to-general-availability/).

## Provisioned status

The tenant setup was completed on 24 August 2026:

-   The dedicated `platform-ui` CodeCommit repository exists in `us-east-1` with `dev` as its default branch.
-   The AWS account has the GitHub Actions OIDC provider and the `GitHubActionsPlatformUiCodeCommitMirror` role with the repository-scoped `PlatformUiCodeCommitMirrorAccess` policy.
-   All four GitHub repository variables are configured, including `CODECOMMIT_MIRROR_ENABLED=true`.
-   The initial mirror was seeded directly from GitHub and all branch and tag object IDs were verified.

The remaining activation step is to commit this workflow and merge it into GitHub's `dev` default branch. The enabled variable is inert until GitHub contains the workflow file.

## What the workflow does

For every GitHub push to a branch or tag, the workflow:

1. Fetches the complete GitHub history for all branches and tags.
2. Uses GitHub OpenID Connect (OIDC) to assume a narrowly scoped AWS IAM role. No long-lived AWS access key is stored in GitHub.
3. Force-updates all CodeCommit branch and tag refs to the exact Git object IDs held by GitHub.
4. Sets the CodeCommit default branch to the GitHub default branch.
5. Removes CodeCommit branches and tags that no longer exist in GitHub.
6. Fails the run if the final branch or tag object IDs differ between the two repositories.

Runs are serialized so that an older run cannot finish after a newer run and move the mirror backwards. A full reconciliation also runs every six hours and can be started manually. This catches current refs after skipped Actions, pushes made with GitHub's workflow token, or pushes to an older branch that does not contain the workflow file.

The first successful run seeds the entire repository. Later runs still fetch the complete GitHub repository on a fresh runner, but Git sends CodeCommit only objects that the destination does not already have.

## One-time setup reference

These steps are complete for the current deployment. Use them only when auditing or rebuilding the integration. The target is destructive by design: it must be a dedicated mirror, because branches and tags that exist only in CodeCommit will be deleted.

### 1. Create the CodeCommit repository

Choose the AWS account, supported AWS Region, and repository name. `platform-ui` is the recommended repository name. Create it without an initial README or other content where possible.

For example, with an authenticated AWS CLI:

```bash
aws codecommit create-repository \
  --region <AWS_REGION> \
  --repository-name platform-ui \
  --repository-description "Read-only mirror of topcoder-platform/platform-ui"
```

Do not use this CodeCommit repository for development or CodeCommit pull requests. GitHub is the source of truth and the next synchronization can overwrite or delete CodeCommit refs.

### 2. Add GitHub as an AWS OIDC identity provider

If the AWS account already has the GitHub Actions OIDC provider, reuse it. Otherwise, in IAM add an OpenID Connect provider with:

-   Provider URL: `https://token.actions.githubusercontent.com`
-   Audience: `sts.amazonaws.com`

GitHub documents the AWS setup in [Configuring OpenID Connect in Amazon Web Services](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws).

### 3. Create the IAM mirror role

Create a role such as `GitHubActionsPlatformUiCodeCommitMirror`. Replace `<AWS_ACCOUNT_ID>` in this trust policy. The policy accepts both GitHub's legacy repository-name subject and its immutable repository-ID subject. The IDs shown are the stable IDs for the existing `topcoder-platform/platform-ui` repository and its owner.

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "TrustPlatformUiGitHubActions",
            "Effect": "Allow",
            "Principal": {
                "Federated": "arn:aws:iam::<AWS_ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com"
            },
            "Action": "sts:AssumeRoleWithWebIdentity",
            "Condition": {
                "StringEquals": {
                    "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
                },
                "StringLike": {
                    "token.actions.githubusercontent.com:sub": [
                        "repo:topcoder-platform/platform-ui:ref:refs/*",
                        "repo:topcoder-platform@25333036/platform-ui@462526084:ref:refs/*"
                    ]
                }
            }
        }
    ]
}
```

Attach the following permissions policy after replacing `<AWS_REGION>`, `<AWS_ACCOUNT_ID>`, and `<CODECOMMIT_REPOSITORY>`. `GitPull` is required for the final object-ID verification, `GitPush` synchronizes Git data, and `UpdateDefaultBranch` keeps the repository metadata aligned.

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "SynchronizePlatformUiMirror",
            "Effect": "Allow",
            "Action": [
                "codecommit:GitPull",
                "codecommit:GitPush",
                "codecommit:UpdateDefaultBranch"
            ],
            "Resource": "arn:aws:codecommit:<AWS_REGION>:<AWS_ACCOUNT_ID>:<CODECOMMIT_REPOSITORY>"
        }
    ]
}
```

Do not attach a broad managed CodeCommit policy. This role needs access to only the single mirror repository. Anyone able to modify and push a workflow on an allowed `platform-ui` ref can request this role, so its permissions must remain mirror-only.

### 4. Configure GitHub repository variables

In `topcoder-platform/platform-ui`, open **Settings > Secrets and variables > Actions > Variables** and create these repository variables:

| Variable                       | Example                                                                  | Purpose                                     |
| ------------------------------ | ------------------------------------------------------------------------ | ------------------------------------------- |
| `CODECOMMIT_MIRROR_AWS_REGION` | `us-east-1`                                                              | Region containing the CodeCommit repository |
| `CODECOMMIT_MIRROR_REPOSITORY` | `platform-ui`                                                            | CodeCommit repository name                  |
| `CODECOMMIT_MIRROR_ROLE_ARN`   | `arn:aws:iam::123456789012:role/GitHubActionsPlatformUiCodeCommitMirror` | OIDC role assumed by the workflow           |

These values identify AWS resources but are not credentials, so repository variables are appropriate. No GitHub Actions secrets are required.

For a new deployment, leave `CODECOMMIT_MIRROR_ENABLED` unset while creating and reviewing the infrastructure. After this workflow is present on the GitHub default branch and the three variables above are correct, add:

| Variable                    | Value  |
| --------------------------- | ------ |
| `CODECOMMIT_MIRROR_ENABLED` | `true` |

Setting this last prevents expected failures while setup is incomplete. The value is case-sensitive.

The same setup can be performed with GitHub CLI by an administrator:

```bash
gh variable set CODECOMMIT_MIRROR_AWS_REGION \
  --repo topcoder-platform/platform-ui \
  --body <AWS_REGION>
gh variable set CODECOMMIT_MIRROR_REPOSITORY \
  --repo topcoder-platform/platform-ui \
  --body platform-ui
gh variable set CODECOMMIT_MIRROR_ROLE_ARN \
  --repo topcoder-platform/platform-ui \
  --body arn:aws:iam::<AWS_ACCOUNT_ID>:role/GitHubActionsPlatformUiCodeCommitMirror
gh variable set CODECOMMIT_MIRROR_ENABLED \
  --repo topcoder-platform/platform-ui \
  --body true
```

### 5. Seed and verify the mirror

After enabling, open **Actions > Mirror GitHub to AWS CodeCommit > Run workflow** and run it from the default branch. The first run may take longer because it transfers the existing history and all current refs.

A successful run verifies every `refs/heads/*` and `refs/tags/*` object ID itself. Also confirm in CodeCommit that:

-   the default branch matches GitHub;
-   expected active branches and tags are present; and
-   the latest default-branch commit ID matches GitHub.

The push that adds this workflow can run it automatically if the variables were enabled first. A manual run is still recommended as the explicit acceptance check.

## Ongoing operation

-   Treat a failed **Mirror GitHub to AWS CodeCommit** run as a backup warning. It does not roll back or block the original GitHub push.
-   The next push or six-hour reconciliation attempts a complete repair, so retries are safe.
-   Use **Run workflow** for an immediate repair or after changing AWS configuration.
-   Keep the two third-party Actions pinned to reviewed commit SHAs. Review and update those pins deliberately when upgrading.
-   If the repository is renamed, transferred, or opts into GitHub immutable OIDC subjects, verify the IAM role's `sub` conditions before the next run. The current trust policy already includes the present immutable owner and repository IDs.
-   If the GitHub default branch changes, no manual CodeCommit change is needed; the next successful run updates it.

## Scope and recovery limitations

This is an exact secondary Git repository, not a point-in-time archive:

-   Branch deletion, tag deletion, tag movement, and force-pushes are reproduced in CodeCommit. Commits left unreachable by all mirrored refs are not guaranteed to remain recoverable indefinitely.
-   A commit pushed and then made unreachable before any workflow or reconciliation fetches it can be missed. Protect important branches against deletion and force-pushes if historical retention is required.
-   Only Git branches, Git tags, commits, trees, and ordinary Git blobs are mirrored. GitHub pull requests, issues, discussions, releases, Actions logs/artifacts, branch protections, repository settings, and secrets are outside the scope.
-   Git LFS pointer files are Git blobs, but their external LFS objects are not copied by a normal Git push. Add a separate LFS/object-storage backup before adopting LFS.
-   The workflow does not copy provider-specific internal refs such as GitHub pull-request refs.

If the requirement changes from a warm Git replica to immutable, point-in-time retention, add a separate scheduled `git bundle` archive in versioned/object-locked storage rather than changing this mirror's destructive synchronization semantics.

For disaster recovery, an administrator with CodeCommit read access can clone the CodeCommit repository and push its branches and tags to a new GitHub repository. Keep the CodeCommit repository and the mirror IAM role under the normal AWS backup-access and break-glass procedures.
