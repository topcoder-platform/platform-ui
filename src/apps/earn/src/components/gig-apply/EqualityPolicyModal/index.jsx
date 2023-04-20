import cn from "classnames";

import { Button } from "~/libs/ui";

import Modal from "../../GigsModal";
import modalStyles from "../../../styles/_modal.scss";

import styles from "./styles.scss";

const EqualityPolicyModal = ({ onClose, open }) => {
  return (
    <Modal
      modalClassName={cn(modalStyles.modal, styles.modal)}
      overlayClassName={modalStyles.modalOverlay}
      onClose={onClose}
      open={open}
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
    </Modal>
  );
};

export default EqualityPolicyModal;
