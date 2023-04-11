import { handleActions } from "redux-actions";
import logger, { fireErrorMessage } from "../utils/logger";

const defaultState = {
  isSubmitting: false,
  submitDone: false,
  submitErrorMsg: "",
  agreed: false,
  uploadProgress: 0,
  filePickers: [],
  submissionFilestackData: {
    challengeId: "",
    fileUrl: "",
    filename: "",
    mimetype: "",
    size: 0,
    key: "",
    container: "",
  },
};

function onSubmitDone(state, { error, payload }) {
  if (error) {
    logger.error("Failed to submit for the challenge");
    fireErrorMessage(
      "ERROR: Failed to submit!",
      "Please, try to submit from https://software.topcoder.com or email you submission to support@topcoder.com"
    );

    return {
      ...state,
      submitErrorMsg: "Failed to submit",
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
      submitErrorMsg: payload.message || "Failed to submit",
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
      submitErrorMsg: payload.result.content.message || "Failed to submit",
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

function onSubmitInit(state) {
  return {
    ...state,
    isSubmitting: true,
    submitDone: false,
    submitErrorMsg: "",
    uploadProgress: 0,
  };
}

function onSubmitReset(state) {
  return {
    ...state,
    isSubmitting: false,
    submitDone: false,
    submitErrorMsg: "",
    uploadProgress: 0,
  };
}

function onUploadProgress(state, { payload }) {
  return {
    ...state,
    uploadProgress: payload,
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
      return {
        ...fp,
        ...map,
      };
    }
    return fp;
  });

  if (found) {
    return { ...state, filePickers: newFilePickers };
  }

  return {
    ...state,
    filePickers: [...newFilePickers, { id, ...map }],
  };
}

function onSetAgreed(state, { payload }) {
  return { ...state, agreed: payload };
}

function onSetFilePickerError(state, { payload }) {
  return fpSet(state, payload.id, { error: payload.error });
}

function onSetFilePickerFileName(state, { payload }) {
  return fpSet(state, payload.id, { fileName: payload.fileName });
}

function onSetFilePickerUploadProgress(state, { payload }) {
  return fpSet(state, payload.id, { uploadProgress: payload.progress });
}

function onSetFilePickerDragged(state, { payload }) {
  return fpSet(state, payload.id, { dragged: payload.dragged });
}

function onSetSubmissionFilestackData(state, { payload }) {
  return { ...state, submissionFilestackData: payload };
}

const reducer = handleActions(
  {
    SUBMIT: {
      SUBMIT_DONE: onSubmitDone,
      SUBMIT_INIT: onSubmitInit,
      SUBMIT_RESET: onSubmitReset,
      UPLOAD_PROGRESS: onUploadProgress,
      SET_AGREED: onSetAgreed,
      SET_FILE_PICKER_ERROR: onSetFilePickerError,
      SET_FILE_PICKER_FILE_NAME: onSetFilePickerFileName,
      SET_FILE_PICKER_UPLOAD_PROGRESS: onSetFilePickerUploadProgress,
      SET_FILE_PICKER_DRAGGED: onSetFilePickerDragged,
      SET_SUBMISSION_FILESTACK_DATA: onSetSubmissionFilestackData,
    },
  },
  defaultState
);

export default reducer;
