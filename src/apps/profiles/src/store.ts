/**
 * Configure Redux Store
 */
import { applyMiddleware, compose, createStore } from 'redux';
import promiseMiddleware from 'redux-promise';

import { EnvironmentConfig } from '~/config';

import { rootReducer } from './lib/redux';

const middlewares = [
  promiseMiddleware,
];

// enable Redux Logger in in DEV environment
if (EnvironmentConfig.ENV !== 'prod') {
  const { createLogger } = require("redux-logger");
  const logger = createLogger();
  middlewares.push(logger);
}

const store = createStore(rootReducer, compose(applyMiddleware(...middlewares)));
export default store;
