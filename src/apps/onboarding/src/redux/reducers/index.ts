/**
 * Root Redux Reducer
 */
import { combineReducers } from 'redux'

import memberReducer from './member'

// redux root reducer
const rootReducer: any = combineReducers({
    member: memberReducer,
})

export default rootReducer
