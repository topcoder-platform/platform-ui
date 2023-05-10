/**
 * Configure Redux Store
 */
import { applyMiddleware, compose, createStore } from "redux";
import { createPromise } from "redux-promise-middleware";
import thunk from "redux-thunk";
import rootReducer from "./reducers";
import { setErrorsStore } from "./utils/errors";

const middlewares = [
  // if payload of action is promise it would split action into 3 states
  createPromise({
    promiseTypeSuffixes: ["PENDING", "SUCCESS", "ERROR"],
  }),
  thunk,
];

// enable Redux Logger in in DEV environment
if (process.env.APPMODE !== "production") {
  const { createLogger } = require("redux-logger");
  const logger = createLogger();
  middlewares.push(logger);
}

// const persistedState = loadSavedFormCookie();

const store = createStore(rootReducer, compose(applyMiddleware(...middlewares)));

setErrorsStore(store);

export default store;
