/**
 * Redux Reducer for state.page.challengeDetails.submission
 *
 * Description:
 *   Implements state reducers for the Challenge Submission page
 *   and handles the Challenge Submission actions
 */

import _ from 'lodash';
import actions from '@earn/actions/page/submission';
import logger from '@earn/utils/logger';
import errors from '../errors';
import { combineReducers } from "@earn/utils/redux";
import { handleActions } from "redux-actions";

const { fireErrorMessage } = errors;

/**
 * Handles results of PAGE/CHALLENGE_DETAILS/SUBMISSION/SUBMIT_DONE action.
 * @param {Object} state
 * @param {Object} action
 * @return {Object} New state.
 */
function onSubmitDone(state, { error, payload }) {
  if (error) {
    /* TODO: Some more details for the log will be handy, but no time to care
     * about right now. */
    logger.error('Failed to submit for the challenge');
    fireErrorMessage(
      'ERROR: Failed to submit!',
      'Please, try to submit from https://software.topcoder.com or email you submission to support@topcoder.com',
    );
    return {
      ...state,
      submitErrorMsg: 'Failed to submit',
      isSubmitting: false,
      submitDone: false,
    };
  }

  if (payload.message) {
    /* payload message is present when upload of file fails due to any reason so
     * handle this special case for error */
    logger.error(`Failed to submit for the challenge - ${payload.message}`);
    return {
      ...state,
      submitErrorMsg: payload.message || 'Failed to submit',
      isSubmitting: false,
      submitDone: false,
    };
  }

  /* TODO: I am not sure, whether this code is just wrong, or does it handle
   * only specific errors, returned from API for design submissions? I am
   * adding a more generic failure handling code just above. */
  if (payload.result && !payload.result.success) {
    return {
      ...state,
      submitErrorMsg: payload.result.content.message || 'Failed to submit',
      isSubmitting: false,
      submitDone: false,
    };
  }

  return {
    ...state,
    ...payload,
    isSubmitting: false,
    submitDone: true,
  };
}

/**
 * Handles results of PAGE/CHALLENGE_DETAILS/SUBMISSION/SUBMIT_INIT action.
 * @param {Object} state
 * @return {Object} New state.
 */
function onSubmitInit(state) {
  return {
    ...state,
    isSubmitting: true,
    submitDone: false,
    submitErrorMsg: '',
    uploadProgress: 0,
  };
}

/**
 * Handles results of PAGE/CHALLENGE_DETAILS/SUBMISSION/SUBMIT_DONE action.
 * @param {Object} state
 * @return {Object} New state.
 */
function onSubmitReset(state) {
  return {
    ...state,
    isSubmitting: false,
    submitDone: false,
    submitErrorMsg: '',
    uploadProgress: 0,
  };
}

/**
 * Handles results of PAGE/CHALLENGE_DETAILS/SUBMISSION/SUBMIT_DONE action.
 * @param {Object} state
 * @param {Object} action
 * @return {Object} New state.
 */
function onUploadProgress(state, action) {
  return {
    ...state,
    uploadProgress: action.payload,
  };
}

/**
 * Returns a new state with the filePicker updated according to map, or added if not existing
 * @param {Object} state Current state
 * @param {String} id ID of the <FilePicker>
 * @param {Object} map Key value pairs for the new FilePicker state
 * @return New state
 */
function fpSet(state, id, map) {
  let found = false;

  const newFilePickers = state.filePickers.map((fp) => {
    if (fp.id === id) {
      found = true;
      return ({
        ...fp,
        ...map,
      });
    }
    return fp;
  });

  if (found) {
    return ({ ...state, filePickers: newFilePickers });
  }

  return ({
    ...state,
    filePickers: [
      ...newFilePickers,
      { id, ...map },
    ],
  });
}

/**
 * Creates a new submission reducer with the specified initial state.
 * @param {Object} initialState Initial state.
 * @return submission reducer.
 */
function create(initialState) {
  const a = actions.page.submission;

  return handleActions({
    [a.submitDone]: onSubmitDone,
    [a.submitInit]: onSubmitInit,
    [a.submitReset]: onSubmitReset,
    [a.uploadProgress]: onUploadProgress,
    [a.setAgreed]: (state, action) => ({ ...state, agreed: action.payload }),
    [a.setFilePickerError]:
      (state, { payload }) => fpSet(state, payload.id, { error: payload.error }),
    [a.setFilePickerFileName]:
      (state, { payload }) => fpSet(state, payload.id, { fileName: payload.fileName }),
    [a.setFilePickerUploadProgress]:
      (state, { payload }) => fpSet(state, payload.id, { uploadProgress: payload.progress }),
    [a.setFilePickerDragged]:
      (state, { payload }) => fpSet(state, payload.id, { dragged: payload.dragged }),
    [a.updateNotesLength]: (state, action) => ({ ...state, notesLength: action.payload }),
    [a.setSubmissionFilestackData]:
      (state, { payload }) => ({ ...state, submissionFilestackData: payload }),
  }, _.defaults(_.clone(initialState) || {}, {
    isSubmitting: false,
    submitDone: false,
    submitErrorMsg: '',
    agreed: false,
    notesLength: 0,
    uploadProgress: 0,
    filePickers: [],
    submissionFilestackData: {
      challengeId: '',
      fileUrl: '',
      filename: '',
      mimetype: '',
      size: 0,
      key: '',
      container: '',
    },
  }));
}

export function factory() {
  // Server-side rendering not implemented yet
  return Promise.resolve(combineReducers(create()));
}

export default combineReducers(create());
