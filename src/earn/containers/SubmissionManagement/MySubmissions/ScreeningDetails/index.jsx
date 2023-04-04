import React from "react";
import PT from "prop-types";

import "./styles.scss";

const ScreeningDetails = ({ screening, helpPageUrl }) => {
  const hasWarnings = screening.warnings;
  const hasStatus = screening.status;
  const hasStatusPassed = hasStatus === "passed";
  const hasStatusFailed = hasStatus === "failed";
  const hasPending = screening.status === "pending";
  const warnLength = screening.warnings && hasWarnings.length;

  let statusInfo;
  if (hasPending) {
    statusInfo = {
      title: "Pending",
      classname: "pending",
      message:
        "Your submission has been received, and will be screened after the end of the phase",
    };
  } else if (hasStatusPassed && !hasWarnings) {
    statusInfo = {
      title: "Passed Screening",
      classname: "passed",
      message: "You have passed screening.",
    };
  } else if (hasStatusFailed && !hasWarnings) {
    statusInfo = {
      title: "Failed Screening",
      classname: "failed",
      message: "You have failed screening",
    };
  } else if (hasStatusPassed && hasWarnings) {
    statusInfo = {
      title: "Passed Screening with Warnings",
      classname: "passed",
      message: `You have passed screening, but the screener has given you ${warnLength} warnings that you must fix in round 2.`,
    };
  } else if (hasStatusFailed && hasWarnings) {
    statusInfo = {
      title: "Failed Screening with Warnings",
      classname: "failed",
      message:
        "You have failed screening and the screener has given you the following warning.",
    };
  } else {
    statusInfo = {
      title: "",
      classname: "",
      message:
        "Your submission has been received, and will be evaluated during Review phase.",
    };
  }

  const warnings = (screening.warnings || []).map((warning, i) => (
    <div styleName="screening-warning" key={`${warning.brief}-${i}`}>
      <div styleName="warning-bold">
        <span>Warning</span> {`${1 + i} : ${warning.brief}`}
      </div>
      <p>{warning.details}</p>
    </div>
  ));

  return (
    <div styleName="screening-details">
      <div styleName="screening-details-head">
        <p styleName={`status-title ${statusInfo.classname}`}>
          {statusInfo.title}
        </p>
      </div>
      <p>{statusInfo.message}</p>
      <div styleName="screening-warning">
        {warnings}
        {(hasStatusFailed || (hasStatusPassed && hasWarnings)) && (
          <p styleName="more-info">
            Need more info on how to pass screening? Go to help to read Rules &
            Policies.
          </p>
        )}
        <div styleName="help-btn">
          <a
            href={helpPageUrl}
            styleName="help-link"
            className="tc-btn-default"
          >
            Help
          </a>
        </div>
      </div>
    </div>
  );
};

ScreeningDetails.defaultProps = {
  screening: {},
};

ScreeningDetails.propTypes = {
  screening: PT.shape({}),
  helpPageUrl: PT.string,
};

export default ScreeningDetails;
