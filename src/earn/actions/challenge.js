/**
 * @module "reducers.challenge"
 * @desc Reducer for {@link module:actions.challenge} actions.
 *
 * State segment managed by this reducer has the following strcuture:
 * @todo Document the structure.
 */

import _ from "lodash";

import { handleActions } from "redux-actions";
import { combineReducers } from "../utils/redux";

import actions from "../actions/challenge";
import smpActions from "../actions/smp";
import logger from "../utils/logger";
import { fireErrorMessage } from "../utils/errors";

import mySubmissionsManagement from "./my-submissions-management";

import { COMPETITION_TRACKS } from "../utils/tc";

/**
 * Handles CHALLENGE/GET_BASIC_DETAILS_INIT action.
 * @param {Object} state
 * @param {Object} action
 * @return {Object} New state
 */
function onGetBasicDetailsInit(state, action) {
  const challengeId = action.payload;
  return state.details && _.toString(state.details.id) !== challengeId
    ? {
        ...state,
        fetchChallengeFailure: false,
        loadingDetailsForChallengeId: challengeId,
        details: null,
      }
    : {
        ...state,
        fetchChallengeFailure: false,
        loadingDetailsForChallengeId: challengeId,
      };
}

/**
 * Handles CHALLENGE/GET_BASIC_DETAILS_DONE action.
 * Note, that it silently discards received details if the ID of received
 * challenge mismatches the one stored in loadingDetailsForChallengeId field
 * of the state.
 * @param {Object} state
 * @param {Object} action
 * @return {Object} New state.
 */
function onGetBasicDetailsDone(state, action) {
  if (action.error) {
    logger.error("Failed to get challenge details!", action.payload);
    fireErrorMessage(
      "ERROR: Failed to load the challenge",
      "Please, try again a bit later"
    );
    return {
      ...state,
      fetchChallengeFailure: action.error,
      loadingDetailsForChallengeId: "",
    };
  }

  const details = action.payload;

  // condition based on ROUTE used for Review Opportunities, change if needed
  const challengeId = state.loadingDetailsForChallengeId;
  let compareChallenge = details.id;
  if (challengeId.length >= 5 && challengeId.length <= 8) {
    compareChallenge = details.legacyId;
  }

  if (_.toString(compareChallenge) !== challengeId) {
    return state;
  }

  return {
    ...state,
    details,
    fetchChallengeFailure: false,
    loadingDetailsForChallengeId: "",
  };
}

/**
 * Handles CHALLENGE/GET_FULL_DETAILS_INIT action.
 * @param {Object} state
 * @param {Object} action
 * @return {Object} New state
 */
function onGetFullDetailsInit(state, action) {
  const challengeId = action.payload;
  return {
    ...state,
    fetchChallengeFailure: false,
    loadingFullDetailsForChallengeId: challengeId,
  };
}

/**
 * Handles CHALLENGE/GET_FULL_DETAILS_DONE action.
 * Note, that it silently discards received details if the ID of received
 * challenge mismatches the one stored in loadingFullDetailsForChallengeId field
 * of the state.
 * @param {Object} state
 * @param {Object} action
 * @return {Object} New state.
 */
function onGetFullDetailsDone(state, action) {
  if (action.error) {
    logger.error("Failed to get full challenge details!", action.payload);
    fireErrorMessage(
      "ERROR: Failed to load the challenge",
      "Please, try again a bit later"
    );
    return {
      ...state,
      fetchChallengeFailure: action.error,
      loadingFullDetailsForChallengeId: "",
    };
  }

  const details = action.payload;

  // condition based on ROUTE used for Review Opportunities, change if needed
  const challengeId = state.loadingFullDetailsForChallengeId;
  let compareChallenge = details.id;
  if (challengeId.length >= 5 && challengeId.length <= 8) {
    compareChallenge = details.legacyId;
  }

  if (_.toString(compareChallenge) !== challengeId) {
    return state;
  }

  return {
    ...state,
    details,
    fetchChallengeFailure: false,
    loadingFullDetailsForChallengeId: "",
  };
}

/**
 * Handles CHALLENGE/GET_SUBMISSION_INIT action.
 * @param {Object} state
 * @param {Object} action
 * @return {Object} New state.
 */
