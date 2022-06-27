/**
 * Style Options component
 */
import classNames from "classnames";
import PT from "prop-types";
import React from "react";
import _ from "lodash";
import LikeIcon from "../../../../assets/images/thumbsup.svg";
import DislikeIcon from "../../../../assets/images/thumbsdown.svg";
import PageDivider from "../../../../components/PageDivider";
import "./styles.module.scss";
import Modal from "components/Modal";
import useCheckMobileScreen from "../../../../hooks/useCheckMobileScreen";

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
      <div styleName="styleWrapper">
        <div styleName={classNames("style", style.className)}>
          <div styleName="name">
            <span>{style.name}</span> &nbsp;
          </div>
          <PageDivider />
          <div styleName="description">
            <span>{style.description}</span>
          </div>
          <div styleName="box">
            <div styleName="preview" />
            <div styleName="actions">
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
                styleName={_.includes(likes, style.name) ? "liked" : null}
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
                styleName={_.includes(dislikes, style.name) ? "disliked" : null}
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
