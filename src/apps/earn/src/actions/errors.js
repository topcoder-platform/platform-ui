/**
 * @module "actions.errors"
 * @desc Actions related to the standard application-wide error handling and
 * messaging.
 *
 * Pending to be documented. You are not supposed to use them directly anyway.
 *
 * @todo This module does not belong to `topcoder-react-lib`, it will be moved
 *  to `topcoder-react-utils` soon.
 */
import _ from "lodash";
import { createActions } from "redux-actions";

export default createActions({
  ERRORS: {
    CLEAR_ERROR: _.noop,
    NEW_ERROR: (title, details) => ({ title, details }),
    CLEAR_ALL_ERROR_ICONS: _.noop,
    SET_ERROR_ICON: (id, title, message) => ({ id, title, message }),
    CLEAR_ERROR_ICON: (id) => ({ id }),
  },
});