function onGetSubmissionsInit(state, action) {
  return {
    ...state,
    loadingSubmissionsForChallengeId: action.payload,
    mySubmissions: { challengeId: "", v2: null },
  };
}

/**
 * Handles challengeActions.fetchSubmissionsDone action.
 * @param {Object} state Previous state.
 * @param {Object} action Action.
 */
function onGetSubmissionsDone(state, action) {
  if (action.error) {
    logger.error(
      "Failed to get user's submissions for the challenge",
      action.payload
    );
    return {
      ...state,
      loadingSubmissionsForChallengeId: "",
      mySubmissions: { challengeId: "", v2: null },
    };
  }

  const { challengeId, submissions } = action.payload;
  if (challengeId !== state.loadingSubmissionsForChallengeId) return state;

  return {
    ...state,
    loadingSubmissionsForChallengeId: "",
    mySubmissions: { challengeId, v2: submissions },
  };
}

/**
 * Handles CHALLENGE/GET_MM_SUBMISSION_INIT action.
 * @param {Object} state
 * @param {Object} action
 * @return {Object} New state.
 */
function onGetMMSubmissionsInit(state, action) {
  return {
    ...state,
    loadingMMSubmissionsForChallengeId: action.payload,
    mmSubmissions: [],
  };
}

/**
 * Handles CHALLENGE/GET_MM_SUBMISSION_DONE action.
 * @param {Object} state Previous state.
 * @param {Object} action Action.
 */
function onGetMMSubmissionsDone(state, action) {
  if (action.error) {
    logger.error(
      "Failed to get Marathon Match submissions for the challenge",
      action.payload
    );
    return {
      ...state,
      loadingMMSubmissionsForChallengeId: "",
      mmSubmissions: [],
    };
  }

  const { challengeId, submissions } = action.payload;
  if (challengeId.toString() !== state.loadingMMSubmissionsForChallengeId)
    return state;
  return {
    ...state,
    loadingMMSubmissionsForChallengeId: "",
    mmSubmissions: submissions,
  };
}

/**
 * Handles challengeActions.fetchCheckpointsDone action.
 * @param {Object} state Previous state.
 * @param {Object} action Action.
 */
function onFetchCheckpointsDone(state, action) {
  if (action.error) {
    return {
      ...state,
      loadingCheckpoints: false,
    };
  }
  if (
    state.details &&
    `${state.details.legacyId}` === `${action.payload.challengeId}`
  ) {
    return {
      ...state,
      checkpoints: action.payload.checkpoints,
      loadingCheckpoints: false,
    };
  }
  return state;
}

/**
 * Handles CHALLENGE/LOAD_RESULTS_INIT action.
 * @param {Object} state
 * @param {Object} action
 * @return {Object}
 */
function onLoadResultsInit(state, { payload }) {
  return { ...state, loadingResultsForChallengeId: payload };
}

/**
 * Handles CHALLENGE/LOAD_RESULTS_DONE action.
 * @param {Object} state
 * @param {Object} action
 * @return {Object}
 */
function onLoadResultsDone(state, action) {
  if (action.payload.challengeId !== state.loadingResultsForChallengeId) {
    return state;
  }
  if (action.error) {
    logger.error(action.payload);
    return {
      ...state,
      loadingResultsForChallengeId: "",
      results: null,
      resultsLoadedForChallengeId: "",
    };
  }
  return {
    ...state,
    loadingResultsForChallengeId: "",
    results: action.payload.results,
    resultsLoadedForChallengeId: action.payload.challengeId,
  };
}

/**
 * Handles CHALLENGE/REGISTER_DONE action.
 * @param {Object} state
 * @param {Object} action
 * @return {Object}
 */
function onRegisterDone(state, action) {
  if (action.error) {
    logger.error("Failed to register for the challenge!", action.payload);
    fireErrorMessage("ERROR: Failed to register for the challenge!");
    return { ...state, registering: false };
  }
  /* As a part of registration flow we silently update challenge details,
   * reusing for this purpose the corresponding action handler. Thus, we
   * should also reuse corresponding reducer to generate proper state. */
  return onGetBasicDetailsDone(
    {
      ...state,
      registering: false,
      loadingDetailsForChallengeId: _.toString(state.details.id),
    },
    action
  );
}

