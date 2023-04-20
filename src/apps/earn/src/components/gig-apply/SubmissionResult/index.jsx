import styles from "./styles.scss";
import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { LinkButton, Button } from "~/libs/ui";

import iconTick from "../../../assets/images/tick-big.png";
import { ReactComponent as IconSadFace } from "../../../assets/icons/icon-sad-face.svg";
import * as applySelectors from "../../../reducers/gig-apply/selectors";
import * as detailsSelectors from "../../../reducers/gig-details/selectors";
import * as userSelectors from "../../../reducers/user/selectors";
import applyActions from "../../../actions/gig-apply/creators";
import { GIG_LIST_ROUTE } from "../../../constants/routes";
import { makeGigApplicationStatusPath } from "../../../utils/url";
import { clearReferralCookie, setAppliedStorage } from "../../../utils/referral";

const SubmissionResult = () => {
  const { data, error } = useSelector(applySelectors.getApplication);
  const { jobExternalId } = useSelector(detailsSelectors.getDetails);
  const profile = useSelector(userSelectors.getProfile);
  const dispatch = useDispatch();

  const onClickBtnApplyAgain = useCallback(() => {
    dispatch(applyActions.resetApplication());
  }, [dispatch]);

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
              <Button size="lg" onClick={onClickBtnApplyAgain}>
                APPLY AGAIN
              </Button>
            )}
            <LinkButton primary size="lg" to={GIG_LIST_ROUTE}>
              VIEW OTHER GIGS
            </LinkButton>
          </>
        ) : (
          <>
            <LinkButton size="lg" to={GIG_LIST_ROUTE}>
              GO TO GIGS LIST
            </LinkButton>
            <LinkButton primary size="lg" to={makeGigApplicationStatusPath(jobExternalId)}>
              CHECK GIG APPLICATION STATUS
            </LinkButton>
          </>
        )}
      </div>
    </div>
  );
};

export default SubmissionResult;
