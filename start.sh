#!/bin/bash
# NOTE: DO NOT run this file directly,
# please run `yarn start` instead!

export ESLINT_NO_DEV_ERRORS=true
export HTTPS=true
export SSL_CRT_FILE=ssl/server.crt
export SSL_KEY_FILE=ssl/server.key
export HOST=local.topcoder-${REACT_APP_HOST_ENV:-dev}.com
export PORT=443

# if [[ ! -e ./.environments/.env.local ]]; then
#     filename=.env.${REACT_APP_HOST_ENV:-dev}
#     cp ./.environments/$filename ./.environments/.env.local
# fi

yarn dev
