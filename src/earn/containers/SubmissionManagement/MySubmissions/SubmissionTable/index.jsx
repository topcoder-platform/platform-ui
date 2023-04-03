import React from "react";
import PT from "prop-types";
import moment from "moment";
import { COMPETITION_TRACKS } from "../../../../constants";
import SubmissionRow from "../SubmissionRow";
import SubmissionRowExpanded from "../SubmissionRowExpanded";

import "./styles.scss";

const SubmissionTable = ({
  submissions,
  showDetails,
  track,
  onDelete,
  helpPageUrl,
  onDownload,
  onShowDetails,
  status,
  submissionPhaseStartDate,
}) => {
  const headerRow = (
    <tr>
      <th>ID </th>
      <th>Type</th>
      <th>Submission Date</th>
      {track === COMPETITION_TRACKS.DES && (
        <th styleName="status">Screening Status</th>
      )}
      <th styleName="actions">Actions</th>
    </tr>
  );

  const emptyRow = (
    <tr styleName="submission-row">
      <td colSpan="6" styleName="no-submission">
        You have no submission uploaded so far.
      </td>
    </tr>
  );

  return (
    <div styleName="submissions-table">
      <table>
        <thead>{headerRow}</thead>
        <tbody>
          {!submissions || submissions.length === 0
            ? emptyRow
            : submissions.map((submission) => [
                <SubmissionRow
                  submission={submission}
                  showScreeningDetails={showDetails[submission.id]}
                  track={track}
                  onShowDetails={onShowDetails}
                  onDelete={onDelete}
                  onDownload={onDownload}
                  status={status}
                  key={`${submission.id}-row`}
                  // submissionPhaseStartDate will be the start date of
                  // the current submission/checkpoint or empty string if any other phase
                  allowDelete={
                    submissionPhaseStartDate &&
                    moment(submission.submissionDate).isAfter(
                      submissionPhaseStartDate
                    )
                  }
                />,
                <SubmissionRowExpanded
                  submission={submission}
                  showScreeningDetails={showDetails[submission.id]}
                  helpPageUrl={helpPageUrl}
                  key={`${submission.id}-expanded-row`}
                />,
              ])}
        </tbody>
      </table>
    </div>
  );
};

SubmissionTable.defaultProps = {};

SubmissionTable.propTypes = {
  submissions: PT.arrayOf(PT.shape()),
  showDetails: PT.shape({}),
  track: PT.string,
  onDelete: PT.func,
  helpPageUrl: PT.string,
  onDownload: PT.func,
  onShowDetails: PT.func,
  status: PT.string,
  submissionPhaseStartDate: PT.string,
};

export default SubmissionTable;
