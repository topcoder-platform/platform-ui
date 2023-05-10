/**
 * @module "actions.auth"
 * @desc Actions related to Topcoder authentication system.
 */

import { createActions } from "redux-actions";
import _ from "lodash";
import { decodeToken, readCookie } from "../utils/token";
import { getApiV3, getApiV5 } from "../services/challenge-api";
import { setErrorIcon, ERROR_ICON_TYPES } from "../utils/errors";
import { TOKEN_COOKIE_KEYS } from "../constants/index";
import { getAuthUserTokens } from "../utils/auth";

/**
 * Helper method that checks for HTTP error response v5 and throws Error in this case.
 * @param {Object} res HTTP response object
 * @return {Object} API JSON response object
 * @private
 */
async function checkErrorV5(res) {
  if (!res.ok) {
    if (res.status === 403) {
      setErrorIcon(ERROR_ICON_TYPES.API, "Auth0", res.statusText);
    }
    throw new Error(res.statusText);
  }
  const jsonRes = await res.json();
  if (jsonRes.message) {
    throw new Error(res.message);
  }
  return {
    result: jsonRes,
    headers: res.headers,
  };
}

/**
 * @static
 * @desc Creates an action that loads Topcoder user profile from v3 API.
 * @param {String} userTokenV3 v3 authentication token.
 * @return {Action}
 */
function loadProfileDone(userTokenV3) {
  if (!userTokenV3) return Promise.resolve(null);
  const user = decodeToken(userTokenV3);
  const apiV3 = getApiV3(userTokenV3);
  const apiV5 = getApiV5(userTokenV3);
  return Promise.all([
    apiV3
      .get(`/members/${user.handle}`)
      .then((res) => res.json())
      .then((res) => (res.result.status === 200 ? res.result.content : {})),
    apiV5
      .get(`/groups?memberId=${user.userId}&membershipType=user`)
      .then(checkErrorV5)
      .then((res) => res.result || []),
  ]).then(([profile, groups]) => ({ ...profile, groups }));
}

/**
 * @static
 * @desc Creates an action that sets Topcoder v2 authentication token.
 * @param {String} tokenV2 Topcoder v2 authentication token.
 * @return {Action}
 */
function setTcTokenV2(tokenV2) {
  return tokenV2;
}

/**
 * @static
 * @desc Creates an action that decodes Topcoder v3 authentication token,
 * to get user object, and then writes both the token and the user object into
 * Redux store.
 * @param {String} tokenV3 Topcoder v3 authentication token.
 * @return {Action}
 */
function setTcTokenV3(tokenV3) {
  return tokenV3;
}

async function setAuthDone() {
  const { tokenV3 } = await getAuthUserTokens();
  const user = tokenV3 ? decodeToken(tokenV3) : null;
  return user;
}

/**
 * @static
 * @desc Check token cookies to find if a user is logged out:
 * This is because all the token cookies are cleared if a user is logged out.
 * @return {Action}
 */
function checkIsLoggedOut() {
  const tokenKeys = Object.keys(TOKEN_COOKIE_KEYS);
  const isLoggedOut = _.every(
    tokenKeys,
    (k) => readCookie(TOKEN_COOKIE_KEYS[k]) === undefined
  );
  return { isLoggedOut };
}

export default createActions({
  AUTH: {
    LOAD_PROFILE: loadProfileDone,
    SET_TC_TOKEN_V2: setTcTokenV2,
    SET_TC_TOKEN_V3: setTcTokenV3,
    SET_AUTH_DONE: setAuthDone,
    CHECK_IS_LOGGED_OUT: checkIsLoggedOut,
  },
});
