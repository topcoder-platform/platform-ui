export HTTPS=true
export SSL_CRT_FILE=ssl/server.crt
export SSL_KEY_FILE=ssl/server.key
export HOST=local.topcoder-dev.com
source ~/.nvm/nvm.sh
nvm use
yarn react-app-rewired start
