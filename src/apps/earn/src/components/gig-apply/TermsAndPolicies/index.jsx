import styles from "./styles.scss";
import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Checkbox from "../../Checkbox";
import CandidateTermsModal from "../CandidateTermsModal";
import EqualityPolicyModal from "../EqualityPolicyModal";
import * as selectors from "../../../reducers/gig-apply/selectors";
import actions from "../../../actions/gig-apply/creators";

const TermsAndPolicies = ({ className }) => {
  const agreedTerms = useSelector(selectors.getAgreedTerms);
  const [isOpenTermsModal, setIsOpenTermsModal] = useState(false);
  const [isOpenPolicyModal, setIsOpenPolicyModal] = useState(false);

  const dispatch = useDispatch();

  const onClickTerms = useCallback(() => {
    setIsOpenTermsModal(true);
  }, []);

  const onClickPolicy = useCallback(() => {
    setIsOpenPolicyModal(true);
  }, []);

  const onCloseTermsModal = useCallback(() => {
    setIsOpenTermsModal(false);
  }, []);

  const onClosePolicyModal = useCallback(() => {
    setIsOpenPolicyModal(false);
  }, []);

  const onSetAgreedTerms = useCallback(
    (value) => {
      dispatch(actions.setAgreedTerms(value));
    },
    [dispatch]
  );

  const onFocusAgreedTerms = useCallback(() => {
    dispatch(actions.touchAgreedTerms());
  }, [dispatch]);

  return (
    <div className={styles["className"]}>
      <div className={styles.links}>
        <div className={styles["terms-field"]}>
          <Checkbox
            className={styles.checkbox}
            checked={agreedTerms.value}
            isRequired
            name="agree"
            size="medium"
            onChange={onSetAgreedTerms}
            onFocus={onFocusAgreedTerms}
            error={agreedTerms.error}
          />{" "}
          I agree to <button onClick={onClickTerms}>Candidate Terms</button> *
          {agreedTerms.error && (
            <div className={styles["terms-error"]}>{agreedTerms.error}</div>
          )}
        </div>
        <div className={styles["policy-field"]}>
          View Our Equal{" "}
          <button onClick={onClickPolicy}>Employment Opportunty Policy</button>
        </div>
      </div>
      <CandidateTermsModal
        onClose={onCloseTermsModal}
        open={isOpenTermsModal}
      />
      <EqualityPolicyModal
        onClose={onClosePolicyModal}
        open={isOpenPolicyModal}
      />
    </div>
  );
};

export default TermsAndPolicies;
