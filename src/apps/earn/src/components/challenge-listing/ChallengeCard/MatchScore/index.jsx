import PT from "prop-types";
import styles from "./style.scss";
import { styled as styledCss } from "@earn/utils";
import { DevelopmentTrackEventTag } from "../../../challenge-detail/Tags";
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
