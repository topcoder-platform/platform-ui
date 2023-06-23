/**
 * Style Options component
 */
import classNames from "classnames";
import PT from "prop-types";
import _ from "lodash";

import { BaseModal } from "~/libs/ui";

import { ReactComponent as LikeIcon } from "../../../assets/images/thumbsup.svg";
import { ReactComponent as DislikeIcon } from "../../../assets/images/thumbsdown.svg";

import styles from "./styles.module.scss";

const StylesOptionsModal = ({
  onDismiss,
  style,
  likes = [],
  dislikes = [],
  onLike,
  onDislike,
}) => (
  <BaseModal
      open
      size="lg"
      onClose={onDismiss}
      title={style.name}
  >
    <div className={styles["styleWrapper"]}>
      <div className={classNames(styles["style"], styles[style.className])}>
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
  </BaseModal>
);

StylesOptionsModal.defaultProps = {};

StylesOptionsModal.propTypes = {
  likes: PT.arrayOf(PT.string),
  dislikes: PT.arrayOf(PT.string),
  onLike: PT.func,
  onDislike: PT.func,
};

export default StylesOptionsModal;
