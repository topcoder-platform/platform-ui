import cn from "classnames";

import { BaseModal, Button } from "~/libs/ui";

import modalStyles from "../../../styles/_modal.scss";

import styles from "./styles.scss";

const EqualityPolicyModal = ({ onClose, open }) => {
  return (
    <BaseModal
      onClose={onClose}
      open={open}
      size="lg"
    >
      <div className={modalStyles.title}>
        Equal Employment Opportunity Policy
      </div>
      <div className={modalStyles.content}>
        <p>
          Our company and our clients do not discriminate in employment on the
          basis of race, color, religion, sex (including pregnancy and gender
          identity), national origin, political affiliation, sexual orientation,
          marital status, disability, genetic information, age, membership in an
          employee organization, retaliation, parental status, military service,
          or other non-merit factors.
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

export default EqualityPolicyModal;
