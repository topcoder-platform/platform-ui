import { navigate, Router, Redirect } from "@reach/router";
import { getAuthUserTokens } from "@topcoder/mfe-header";
import LoadingSpinner from "components/LoadingSpinner";
import _ from "lodash";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { decodeToken } from "tc-auth-lib";
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
import {
  authUserError,
  authUserSuccess,
} from "./hoc/withAuthentication/actions";
import { getIntakeFormChallenges } from "services/challenge";
import SelectWorkType from "./routes/SelectWorkType";
import DataExploration from "./routes/Products/DataExploration";
import FindMeData from "./routes/Products/FindMeData";
import WebsiteDesign from "./routes/Products/WebsiteDesign";
import DataAdvisory from "./routes/Products/DataAdvisory";
import WebsiteDesignLegacy from "./routes/Products/WebsiteDesignLegacy";

import { WorkType } from "../src-ts";

export default function IntakeForm() {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const onReload = (event) => {
    getAuthUserTokens()
      .then((auth) => {
        if (auth?.tokenV3) {
          event.preventDefault();
          event.returnValue = "";
        }
      })
      .catch((error) => {
        setCookie(MAX_COMPLETED_STEP, "", -1);
        authUserError(error);
      });
    dispatch(triggerAutoSave(true));
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
    const { handle } = await getAuth();
    if (handle) {
      await handleAutoSaveLoggedIn(handle);
      setIsLoggedIn(true);
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

  const getAuth = async () => {
    let auth = {};
    try {
      const { tokenV3 } = await getAuthUserTokens();
      if (!!tokenV3) {
        const tokenData = decodeToken(tokenV3);
        const authProps = ["userId", "handle", "roles"];
        dispatch(authUserSuccess(_.pick(tokenData, authProps)));
        auth = tokenData;
      }
    } catch (err) {
      dispatch(authUserError(err));
    }
    return auth;
  };

  return (
    <div>
      <LoadingSpinner show={isLoading} />
      {!isLoading && (
        <Router>
          {/* Data Exploration */}
          <DataExploration
            path="/work/new/data-exploration/*"
            isLoggedIn={isLoggedIn}
          />

          {/* Data Advisory */}
          <DataAdvisory
            path="/work/new/data-advisory/*"
            isLoggedIn={isLoggedIn}
          />

          {/* Find Me Data */}
          <FindMeData path="/work/new/find-me-data/*" isLoggedIn={isLoggedIn} />

          {/* Web Design (NEW) */}
          <WebsiteDesign
            path="/work/new/website-design-new/*"
            isLoggedIn={isLoggedIn}
          />

          {/* Web Design (Legacy) */}
          <WebsiteDesignLegacy
            path="/work/new/website-design/*"
            isLoggedIn={isLoggedIn}
          />

          <SelectWorkType path="/wizard" />
          {/* <Redirect noThrow from="/*" to="/self-service/wizard" /> */}
        </Router>
      )}
    </div>
  );
}
