import PT from "prop-types";

import styles from "./styles.module.scss";
import { styled as styledCss } from "../../../utils";
const styled = styledCss(styles)

function Checkpoints(props) {
  const { checkpoints, toggleCheckpointFeedback } = props;
  const { checkpointResults, generalFeedback } = checkpoints;

  return (
    <div className={styled("challenge-detail-checkpoints")}>
      <div className={styled("challenge-checkpoint-list")}>
        {checkpointResults &&
          checkpointResults.map((item, index) => (
            <button
              key={item.submissionId}
              className={styled("challenge-checkpoint-li")}
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementsByClassName(styles["challenge-checkpoint-winners"])
                  [index].scrollIntoView(true);
                toggleCheckpointFeedback(item.submissionId, true);
              }}
              type="button"
            >
              #{item.submissionId}
            </button>
          ))}
      </div>
      <div className={styled("challenge-checkpoint-detail")}>
        <h2>Checkpoint Winners & General Feedback</h2>
        <p
          dangerouslySetInnerHTML={{
            __html: generalFeedback || "",
          }}
        />
        {checkpointResults &&
          checkpointResults.map((item) => (
            <div
              key={item.submissionId}
              className={styled("challenge-checkpoint-winners")}
            >
              <button
                onClick={(e) => {
                  e.preventDefault();
                  toggleCheckpointFeedback(item.submissionId, !item.expanded);
                }}
                className={styled("challenge-checkpoint-submission")}
                type="button"
              >
                <span>
                  <span className={styled("feedback-text")}>Feedback </span>#
                  {item.submissionId}
                </span>
                <span className={styled("challenge-checkpoint-expander")}>
                  {item.expanded ? "-" : "+"}
                </span>
              </button>
              {item.expanded && (
                <p
                  className={styled("challenge-checkpoint-feedback")}
                  dangerouslySetInnerHTML={{
                    __html: item.feedback || "<span>Empty Feedback</span>",
                  }}
                />
              )}
            </div>
          ))}
      </div>
    </div>
  );
}

Checkpoints.propTypes = {
  checkpoints: PT.shape({
    checkpointResults: PT.arrayOf(PT.shape()).isRequired,
    generalFeedback: PT.string,
  }).isRequired,
  toggleCheckpointFeedback: PT.func.isRequired,
};

export default Checkpoints;
