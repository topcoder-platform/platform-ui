import styles from "./styles.scss";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import LoadingCircles from "components/LoadingCircles";
import LoginRequest from "./components/LoginRequest";
import ApplicationForm from "./components/ApplicationForm";
import * as myGigsSelectors from "reducers/gigs/myGigsSelectors";
import myGigsActions from "actions/gigs/myGigs";
import * as lookupSelectors from "reducers/gigs/lookupSelectors";
import * as detailsSelectors from "reducers/gigs/gigDetails/selectors";
import * as applyEffectors from "actions/gigs/gigApply/effectors";

const GigApplyPage = ({ externalId }) => {
  const isLoggingIn = useSelector(myGigsSelectors.getIsLoggingIn);
  const isLoggedIn = useSelector(myGigsSelectors.getIsLoggedIn);
  const getProfileError = useSelector(myGigsSelectors.getProfileError);
  const isEmptyProfile = useSelector(myGigsSelectors.isEmptyProfile);
  const isLoadingCountries = useSelector(lookupSelectors.getIsLoadingCountries);
  const isLoadingDetails = useSelector(detailsSelectors.getIsLoadingDetails);

  const dispatch = useDispatch();

  const isLoading =
    isLoggingIn || (isLoggedIn && (isLoadingDetails || isLoadingCountries));

  useEffect(() => {
    if (isEmptyProfile) {
      dispatch(myGigsActions.getProfile());
    }
  }, [isEmptyProfile, dispatch]);

  useEffect(() => {
    if (isLoggedIn) {
      applyEffectors.loadInitialData(externalId);
    }
  }, [isLoggedIn, externalId]);

  return (
    <div styleName="container">
      <div styleName="page">
        {isLoading ? (
          <LoadingCircles className={styles.loadingIndicator} />
        ) : getProfileError ? (
          <div styleName="error">
            Something bad happened. Please try again after some time or contact
            support if issue persists.
          </div>
        ) : isLoggedIn ? (
          <ApplicationForm />
        ) : (
          <LoginRequest />
        )}
      </div>
    </div>
  );
};

export default GigApplyPage;
