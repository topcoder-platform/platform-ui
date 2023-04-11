/* eslint jsx-a11y/no-static-element-interactions:0 */
/**
 * SubmissionRow component.
 */

import React from "react";
import PT from "prop-types";
import _ from "lodash";
import moment from "moment";
import { getRatingLevel } from "../../../../utils/tc";
import config from "../../../../config";

import { ReactComponent as ArrowNext } from "../../../../assets/images/arrow-next.svg";
import Failed from "../../icons/failed.svg";
import InReview from "../../icons/in-review.svg";
import Queued from "../../icons/queued.svg";
import SubmissionHistoryRow from "./SubmissionHistoryRow";

import styles from "./style.module.scss";
import { styled as styledCss } from "@earn/utils";
const styled = styledCss(styles)

export default function SubmissionRow({
  isMM,
  openHistory,
  member,
  submissions,
  score,
  toggleHistory,
  isReviewPhaseComplete,
  finalRank,
  provisionalRank,
  onShowPopup,
  rating,
}) {
  const { submissionTime, provisionalScore, status } = submissions[0];
  let { finalScore } = submissions[0];
  finalScore =
    (!finalScore && finalScore < 0) || !isReviewPhaseComplete
      ? "-"
      : finalScore;
  let initialScore;
  if (provisionalScore >= 0 || provisionalScore === -1) {
    initialScore = provisionalScore;
  }

  const getInitialReviewResult = () => {
    const s = isMM ? _.get(score, "provisional", initialScore) : initialScore;
    if (s && s < 0) return <Failed />;
    switch (status) {
      case "completed":
        return s;
      case "in-review":
        return <InReview />;
      case "queued":
        return <Queued />;
      case "failed":
        return <Failed />;
      default:
        return s;
    }
  };

  const getFinalReviewResult = () => {
    const s =
      isMM && isReviewPhaseComplete
        ? _.get(score, "final", finalScore)
        : finalScore;
    if (isReviewPhaseComplete) {
      if (s && s < 0) return 0;
      return s;
    }
    return "-";
  };

  return (
    <div className={styled("container")}>
      <div className={styled("row")}>
        {isMM ? (
          <div className={styled("col-1 col")}>
            <div className={styled("col col-left")}>
              {isReviewPhaseComplete ? finalRank || "-" : "-"}
            </div>
            <div className={styled("col")}>{provisionalRank || "-"}</div>
          </div>
        ) : null}
        <div className={styled("col-2 col")}>
          <span className={styled(`col level-${getRatingLevel(rating)}`)}>
            {rating || "-"}
          </span>
          <a
            href={`${config.URL.PLATFORM_WEBSITE}/profile/${member}`}
            target={`${_.includes(window.origin, "www") ? "_self" : "_blank"}`}
            rel="noopener noreferrer"
            className={styled(`col level-${getRatingLevel(rating)}`)}
          >
            {member || "-"}
          </a>
        </div>
        <div className={styled("col-3 col")}>
          <div className={styled("col col-left")}>{getFinalReviewResult()}</div>
          <div className={styled("col")}>{getInitialReviewResult()}</div>
          <div className={styled("col time")}>
            {moment(submissionTime).format("DD MMM YYYY")}{" "}
            {moment(submissionTime).format("HH:mm:ss")}
          </div>
        </div>
        <div className={styled("col-4 col")}>
          {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
          <a onClick={toggleHistory} onKeyPress={toggleHistory}>
            <span>
              <span className={styled("text")}>History ({submissions.length})</span>
              {openHistory ? (
                <ArrowNext className={styled("icon down")} />
              ) : (
                <ArrowNext className={styled("icon")} />
              )}
            </span>
          </a>
        </div>
      </div>
      {openHistory && (
        <div className={styled("history")}>
          <div>
            <div className={styled("row no-border history-head")}>
              {isMM ? <div className={styled("col-1 col")} /> : null}
              <div className={styled("col-2 col")}>Submission</div>
              <div className={styled("col-3 col")}>
                <div className={styled("col")} />
                <div className={styled("col")}>Final</div>
                <div className={styled("col")}>Provisional</div>
              </div>
              <div className={styled(`col-4 col ${isMM ? "mm" : ""}`)}>Time</div>
              {isMM && <div className={styled("col-5 col")}>&nbsp;</div>}
            </div>
          </div>
          {submissions.map((submissionHistory, index) => (
            <SubmissionHistoryRow
              isReviewPhaseComplete={isReviewPhaseComplete}
              isMM={isMM}
              submission={submissions.length - index}
              {...submissionHistory}
              key={submissionHistory.submissionId}
              onShowPopup={onShowPopup}
              member={member}
            />
          ))}
        </div>
      )}
    </div>
  );
}

SubmissionRow.defaultProps = {
  toggleHistory: () => {},
  score: {},
  isReviewPhaseComplete: false,
  finalRank: null,
  provisionalRank: null,
  rating: null,
};

SubmissionRow.propTypes = {
  isMM: PT.bool.isRequired,
  openHistory: PT.bool.isRequired,
  member: PT.string.isRequired,
  submissions: PT.arrayOf(
    PT.shape({
      provisionalScore: PT.oneOfType([PT.number, PT.string]),
      finalScore: PT.oneOfType([PT.number, PT.string]),
      initialScore: PT.oneOfType([PT.number, PT.string]),
      status: PT.string,
      submissionId: PT.string.isRequired,
      submissionTime: PT.string.isRequired,
    })
  ).isRequired,
  score: PT.shape({
    final: PT.oneOfType([PT.number, PT.string]),
    provisional: PT.oneOfType([PT.number, PT.string]),
  }),
  rating: PT.number,
  toggleHistory: PT.func,
  isReviewPhaseComplete: PT.bool,
  finalRank: PT.number,
  provisionalRank: PT.number,
  onShowPopup: PT.func.isRequired,
};
