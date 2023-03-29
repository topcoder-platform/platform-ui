import styles from "./styles.scss";
import React, { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import GigsButton from "../../../../components/GigsButton";
import iconTick from "../../../../assets/images/tick-big.png";
import { ReactComponent as IconSadFace } from "../../../../assets/icons/icon-sad-face.svg";
import * as applySelectors from "../../../../reducers/gigs/gigApply/selectors";
import * as detailsSelectors from "../../../../reducers/gigs/gigDetails/selectors";
import * as userSelectors from "../../../../reducers/gigs/user/selectors";
import applyActions from "../../../../actions/gigs/gigApply/creators";
import { GIG_LIST_ROUTE } from "../../../../constants/routes";
import { makeGigApplicationStatusPath } from "../../../../utils/gigs/url";
import { clearReferralCookie, setAppliedStorage } from "../../../../utils/gigs/referral";

const SubmissionResult = () => {
  const { data, error } = useSelector(applySelectors.getApplication);
  const { jobExternalId } = useSelector(detailsSelectors.getDetails);
  const profile = useSelector(userSelectors.getProfile);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const onClickBtnApplyAgain = useCallback(() => {
    dispatch(applyActions.resetApplication());
  }, [dispatch]);

  const onClickBtnViewList = useCallback(() => {
    navigate(GIG_LIST_ROUTE);
  }, []);

  const onClickBtnViewStatus = useCallback(() => {
    navigate(makeGigApplicationStatusPath(jobExternalId));
  }, [jobExternalId]);


  useEffect(() => {
    if (data) {
      clearReferralCookie();
    }
    if (data && profile) {
      setAppliedStorage(`${jobExternalId}${profile.userId}`);
    }
  }, [data, jobExternalId, profile]);

  return (
    <div className={styles.container}>
      {error ? (
        <IconSadFace className={styles.iconError} />
      ) : (
        <img className={styles.iconSuccess} src={iconTick} alt="" />
      )}
      <div className={styles.title}>
        {error ? "OOPS!" : "APPLICATION SUBMITTED"}
      </div>
      {error && <div className={styles.error}>{error.message}</div>}
      <div className={styles.message}>
        {error ? (
          error.notAllowed ? (
            <p>
              If you have any questions or feel this is an error, please email{" "}
              <a href="mailto:gigwork@topcoder.com">gigwork@topcoder.com</a>.
            </p>
          ) : (
            <>
              <p>
                Looks like there is a problem on our end. Please try again.
                <br />
                If this persists please contact{" "}
                <a href="mailto:support@topcoder.com">support@topcoder.com</a>.
              </p>
              <p>
                Please send us an email at{" "}
                <a href="mailto:gigwork@topcoder.com">gigwork@topcoder.com</a>{" "}
                with the subject ‘Gig Error’
                <br />
                and paste the URL for the gig you are attempting to apply for so
                that we know of your interest.
              </p>
            </>
          )
        ) : (
          <p>We will contact you via email if it seems like a fit!</p>
        )}
      </div>
      <div className={styles.controls}>
        {error ? (
          <>
            {!error.notAllowed && (
              <GigsButton size="lg" onClick={onClickBtnApplyAgain}>
                APPLY AGAIN
              </GigsButton>
            )}
            <GigsButton isPrimary size="lg" onClick={onClickBtnViewList}>
              VIEW OTHER GIGS
            </GigsButton>
          </>
        ) : (
          <>
            <GigsButton size="lg" onClick={onClickBtnViewList}>
              GO TO GIGS LIST
            </GigsButton>
            <GigsButton isPrimary size="lg" onClick={onClickBtnViewStatus}>
              CHECK GIG APPLICATION STATUS
            </GigsButton>
          </>
        )}
      </div>
    </div>
  );
};

export default SubmissionResult;
