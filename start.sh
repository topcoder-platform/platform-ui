#!/bin/bash
# NOTE: DO NOT run this file directly,
# please run `yarn start` instead!

export ESLINT_NO_DEV_ERRORS=true
export HTTPS=true
export HOST=local.topcoder-dev.com
export REACT_APP_HOST_ENV=${REACT_APP_HOST_ENV:-dev}
export PORT=443

# if [[ ! -e ./.environments/.env.local ]]; then
#     filename=.env.${REACT_APP_HOST_ENV:-dev}
#     cp ./.environments/$filename ./.environments/.env.local
# fi

yarn dev
