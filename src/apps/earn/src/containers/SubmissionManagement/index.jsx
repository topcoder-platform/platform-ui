import React, { useEffect, useLayoutEffect, useRef } from "react";
import PT from "prop-types";
import _ from "lodash";
import { useNavigate } from "react-router-dom";
import { connect } from "react-redux";
import Button from "../../components/Buttons";
import Modal from "../../components/Modal";
import LoadingIndicator from "../../components/LoadingIndicator";
import MySubmissions from "./MySubmissions";
import AccessDenied from "../../components/AccessDenied";
import config from "../../config";
import { ACCESS_DENIED_REASON, CHALLENGES_URL } from "../../constants";
import actions from "../../actions";
import { isLegacyId, isUuid } from "../../utils/challenge";
import { withRouter } from "../../utils/router";

import styles from "./styles.scss";
import { styled as styledCss } from "../../utils";
const styled = styledCss(styles)

const SubmissionManagement = ({
  id,
  challengeId,
  challengeLegacyId,
  challengeTrack,
  challengeName,
  challengeStatus,
  challengePhases,

  isDeletingSubmission,
  isLoadingChallenge,
  isChallengeLoaded,
  isLoadingMySubmissions,
  isRegistered,

  mySubmissions,
  submissionPhaseStartDate,
  showDetails,
  showModal,
  toBeDeletedId,

  onShowDetails,
  onSubmissionDelete,
  onCancelSubmissionDelete,
  onSubmissionDeleteConfirmed,
  onDownloadSubmission,
  getChallenge,
  getMySubmissions,
}) => {
  const navigate = useNavigate();
  const propsRef = useRef();
  propsRef.current = {
    id,
    challengeId,
    challengeLegacyId,
    getChallenge,
    getMySubmissions,
  };

  useLayoutEffect(() => {
    const didChallengeLoaded =
      propsRef.current.challengeId &&
      `${propsRef.current.challengeId}` === `${propsRef.current.id}`;
    if (didChallengeLoaded) {
      propsRef.current.getMySubmissions(propsRef.current.id);
      return;
    }

    if (isLegacyId(propsRef.current.id)) {
      propsRef.current.getChallenge(propsRef.current.id);
    } else if (isUuid(propsRef.current.id)) {
      propsRef.current.getChallenge(propsRef.current.id);
      propsRef.current.getMySubmissions(propsRef.current.id);
    } else {
      navigate(CHALLENGES_URL);
    }
  }, []);

  useEffect(() => {
    if (isChallengeLoaded && isLegacyId(propsRef.current.id)) {
      navigate(
        `${CHALLENGES_URL}/${propsRef.current.challengeId}/my-submissions`
      );
      propsRef.current.getMySubmissions(propsRef.current.challengeId);
    }
  }, [isChallengeLoaded]);

  if (isLoadingChallenge) {
    return <LoadingIndicator />;
  }

  if (!isChallengeLoaded) {
    return null;
  }

  if (!isRegistered) {
    return (
      <AccessDenied
        redirectLink={`${CHALLENGES_URL}/${challengeId}`}
        cause={ACCESS_DENIED_REASON.HAVE_NOT_SUBMITTED_TO_THE_CHALLENGE}
      />
    );
  }

  const isEmpty = _.isEmpty(challengeName);
  const modal = (
    <Modal onCancel={isDeletingSubmission ? _.noop : onCancelSubmissionDelete}>
      <div className={styled("modal-content")}>
        <p className={styled("are-you-sure")}>
          Are you sure you want to delete submission{" "}
          <span className={styled("id")}>{toBeDeletedId}</span>?
        </p>
        <p className={styled("remove-warn")}>
          This will permanently remove all files from our servers and can’t be
          undone. You’ll have to upload all the files again in order to restore
          it.
        </p>
        <div
          className={styled("deletingIndicator", isDeletingSubmission ? "" : "hidden")}
        >
          <LoadingIndicator />
        </div>
        <div
          className={styled("action-btns", isDeletingSubmission ? "hidden" : "")}
        >
          <Button
            className="tc-btn-sm tc-btn-default"
            onClick={() => onCancelSubmissionDelete()}
          >
            Cancel
          </Button>
          <Button
            className="tc-btn-sm tc-btn-warning"
            onClick={() => onSubmissionDeleteConfirmed(toBeDeletedId)}
          >
            Delete Submission
          </Button>
        </div>
      </div>
    </Modal>
  );

  return (
    <div className={styled("outer-container")}>
      <div className={styled("submission-management-container")} role="main">
        {!isEmpty && (
          <MySubmissions
            challengeId={challengeId}
            challengeTrack={challengeTrack}
            challengeName={challengeName}
            challengeStatus={challengeStatus}
            challengePhases={challengePhases}
            loadingSubmissions={isLoadingMySubmissions}
            submissions={mySubmissions}
            showDetails={showDetails}
            submissionPhaseStartDate={submissionPhaseStartDate}
            onShowDetails={onShowDetails}
            onDelete={onSubmissionDelete}
            onDownload={onDownloadSubmission}
            helpPageUrl={config.URL.HELP}
            isDeletingSubmission={isDeletingSubmission}
          />
        )}
        {showModal && modal}
      </div>
    </div>
  );
};

