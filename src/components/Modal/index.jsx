/**
 * Modal
 *
 * Modal
 */
import cn from "classnames";
import React from "react";
import PT from "prop-types";

import styles from "./styles.module.scss";
import IconCross from "../../assets/images/icon-cross.svg";

const Modal = ({
  children,
  fullWidth,
  halfWidth,
  handleClose = (f) => f,
  hideClose = false,
  show = false,
  title,
}) => {
  return (
    show && (
      <div styleName="modalContainer">
        <div
          styleName="modalBackground"
          onClick={(e) => handleClose(e)}
          role="button"
          tabIndex={0}
        ></div>

        <div
          styleName={cn(
            "modalContent",
            fullWidth ? "full-width" : "",
            halfWidth ? "half-width" : ""
          )}
        >
          <div styleName="stickyHeader">
            <div className={styles.titleContainer}>{title}</div>
            {!hideClose && (
              <IconCross
                styleName="modalCloseBtn"
                onClick={(e) => handleClose(e)}
              />
            )}
          </div>

          {children}
        </div>
      </div>
    )
  );
};

Modal.propTypes = {
  children: PT.node,
  handleClose: PT.func,
  hideClose: PT.bool,
  show: PT.bool,
  title: PT.string,
};

export default Modal;
