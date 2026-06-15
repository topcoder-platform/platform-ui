#!/bin/bash
# NOTE: DO NOT run this file directly,
# please run `yarn start` instead!

export ESLINT_NO_DEV_ERRORS=true
export HTTPS=true
export PORT=443
export REACT_APP_HOST_ENV=${REACT_APP_HOST_ENV:-dev}
export HOST=local.topcoder-dev.com
# Use polling for dev watchers to avoid exhausting inotify watcher slots in this monorepo.
export CHOKIDAR_USEPOLLING=${CHOKIDAR_USEPOLLING:-true}
export CHOKIDAR_INTERVAL=${CHOKIDAR_INTERVAL:-1000}
export WATCHPACK_POLLING=${WATCHPACK_POLLING:-1000}
# if [[ ! -e ./.environments/.env.local ]]; then
#     filename=.env.${REACT_APP_HOST_ENV:-dev}
#     cp ./.environments/$filename ./.environments/.env.local
# fi

yarn dev
