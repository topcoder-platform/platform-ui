import React from "react";
import PT from "prop-types";

import styles from "./styles.scss";
import { styled as styledCss } from "@earn/utils";
const styled = styledCss(styles)

const ScreeningStatus = ({ screening, onShowDetails, submissionId }) => {
  const hasWarnings = screening.warnings;
  const hasStatus = screening.status;
  const hasStatusPassed = hasStatus === "passed";
  const hasStatusFailed = hasStatus === "failed";
  const hasPending = screening.status === "pending";
  const warnLength = screening.warnings && hasWarnings.length;

  let className;
  if (hasPending) {
    className = "pending";
  } else if (hasStatusPassed && !hasWarnings) {
    className = "pass-with-no-warn";
  } else if (hasStatusFailed && !hasWarnings) {
    className = "fail-with-no-warn";
  } else {
    className = "has-warn";
  }

  let statusClassName;
  if (hasStatusPassed && hasWarnings) {
    statusClassName = "passed";
  } else if (hasStatusFailed && hasWarnings) {
    statusClassName = "failed";
  } else {
    statusClassName = "";
  }

  return (
    <button onClick={() => onShowDetails(submissionId)} type="button">
      <div className={styled(`screening-status ${className}`)}>
        {/* status */}
        {hasStatus && !hasPending ? (
          <span className={styled(`status ${statusClassName}`)}>
            {hasStatus.substring(0, hasStatus.indexOf("ed"))}
          </span>
        ) : (
          <span>Not yet performed</span>
        )}
        {/* pending */}
        {/* warning */}
        {hasWarnings && (
          <span className={styled("warning")}>
            {`${warnLength} `}
            {warnLength > 1 ? " warnings" : "warning"}
          </span>
        )}
      </div>
    </button>
  );
};

ScreeningStatus.defaultProps = {};

ScreeningStatus.propTypes = {
  screening: PT.shape(),
  onShowDetails: PT.func,
  submissionId: PT.string,
};

export default ScreeningStatus;
