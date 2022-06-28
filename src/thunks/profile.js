import { getAuthUserProfile } from "@topcoder/mfe-header";
import * as actions from "actions/profile";
import _ from "lodash";

/**
 * Loads User Profile Information
 * @returns {() => Promise}
 */
export const getUserProfile = () => async (dispatch, getState) => {
  const state = getState();

  getAuthUserProfile().then((authUser) => {
    const profile = _.pick(authUser, [
      "firstName",
      "lastName",
      "email",
      "handle",
    ]);
    dispatch(actions.getUserProfile(profile));
  });
};
