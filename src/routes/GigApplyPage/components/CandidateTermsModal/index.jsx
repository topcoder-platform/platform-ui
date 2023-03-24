import styles from "./styles.scss";
import modalStyles from "styles/_modal.scss";
import React from "react";
import cn from "classnames";
import Button from "components/Button";
import Modal from "components/Modal";
import {
  RECRUIT_CRM_GDPR_URL,
  RECRUIT_CRM_PRIVACY_POLICY_URL,
  RECRUIT_CRM_URL,
  TOPCODER_PRIVACY_POLICY_URL,
} from "constants/urls";

const CandidateTermsModal = ({ onClose, open }) => {
  return (
    <Modal
      modalClassName={cn(modalStyles.modal, styles.modal)}
      overlayClassName={modalStyles.modalOverlay}
      onClose={onClose}
      open={open}
    >
      <div className={modalStyles.title}>Candidate Terms</div>
      <div className={modalStyles.content}>
        <p>
          Your Recruitment Partner Topcoder, will be storing your data in
          Recruit CRM to manage your information and send your profile to
          companies to present you for potential Gig Opportunities. You Can view
          Topcoder’s{" "}
          <a target="_blank" href={TOPCODER_PRIVACY_POLICY_URL}>
            privacy policy here
          </a>
          .
        </p>
        <p>
          <a target="_blank" href={RECRUIT_CRM_URL}>
            Recruit CRM
          </a>{" "}
          is a software system that helps recruitment firms manage their
          relationship with their clients. You can view Recruit CRMs{" "}
          <a target="_blank" href={RECRUIT_CRM_PRIVACY_POLICY_URL}>
            privacy policy
          </a>{" "}
          or{" "}
          <a target="_blank" href={RECRUIT_CRM_GDPR_URL}>
            GDPR
          </a>{" "}
          commitment on our website.
        </p>
        <p>
          Recruit CRM may store your data in a Data Centre inside or outside
          Europe.
        </p>
        <p>
          You can ask your recruiter at any point to delete your data or simply
          ask them for an “Update resume link” which you can use to update your
          profile information/resume or simply delete your data from their
          system.
        </p>
      </div>
      <div className={cn(modalStyles.controls, styles.controls)}>
        <Button
          isPrimary
          size="lg"
          className={modalStyles.button}
          onClick={onClose}
        >
          CLOSE
        </Button>
      </div>
    </Modal>
  );
};

export default CandidateTermsModal;
