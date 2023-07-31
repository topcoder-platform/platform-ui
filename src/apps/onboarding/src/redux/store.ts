/**
 * Configure Redux Store
 */
import { applyMiddleware, compose, createStore } from 'redux'
import { createPromise } from 'redux-promise-middleware'
import thunk from 'redux-thunk'

import rootReducer from './reducers'

const middlewares: any = [
    // if payload of action is promise it would split action into 3 states
    createPromise({
        promiseTypeSuffixes: ['PENDING', 'SUCCESS', 'ERROR'],
    }),
    thunk,
]

// enable Redux Logger in in DEV environment
if (process.env.APPMODE !== 'production') {
    /* eslint-disable-next-line global-require, @typescript-eslint/no-var-requires */
    const { createLogger }: any = require('redux-logger')

    const logger: any = createLogger()
    middlewares.push(logger)
}

const store: any = createStore(rootReducer, compose(applyMiddleware(...middlewares)))

export default store
