import { useCallback } from "react";
import PT from "prop-types";

import GigsButton from "../GigsButton";
import GigsModal from "../GigsModal";
import { REFERRAL_PROGRAM_URL } from "../../constants";
import { makeLoginUrl, makeRegisterUrl } from "../../utils/url";

import styles from "./styles.scss";

/**
 * Displays a modal with "Login" and "Register" buttons which is displayed after
 * the user clicks the button in the ReferralBanner.
 *
 * @param {Object} props component properties
 * @returns {JSX.Element}
 */
const ReferralAuthModal = ({ onClose, open }) => {
  const onClickBtnLogin = useCallback(() => {
    window.location = makeLoginUrl(window.location.href);
  }, []);

  const onClickBtnRegister = useCallback(() => {
    window.open(makeRegisterUrl(window.location.href));
  }, []);

  return (
    <GigsModal
      modalClassName={styles.modal}
      overlayClassName={styles.modalOverlay}
      onClose={onClose}
      open={open}
    >
      <div className={styles["title"]}>Referral Program</div>
      <div className={styles["message"]}>Please login to receive your referral code.</div>
      <div className={styles["controls"]}>
        <GigsButton
          className={styles.button}
          isPrimary
          shade="dark"
          size="lg"
          onClick={onClickBtnLogin}
        >
          LOGIN
        </GigsButton>
        <GigsButton
          className={styles.button}
          shade="dark"
          size="lg"
          onClick={onClickBtnRegister}
        >
          REGISTER
        </GigsButton>
      </div>
      <div className={styles["hint"]}>
        Find out how the referral program works{" "}
        <a target="_blank" href={REFERRAL_PROGRAM_URL} rel="noreferrer">
          here
        </a>
        .
      </div>
    </GigsModal>
  );
};

ReferralAuthModal.propTypes = {
  onClose: PT.func.isRequired,
  open: PT.bool.isRequired,
};

export default ReferralAuthModal;
