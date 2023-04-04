import React, { useEffect, useLayoutEffect, useRef } from "react";
import PT from "prop-types";
import { connect } from "react-redux";
import { useNavigate } from "react-router-dom";
import { PrimaryButton } from "@earn/components/Buttons";
import AccessDenied from "@earn/components/AccessDenied";
import LoadingIndicator from "@earn/components/LoadingIndicator";
import { ACCESS_DENIED_REASON, CHALLENGES_URL } from "../../constants";
import Submit from "./Submit";
import actions from "../../actions";
import { isLegacyId, isUuid } from "../../utils/challenge";
import { logIn } from "../../utils/auth";
import { withRouter } from "../../utils/router";

const Submission = ({
  id,
  challengeId,
  challengeName,
  isRegistered,
  phases,
  status,
  winners,
  groups,
  isAuthInitialized,
  communityList,
  isCommunityListLoaded,
  getCommunityList,
  isLoadingChallenge,
  isChallengeLoaded,

  track,
  agreed,
  filePickers,
  submissionFilestackData,
  userId,
  handle,

  errorMsg,
  isSubmitting,
  submitDone,
  uploadProgress,

  getIsRegistered,
  getChallenge,
  submit,
  resetForm,
  setAgreed,
  setFilePickerError,
  setFilePickerFileName,
  setFilePickerUploadProgress,
  setFilePickerDragged,
  setSubmissionFilestackData,
  checkIsLoggedOut,
  setAuth,
}) => {
  const navigate = useNavigate();
  const propsRef = useRef();
  propsRef.current = {
    id,
    challengeId,
    getCommunityList,
    setAuth,
    getChallenge,
  };

  useLayoutEffect(() => {
    if (isLegacyId(propsRef.current.id) || isUuid(propsRef.current.id)) {
      propsRef.current.getCommunityList();
      propsRef.current.setAuth();
      propsRef.current.getChallenge(propsRef.current.id);
    } else {
      navigate(CHALLENGES_URL);
    }
  }, []);

  useEffect(() => {
    if (isChallengeLoaded && isLegacyId(propsRef.current.id)) {
      navigate(`${CHALLENGES_URL}/${propsRef.current.challengeId}/submit`);
    }
  }, [isChallengeLoaded]);

  if (isLoadingChallenge || !isAuthInitialized) {
    return <LoadingIndicator />;
  }

  if (!isChallengeLoaded) {
    return null;
  }

  if (!isRegistered) {
    return (
      <AccessDenied cause={ACCESS_DENIED_REASON.NOT_AUTHORIZED}>
        <PrimaryButton to={`${CHALLENGES_URL}/${challengeId}`}>
          Go to Challenge Details
        </PrimaryButton>
      </AccessDenied>
    );
  }

  const handleSubmit = async (data) => {
    const isLoggedOut = checkIsLoggedOut();
    if (isLoggedOut) {
      window.sessionStorage && window.sessionStorage.clear();
      logIn();
    } else {
      const registered = await getIsRegistered(challengeId, userId);
      if (registered) submit(data);
    }
  };

  return (
    <Submit
      challengeId={challengeId}
      challengeName={challengeName}
      phases={phases}
      status={status}
      winners={winners}
      groups={groups}
      handle={handle}
      communityList={communityList}
      isCommunityListLoaded={isCommunityListLoaded}
      track={track}
      agreed={agreed}
      filePickers={filePickers}
      submissionFilestackData={submissionFilestackData}
      userId={userId}
      errorMsg={errorMsg}
      isSubmitting={isSubmitting}
      submitDone={submitDone}
      uploadProgress={uploadProgress}
      resetForm={resetForm}
      setAgreed={setAgreed}
      setFilePickerError={setFilePickerError}
      setFilePickerFileName={setFilePickerFileName}
      setFilePickerUploadProgress={setFilePickerUploadProgress}
      setFilePickerDragged={setFilePickerDragged}
      setSubmissionFilestackData={setSubmissionFilestackData}
      submit={handleSubmit}
    />
  );
};

Submission.defaultProps = {};

