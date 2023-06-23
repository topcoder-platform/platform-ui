import _ from "lodash";
import { createActions } from "redux-actions";
import service from "../services/submission";
import { decodeToken } from "tc-auth-lib";
import { triggerDownload } from "../utils";
import { getAuthUserTokens } from "../utils/auth";

function deleteSubmissionDone(submissionId) {
  return service.deleteSubmission(submissionId);
}

async function downloadSubmissionDone(track, submissionId) {
  const blob = await service.downloadSubmission(track, submissionId);
  triggerDownload(
    `submission-${track.toLowerCase()}-${submissionId}.zip`,
    blob
  );
}

async function getMySubmissionsDone(challengeId) {
  const { tokenV3 } = await getAuthUserTokens();
  const user = decodeToken(tokenV3);
  const filters = {
    challengeId,
    memberId: user.userId,
  };

  return service.getSubmissions(filters);
}

export default createActions({
  MY_SUBMISSIONS: {
    SHOW_DETAILS: _.identity,
    CANCEL_DELETE: _.noop,
    CONFIRM_DELETE: _.identity,
    DELETE_SUBMISSION_INIT: _.noop,
    DELETE_SUBMISSION_DONE: deleteSubmissionDone,
    DOWNLOAD_SUBMISSION_DONE: downloadSubmissionDone,
    GET_MY_SUBMISSIONS_INIT: _.noop,
    GET_MY_SUBMISSIONS_DONE: getMySubmissionsDone,
  },
});
