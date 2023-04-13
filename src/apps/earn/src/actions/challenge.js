/**
 * @module "actions.challenge"
 * @desc Actions related to Topcoder challenges APIs.
 */

import _ from "lodash";
import config from "../config";
import { createActions } from "redux-actions";
import { decodeToken } from "../utils/token";
import { getService as getChallengesService } from "../services/challenges";
import { getService as getSubmissionService } from "../services/submissions";
import { getApi } from "../services/challenge-api";
import * as submissionUtil from "../utils/submission";

const { PAGE_SIZE } = config;

/**
 * Private. Loads from the backend all data matching some conditions.
 * @param {Function} getter Given params object of shape { limit, offset }
 *  loads from the backend at most "limit" data, skipping the first
 *  "offset" ones. Returns loaded data as an array.
 * @param {Number} page Optional. Next page of data to load.
 * @param {Number} perPage Optional. The size of the page content to load.
 * @param {Array<string>} prev Optional. data loaded so far.
 */
function getAll(getter, page = 1, perPage = PAGE_SIZE, prev) {
  /* Amount of submissions to fetch in one API call. 50 is the current maximum
   * amount of submissions the backend returns, event when the larger limit is
   * explicitely required. */
  return getter({
    page,
    perPage,
  }).then((res) => {
    if (res.length === 0) {
      return prev || res;
    }
    // parse submissions
    let current = [];
    if (prev) {
      current = prev.concat(res);
    } else {
      current = res;
    }
    return getAll(getter, 1 + page, perPage, current);
  });
}

/**
 * @static
 * @desc Creates an action that drops from Redux store all checkpoints loaded
 *  before.
 * @return {Action}
 */
function dropCheckpoints() {}

/**
 * @static
 * @desc Creates an action that drops from Redux store all challenge results
 *  loaded before.
 * @return {Action}
 */
function dropResults() {}

/**
 * @static
 * @desc Creates an action that signals beginning of challenge details loading.
 * @param {Number|String} challengeId Challenge ID
 * @return {Action}
 */
function getDetailsInit(challengeId) {
  return _.toString(challengeId);
}

/**
 * @static
 * @desc Creates an action that loads challenge details.
 * @param {Number|String} challengeId Challenge ID.
 * @param {String} tokenV3 Topcoder v3 auth token.
 * @param {String} tokenV2 Topcoder v2 auth token.
 * @return {Action}
 */
function getDetailsDone(challengeId, tokenV3, tokenV2) {
  const service = getChallengesService(tokenV3, tokenV2);
  const v3Promise = service.getChallengeDetails(challengeId);
  return v3Promise;
}

/**
 * @static
 * @desc Creates an action that signals beginning of user submissions loading.
 * @param {String} challengeId Challenge ID.
 * @return {Action}
 */
function getSubmissionsInit(challengeId) {
  /* As a safeguard, we enforce challengeId to be string (in case somebody
   * passes in a number, by mistake). */
  return _.toString(challengeId);
}

/**
 * @static
 * @desc Creates an action that loads user's submissions to the specified
 * challenge.
 * @param {String} challengeId Challenge ID.
 * @param {String} tokenV3 Topcoder auth token v3.
 * @return {Action}
 */
function getSubmissionsDone(challengeId, tokenV3) {
  const user = decodeToken(tokenV3);
  const submissionsService = getSubmissionService(tokenV3);
  const filters = {
    challengeId,
    memberId: user.userId,
  };
  return submissionsService.getSubmissions(filters)
    .then(submissions => ({
      challengeId: _.toString(challengeId),
      submissions,
    }))
    .catch((error) => {
      const err = { challengeId: _.toString(challengeId), error };
      throw err;
    });
}

/**
 * @static
 * @desc Creates an action that signals beginning of Marathon Match submissions loading.
 * @param {String} challengeId Challenge ID.
 * @return {Action}
 */
function getMMSubmissionsInit(challengeId) {
  /* As a safeguard, we enforce challengeId to be string (in case somebody
   * passes in a number, by mistake). */
  return _.toString(challengeId);
}


/**
 * @static
 * @desc Creates an action that loads Marathon Match submissions to the specified
 * challenge.
 * @param {String} challengeId Challenge ID.
 * @param {Array} registrants The array of register.
 * @param {String} tokenV3  Topcoder auth token v3.
 * @return {Action}
 */
function getMMSubmissionsDone(challengeId, tokenV3) {
  const filter = { challengeId };
  const submissionsService = getSubmissionService(tokenV3);

  // TODO: Move those numbers to configs
  return getAll(params => submissionsService.getSubmissions(filter, params), 1, 500)
    .then((submissions) => {
      const finalSubmissions = submissionUtil.processMMSubmissions(submissions);
      return {
        challengeId,
        submissions: finalSubmissions,
        tokenV3,
      };
    });
}

/**
 * @static
 * @desc Creates an action that signals beginning of registration for a
 * challenge.
 * @return {Action}
 */
