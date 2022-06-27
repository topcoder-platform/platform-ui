import { ACTIONS } from "constants/";

/**
 * Creates an action denoting the failure to get user works.
 *
 * @param {Object} error error object
 * @returns {Object}
 */
export const loadWorksError = (error) => ({
  type: ACTIONS.MY_WORK.LOAD_WORKS_ERROR,
  payload: error,
});

/**
 * Creates an action denoting the start of loading user's works.
 *
 * @param {Object} cancelSource axios' cancel source object
 * @returns {Object}
 */
export const loadWorksPending = (cancelSource) => ({
  type: ACTIONS.MY_WORK.LOAD_WORKS_PENDING,
  payload: cancelSource,
});

/**
 * Creates an action denoting the successful load of user's works.
 *
 * @param {Array} works user's works
 * @returns {Object}
 */
export const loadWorksSuccess = (works) => ({
  type: ACTIONS.MY_WORK.LOAD_WORKS_SUCCESS,
  payload: works,
});
