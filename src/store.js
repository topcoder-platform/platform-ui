/* global process */
/**
 * Configure Redux Store
 */
import { applyMiddleware, createStore } from "redux";
import { createLogger } from "redux-logger";
import { createPromise } from "redux-promise-middleware";
import thunk from "redux-thunk";
import { saveUpdatesMiddleware } from "./autoSaveBeforeLogin";
import rootReducer from "./reducers";

const middlewares = [
  // if payload of action is promise it would split action into 3 states
  createPromise({
    promiseTypeSuffixes: ["PENDING", "SUCCESS", "ERROR"],
  }),
  thunk,
  saveUpdatesMiddleware,
];

// enable Redux Logger in in DEV environment
if (process.env.APPMODE !== "production") {
  const { createLogger } = require("redux-logger");
  const logger = createLogger();
  middlewares.push(logger);
}

// const persistedState = loadSavedFormCookie();

const store = createStore(rootReducer, applyMiddleware(...middlewares));

export default store;