function registerInit() {
}

/**
 * @static
 * @desc Creates an action that registers user for a challenge.
 * @param {Object} auth An object that holds auth tokens. You can directly pass
 *  here the `auth` segment of Redux store.
 * @param [auth.tokenV2]{String} Topcoder auth token v2.
 * @param [auth.tokenV3]{String} Topcoder auth token v3.
 * @param {String} challengeId Challenge ID.
 * @return {Action}
 */
function registerDone(auth, challengeId) {
  return getChallengesService(auth.tokenV3)
    .register(challengeId)
    /* As a part of registration flow we silently update challenge details,
     * reusing for this purpose the corresponding action handler. */
    // Uses a delay to allow API time to update
    .then(() => new Promise(
      resolve => setTimeout(
        () => resolve(getDetailsDone(challengeId, auth.tokenV3, auth.tokenV2)),
        config.CHALLENGE_DETAILS_REFRESH_DELAY,
      ),
    ));
}

/**
 * @static
 * @desc Creates an action that signals beginning of user unregistration from a
 *  challenge.
 * @return {Action}
 */
function unregisterInit() {}

/**
 * @static
 * @desc Creates an action that unregisters user from a challenge.
 * @param {Object} auth Object that holds Topcoder auth tokens.
 * @param {String} [auth.tokenV2] v2 token.
 * @param {String} [auth.tokenV3] v3 token.
 * @param {String} challengeId Challenge ID.
 * @return {Action}
 */
function unregisterDone(auth, challengeId) {
  return getChallengesService(auth.tokenV3)
    .unregister(challengeId)
    /* As a part of unregistration flow we silently update challenge details,
     * reusing for this purpose the corresponding action handler. */
    // Uses a delay to allow API time to update
    .then(() => new Promise(
      resolve => setTimeout(
        () => resolve(getDetailsDone(challengeId, auth.tokenV3, auth.tokenV2)),
        config.CHALLENGE_DETAILS_REFRESH_DELAY,
      ),
    ));
}

/**
 * @static
 * @desc Creates an action that signals beginning of challenge results loading.
 * @param {Number|String} challengeId Challenge ID
 * @return {Action}
 */
function loadResultsInit(challengeId) {
  return _.toString(challengeId);
}

/**
 * @static
 * @desc Creates an action that loads challenge results.
 * @param {Object} auth Object that holds Topcoder auth tokens.
 * @param {String} [auth.tokenV2] v2 token.
 * @param {String} [auth.tokenV3] v3 token.
 * @param {Number|String} challengeId Challenge ID. Should match the one passed
 *  in the previous {@link module:actions.challenge.loadResultsInit} call.
 * @param {String} type Challenge type.
 * @return {Action}
 */
function loadResultsDone(auth, challengeId, type) {
  return getApi('V2')
    .fetch(`/${type}/challenges/result/${challengeId}`)
    .then(response => response.json())
    .then(response => ({
      challengeId: _.toString(challengeId),
      results: response.results,
    }));
}

/**
 * @static
 * @desc Creates an action that signals beginning of challenge checkpoints data
 *  loading.
 * @return {Action}
 */
function fetchCheckpointsInit() {}

/**
 * @static
 * @desc Creates an action that loads challenge checkpoints data.
 * @param {String} tokenV2 Topcoder v2 auth token.
 * @param {String} challengeId Challenge ID.
 */
function fetchCheckpointsDone(tokenV2, challengeId) {
  const endpoint = `/design/challenges/checkpoint/${challengeId}`;
  return getApi('V2').fetch(endpoint)
    .then((response) => {
      if (response.status !== 200) {
        throw response.status;
      } else {
        return response.json();
      }
    })
    .then((response) => {
      // Expanded key is used for UI expand/collapse.
      response.checkpointResults.forEach((checkpoint, index) => {
        response.checkpointResults[index].expanded = false;
      });
      return {
        challengeId: String(challengeId),
        checkpoints: response,
      };
    })
    .catch(error => ({
      error,
      challengeId: String(challengeId),
    }));
}

/**
 * @static
 * @desc Creates an action that Toggles checkpoint details panel in the Topcoder
 *  Submission Management Page.
 * @todo This is UI action relevant to a specific page in specific app. Must be
 *  moved back to Community App.
 * @param {Number} id Checkpoint ID.
 * @param {Boolean} open Target state: `true` to expand, `false` to collapse the
 *  details.
 * @return {Action}
 */
function toggleCheckpointFeedback(id, open) {
  return { id, open };
}

/**
 * @static
 * @desc Creates an action that signals beginning of challenge details update.
 * @todo No idea, why we have this action. This functionality should be covered
 *  by {@link module:actions.challenge.getDetailsInit} and
 *  {@link module:actions.challenge.getDetailsDone}. We need to refactor this.
 * @param {String} uuid UUID of the operation (the same should be passed into
 *  the corresponding {@link module:actions.challenge.updateChallengeDone}).
 * @return {Action}
 */
