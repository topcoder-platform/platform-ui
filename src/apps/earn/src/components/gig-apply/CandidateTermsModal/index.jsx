import cn from "classnames";

import { BaseModal, Button } from "~/libs/ui";

import styles from "./styles.scss";
import modalStyles from "../../../styles/_modal.scss";

import {
  RECRUIT_CRM_GDPR_URL,
  RECRUIT_CRM_PRIVACY_POLICY_URL,
  RECRUIT_CRM_URL,
  TOPCODER_PRIVACY_POLICY_URL,
} from "../../../constants";

const CandidateTermsModal = ({ onClose, open }) => {
  return (
    <BaseModal
      onClose={onClose}
      open={open}
      size="lg"
    >
      <div className={modalStyles.title}>Candidate Terms</div>
      <div className={modalStyles.content}>
        <p>
          Your Recruitment Partner Topcoder, will be storing your data in
          Recruit CRM to manage your information and send your profile to
          companies to present you for potential Gig Opportunities. You Can view
          Topcoder’s{" "}
          <a target="_blank" href={TOPCODER_PRIVACY_POLICY_URL} rel="noreferrer">
            privacy policy here
          </a>
          .
        </p>
        <p>
          <a target="_blank" href={RECRUIT_CRM_URL} rel="noreferrer">
            Recruit CRM
          </a>{" "}
          is a software system that helps recruitment firms manage their
          relationship with their clients. You can view Recruit CRMs{" "}
          <a target="_blank" href={RECRUIT_CRM_PRIVACY_POLICY_URL} rel="noreferrer">
            privacy policy
          </a>{" "}
          or{" "}
          <a target="_blank" href={RECRUIT_CRM_GDPR_URL} rel="noreferrer">
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
          primary
          size="lg"
          className={modalStyles.button}
          onClick={onClose}
        >
          CLOSE
        </Button>
      </div>
    </BaseModal>
  );
};

export default CandidateTermsModal;
