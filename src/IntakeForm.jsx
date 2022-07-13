import { useNavigate, Route, Routes } from "react-router-dom";
import _ from "lodash";
import React, { useContext, useEffect, useState } from "react";
import { useDispatch } from "react-redux";

import LoadingSpinner from "./components/LoadingSpinner";
import { autoSaveInitErrored, triggerAutoSave } from "./actions/autoSave";
import { getChallenge } from "./actions/challenge";
import { saveForm } from "./actions/form";
import { setProgressItem } from "./actions/progress";
import {
  cacheChallengeId,
  loadChallengeId,
  loadSavedFormCookie,
  setCookie,
} from "./autoSaveBeforeLogin";
import { MAX_COMPLETED_STEP } from "./constants";
import { INTAKE_FORM_ROUTES as DATA_EXPLORATION_INTAKE_FORM_ROUTES } from "./constants/products/DataExploration";
import { INTAKE_FORM_ROUTES as FIND_ME_DATA_INTAKE_FORM_ROUTES } from "./constants/products/FindMeData";
import { INTAKE_FORM_ROUTES as DATA_ADVISORY_INTAKE_FORM_ROUTES } from "./constants/products/DataAdvisory";
import { INTAKE_FORM_ROUTES as WEBSITE_DESIGN_INTAKE_FORM_ROUTES } from "./constants/products/WebsiteDesign";
import { INTAKE_FORM_ROUTES as WEBSITE_DESIGN_LEGACY_INTAKE_FORM_ROUTES } from "./constants/products/WebsiteDesignLegacy";
import { getIntakeFormChallenges } from "./services/challenge";
import SelectWorkType from "./routes/SelectWorkType";
import DataExploration from "./routes/Products/DataExploration";
import FindMeData from "./routes/Products/FindMeData";
import WebsiteDesign from "./routes/Products/WebsiteDesign";
import DataAdvisory from "./routes/Products/DataAdvisory";
import WebsiteDesignLegacy from "./routes/Products/WebsiteDesignLegacy";

import { profileContext, WorkType } from "../src-ts";

export default function IntakeForm() {

  const dispatch = useDispatch();
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
    if (!savedData) return;
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

  return (
    <div>
      <LoadingSpinner show={isLoading} />
      {!isLoading && (
        <Routes>
          {/* Data Exploration */}
          <Route
            element={<DataExploration isLoggedIn={isLoggedIn} />}
            path="/work/new/data-exploration/*"
          />

          {/* Data Advisory */}
          <Route
            element={<DataAdvisory isLoggedIn={isLoggedIn} />}
            path="/work/new/data-advisory/*"

          />

          {/* Find Me Data */}
          <Route
            element={<FindMeData isLoggedIn={isLoggedIn} />}
            path="/work/new/find-me-data/*"
          />

          {/* Web Design*/}
          <Route
            element={<WebsiteDesign isLoggedIn={isLoggedIn} />}
            path="/work/new/website-design/*"
          />

          {/* Web Design (Legacy) */}
          <Route
            element={<WebsiteDesignLegacy isLoggedIn={isLoggedIn} />}
            path="/work/new/website-design-legacy/*"
          />

          <Route
            element={<SelectWorkType isLoggedIn={isLoggedIn} />}
            path="/wizard"
          />
        </Routes>
      )}
    </div>
  );
}
