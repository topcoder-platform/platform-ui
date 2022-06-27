import { ACTIONS, AUTO_SAVE_FORM, CACHED_CHALLENGE_ID } from "constants/index";
import CryptoJS from "crypto-js";
import _ from "lodash";
import moment from "moment";
import "moment-timezone";
import config from "../config";
import {
  autoSaveCookieCleared,
  sendAutoSavedPatch,
  storeAutoSavedCookie,
} from "./actions/autoSave";
import { createNewChallenge } from "./actions/challenge";

let CREATION_IN_PROGRESS = false;

export const saveUpdatesMiddleware = ({ dispatch, getState }) => {
  const handleAutoSave = () => {
    const { progress, form, authUser, challenge, autoSave } = getState();
    const isEmptyForm = !form?.workType?.selectedWorkType;
    if (isEmptyForm) return;

    let challengeId = loadChallengeId() || challenge?.id;
    const dataToSave = { progress, form };
    const currentStep = _.get(dataToSave, "progress.currentStep", 1);
    if (authUser?.isLoggedIn && (autoSave.forced || currentStep >= 3)) {
      const triggerSave = () => {
        challengeId = loadChallengeId() || challenge?.id;
        if (!challengeId) {
          // retry until challenge gets created
          return setTimeout(() => triggerSave(), 1000);
        }
        CREATION_IN_PROGRESS = false;
        clearCachedCookie(autoSave);
        handleLoginSave(autoSave, dataToSave, challengeId, challenge);
      };
      if (!challengeId) {
        if (!CREATION_IN_PROGRESS) {
          dispatch(
            createNewChallenge(_.get(form, "workType.selectedWorkType"))
          );
          CREATION_IN_PROGRESS = true;
        }
        triggerSave();
      } else {
        triggerSave();
      }
    } else {
      dispatch(storeAutoSavedCookie(dataToSave));
    }
  };

  const clearCache = () => {
    clearAutoSavedForm();
    dispatch(autoSaveCookieCleared(true));
  };

  const clearCachedCookie = (autoSave) => {
    if (autoSave.triggered && !autoSave.cookieCleared) {
      clearCache();
    }
  };

  const handleLoginSave = (autoSave, dataToSave, challengeId, challenge) => {
    const metaData = challenge?.metadata
      ? _.find(challenge.metadata, (m) => m.name === "intake-form")
      : undefined;
    const formString = JSON.stringify(dataToSave);
    if (metaData?.value !== formString) {
      dispatch(sendAutoSavedPatch(formString, challengeId));
    }
  };

  return (next) => (action) => {
    const result = next(action);

    if ([ACTIONS.AUTO_SAVE.TRIGGER_COOKIE_CLEARED].includes(result.type)) {
      clearCachedChallengeId();
      clearCache();
    } else if ([ACTIONS.AUTO_SAVE.TRIGGER_AUTO_SAVE].includes(result.type)) {
      handleAutoSave();
    }
    return result;
  };
};

export const autoSaveCookie = (stateToSave) => {
  const { progress, form } = stateToSave;
  if (progress?.currentStep && isUpdatingTheLatest(form)) {
    const newCookie = CryptoJS?.AES.encrypt(
      JSON.stringify(stateToSave),
      AUTO_SAVE_FORM
    );
    setCookie(AUTO_SAVE_FORM, newCookie, config.AUTO_SAVED_COOKIE_EXPIRED_IN);
  }
};

const isUpdatingTheLatest = (form) => {
  const cachedCookie = loadSavedFormCookie();
  const lastUpdatedAt = cachedCookie?.form?.updatedAt;
  const thisUpdatedAt = form.updatedAt;
  return !lastUpdatedAt || moment(lastUpdatedAt).isBefore(thisUpdatedAt);
};

export const loadSavedFormCookie = () => {
  try {
    const savedCookie = getCookie(AUTO_SAVE_FORM);
    if (!savedCookie) {
      return undefined;
    }
    const bytes = CryptoJS?.AES.decrypt(savedCookie, AUTO_SAVE_FORM);
    const autoSavedForm = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(autoSavedForm);
  } catch (e) {
    return undefined;
  }
};

export const clearAutoSavedForm = () => {
  setCookie(AUTO_SAVE_FORM, "", -1);
};

export const clearCachedChallengeId = () => {
  setCookie(CACHED_CHALLENGE_ID, "", -1);
};

export const loadChallengeId = () => {
  try {
    const savedId = getCookie(CACHED_CHALLENGE_ID);
    if (!savedId) {
      return undefined;
    }
    const bytes = CryptoJS?.AES.decrypt(savedId, CACHED_CHALLENGE_ID);
    const challengeId = bytes.toString(CryptoJS.enc.Utf8);
    return challengeId;
  } catch (e) {
    return undefined;
  }
};

export const cacheChallengeId = (challengeId) => {
  if (_.isString(challengeId)) {
    const encryptedId = CryptoJS.AES.encrypt(challengeId, CACHED_CHALLENGE_ID);
    setCookie(
      CACHED_CHALLENGE_ID,
      encryptedId,
      config.AUTO_SAVED_COOKIE_EXPIRED_IN
    );
  }
};

export function setCookie(cname, cvalue, exMins) {
  const cDomain = getHostDomain();

  let d = new Date();
  d.setTime(d.getTime() + exMins * 60 * 1000);

  let expires = ";expires=" + d.toUTCString();
  document.cookie = cname + "=" + cvalue + cDomain + expires + ";path=/";
}

export function getCookie(name) {
  const v = document.cookie.match("(^|;) ?" + name + "=([^;]*)(;|$)");
  return v ? v[2] : undefined;
}

function getHostDomain() {
  let hostDomain = "";
  if (location.hostname !== "localhost") {
    hostDomain =
      ";domain=." +
      location.hostname.split(".").reverse()[1] +
      "." +
      location.hostname.split(".").reverse()[0];
  }
  return hostDomain;
}
