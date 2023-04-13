# NOTE: DO NOT run this file directly,
# please run `yarn start` instead!

export ESLINT_NO_DEV_ERRORS=true
export HTTPS=true
export SSL_CRT_FILE=ssl/server.crt
export SSL_KEY_FILE=ssl/server.key
export HOST=192.168.1.54
export PORT=443
yarn dev
