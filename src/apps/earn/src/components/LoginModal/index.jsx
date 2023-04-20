import { useCallback } from "react";
import MediaQuery from "react-responsive";
import PT from "prop-types";
import cn from "classnames";

import { Button } from "~/libs/ui";

import Modal from "../../components/GigsModal";
import blobYellow from "../../assets/images/blob-yellow.svg";
import blobPurple from "../../assets/images/blob-purple.svg";
import progressBar from "../../assets/images/progress-bar.svg";
import progressBarMid from "../../assets/images/progress-bar-mid.svg";
import ProgressBarXS from "../../assets/images/progress-bar-mobile.svg";
import thinkingFaceMobile from "../../assets/images/thinking-face-mobile.svg";
import thinkingFace from "../../assets/images/thinking-face-laptop-tablet.svg";
import { makeLoginUrl, makeRegisterUrl } from "../../utils/url";
import modalStyles from "../../styles/_modal.scss";

import styles from "./styles.scss";

function LoginModal({ onClose, open }) {
  const onClickBtnRegister = useCallback(() => {
    window.open(makeRegisterUrl(window.location.href));
  }, []);

  return (
    <Modal
      modalClassName={cn(modalStyles.modal, styles.container)}
      overlayClassName={modalStyles.modalOverlay}
      onClose={onClose}
      open={open}
    >
      <div className={styles.loginRequired}>
        <img src={blobYellow} className={styles.blobYellow} alt="" />
        <img src={blobPurple} className={styles.blobPurple} alt="" />
        <h3 className={styles.title}>YAY! You are almost done!</h3>
        <p className={styles.loginMsg}>
          Looks like you&apos;re not a Topcoder member yet. Or maybe you&apos;re
          not logged in?
          <MediaQuery maxDeviceWidth={425}>
            <img
              src={thinkingFaceMobile}
              className={styles.thinkingFace}
              alt=""
            />
          </MediaQuery>
          <MediaQuery minDeviceWidth={426}>
            <img src={thinkingFace} className={styles.thinkingFace} alt="" />
          </MediaQuery>
          It&apos;s quick to register and it&apos;s free!
        </p>
        <MediaQuery minDeviceWidth={768}>
          <img src={progressBar} className={styles.progressBar} alt="" />
        </MediaQuery>
        <MediaQuery maxDeviceWidth={767} minDeviceWidth={630}>
          <img src={progressBarMid} className={styles.progressBar} alt="" />
        </MediaQuery>
        <MediaQuery maxDeviceWidth={629}>
          <img src={ProgressBarXS} className={styles.progressBar} alt="" />
        </MediaQuery>
        <div className={cn(modalStyles.controls, styles.controls)}>
          <Button primary size="md" onClick={onClickBtnRegister}>
            REGISTER NOW
          </Button>
        </div>
        <p className={styles.regTxt}>
          Already a member? <a href={makeLoginUrl(window.location.href)}>Login here</a>
        </p>
      </div>
    </Modal>
  );
}

LoginModal.defaultProps = {
  utmSource: "gig_listing",
};

LoginModal.propTypes = {
  utmSource: PT.string,
};

export default LoginModal;
