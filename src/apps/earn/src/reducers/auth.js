/**
 * @module "reducers.auth"
 * @desc Reducer for {@link module:actions.auth} actions.
 *
 * State segment managed by this reducer has the following structure:
 * @param {Boolean} authenticating=true `true` if authentication is still in
 *  progress; `false` if it has already completed or failed.
 * @param {Object} profile=null Topcoder user profile.
 * @param {String} tokenV2='' Topcoder v2 auth token.
 * @param {String} tokenV3='' Topcoder v3 auth token.
 * @param {Object} user=null Topcoder user object (user information stored in
 *  v3 auth token).
 */

import _ from "lodash";
import { decodeToken } from "../utils/token";
import { handleActions } from "redux-actions";
import actions from "../actions";

/**
 * Handles actions.auth.loadProfile action.
 * @param {Object} state
 * @param {Object} action
 */
function onProfileLoaded(state, action) {
  return {
    ...state,
    authenticating: false,
    isProfileLoaded: true,
    profile: action.payload,
  };
}

function onSetAuthDone(state, { payload }) {
  return { ...state, user: payload, isAuthInitialized: true };
}

/**
 * Creates a new Auth reducer with the specified initial state.
 * @param {Object} initialState Optional. Initial state.
 * @param {Object} mergeReducers Optional. Reducers to merge.
 * @return {Function} Auth reducer.
 */
function create(initialState) {
  return handleActions(
    {
      [`${actions.auth.loadProfile}_SUCCESS`]: onProfileLoaded,
      [actions.auth.setTcTokenV2]: (state, action) => ({
        ...state,
        tokenV2: action.payload,
      }),
      [actions.auth.setTcTokenV3]: (state, { payload }) => ({
        ...state,
        tokenV3: payload,
        user: payload ? decodeToken(payload) : null,
      }),
      "COMMUNITY_ACTIONS/TC_COMMUNITY/JOIN_DONE": (state, { payload }) => ({
        ...state,
        profile: {
          ...state.profile,
          groups: state.profile.groups.concat({
            id: payload.groupId.toString(),
          }),
        },
      }),
      [`${actions.auth.setAuthDone}_SUCCESS`]: onSetAuthDone,
    },
    _.defaults(initialState, {
      authenticating: true,
      profile: null,
      tokenV2: "",
      tokenV3: "",
      user: null,
      isAuthInitialized: false,
      isProfileLoaded: false,
    })
  );
}

/**
 * @static
 * @member default
 * @desc Reducer with default initial state.
 */
export default create();