/**
 * Handles CHALLENGE/UNREGISTER_DONE action.
 * @param {Object} state
 * @param {Object} action
 * @return {Object}
 */
function onUnregisterDone(state, action) {
  if (action.error) {
    logger.error("Failed to register for the challenge!", action.payload);
    fireErrorMessage("ERROR: Failed to unregister for the challenge!");
    return { ...state, unregistering: false };
  }
  /* As a part of unregistration flow we silently update challenge details,
   * reusing for this purpose the corresponding action handler. Thus, we
   * should also reuse corresponding reducer to generate proper state. */
  return onGetBasicDetailsDone(
    {
      ...state,
      unregistering: false,
      loadingDetailsForChallengeId: _.toString(state.details.id),
    },
    action
  );
}

/**
 * Handles CHALLENGE/UPDATE_CHALLENGE_INIT.
 * @param {Object} state Old state.
 * @param {Object} actions Action.
 * @return {Object} New state.
 */
function onUpdateChallengeInit(state, { payload }) {
  return { ...state, updatingChallengeUuid: payload };
}

/**
 * Handles CHALLENGE/UPDATE_CHALLENGE_DONE.
 * @param {Object} state Old state.
 * @param {Object} actions Action.
 * @return {Object} New state.
 */
function onUpdateChallengeDone(state, { error, payload }) {
  if (error) {
    fireErrorMessage("Failed to save the challenge!", "");
    logger.error("Failed to save the challenge", payload);
    return state;
  }
  if (payload.uuid !== state.updatingChallengeUuid) return state;

  /* Due to the normalization of challenge APIs responses done when a challenge
   * is loaded, many pieces of our code expect different information in a format
   * different from API v3 response, thus if we just save entire payload.res
   * into the Redux state segment, it will break our app. As a rapid fix, let's
   * just save only the data which are really supposed to be updated in the
   * current use case (editing of challenge specs). */
  const res = _.pick(payload.res, [
    "detailedRequirements",
    "introduction",
    "round1Introduction",
    "round2Introduction",
    "submissionGuidelines",
  ]);

  return {
    ...state,
    details: {
      ...state.details,
      ...res,
    },
    updatingChallengeUuid: "",
  };
}

/**
 * Handles CHALLENGE/GET_ACTIVE_CHALLENGES_COUNT_DONE action.
 * @param {Object} state Old state.
 * @param {Object} action Action payload/error
 * @return {Object} New state
 */
function onGetActiveChallengesCountDone(state, { payload, error }) {
  if (error) {
    fireErrorMessage("Failed to get active challenges count!", "");
    logger.error("Failed to get active challenges count", payload);
    return state;
  }

  return { ...state, activeChallengesCount: payload };
}

/**
 * Handles CHALLENGE/GET_SUBMISSION_INFORMATION_INIT action.
 * @param {Object} state
 * @param {Object} action
 * @return {Object} New state.
 */
function onGetSubmissionInformationInit(state, action) {
  return {
    ...state,
    loadingSubmissionInformationForChallengeId: action.payload.challengeId,
    loadingSubmissionInformationForSubmissionId: action.payload.submissionId,
    submissionInformation: null,
  };
}

/**
 * Handles CHALLENGE/GET_SUBMISSION_INFORMATION_DONE action.
 * @param {Object} state Previous state.
 * @param {Object} action Action.
 */
function onGetSubmissionInformationDone(state, action) {
  if (action.error) {
    logger.error("Failed to get submission information", action.payload);
    return {
      ...state,
      loadingSubmissionInformationForSubmissionId: "",
      submissionInformation: null,
    };
  }

  const { submissionId, submission } = action.payload;
  if (submissionId !== state.loadingSubmissionInformationForSubmissionId)
    return state;

  return {
    ...state,
    loadingSubmissionInformationForSubmissionId: "",
    submissionInformation: submission,
  };
}

function onGetChallengeInit(state) {
  return {
    ...state,
    isLoadingChallenge: true,
    isChallengeLoaded: false,
  };
}

