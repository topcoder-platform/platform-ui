export HTTPS=true&&SSL_CRT_FILE=ssl/cert.pem&&SSL_KEY_FILE=ssl/key.pem
export HOST=local.topcoder-dev.com
export REACT_APP_HOST_ENV=bsouza
nvm use
yarn react-app-rewired start
