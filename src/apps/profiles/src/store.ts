/**
 * Configure Redux Store
 */
import { applyMiddleware, compose, createStore, Middleware, Store } from 'redux'
import { createLogger } from 'redux-logger'
import promiseMiddleware from 'redux-promise'

import { EnvironmentConfig } from '~/config'

import { rootReducer } from './lib/redux'

const middlewares: Middleware[] = [
    promiseMiddleware,
]

// enable Redux Logger in in DEV environment
if (EnvironmentConfig.ENV !== 'prod') {
    const logger: Middleware = createLogger()
    middlewares.push(logger)
}

const store: Store = createStore(rootReducer, compose(applyMiddleware(...middlewares)))
export default store
