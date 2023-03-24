/**
 * @module errors
 * @desc Utility functions for the standard error handling.
 * @todo They will be moved to `topcoder-react-utils` soon.
 */
import actions from "../actions/errors";

export const ERROR_ICON_TYPES = {
  NETWORK: "network",
  API: "api",
};

let store; // Will be set only when rendering client-side

export function setErrorsStore(s) {
  store = s;
}

/**
 * The function behaves similarly to javascript alert()
 * it will show a modal error diaglog with styling until the user clicks OK.
 */
export function fireErrorMessage(title, details) {
  if (store) {
    window.setImmediate(() => {
      store.dispatch(actions.errors.newError(title, details));
    });
  }
}

/**
 * clear all error icons
 */
export function clearAllErrorIcons() {
  if (store) {
    window.setImmediate(() => {
      store.dispatch(actions.errors.clearAllErrorIcons());
    });
  }
}

/**
 * add error message to error icon in bottom left in the screen.
 * @param id  id of error icon type (ERROR_ICON_TYPES.NETWORK or ERROR_ICON_TYPES.API)
 * @param title icon hover title
 * @param message icon hover message
 */
export function setErrorIcon(id, title, message) {
  if (store) {
    window.setImmediate(() => {
      store.dispatch(actions.errors.setErrorIcon(id, title, message));
    });
  }
}

/**
 * clear all error message for an error icon.
 * @param id  id of error icon type to clear
 */
export function clearErrorIcon(id) {
  if (store) {
    window.setImmediate(() => {
      store.dispatch(actions.errors.clearErrorIcon(id));
    });
  }
}
