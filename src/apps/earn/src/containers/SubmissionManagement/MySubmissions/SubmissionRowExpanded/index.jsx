import React from "react";
import PT from "prop-types";
import ScreeningDetails from "../ScreeningDetails";

import styles from "./styles.scss";
import { styled as styledCss } from "@earn/utils";
const styled = styledCss(styles)

const SubmissionRowExpanded = ({
  submission,
  showScreeningDetails,
  helpPageUrl,
}) => {
  return (
    <tr key={submission.id} className={styled("submission-row")}>
      {showScreeningDetails && (
        <td colSpan="6" className={styled("dev-details")}>
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
