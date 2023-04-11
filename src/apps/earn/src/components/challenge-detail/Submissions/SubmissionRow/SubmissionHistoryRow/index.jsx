/* eslint jsx-a11y/no-static-element-interactions:0 */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/**
 * SubmissionHistoryRow component.
 */

import React from "react";
import PT from "prop-types";
import moment from "moment";
// import Completed from '../../../icons/completed.svg';
import Failed from "../../../icons/failed.svg";
import InReview from "../../../icons/in-review.svg";
import Queued from "../../../icons/queued.svg";

import styles from "./style.module.scss";
import { styled as styledCss } from "@earn/utils";
const styled = styledCss(styles)

export default function SubmissionHistoryRow({
  isMM,
  submission,
  finalScore,
  provisionalScore,
  submissionTime,
  isReviewPhaseComplete,
  onShowPopup,
  submissionId,
  status,
  member,
}) {
  const getInitialReviewResult = () => {
    if (provisionalScore && provisionalScore < 0) return <Failed />;
    switch (status) {
      case "completed":
        return provisionalScore;
      case "in-review":
        return <InReview />;
      case "queued":
        return <Queued />;
      case "failed":
        return <Failed />;
      default:
        return provisionalScore;
    }
  };
  const getFinalScore = () => {
    if (isMM && finalScore && finalScore > -1 && isReviewPhaseComplete) {
      return finalScore;
    }
    return "-";
  };

  return (
    <div className={styled("container")}>
      <div className={styled("row no-border")}>
        {isMM ? <div className={styled("col-1 col child")} /> : null}
        <div className={styled("col-2 col child")}>{submission}</div>
        <div className={styled("col-3 col")}>
          <div className={styled("col child")}>{getFinalScore()}</div>
          <div className={styled("col child")}>{getInitialReviewResult()}</div>
        </div>
        <div className={styled(`col-4 col history-time ${isMM ? "mm" : ""}`)}>
          <div className={styled("col child")}>
            {moment(submissionTime).format("DD MMM YYYY")}{" "}
            {moment(submissionTime).format("HH:mm:ss")}
          </div>
        </div>
        {isMM && (
          <div className={styled("col-5 col")}>
            <div
              role="button"
              tabIndex={0}
              className={styled("col child")}
              onClick={() => onShowPopup(true, submissionId, member)}
            >
              View Details
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

SubmissionHistoryRow.defaultProps = {
  finalScore: null,
  provisionalScore: null,
  isReviewPhaseComplete: false,
};

SubmissionHistoryRow.propTypes = {
  member: PT.string.isRequired,
  isMM: PT.bool.isRequired,
  submission: PT.number.isRequired,
  finalScore: PT.oneOfType([PT.number, PT.string]),
  status: PT.string,
  provisionalScore: PT.oneOfType([PT.number, PT.string]),
  submissionTime: PT.string.isRequired,
  isReviewPhaseComplete: PT.bool,
  submissionId: PT.string.isRequired,
  onShowPopup: PT.func.isRequired,
};