function onGetChallengeDone(state, { error, payload }) {
  if (error) {
    logger.error("Failed to get challenge details!", payload);
    fireErrorMessage(
      "ERROR: Failed to load the challenge",
      "Please, try again a bit later"
    );
    return { ...state, isLoadingChallenge: false, isChallengeLoaded: false };
  }

  return {
    ...state,
    challenge: { ...payload },
    isLoadingChallenge: false,
    isChallengeLoaded: true,
  };
}

/**
 * Update isRegistered to before challenge submit
 * @param {Object} state Old state.
 * @param {Object} actions Action error/payload.
 * @param {Object} action Action.
 */
function onGetIsRegistered(state, { error, payload }) {
  if (error) {
    logger.error("Failed to get the user's registration status!", payload);
    fireErrorMessage(
      "ERROR: Failed to submit",
      "Please, try again a bit later"
    );
    return state;
  }
  return {
    ...state,
    challenge: {
      ...state.challenge,
      isRegistered: payload.isRegistered,
    },
  };
}

/**
 * Creates a new Challenge reducer with the specified initial state.
 * @param {Object} initialState Optional. Initial state.
 * @return {Function} Challenge reducer.
 */
function create(initialState) {
  const a = actions.challenge;
  return handleActions(
    {
      [a.dropCheckpoints]: (state) => ({ ...state, checkpoints: null }),
      [a.dropResults]: (state) => ({ ...state, results: null }),
      [a.getBasicDetailsInit]: onGetBasicDetailsInit,
      [a.getBasicDetailsDone]: onGetBasicDetailsDone,
      [a.getFullDetailsInit]: onGetFullDetailsInit,
      [a.getFullDetailsDone]: onGetFullDetailsDone,
      [a.getSubmissionsInit]: onGetSubmissionsInit,
      [a.getSubmissionsDone]: onGetSubmissionsDone,
      [a.getMmSubmissionsInit]: onGetMMSubmissionsInit,
      [a.getMmSubmissionsDone]: onGetMMSubmissionsDone,
      [smpActions.smp.deleteSubmissionDone]: (state, { payload }) => ({
        ...state,
        mySubmissions: {
          ...state.mySubmissions,
          v2: state.mySubmissions.v2.filter(
            (subm) => subm.submissionId !== payload
          ),
        },
      }),
      [a.registerInit]: (state) => ({ ...state, registering: true }),
      [a.registerDone]: onRegisterDone,
      [a.unregisterInit]: (state) => ({ ...state, unregistering: true }),
      [a.unregisterDone]: onUnregisterDone,
      [a.loadResultsInit]: onLoadResultsInit,
      [a.loadResultsDone]: onLoadResultsDone,
      [a.fetchCheckpointsInit]: (state) => ({
        ...state,
        checkpoints: null,
        loadingCheckpoints: true,
      }),
      [a.fetchCheckpointsDone]: onFetchCheckpointsDone,
      [a.updateChallengeInit]: onUpdateChallengeInit,
      [a.updateChallengeDone]: onUpdateChallengeDone,
      [a.getActiveChallengesCountInit]: (state) => state,
      [a.getActiveChallengesCountDone]: onGetActiveChallengesCountDone,
      [a.getSubmissionInformationInit]: onGetSubmissionInformationInit,
      [a.getSubmissionInformationDone]: onGetSubmissionInformationDone,
      [a.getChallengeInit]: onGetChallengeInit,
      [a.getChallengeDone]: onGetChallengeDone,
      [a.getIsRegistered]: onGetIsRegistered,
    },
    _.defaults(initialState, {
      details: null,
      loadingCheckpoints: false,
      loadingDetailsForChallengeId: "",
      loadingFullDetailsForChallengeId: "",
      loadingResultsForChallengeId: "",
      loadingMMSubmissionsForChallengeId: "",
      loadingSubmissionInformationForSubmissionId: "",
      mySubmissions: {},
      checkpoints: null,
      registering: false,
      results: null,
      resultsLoadedForChallengeId: "",
      unregistering: false,
      updatingChallengeUuid: "",
      mmSubmissions: [],
      submissionInformation: null,
      isLoadingChallenge: false,
    })
  );
}

/**
 * @static
 * @member default
 * @desc Reducer with default intial state.
 */
export default combineReducers(create(), { mySubmissionsManagement });
