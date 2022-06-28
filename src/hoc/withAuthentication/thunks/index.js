import pick from "lodash/pick";
import { getAuthUserTokens, login } from "@topcoder/mfe-header";
import { decodeToken } from "tc-auth-lib";
import { getIsLoggedIn } from "../selectors";
import { authUserError, authUserSuccess } from "../actions";

/**
 * Tries to acquire auth tokens and thus check if the user is logged in.
 *
 * @returns (() => Promise)
 */
export const checkIfLoggedIn = () => async (dispatch, getState) => {
  const state = getState();
  const isLoggedIn = getIsLoggedIn(state);
  if (isLoggedIn) {
    return;
  }
  let tokenData = null;
  try {
    const { tokenV3 } = await getAuthUserTokens();
    if (tokenV3) {
      tokenData = decodeToken(tokenV3);
    }
  } catch (error) {
    dispatch(authUserError(error));
    return;
  }
  dispatch(authUserSuccess(pick(tokenData, ["userId", "handle", "roles"])));
};