function updateChallengeInit(uuid) {
  return uuid;
}

/**
 * @static
 * @desc Creates an action that updates challenge details.
 * @todo No idea, why we have this action. This functionality should be covered
 *  by {@link module:actions.challenge.getDetailsInit} and
 *  {@link module:actions.challenge.getDetailsDone}. We need to refactor this.
 * @param {String} uuid Operation UUID. Should match the one passed into the
 *  previous {@link module:actions.challenge.updateChallengeInit} call.
 * @param {Object} challenge Challenge data.
 * @param {String} tokenV3 Topcoder v3 auth token.
 * @return {Action}
 */
function updateChallengeDone(uuid, challenge, tokenV3) {
  return getChallengesService(tokenV3).updateChallenge(challenge)
    .then(res => ({ uuid, res }));
}

/**
 * @static
 * @desc Creates an action that signals beginning of getting count of user's active challenges.
 * @return {Action}
 */
function getActiveChallengesCountInit() {}

/**
 * @static
 * @desc Creates an action that gets count of user's active challenges from the backend.
 * @param {String} handle Topcoder user handle.
 * @param {String} tokenV3 Optional. Topcoder auth token v3. Without token only
 *  public challenges will be counted. With the token provided, the action will
 *  also count private challenges related to this user.
 * @return {Action}
 */
function getActiveChallengesCountDone(handle, tokenV3) {
  return getChallengesService(tokenV3).getActiveChallengesCount(handle);
}

/**
 * @static
 * @desc Creates an action that gets submission information by submission id
 * @param {String} submissionId The submission id
 * @return {Action}
 */
function getSubmissionInformationInit(challengeId, submissionId) {
  return { challengeId: _.toString(challengeId), submissionId: _.toString(submissionId) };
}

/**
 * @static
 * @desc Creates an action that gets submission information from the backend.
 * @param {String} submissionId The submission id
 * @param {String} tokenV3 Topcoder auth token v3.
 * @return {Action}
 */
function getSubmissionInformationDone(challengeId, submissionId, tokenV3) {
  const filter = { challengeId };
  const submissionsService = getSubmissionService(tokenV3);

  return getAll(params => submissionsService.getSubmissions(filter, params), 1, 500)
    .then((submissions) => {
      const submission = _.find(submissions, { id: submissionId });
      _.remove(submission.review, review => review.typeId === config.AV_SCAN_SCORER_REVIEW_TYPE_ID);
      return { submissionId, submission };
    });
}

/**
 * @static
 * @desc Creates an action that signals beginning of fetching challenge statistics
 * @return {Action}
 */
function fetchChallengeStatisticsInit() {}

/**
 * @static
 * @desc Creates an action that gets challenge statistics from the backend.
 * @param {String} challengeId The challenge id
 * @param {String} tokenV3 Topcoder auth token v3.
 * @return {Action}
 */
function fetchChallengeStatisticsDone(challengeId, tokenV3) {
  const challengeService = getChallengesService(tokenV3);
  return challengeService.getChallengeStatistics(challengeId);
}

export default createActions({
  CHALLENGE: {
    DROP_CHECKPOINTS: dropCheckpoints,
    DROP_RESULTS: dropResults,
    FETCH_CHECKPOINTS_INIT: fetchCheckpointsInit,
    FETCH_CHECKPOINTS_DONE: fetchCheckpointsDone,
    GET_DETAILS_INIT: getDetailsInit,
    GET_DETAILS_DONE: getDetailsDone,
    GET_SUBMISSIONS_INIT: getSubmissionsInit,
    GET_SUBMISSIONS_DONE: getSubmissionsDone,
    LOAD_RESULTS_INIT: loadResultsInit,
    LOAD_RESULTS_DONE: loadResultsDone,
    REGISTER_INIT: registerInit,
    REGISTER_DONE: registerDone,
    TOGGLE_CHECKPOINT_FEEDBACK: toggleCheckpointFeedback,
    UNREGISTER_INIT: unregisterInit,
    UNREGISTER_DONE: unregisterDone,
    UPDATE_CHALLENGE_INIT: updateChallengeInit,
    UPDATE_CHALLENGE_DONE: updateChallengeDone,
    GET_ACTIVE_CHALLENGES_COUNT_INIT: getActiveChallengesCountInit,
    GET_ACTIVE_CHALLENGES_COUNT_DONE: getActiveChallengesCountDone,
    GET_MM_SUBMISSIONS_INIT: getMMSubmissionsInit,
    GET_MM_SUBMISSIONS_DONE: getMMSubmissionsDone,
    GET_SUBMISSION_INFORMATION_INIT: getSubmissionInformationInit,
    GET_SUBMISSION_INFORMATION_DONE: getSubmissionInformationDone,
    FETCH_CHALLENGE_STATISTICS_INIT: fetchChallengeStatisticsInit,
    FETCH_CHALLENGE_STATISTICS_DONE: fetchChallengeStatisticsDone,
  },
});
