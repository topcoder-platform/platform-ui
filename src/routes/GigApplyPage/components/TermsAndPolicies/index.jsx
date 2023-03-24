import styles from "./styles.scss";
import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Checkbox from "components/Checkbox";
import CandidateTermsModal from "../CandidateTermsModal";
import EqualityPolicyModal from "../EqualityPolicyModal";
import * as selectors from "reducers/gigApply/selectors";
import actions from "actions/gigApply/creators";

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
    <div className={className}>
      <div styleName="links">
        <div styleName="terms-field">
          <Checkbox
            className={styles.checkbox}
            checked={agreedTerms.value}
            isRequired
            name="agree"
            size="large"
            onChange={onSetAgreedTerms}
            onFocus={onFocusAgreedTerms}
            error={agreedTerms.error}
          />{" "}
          I agree to <button onClick={onClickTerms}>Candidate Terms</button> *
          {agreedTerms.error && (
            <div styleName="terms-error">{agreedTerms.error}</div>
          )}
        </div>
        <div styleName="policy-field">
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
