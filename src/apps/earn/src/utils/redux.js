/**
 * Redux-related helpers.
 */

 import _ from 'lodash';
 import promiseMiddleware from 'redux-promise';
 import { applyMiddleware, createStore } from 'redux';
 import { createActions, handleActions } from 'redux-actions';
 import { connect } from 'react-redux';
  
 /**
  * Reduce multiple reducers into a single reducer from left to right.
  * Function-type reducers will be called directly with current state, and action
  * Object type reducers (eg: `{submissions: (state, action) => {}}`)
  *   will be called with the state's slice corresponding to object's key
  *   eg: `{submissions}` will be called with `submissions(state.submissions, action)`
  *
  * @params {function|Object} the reducers to be combined
  * @return function the unified reducer
  */
 /* TODO: Can we simplify this function? */
 export function combineReducers(...reducers) {
   return (state, action) => {
     const nextState = {};
     const mergeState = Object.assign.bind(Object, nextState);
 
     reducers.forEach((reducer) => {
       if (typeof reducer === 'function') {
         return mergeState(reducer(state, action));
       }
 
       Object.keys(reducer).forEach((slice) => {
         mergeState({ [slice]: reducer[slice]((state || {})[slice], action) });
       });
       return undefined;
     });
 
     return nextState;
   };
 }
 
 /**
  * Helps to proxy actions. This function has two modes:
  *
  * 1. **When no `action` is given:** it re-generates payload creator used by
  *    `actionCreator`; i.e. it returns a function that passes its arguments
  *    to the given `actionCreator`, and then returns `payload` of the
  *    created action.
  *
  * 2. **When `action` is given:** it returns a copy of `action` with its type
  *    replaced by the type of `actionCreator`.
  *
  * @param {Function} actionCreator Creator of the proxied action. It is assumed
  *  that it creates a Flux Standard Action.
  * @param {Action} action Optional. Action to map.
  * @return {Function|Action} Payload creator, or the mapped action.
  */
 export function proxyAction(actionCreator, action) {
   if (action) return { ...action, type: actionCreator.toString() };
   return (...args) => actionCreator(...args).payload;
 }
 
 /**
  * Wraps given reducer with a piece of code that changes the type of incoming
  * action to the type of action created by the given `actionCreator`.
  * @param {Function} reducer
  * @param {Function} actionCreator
  * @return {Reducer}
  */
 export function proxyReducer(reducer, actionCreator) {
   return (state, action) => reducer(state, proxyAction(actionCreator, action));
 }
 
 /**
  * Given any Flux Standard Action (FSA) with promise as the payload, it returns
  * a promise which resolves into the FSA result object.
  * @param {Object} action
  * @return Promise which resolves to the operation result.
  */
 export function resolveAction(action) {
   return action.payload.then(data => ({
     ...action,
     payload: data,
   }), error => ({
     ...action,
     payload: error,
     error: true,
   }));
 }
 
 /**
  * Given a mapping between reducer names and their promises, this function
  * waits till resolution of all promises and returns the mapping between
  * reducer names and the resolved reducers.
  * @param {Object} promises Object with promises of reducers.
  * @return Object with reducers.
  */
 export function resolveReducers(promises) {
   return Promise.all(_.values(promises)).then((reducers) => {
     const map = {};
     _.keys(promises).forEach((key, index) => {
       map[key] = reducers[index];
     });
     return map;
   });
 }
 
 /**
  * Creates a new Redux store.
  * @param {Function} getReducerFactory Function that returns reducer factory.
  *  For HMR to work, it should require the JS module of the factory each time it
  *  is called.
  * @param {Object} httpRequest Optional. ExpressJS HTTP request. It should be
  *  passed in at the server side to support server-side rendering.
  * @param {Object} intialState Optional. Initial state of Redux store. It should
  *  be passed in at the client side to support server-side rendering.
  * @param {Object} moduleHot Optional. `module.hot` object from the module that
  *  imports storeFactory(..).
  * @param {Object} reducerFactoryModulePath Optional. Path of the root module of
  *  the reducer factory. It is necessary for proper HMR support.
  * @return {Promise} Resolves to the new Redux store.
  */
 export async function storeFactory({
   getReducerFactory,
   httpRequest,
   initialState,
   moduleHot,
   reducerFactoryModulePath,
 }) {
   const reducer = await (getReducerFactory()(httpRequest));
   let enhancer = applyMiddleware(promiseMiddleware);
   const store = createStore(reducer, initialState || {}, enhancer);
   if (moduleHot && reducerFactoryModulePath) {
     moduleHot.accept(reducerFactoryModulePath, async () => {
       const newReducer = await (getReducerFactory()());
       store.replaceReducer(newReducer);
     });
   }
   return store;
 }