import React, { useEffect } from "react";
import PT from "prop-types";
import { DangerButton } from "../Buttons";
import Modal from "../Modal";

import styles from "./styles.scss";

const ErrorMessage = ({ title, details, onOk }) => {
  useEffect(() => {
    document.body.classList.add("scrolling-disabled-by-modal");

    return () => {
      document.body.classList.remove("scrolling-disabled-by-modal");
    };
  }, []);

  return (
    <Modal theme={{ container: styles.container }}>
      <p styleName="title">{title}</p>
      <p styleName="details">{details}</p>
      <p styleName="details">
        We are sorry that you have encountered this problem. Please, contact our
        support &zwnj;
        <a href="mailto:support@topcoder.com">support@topcoder.com</a>
        &zwnj; to help us resolve it as soon as possible.
      </p>
      <DangerButton
        onClick={(e) => {
          e.preventDefault();
          onOk();
        }}
      >
        OK
      </DangerButton>
    </Modal>
  );
};

ErrorMessage.defaultProps = {
  details: "",
};

ErrorMessage.propTypes = {
  title: PT.string.isRequired,
  details: PT.string,
  onOk: PT.func.isRequired,
};

export default ErrorMessage;
