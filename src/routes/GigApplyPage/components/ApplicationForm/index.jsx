import styles from "./styles.scss";
import React, { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { ReactComponent as IconCornerLeft } from "../../../../assets/icons/icon-corner-left-green.svg";
import { ReactComponent as IconTickCircled } from "../../../../assets/icons/icon-tick-circled.svg";
import GigsButton from "../../../../components/GigsButton";
import LoadingCircles from "../../../../components/LoadingCircles";
import PersonalInfo from "../PersonalInfo";
import TopcoderInfo from "../TopcoderInfo";
import PayExpectations from "../PayExpectations";
import ResumeAndSkills from "../ResumeAndSkills";
import FinalQuestions from "../FinalQuestions";
import TermsAndPolicies from "../TermsAndPolicies";
import SubmissionResult from "../SubmissionResult";
import * as myGigsSelectors from "../../../../reducers/gigs/myGigsSelectors";
import * as detailsSelectors from "../../../../reducers/gigs/gigDetails/selectors";
import * as applySelectors from "../../../../reducers/gigs/gigApply/selectors";
import applyActions from "../../../../actions/gigs/gigApply/creators";
import * as applyEffectors from "../../../../actions/gigs/gigApply/effectors";
import { makeGigPath } from "../../../../utils/gigs/url";
import { preventDefault } from "../../../../utils/gigs/misc";

const SubmissionForm = () => {
  const hasProfile = useSelector(myGigsSelectors.getHasProfile);

  const onClickBtnApply = useCallback(() => {
    applyEffectors.sendApplication();
  }, []);

  return (
    <form className={styles.form} action="#" onSubmit={preventDefault}>
      {hasProfile && (
        <div className={styles.hasProfileSection}>
          <div className={styles.hasProfileTitle}>
            It looks like you have applied to a gig previously. Perfect!
            <IconTickCircled className={styles.hasProfileIcon} />
          </div>
          <div className={styles.hasProfileMessage}>
            We have most of your information. Is there anything you would like
            to update to your Gig Work Profile?
          </div>
        </div>
      )}
      <PersonalInfo />
      {!hasProfile && <TopcoderInfo />}
      <PayExpectations />
      <ResumeAndSkills />
      <FinalQuestions />
      <TermsAndPolicies className={styles.termsAndPolicies} />
      <div className={styles.controls}>
        <GigsButton isPrimary size="lg" onClick={onClickBtnApply}>
          APPLY TO THIS JOB
        </GigsButton>
      </div>
    </form>
  );
};

const ApplicationForm = () => {
  const { data, error, isSending } = useSelector(applySelectors.getApplication);
  const { jobExternalId, title } = useSelector(detailsSelectors.getDetails);

  const dispatch = useDispatch();

  useEffect(() => {
    return () => {
      dispatch(applyActions.resetForm());
    };
  }, [dispatch]);

  return (
    <div className={styles.container}>
      <div className={styles.title}>{title}</div>
      <Link className={styles.backButton} to={makeGigPath(jobExternalId)}>
        <IconCornerLeft /> Gig Details
      </Link>
      {isSending ? (
        <>
          <LoadingCircles className={styles.loadingIndicator} />
          <div className={styles.message}>Processing your application...</div>
        </>
      ) : data || error ? (
        <SubmissionResult />
      ) : (
        <SubmissionForm />
      )}
    </div>
  );
};

export default ApplicationForm;
