/**
 * @module "actions.smp"
 * @desc Actions related to *My Submissions Management* page.
 */

import _ from "lodash";
import { createActions } from "redux-actions";
import { getApi } from "../services/challenge-api";

/**
 * @static
 * @desc Creates an action that signals beginning of submission download.
 * @return {Action}
 */
function deleteSubmissionInit() {}

/**
 * @static
 * @desc Creates an action that deletes user's submission to a challenge.
 * @param {String} tokenV3 Topcoder v3 auth token.
 * @param {Number|String} submissionId Submission ID.
 * @return {Action}
 */
function deleteSubmissionDone(tokenV3, submissionId) {
  return getApi("V5", tokenV3)
    .delete(`/submissions/${submissionId}`)
    .then(() => submissionId);
}

/**
 * @static
 * @todo At this moment we don't need any special JS code to download
 * submissions: we get them from legacy Topcoder Studio API, which is
 * authenticated by cookies, and can be done with a simple <a> link in
 * the component. Soon we'll migrate to use the new TC API instead, and
 * then we'll decide, whether we need operate downloads in JS, or can we
 * just remove this action.
 * @return {Action}
 */
function downloadSubmission(tokens, type, submissionId) {
  _.noop(tokens, type, submissionId);
}

export default createActions({
  SMP: {
    DELETE_SUBMISSION_DONE: deleteSubmissionDone,
    DELETE_SUBMISSION_INIT: deleteSubmissionInit,
    DOWNLOAD_SUBMISSION: downloadSubmission,
  },
});
