/**
 * @module logger
 *
 * @desc
 * Isomorphic logger.
 *
 * At the front-end side it outputs log messages to the console (only when
 * development build of the frontend is used), and sends them to the
 * https://logentries.com service (both dev and prod build of the frontend
 * send messages to the service, proxying them through the App's server;
 * the proxy will forward them to the service only if LOG_ENTRIES_TOKEN is set).
 *
 * In all case, interface of the logger matches that of the standard JS console.
 *
 * @todo This module does not belong here, it should be moved to
 * `topcoder-react-utils`.
 */
/* eslint-disable global-require */
/* eslint-disable no-console */

import _ from "lodash";
import { createAction } from "redux-actions";

import config from "../config";
import store from "../store";

const isDev = process.env.APPMODE === "development";
const logger = {};
_.functions(console).forEach((func) => {
  logger[func] = isDev ? console[func] : _.noop;
});

let leLogger;

const log = (type, ...rest) => {
  if (!config.SERVER_API_KEY) {
    return;
  }

  fetch("/community-app-assets/api/logger", {
    body: JSON.stringify({
      data: rest,
      type,
    }),
    headers: {
      "Content-Type": "application/json",
      Authorization: `ApiKey ${config.SERVER_API_KEY}`,
    },
    method: "POST",
  }).catch(() => {
    /* TODO: Network or server are down. We should msg it to the user somehow
     */
  });
};
leLogger = {
  err: (...rest) => log("err", ...rest),
  info: (...rest) => log("info", ...rest),
  log: (...rest) => log("log", ...rest),
  warning: (...rest) => log("warn", ...rest),
};

if (leLogger) {
  const extend = (base, le) => {
    logger[base] = (...rest) => {
      if (isDev) {
        console[base](...rest);
      }
      let msg = "";
      rest.forEach((item) => {
        let it = item;
        if (!_.isString(it)) {
          it = JSON.stringify(it);
          if (!_.isString(it)) it = String(it);
        }
        msg = `${msg}${it} `;
      });
      leLogger[le](msg);
    };
  };
  extend("error", "err");
  extend("info", "info");
  extend("log", "log");
  extend("warn", "warning");
}

/**
 * The function behaves similarly to javascript alert()
 * it will show a modal error diaglog with styling until the user clicks OK.
 */
export const fireErrorMessage = (title, details) => {
  setImmediate(() => {
    const newError = createAction("NEW_ERROR", (paramTitle, paramDetails) => ({
      title: paramTitle,
      details: paramDetails,
    }));
    store.dispatch(newError(title, details));
  });
};

export const clearErrorMesssage = () => {
  setImmediate(() => {
    const clearError = createAction("CLEAR_ERROR");
    store.dispatch(clearError());
  });
};

export default logger;
