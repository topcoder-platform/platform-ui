import { handleActions } from "redux-actions";
import _ from "lodash";
import logger from "../utils/logger";

const defaultState = {
  showDetails: {},
  showModal: false,
  toBeDeletedId: "",
  deletingSubmission: false,
  mySubmissions: [],
  isLoadingMySubmissions: false,
};

function onShowDetails(state, { payload: id }) {
  const showDetails = _.clone(state.showDetails);
  if (showDetails[id]) delete showDetails[id];
  else showDetails[id] = true;
  return { ...state, showDetails };
}

function onConfirmDelete(state, { payload }) {
  return {
    ...state,
    showModal: true,
    toBeDeletedId: payload,
  };
}

function onCancelDelete(state) {
  return {
    ...state,
    showModal: false,
    toBeDeletedId: "",
  };
}

function onDeleteSubmissionInit(state) {
  return {
    ...state,
    showModal: false,
    deletingSubmission: true,
  };
}

function onDeleteSubmissionDone(state, { error, payload }) {
  if (error) {
    return {
      ...state,
      deletingSubmission: false,
    };
  }

  const deletedSubmissionId = payload;
  return {
    ...state,
    deletingSubmission: false,
    showModal: false,
    toBeDeletedId: "",
    mySubmissions: state.mySubmissions.filter(
      (submission) => submission.id !== deletedSubmissionId
    ),
  };
}

function onGetMySubmissionsInit(state) {
  return {
    ...state,
    isLoadingMySubmissions: true,
  };
}

function onGetMySubmissionsDone(state, { error, payload }) {
  if (error) {
    logger.error("Failed to get user's submissions for the challenge", payload);
    return {
      ...state,
      mySubmissions: [],
      isLoadingMySubmissions: false,
    };
  }

  return {
    ...state,
    mySubmissions: [...payload],
    isLoadingMySubmissions: false,
  };
}

const reducer = handleActions(
  {
    MY_SUBMISSIONS: {
      SHOW_DETAILS: onShowDetails,
      CONFIRM_DELETE: onConfirmDelete,
      CANCEL_DELETE: onCancelDelete,
      DELETE_SUBMISSION_INIT: onDeleteSubmissionInit,
      DELETE_SUBMISSION_DONE: onDeleteSubmissionDone,
      GET_MY_SUBMISSIONS_INIT: onGetMySubmissionsInit,
      GET_MY_SUBMISSIONS_DONE: onGetMySubmissionsDone,
    },
  },
  defaultState
);

export default reducer;
