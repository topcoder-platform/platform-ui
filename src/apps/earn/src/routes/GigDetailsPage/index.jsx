import styles from "./styles.scss";
import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { Link, useLocation, useParams } from "react-router-dom";
import { ReactComponent as IconArrowPrev } from "../../assets/icons/arrow-prev.svg";
import { LoadingCircles } from "~/libs/ui";
import GigDetails from "../../components/gig-details/GigDetails";
import GigsFulFill from "../../components/gig-details/GigsFulFill";
import store from "../../store";
import * as selectors from "../../reducers/gig-details/selectors";
import * as effectors from "../../actions/gig-details/effectors";
import * as userSelectors from "../../reducers/user/selectors";
import * as userEffectors from "../../actions/user/effectors";
import { GIG_LIST_ROUTE } from "../../constants/routes";
import { setReferralCookie } from "../../utils/referral";

const GigDetailsPage = () => {
  const { externalId } = useParams()
  const details = useSelector(selectors.getDetails);
  const isLoading = useSelector(selectors.getIsLoadingDetails);
  const isLoggedIn = useSelector(userSelectors.getIsLoggedIn);
  const error = useSelector(selectors.getDetailsError);

  const location = useLocation();

  useEffect(() => {
    effectors.loadDetails(store, externalId);
    return () => {
      effectors.resetDetails(store);
    };
  }, [externalId]);

  useEffect(() => {
    if (!isLoggedIn) {
      userEffectors.loadProfile(store);
    }
  }, [isLoggedIn]);

  useEffect(setReferralCookie, []);

  return (
    <div className={styles["container"]}>
      <div className={styles["page"]}>
        {isLoading ? (
          <LoadingCircles className={styles.loadingIndicator} />
        ) : (
          <>
            {(!details || !details.jobClosed) && (
              <Link
                to={
                  location.state && location.state.from
                    ? location.state.from
                    : GIG_LIST_ROUTE
                }
                className={styles.gigsLink}
              >
                <IconArrowPrev className={styles.iconArrowPrev} />
              </Link>
            )}
            {error ? (
              <div className={styles["error"]}>{error}</div>
            ) : details && details.jobClosed ? (
              <GigsFulFill />
            ) : (
              <GigDetails />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default GigDetailsPage;
