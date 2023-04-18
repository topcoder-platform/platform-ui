import modalStyles from "../../styles/_modal.scss";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import cn from "classnames";

import { UiButton } from "~/libs/ui";

import { LoadingCircles } from "~/libs/ui";
import Modal from "../GigsModal";
import { GIG_LIST_ROUTE } from "../../constants";

import styles from "./styles.scss";

const ReferralEmailModal = ({ error, isBusy, isUserError, onClose, open }) => {
  const navigate = useNavigate();
  const onClickBtnFindAnoherGig = useCallback(() => {
    navigate(GIG_LIST_ROUTE);
  }, []);

  return (
    <Modal
      modalClassName={cn(modalStyles.modal, styles.modal)}
      overlayClassName={modalStyles.modalOverlay}
      onClose={onClose}
      open={open}
    >
      {isBusy ? (
        <>
          <div className={modalStyles.message}>Sending your referral...</div>
          <LoadingCircles className={styles.sendLoadingIndicator} />
        </>
      ) : (
        <>
          <div className={modalStyles.title}>
            {error ? "Oops!" : "Congratulations!"}
          </div>
          <div className={modalStyles.message}>
            {error ? error : "Your referral has been sent."}
          </div>
          {!!error &&
            (isUserError ? (
              <div className={styles.hint}>
                If you think this is an error please contact
                <br />
                <a href="mailto:support@topcoder.com">support@topcoder.com</a>.
              </div>
            ) : (
              <div className={styles.hint}>
                Looks like there is a problem on our end. Please try again.
                <br />
                If this persists please contact{" "}
                <a href="mailto:support@topcoder.com">support@topcoder.com</a>.
              </div>
            ))}
          <div className={cn(modalStyles.controls, styles.controls)}>
            <UiButton
              primary
              size="md"
              className={modalStyles.button}
              onClick={onClose}
            >
              CLOSE
            </UiButton>
            <UiButton
              size="md"
              className={modalStyles.button}
              onClick={onClickBtnFindAnoherGig}
            >
              FIND ANOTHER GIG
            </UiButton>
          </div>
        </>
      )}
    </Modal>
  );
};

export default ReferralEmailModal;
