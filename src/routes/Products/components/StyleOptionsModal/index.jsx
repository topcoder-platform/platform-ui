/**
 * Style Options component
 */
import classNames from "classnames";
import PT from "prop-types";
import React from "react";
import _ from "lodash";

import { ReactComponent as LikeIcon } from "../../../../assets/images/thumbsup.svg";
import { ReactComponent as DislikeIcon } from "../../../../assets/images/thumbsdown.svg";
import PageDivider from "../../../../components/PageDivider";
import Modal from "../../../../components/Modal";
import useCheckMobileScreen from "../../../../hooks/useCheckMobileScreen";

import styles from "./styles.module.scss";

const StylesOptionsModal = ({
  onDismiss,
  style,
  likes = [],
  dislikes = [],
  onLike,
  onDislike,
}) => {
  const isMobile = useCheckMobileScreen();
  const modalWidth = isMobile ? { fullWidth: true } : { halfWidth: true };
  return (
    <Modal show={true} {...modalWidth} handleClose={onDismiss}>
      <div className={styles["styleOptions"]}>
        <div className={classNames(styles["style"], styles[style.className])}>
          <div className={styles["name"]}>
            <span>{style.name}</span> &nbsp;
          </div>
          <PageDivider />
          <div className={styles["description"]}>
            <span>{style.description}</span>
          </div>
          <div className={styles["box"]}>
            <div className={styles["preview"]} />
            <div className={styles["actions"]}>
              <LikeIcon
                role="button"
                onClick={() => {
                  if (likes.includes(style.name)) {
                    onLike(likes.filter((s) => s !== style.name));
                  } else {
                    onLike([...likes, style.name]);
                    if (dislikes.includes(style.name)) {
                      onDislike(dislikes.filter((s) => s !== style.name));
                    }
                  }
                }}
                className={_.includes(likes, style.name) ? styles["liked"] : null}
              />
              <DislikeIcon
                role="button"
                onClick={() => {
                  if (dislikes.includes(style.name)) {
                    onDislike(dislikes.filter((s) => s !== style.name));
                  } else {
                    onDislike([...dislikes, style.name]);
                    if (likes.includes(style.name)) {
                      onLike(likes.filter((s) => s !== style.name));
                    }
                  }
                }}
                className={_.includes(dislikes, style.name) ? styles["disliked"] : null}
              />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

StylesOptionsModal.defaultProps = {};

StylesOptionsModal.propTypes = {
  likes: PT.arrayOf(PT.string),
  dislikes: PT.arrayOf(PT.string),
  onLike: PT.func,
  onDislike: PT.func,
};

export default StylesOptionsModal;
