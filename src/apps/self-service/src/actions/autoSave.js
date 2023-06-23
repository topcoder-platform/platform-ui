import { patchChallenge } from "../services/challenge";
import { getChallenge } from "../actions/challenge";
import { autoSaveCookie } from "../utils/autoSaveBeforeLogin";
import { ACTIONS } from "../config";

export const autoSaveInitErrored = (error) => ({
  type: ACTIONS.AUTO_SAVE.INIT_ERRORED,
  payload: error,
});

export const triggerAutoSave = (isTriggered, isLoggedIn, isForced) => ({
  type: ACTIONS.AUTO_SAVE.TRIGGER_AUTO_SAVE,
  payload: {
    isTriggered,
    isLoggedIn,
    isForced,
  },
});

export const triggerCookieClear = () => ({
  type: ACTIONS.AUTO_SAVE.TRIGGER_COOKIE_CLEARED,
});

export const sendAutoSavedPatch = (dataToSave, challengeId) => (dispatch) => {
  patchChallenge(dataToSave, challengeId)
    .then((patched) => {
      dispatch(getChallenge(patched));
    })
    .catch((e) => { });
};

export const storeAutoSavedCookie = (dataToSave) => (dispatch) => {
  autoSaveCookie(dataToSave);
};
