import modalStyles from "../../styles/_modal.scss";
import cn from "classnames";

import { BaseModal, Button, LinkButton } from "~/libs/ui";

import { LoadingCircles } from "~/libs/ui";
import { GIG_LIST_ROUTE } from "../../constants";

import styles from "./styles.scss";

const ReferralEmailModal = ({ error, isBusy, isUserError, onClose, open }) => (
  <BaseModal
    onClose={onClose}
    open={open}
    size="md"
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
          <Button
            primary
            size="lg"
            className={modalStyles.button}
            onClick={onClose}
          >
            CLOSE
          </Button>
          <LinkButton
            size="lg"
            secondary
            className={modalStyles.button}
            to={GIG_LIST_ROUTE}
          >
            FIND ANOTHER GIG
          </LinkButton>
        </div>
      </>
    )}
  </BaseModal>
);

export default ReferralEmailModal;
