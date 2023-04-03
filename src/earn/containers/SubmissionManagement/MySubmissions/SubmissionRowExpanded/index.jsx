import React from "react";
import PT from "prop-types";
import ScreeningDetails from "../ScreeningDetails";

import "./styles.scss";

const SubmissionRowExpanded = ({
  submission,
  showScreeningDetails,
  helpPageUrl,
}) => {
  return (
    <tr key={submission.id} styleName="submission-row">
      {showScreeningDetails && (
        <td colSpan="6" styleName="dev-details">
          <ScreeningDetails
            screening={submission.screening}
            helpPageUrl={helpPageUrl}
          />
        </td>
      )}
    </tr>
  );
};

SubmissionRowExpanded.defaultProps = {};

SubmissionRowExpanded.propTypes = {
  submission: PT.shape({}),
  showScreeningDetails: PT.bool,
  helpPageUrl: PT.string,
};

export default SubmissionRowExpanded;
