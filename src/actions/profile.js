import { ACTIONS } from "../constants";

/**
 * Creates an action for grabbing user profile information
 *
 * @param {Object} profile user profile
 *
 * @returns {Object}
 */
export const getUserProfile = (profile) => ({
  type: ACTIONS.PROFILE.GET_PROFILE,
  payload: profile,
});

/**
 * Creates an action denoting the start of updating user basic info.
 *
 * @returns {Object}
 */
export const updateBasicInfoPending = () => ({
  type: ACTIONS.PROFILE.UPDATE_BASIC_INFO_PENDING,
});

/**
 * Creates an action denoting the successful load of updating user basic info
 *
 * @param {Object} basicInfo basic info
 *
 * @returns {Object}
 */
export const updateBasicInfoSuccess = (basicInfo) => ({
  type: ACTIONS.PROFILE.UPDATE_BASIC_INFO_SUCCESS,
  payload: basicInfo,
});

/**
 * Creates an action denoting the failure to updating user basic info.
 *
 * @param {Object} error error object
 *
 * @returns {Object}
 */
export const updateBasicInfoError = (error) => ({
  type: ACTIONS.PROFILE.UPDATE_BASIC_INFO_ERROR,
  payload: error,
});
