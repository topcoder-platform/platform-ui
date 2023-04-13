import React from "react";
import PT from "prop-types";
import moment from "moment";
import { EnvironmentConfig } from "~/config";

import { PrimaryButton } from "../../../components/Buttons";
import SubmissionTable from "./SubmissionTable";
import LoadingIndicator from "../../../components/LoadingIndicator";
import * as util from "../../../utils/challenge";

import styles from "./styles.scss";
import { styled as styledCss } from "../../../utils";
const styled = styledCss(styles)

const MySubmissions = ({
  challengeId,
  challengeTrack,
  challengeName,
  challengeStatus,
  challengePhases,
  submissions,
  loadingSubmissions,
  showDetails,
  submissionPhaseStartDate,
  onShowDetails,
  onDelete,
  onDownload,
  helpPageUrl,
  isDeletingSubmission,
}) => {
  const challengeType = challengeTrack.toLowerCase();
  const isDesign = challengeType === "design";
  const isDevelop = challengeType === "development";
  const currentPhase = util.currentPhase(challengePhases);
  const submissionPhase = util.submissionPhase(challengePhases);
  const submissionEndDate =
    submissionPhase && util.phaseEndDate(submissionPhase);

  const now = moment();
  const end = moment(currentPhase && currentPhase.scheduledEndDate);
  const diff = end.isAfter(now) ? end.diff(now) : 0;
  const timeLeft = moment.duration(diff);

  const [days, hours, minutes] = [
    timeLeft.get("days"),
    timeLeft.get("hours"),
    timeLeft.get("minutes"),
  ];

  const isLoadingOrDeleting = loadingSubmissions || isDeletingSubmission;

  return (
    <div className={styled("submission-management")}>
      {/* Header */}
      <div className={styled("submission-management-header")}>
        <div className={styled("left-col")}>
          <h4 className={styled("name")}>{challengeName}</h4>
          <a
            href={`${EnvironmentConfig.PLATFORMUI_URL}/earn/challenges/${challengeId}`}
            className={styled("back-btn")}
          >
            &lt; Back
          </a>
        </div>
        <div className={styled("right-col")}>
          {currentPhase && <p className={styled("round")}>{currentPhase.name}</p>}
          {challengeStatus !== "Completed" ? (
            <div>
              <p className={styled("time-left")}>
                {days > 0 && `${days}D`} {hours}H {minutes}M
              </p>
              <p className={styled("left-label")}>left</p>
            </div>
          ) : (
            <p className={styled("time-left")}>The challenge has ended</p>
          )}
        </div>
      </div>
      {/* Table */}
      <div className={styled("submission-management-content")}>
        <div className={styled("content-head")}>
          <p className={styled("title")}>Manage your submissions</p>
          {isDesign && currentPhase && (
            <p className={styled("round-ends")}>
              <span className={styled("ends-label")}>{currentPhase.name} Ends:</span>{" "}
              {end.format("dddd MM/DD/YY hh:mm A")}
            </p>
          )}
        </div>
        {isDesign && (
          <p className={styled("recommend-info")}>
            We always recommend to download your submission to check you
            uploaded the correct zip files and also verify the photos and fonts
            declarations. If you don’t want to see a submission, simply delete.
            If you have a new submission, use the Upload Submission button to
            add one at the top of the list.
          </p>
        )}
        {isDevelop && (
          <p className={styled("recommend-info")}>
            We always recommend to download your submission to check you
            uploaded the correct zip file. If you don’t want to see the
            submission, simply delete. If you have a new submission, use the
            Upload Submission button to overwrite the current one.
          </p>
        )}
        {isLoadingOrDeleting && <LoadingIndicator />}
        {!isLoadingOrDeleting && (
          <SubmissionTable
            submissions={submissions}
            showDetails={showDetails}
            track={challengeTrack}
            status={challengeStatus}
            submissionPhaseStartDate={submissionPhaseStartDate}
            helpPageUrl={helpPageUrl}
            onDelete={onDelete}
            onDownload={(submissionId) =>
              onDownload(challengeType, submissionId)
            }
            onShowDetails={onShowDetails}
          />
        )}
      </div>
      {/* Footer */}
      {now.isBefore(submissionEndDate) && (
        <div className={styled("btn-wrap")}>
          <PrimaryButton
            theme={{
              button: styles["add-sub-btn"],
            }}
            to={`${EnvironmentConfig.PLATFORMUI_URL}/earn/challenges/${challengeId}/submit`}
          >
            {!isDevelop || !submissions || submissions.length === 0
              ? "Add Submission"
              : "Update Submission"}
          </PrimaryButton>
        </div>
      )}
    </div>
  );
};

MySubmissions.defaultProps = {};

MySubmissions.propTypes = {
  challengeId: PT.string,
  challengeTrack: PT.string,
  challengeName: PT.string,
  challengeStatus: PT.string,
  challengePhases: PT.arrayOf(PT.shape()),
  submissions: PT.arrayOf(PT.shape()),
  loadingSubmissions: PT.bool,
  showDetails: PT.shape({}),
  submissionPhaseStartDate: PT.string,
  onShowDetails: PT.func,
  onDelete: PT.func,
  onDownload: PT.func,
  helpPageUrl: PT.string,
  isDeletingSubmission: PT.bool,
};

export default MySubmissions;
