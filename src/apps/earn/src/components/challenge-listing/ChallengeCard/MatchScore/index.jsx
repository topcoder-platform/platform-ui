import PT from "prop-types";
import React from "react";
import { DevelopmentTrackEventTag } from "../../../../components/UiKit";
import styles from "./style.scss";
import { styled as styledCss } from "@earn/utils";
const styled = styledCss(styles)

export default function MatchScore({ score }) {
  return (
    <div className={styled("matchScoreTag")}>
      <DevelopmentTrackEventTag>{score}% match</DevelopmentTrackEventTag>
    </div>
  );
}

MatchScore.defaultProps = {
  score: 0,
};

MatchScore.propTypes = {
  score: PT.number,
};