SubmissionManagement.defaultProps = {};

SubmissionManagement.propTypes = {
  id: PT.string,
  challengeId: PT.string,
  challengeLegacyId: PT.number,
  challengeTrack: PT.string,
  challengeName: PT.string,
  challengeStatus: PT.string,
  challengePhases: PT.arrayOf(PT.shape()),

  isDeletingSubmission: PT.bool,
  isLoadingChallenge: PT.bool,
  isChallengeLoaded: PT.bool,
  isLoadingMySubmissions: PT.bool,
  isRegistered: PT.bool,

  mySubmissions: PT.arrayOf(PT.shape()),
  submissionPhaseStartDate: PT.string,
  showDetails: PT.shape({}),
  showModal: PT.bool,
  toBeDeletedId: PT.string,

  onShowDetails: PT.func,
  onSubmissionDelete: PT.func,
  onCancelSubmissionDelete: PT.func,
  onSubmissionDeleteConfirmed: PT.func,
  onDownloadSubmission: PT.func,
  getChallenge: PT.func,
  getMySubmissions: PT.func,
};

const mapStateToProps = (state, ownProps) => {
  const challenge = (state.challenge && state.challenge.challenge) || {};
  const allPhases = challenge.phases || [];
  const submissionPhase =
    allPhases.find(
      (phase) =>
        ["Submission", "Checkpoint Submission"].includes(phase.name) &&
        phase.isOpen
    ) || {};

  return {
    id: ownProps.params.challengeId,
    challengeId: challenge.id,
    challengeLegacyId: challenge.legacyId,
    challengeTrack: challenge.track,
    challengeName: challenge.name,
    challengeStatus: challenge.status,
    challengePhases: challenge.phases,

    isDeletingSubmission: state.submissionManagement.deletingSubmission,
    isLoadingChallenge: state.challenge.isLoadingChallenge,
    isChallengeLoaded: state.challenge.isChallengeLoaded,
    isLoadingMySubmissions: state.submissionManagement.isLoadingMySubmissions,
    isRegistered: challenge.isRegistered,

    mySubmissions: state.submissionManagement.mySubmissions,
    submissionPhaseStartDate:
      submissionPhase.actualStartDate ||
      submissionPhase.scheduledStartDate ||
      "",
    showDetails: state.submissionManagement.showDetails,
    showModal: state.submissionManagement.showModal,
    toBeDeletedId: state.submissionManagement.toBeDeletedId,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    onShowDetails: (submissionId) => {
      dispatch(
        actions.submissionManagement.mySubmissions.showDetails(submissionId)
      );
    },
    onSubmissionDelete: (submissionId) => {
      dispatch(
        actions.submissionManagement.mySubmissions.confirmDelete(submissionId)
      );
    },
    onCancelSubmissionDelete: () => {
      dispatch(actions.submissionManagement.mySubmissions.cancelDelete());
    },
    onSubmissionDeleteConfirmed: (submissionId) => {
      dispatch(
        actions.submissionManagement.mySubmissions.deleteSubmissionInit()
      );
      dispatch(
        actions.submissionManagement.mySubmissions.deleteSubmissionDone(
          submissionId
        )
      );
    },
    onDownloadSubmission: (challengeType, submissionId) => {
      dispatch(
        actions.submissionManagement.mySubmissions.downloadSubmissionDone(
          challengeType,
          submissionId
        )
      );
    },
    getChallenge: (challengeId) => {
      dispatch(actions.challenge.getChallengeInit());
      dispatch(actions.challenge.getChallenge(challengeId));
    },
    getMySubmissions: (challengeId) => {
      dispatch(
        actions.submissionManagement.mySubmissions.getMySubmissionsInit()
      );
      dispatch(
        actions.submissionManagement.mySubmissions.getMySubmissionsDone(
          challengeId
        )
      );
    },
  };
};

export default withRouter(connect(
  mapStateToProps,
  mapDispatchToProps
)(SubmissionManagement));