Submission.propTypes = {
  id: PT.string,
  challengeId: PT.string,
  challengeName: PT.string,
  isRegistered: PT.bool,
  phases: PT.arrayOf(PT.shape()),
  status: PT.string,
  winners: PT.arrayOf(PT.shape()),
  groups: PT.arrayOf(PT.shape()),
  isAuthInitialized: PT.bool,
  communityList: PT.arrayOf(PT.shape()),
  isCommunityListLoaded: PT.bool,
  getCommunityList: PT.func,
  isLoadingChallenge: PT.bool,
  isChallengeLoaded: PT.bool,

  track: PT.string,
  agreed: PT.bool,
  filePickers: PT.arrayOf(PT.shape()),
  submissionFilestackData: PT.shape(),
  userId: PT.number,
  handle: PT.string,

  errorMsg: PT.string,
  isSubmitting: PT.bool,
  submitDone: PT.bool,
  uploadProgress: PT.number,

  getChallenge: PT.func,
  getIsRegistered: PT.func,
  submit: PT.func,
  resetForm: PT.func,
  setAgreed: PT.func,
  setFilePickerError: PT.func,
  setFilePickerFileName: PT.func,
  setFilePickerUploadProgress: PT.func,
  setFilePickerDragged: PT.func,
  setSubmissionFilestackData: PT.func,
  setAuth: PT.func,
  checkIsLoggedOut: PT.func,
};

const mapStateToProps = ({earn: state}, ownProps) => {
  const challenge = state?.challenge?.challenge;

  return {
    id: ownProps.params.challengeId,
    challengeId: challenge?.id,
    challengeName: challenge?.name,
    isRegistered: challenge?.isRegistered,
    phases: challenge?.phases,
    status: challenge?.status,
    winners: challenge?.winners,
    groups: challenge?.groups,
    handle: state.auth.user ? state.auth.user.handle : "",
    isAuthInitialized: state.auth.isAuthInitialized,
    communityList: state.lookup.subCommunities,
    isCommunityListLoaded: state.lookup.isSubCommunitiesLoaded,
    isLoadingChallenge: state.challenge?.isLoadingChallenge,
    isChallengeLoaded: state.challenge?.isChallengeLoaded,

    track: challenge?.track,
    agreed: state.submission.agreed,
    filePickers: state.submission.filePickers,
    submissionFilestackData: state.submission.submissionFilestackData,
    userId: state.auth.user ? state.auth.user.userId : null,

    errorMsg: state.submission.submitErrorMsg,
    isSubmitting: state.submission.isSubmitting,
    submitDone: state.submission.submitDone,
    uploadProgress: state.submission.uploadProgress,
  };
};

const mapDispatchToProps = (dispatch) => {
  const onProgress = (event) =>
    dispatch(actions.submission.submit.uploadProgress(event));

  return {
    getCommunityList: () => {
      dispatch(actions.lookup.getCommunityListDone());
    },
    setAuth: () => {
      dispatch(actions.auth.setAuthDone());
    },
    checkIsLoggedOut: () => {
      const action = dispatch(actions.auth.checkIsLoggedOut());
      return action?.payload?.isLoggedOut;
    },
    getIsRegistered: async (challengeId, userId) => {
      const action = await dispatch(
        actions.challenge.getIsRegistered(challengeId, userId)
      );
      return action?.payload?.isRegistered;
    },
    getChallenge: (challengeId) => {
      dispatch(actions.challenge.getChallengeInit(challengeId));
      dispatch(actions.challenge.getChallenge(challengeId));
    },
    submit: (data) => {
      dispatch(actions.submission.submit.submitInit());
      dispatch(actions.submission.submit.submitDone(data, onProgress));
    },
    setAgreed: (agreed) => {
      dispatch(actions.submission.submit.setAgreed(agreed));
    },
    setFilePickerError: (id, error) => {
      dispatch(actions.submission.submit.setFilePickerError(id, error));
    },
    setFilePickerFileName: (id, fileName) => {
      dispatch(actions.submission.submit.setFilePickerFileName(id, fileName));
    },
    setFilePickerDragged: (id, dragged) => {
      dispatch(actions.submission.submit.setFilePickerDragged(id, dragged));
    },
    setFilePickerUploadProgress: (id, p) => {
      dispatch(actions.submission.submit.setFilePickerUploadProgress(id, p));
    },
    setSubmissionFilestackData: (id, data) => {
      dispatch(actions.submission.submit.setSubmissionFilestackData(id, data));
    },
    resetForm: () => {
      dispatch(actions.submission.submit.submitReset());
    },
  };
};

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Submission));
