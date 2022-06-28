/**
 * Style Options component
 */
import classNames from "classnames";
import PT from "prop-types";
import React from "react";
import _ from "lodash";
import { v4 as uuidV4 } from "uuid";
import LikeIcon from "../../../../assets/images/thumbsup.svg";
import DislikeIcon from "../../../../assets/images/thumbsdown.svg";
import styles from "../../../../assets/data/website-design-styles.json";
import HelpIcon from "../../../../components/HelpIcon";
import "./styles.module.scss";

const StyleOptions = ({
  likes = [],
  dislikes = [],
  onLike,
  onDislike,
  onSelect,
}) => {
  return (
    <div styleName="styleOptions">
      {styles.map((style, index) => (
        <div styleName="styleWrapper" key={uuidV4}>
          <div styleName={classNames("style", style.className)}>
            <div styleName="name">
              <span>{style.name}</span> &nbsp;
              <HelpIcon
                textColor="#f4f4f4"
                inverted
                backgroundColor="#000"
                arrowColor="#000"
              >
                {style.description}
              </HelpIcon>
            </div>
            <div styleName="box">
              <div
                styleName="preview"
                role="button"
                onClick={() => onSelect(style)}
              />
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
                  styleName={
                    _.includes(dislikes, style.name) ? "disliked" : null
                  }
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

StyleOptions.defaultProps = {};

StyleOptions.propTypes = {
  likes: PT.arrayOf(PT.string),
  dislikes: PT.arrayOf(PT.string),
  onLike: PT.func,
  onDislike: PT.func,
};

export default StyleOptions;
