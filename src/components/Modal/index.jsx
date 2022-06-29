/**
 * Modal
 *
 * Modal
 */
import cn from "classnames";
import React from "react";
import PT from "prop-types";

import styles from "./styles.module.scss";
import { ReactComponent as  IconCross} from "../../assets/images/icon-cross.svg";

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
      <div className={styles["modalContainer"]}>
        <div
          className={styles["modalBackground"]}
          onClick={(e) => handleClose(e)}
          role="button"
          tabIndex={0}
        ></div>

        <div
          className={cn(
            styles["modalContent"],
            fullWidth ? styles["full-width"] : "",
            halfWidth ? styles["half-width"] : ""
          )}
        >
          <div className={styles["stickyHeader"]}>
            <div className={styles.titleContainer}>{title}</div>
            {!hideClose && (
              <IconCross
                className={styles["modalCloseBtn"]}
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
