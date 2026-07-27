# Instructions For Running The Review Locally

### Build and run:

- Run this script to start the app, you may have to type the admin password for the `sudo` command:

```bash
nvm use
export NVM_DIR=~/.nvm
yarn install
sudo yarn start
```

- If you have any problem when running the above script, please check `README.md` in the root of the project for more info.
- After running successfully, please open `https://local.topcoder-dev.com/review` in the browser to start the admin app

### Configuration:

- Configuration files are under src/apps/review/src/config

### Mock data:

- Mock data files are under src/apps/review/src/mock-datas

### Winners result identity:

- The Winners tab loads every page from the Review API `projectResult` endpoint.
- Each final-placement winner is matched by normalized member ID and placement. The endpoint's
  `submissionId` is authoritative for display and download; another submission from the same
  member is never substituted based on score or recency.
- Local submission and review data may enrich the submitted date and reviews only when the local
  submission ID exactly matches the canonical ID. Missing or malformed canonical results are
  omitted safely.
- Canonical `PLACEMENT` winner types are shown. Untyped and contest-submission winner types remain
  supported for legacy challenge records, while checkpoint winner types are excluded.
