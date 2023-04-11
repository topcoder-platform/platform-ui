import styles from "./styles.scss";
import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector,  } from "react-redux";
import { LoadingCircles } from "~/libs/ui";
import LoginRequest from "../../components/gig-apply/LoginRequest";
import ApplicationForm from "../../components/gig-apply/ApplicationForm";
import * as myGigsSelectors from "../../reducers/my-gigs/selectors";
import myGigsActions from "../../actions/my-gigs";
import * as lookupSelectors from "../../reducers/lookupSelectors";
import * as detailsSelectors from "../../reducers/gig-details/selectors";
import * as applyEffectors from "../../actions/gig-apply/effectors";

const GigApplyPage = () => {
  const { externalId } = useParams()
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
    <div className={styles.container}>
      <div className={styles.page}>
        {isLoading ? (
          <LoadingCircles className={styles.loadingIndicator} />
        ) : getProfileError ? (
          <div className={styles.error}>
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
