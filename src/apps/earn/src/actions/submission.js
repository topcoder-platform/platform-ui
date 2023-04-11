/**
 * actions.page.challenge-details.submission
 *
 * Description:
 *   Contains the Redux Actions for updating the Submission page UI
 *   and for for uploading submissions to back end
 */
import _ from "lodash";
import { createActions } from "redux-actions";
import service from "../services/submission";

/**
 * Payload creator for the action that actually performs submission operation.
 * @param {Object} data Data to submit.
 * @param {Function} onProgress The callback to trigger with updates on the
 *  submission progress.
 * @return Promise
 */
function submitDone(data, onProgress) {
  return service.submit(data, onProgress);
}

export default createActions({
  SUBMIT: {
    SUBMIT_INIT: _.noop,
    SUBMIT_DONE: submitDone,
    SUBMIT_RESET: _.noop,
    UPLOAD_PROGRESS: (percent) => percent,
    SET_AGREED: (agreed) => agreed,
    SET_FILE_PICKER_ERROR: (id, error) => ({ id, error }),
    SET_FILE_PICKER_FILE_NAME: (id, fileName) => ({ id, fileName }),
    SET_FILE_PICKER_UPLOAD_PROGRESS: (id, progress) => ({ id, progress }),
    SET_FILE_PICKER_DRAGGED: (id, dragged) => ({ id, dragged }),
    SET_SUBMISSION_FILESTACK_DATA: (data) => data,
  },
});
