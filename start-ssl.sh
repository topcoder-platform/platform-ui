export HTTPS=true
export SSL_CRT_FILE=ssl/server.cert
export SSL_KEY_FILE=ssl/server.key
export HOST=local.topcoder-dev.com
export PORT=3003
export REACT_APP_HOST_ENV=default
nvm use
yarn react-app-rewired start
