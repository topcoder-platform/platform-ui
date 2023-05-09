import { useState, useContext, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import _ from "lodash";

import { profileContext } from "~/libs/core";

import { triggerAutoSave, autoSaveInitErrored } from "../../actions/autoSave";
import { getChallenge } from "../../actions/challenge";
import { saveForm } from "../../actions/form";
import { setProgressItem } from "../../actions/progress";
import { bugHuntRoute, MAX_COMPLETED_STEP } from "../../config";
import { WorkType } from "../../lib";
import { getIntakeFormChallenges } from "../../services/challenge";
import { setCookie, loadChallengeId, cacheChallengeId, loadSavedFormCookie } from "../../utils/autoSaveBeforeLogin";

import { INTAKE_FORM_ROUTES as DATA_EXPLORATION_INTAKE_FORM_ROUTES } from "../../config/constants/products/data-exploration";
import { INTAKE_FORM_ROUTES as FIND_ME_DATA_INTAKE_FORM_ROUTES } from "../../config/constants/products/find-me-data";
import { INTAKE_FORM_ROUTES as DATA_ADVISORY_INTAKE_FORM_ROUTES } from "../../config/constants/products/data-advisory";
import { INTAKE_FORM_ROUTES as WEBSITE_DESIGN_INTAKE_FORM_ROUTES } from "../../config/constants/products/website-design";
import { INTAKE_FORM_ROUTES as WEBSITE_DESIGN_LEGACY_INTAKE_FORM_ROUTES } from "../../config/constants/products/website-design-legacy";

export const useLoadUnfinishedWork = () => {


  const dispatch = useDispatch();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate()

  const {
    isLoggedIn,
    profile,
  } = useContext(profileContext)

  const onReload = (event) => {
    if (isLoggedIn) {
      event.preventDefault();
      event.returnValue = "";
    }
    dispatch(triggerAutoSave(true, isLoggedIn));
  };

  useEffect(() => {
    setIsLoading(true);
    setCookie(MAX_COMPLETED_STEP, "", -1);
    setUpAutoSave()
      .then(() => {
        setIsLoading(false);
      })
      .catch((e) => {
        dispatch(autoSaveInitErrored(e));
      });

    window.addEventListener("beforeunload", onReload);
    return () => {
      window.removeEventListener("beforeunload", onReload);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goToUnfinishedStep = (currentStep, workType) => {
    if (currentStep - 1 >= 0) {
      switch (workType) {
        case WorkType.designLegacy:
          navigate(WEBSITE_DESIGN_LEGACY_INTAKE_FORM_ROUTES[currentStep - 1]);
          break;
        case WorkType.data:
          navigate(DATA_EXPLORATION_INTAKE_FORM_ROUTES[currentStep - 1]);
          break;
        case WorkType.findData:
          navigate(FIND_ME_DATA_INTAKE_FORM_ROUTES[currentStep - 1]);
          break;
        case WorkType.problem:
          navigate(DATA_ADVISORY_INTAKE_FORM_ROUTES[currentStep - 1]);
          break;
        case WorkType.design:
          navigate(WEBSITE_DESIGN_INTAKE_FORM_ROUTES[currentStep - 1]);
          break;
        default:
          return;
      }
    }
  };

  const setUpAutoSave = async () => {
    if (!!profile) {
      await handleAutoSaveLoggedIn(profile.handle);
    } else {
      handleAutoSavedLoggedOut();
    }
    return;
  };

  const handleAutoSaveLoggedIn = async (handle) => {
    const challengeDetail = await receiveChallengeDetail(handle);
    const dataToSync = await getSavedDataAfterLoggedIn(challengeDetail);
    syncSavedData(dataToSync);
  };

  const receiveChallengeDetail = async (handle) => {
    const challengeId = loadChallengeId();
    if (!challengeId) return undefined;
    return getIntakeFormChallenges(handle, challengeId)
      .then((challengeDetail) => {
        const savedChallenge = challengeDetail
          ? _.find(challengeDetail, (c) => c.status === "New")
          : undefined;
        if (savedChallenge) {
          dispatch(getChallenge(savedChallenge));
          cacheChallengeId(savedChallenge.id);
        }
        return savedChallenge;
      })
      .catch((e) => {
        dispatch(autoSaveInitErrored(e));
      });
  };

  const getSavedDataAfterLoggedIn = async (challengeDetail) => {
    const savedCookie = loadSavedFormCookie();
    return dataSyncWithoutCookie(challengeDetail) || savedCookie || {};
  };

  const dataSyncWithoutCookie = (challengeDetail) => {
    const metaData = challengeDetail?.metadata;
    const savedForm = metaData
      ? _.find(metaData, (m) => m.name === "intake-form")
      : {};
    return _.isString(savedForm?.value)
      ? JSON.parse(savedForm?.value)
      : undefined;
  };

  const syncSavedData = (savedData) => {
    const isBugHuntRoute = location.pathname.indexOf(`/${bugHuntRoute}`) > -1
    if (!savedData || isBugHuntRoute) return;
    const { form, progress } = savedData;
    if (form) dispatch(saveForm(form));
    if (progress?.currentStep) {
      dispatch(setProgressItem(progress.currentStep));
      goToUnfinishedStep(
        progress.currentStep,
        _.get(form, "workType.selectedWorkType")
      );
    }
  };

  const handleAutoSavedLoggedOut = () => {
    const savedFormCookie = loadSavedFormCookie();
    syncSavedData(savedFormCookie);
  };

  return { isLoading }
}
