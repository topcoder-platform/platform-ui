/**
 * Style Options component
 */
import classNames from "classnames";
import PT from "prop-types";
import _ from "lodash";

import { ReactComponent as LikeIcon } from "../../../assets/images/thumbsup.svg";
import { ReactComponent as DislikeIcon } from "../../../assets/images/thumbsdown.svg";
import styles from "../../../assets/data/website-design-styles.json";
import { HelpIcon } from "../../help-icon";

import moduleStyles from "./styles.module.scss";

const StyleOptions = ({
  likes = [],
  dislikes = [],
  onLike,
  onDislike,
  onSelect,
}) => {
  return (
    <div className={moduleStyles["styleOptions"]}>
      {styles.map((style, index) => (
        <div className={moduleStyles["styleWrapper"]} key={index}>
          <div className={classNames(moduleStyles["style"], moduleStyles[style.className])}>
            <div className={moduleStyles["name"]}>
              <span>{style.name}</span> &nbsp;
              <HelpIcon>
                {style.description}
              </HelpIcon>
            </div>
            <div className={moduleStyles["box"]}>
              <div
                className={moduleStyles["preview"]}
                role="button"
                onClick={() => onSelect(style)}
              />
              <div className={moduleStyles["actions"]}>
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
                  className={_.includes(likes, style.name) ? moduleStyles["liked"] : null}
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
                  className={
                    _.includes(dislikes, style.name) ? moduleStyles["disliked"] : null
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
