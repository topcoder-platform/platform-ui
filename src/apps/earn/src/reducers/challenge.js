/**
 * @module "reducers.challenge"
 * @desc Reducer for {@link module:actions.challenge} actions.
 *
 * State segment managed by this reducer has the following strcuture:
 * @todo Document the structure.
 */

import _ from "lodash";

import { handleActions } from "redux-actions";
import { combineReducers, resolveAction } from "../utils/redux";

import actions from "../actions/challenge";
import smpActions from "../actions/smp";
import logger from "../utils/logger";
import { fireErrorMessage } from "../utils/errors";

import mySubmissionsManagement from "./my-submissions-management";
import { COMPETITION_TRACKS } from '../utils/tc';

 
 /**
  * Handles CHALLENGE/GET_DETAILS_INIT action.
  * @param {Object} state
  * @param {Object} action
  * @return {Object} New state
  */
 function onGetDetailsInit(state, action) {
   const challengeId = action.payload;
   return state.details && _.toString(state.details.id) !== challengeId ? {
     ...state,
     fetchChallengeFailure: false,
     loadingDetailsForChallengeId: challengeId,
     details: null,
   } : {
     ...state,
     fetchChallengeFailure: false,
     loadingDetailsForChallengeId: challengeId,
   };
 }
 
 /**
  * Handles CHALLENGE/GET_DETAILS_DONE action.
  * Note, that it silently discards received details if the ID of received
  * challenge mismatches the one stored in loadingDetailsForChallengeId field
  * of the state.
  * @param {Object} state
  * @param {Object} action
  * @return {Object} New state.
  */
 function onGetDetailsDone(state, action) {
   if (action.error) {
     alert("ERROR");
     logger.error('Failed to get challenge details!', action.payload);
     fireErrorMessage(
       'ERROR: Failed to load the challenge',
       'Please, try again a bit later',
     );
     return {
       ...state,
       fetchChallengeFailure: action.error,
       loadingDetailsForChallengeId: '',
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
     loadingDetailsForChallengeId: '',
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
     mySubmissions: { challengeId: '', v2: null },
   };
 }
 
 /**
  * Handles challengeActions.fetchSubmissionsDone action.
  * @param {Object} state Previous state.
  * @param {Object} action Action.
  */
 function onGetSubmissionsDone(state, action) {
   if (action.error) {
     logger.error('Failed to get user\'s submissions for the challenge', action.payload);
     return {
       ...state,
       loadingSubmissionsForChallengeId: '',
       mySubmissions: { challengeId: '', v2: null },
     };
   }
 
   const { challengeId, submissions } = action.payload;
   if (challengeId !== state.loadingSubmissionsForChallengeId) return state;
 
   return {
     ...state,
     loadingSubmissionsForChallengeId: '',
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
     logger.error('Failed to get Marathon Match submissions for the challenge', action.payload);
     return {
       ...state,
       loadingMMSubmissionsForChallengeId: '',
       mmSubmissions: [],
     };
   }
 
   const { challengeId, submissions } = action.payload;
   if (challengeId.toString() !== state.loadingMMSubmissionsForChallengeId) return state;
   return {
     ...state,
     loadingMMSubmissionsForChallengeId: '',
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
   if (state.details && `${state.details.legacyId}` === `${action.payload.challengeId}`) {
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
       loadingResultsForChallengeId: '',
       results: null,
       resultsLoadedForChallengeId: '',
     };
   }
   return {
     ...state,
     loadingResultsForChallengeId: '',
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
     logger.error('Failed to register for the challenge!', action.payload);
     fireErrorMessage('ERROR: Failed to register for the challenge!');
     return { ...state, registering: false };
   }
   /* As a part of registration flow we silently update challenge details,
    * reusing for this purpose the corresponding action handler. Thus, we
    * should also reuse corresponding reducer to generate proper state. */
   return onGetDetailsDone({
     ...state,
     registering: false,
     loadingDetailsForChallengeId: _.toString(state.details.id),
   }, action);
 }
 
 /**
  * Handles CHALLENGE/UNREGISTER_DONE action.
  * @param {Object} state
  * @param {Object} action
  * @return {Object}
  */
 function onUnregisterDone(state, action) {
   if (action.error) {
     logger.error('Failed to register for the challenge!', action.payload);
     fireErrorMessage('ERROR: Failed to unregister for the challenge!');
     return { ...state, unregistering: false };
   }
   /* As a part of unregistration flow we silently update challenge details,
    * reusing for this purpose the corresponding action handler. Thus, we
    * should also reuse corresponding reducer to generate proper state. */
   return onGetDetailsDone({
     ...state,
     unregistering: false,
     loadingDetailsForChallengeId: _.toString(state.details.id),
   }, action);
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
     fireErrorMessage('Failed to save the challenge!', '');
     logger.error('Failed to save the challenge', payload);
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
     'detailedRequirements',
     'introduction',
     'round1Introduction',
     'round2Introduction',
     'submissionGuidelines',
   ]);
 
   return {
     ...state,
     details: {
       ...state.details,
       ...res,
     },
     updatingChallengeUuid: '',
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
     fireErrorMessage('Failed to get active challenges count!', '');
     logger.error('Failed to get active challenges count', payload);
     return state;
   }
 
   return ({ ...state, activeChallengesCount: payload });
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
     logger.error('Failed to get submission information', action.payload);
     return {
       ...state,
       loadingSubmissionInformationForSubmissionId: '',
       submissionInformation: null,
     };
   }
 
   const { submissionId, submission } = action.payload;
   if (submissionId !== state.loadingSubmissionInformationForSubmissionId) return state;
 
   return {
     ...state,
     loadingSubmissionInformationForSubmissionId: '',
     submissionInformation: submission,
   };
 }
 
 /**
  * Handles CHALLENGE/GET_CHALLENGE_STATISTICS_DONE action.
  * @param {Object} state Previous state.
  * @param {Object} action Action.
  */
 function onFetchChallengeStatisticsDone(state, action) {
   if (action.error) {
     logger.error('Failed to get challenge statistics', action.payload);
     return {
       ...state,
       statisticsData: null,
     };
   }
 
   return {
     ...state,
     statisticsData: action.payload,
   };
 }
 
 /**
  * Creates a new Challenge reducer with the specified initial state.
  * @param {Object} initialState Optional. Initial state.
  * @return {Function} Challenge reducer.
  */
 function create(initialState) {
   const a = actions.challenge;
   return handleActions({
     [a.dropCheckpoints]: state => ({ ...state, checkpoints: null }),
     [a.dropResults]: state => ({ ...state, results: null }),
     [a.getDetailsInit]: onGetDetailsInit,
     [a.getDetailsDone]: onGetDetailsDone,
     [`${a.getDetailsDone}_SUCCESS`]: onGetDetailsDone,
     [`${a.getDetailsDone}_ERROR`]: onGetDetailsDone,
     [a.getSubmissionsInit]: onGetSubmissionsInit,
     [a.getSubmissionsDone]: onGetSubmissionsDone,
     [a.getMmSubmissionsInit]: onGetMMSubmissionsInit,
     [a.getMmSubmissionsDone]: onGetMMSubmissionsDone,
     [smpActions.smp.deleteSubmissionDone]: (state, { payload }) => ({
       ...state,
       mySubmissions: {
         ...state.mySubmissions,
         v2: state.mySubmissions.v2.filter(subm => (
           subm.submissionId !== payload
         )),
       },
     }),
     [a.registerInit]: state => ({ ...state, registering: true }),
     [a.registerDone]: onRegisterDone,
     [a.unregisterInit]: state => ({ ...state, unregistering: true }),
     [a.unregisterDone]: onUnregisterDone,
     [a.loadResultsInit]: onLoadResultsInit,
     [a.loadResultsDone]: onLoadResultsDone,
     [a.fetchCheckpointsInit]: state => ({
       ...state,
       checkpoints: null,
       loadingCheckpoints: true,
     }),
     [a.fetchCheckpointsDone]: onFetchCheckpointsDone,
     [a.updateChallengeInit]: onUpdateChallengeInit,
     [a.updateChallengeDone]: onUpdateChallengeDone,
     [a.getActiveChallengesCountInit]: state => state,
     [a.getActiveChallengesCountDone]: onGetActiveChallengesCountDone,
     [a.getSubmissionInformationInit]: onGetSubmissionInformationInit,
     [a.getSubmissionInformationDone]: onGetSubmissionInformationDone,
     [a.fetchChallengeStatisticsInit]: state => state,
     [a.fetchChallengeStatisticsDone + "_SUCCESS"]: onFetchChallengeStatisticsDone,
   }, _.defaults(initialState, {
     details: null,
     loadingCheckpoints: false,
     loadingDetailsForChallengeId: '',
     loadingResultsForChallengeId: '',
     loadingMMSubmissionsForChallengeId: '',
     loadingSubmissionInformationForSubmissionId: '',
     mySubmissions: {},
     checkpoints: null,
     registering: false,
     results: null,
     resultsLoadedForChallengeId: '',
     unregistering: false,
     updatingChallengeUuid: '',
     mmSubmissions: [],
     submissionInformation: null,
     statisticsData: null,
   }));
 }
 
 /**
  * Factory which creates a new reducer with its initial state tailored to the
  * given options object, if specified (for server-side rendering). If options
  * object is not specified, it creates just the default reducer. Accepted options are:
  *
  * @param {Object} options={} Optional. Factory options.
  * @param {String} [options.auth.tokenV2=''] Optional. Topcoder v2 auth token.
  * @param {String} [options.auth.tokenV3=''] Optional. Topcoder v3 auth token.
  * @param {String} [options.challenge.challengeDetails.id=''] Optional. ID of
  *  the challenge to load details for.
  * @param {Boolean} [options.challenge.challengeDetails.mySubmission=false]
  *  Optional. The flag indicates whether load my submission.
  * @return {Promise}
  * @resolves {Function(state, action): state} New reducer.
  */
 export function factory(options = {}) {
   /* Server-side rendering of Submission Management Page. */
 
   /* TODO: This shares some common logic with the next "if" block, which
    * should be re-used there. */
   /* TODO: For completely server-side rendering it is also necessary to load
    * terms, etc. */
 
   const tokens = {
     tokenV2: _.get(options.auth, 'tokenV2'),
     tokenV3: _.get(options.auth, 'tokenV3'),
   };
 
   let state = {};
   const challengeId = _.get(options, 'challenge.challengeDetails.id');
   const mySubmission = _.get(options, 'challenge.challengeDetails.mySubmission');
 
   if (challengeId && !mySubmission) {
     return resolveAction(actions.challenge.getDetailsDone(
       challengeId,
       tokens.tokenV3,
       tokens.tokenV2,
     )).then((res) => {
       const challengeDetails = _.get(res, 'payload', {});
       const track = _.get(challengeDetails, 'track', '');
       let checkpointsPromise = null;
       if (track === COMPETITION_TRACKS.DES) {
         const p = _.get(challengeDetails, 'phases', [])
           .filter(x => x.name === 'Checkpoint Review');
         if (p.length && !p[0].isOpen) {
           checkpointsPromise = resolveAction(
             actions.challenge.fetchCheckpointsDone(tokens.tokenV2, challengeDetails.legacyId),
           );
         }
       }
       const resultsPromise = challengeDetails.status === 'Completed' ? (
         resolveAction(
           actions.challenge.loadResultsDone(tokens, challengeId, track.toLowerCase()),
         )
       ) : null;
       return Promise.all([res, checkpointsPromise, resultsPromise]);
     }).then(([details, checkpoints, results]) => {
       state = {
         ...state,
         loadingCheckpoints: true,
         loadingDetailsForChallengeId: challengeId,
         loadingResultsForChallengeId: challengeId,
       };
       state = onGetDetailsDone(state, details);
       if (checkpoints) state = onFetchCheckpointsDone(state, checkpoints);
       if (results) state = onLoadResultsDone(state, results);
       return state;
     }).then(res => combineReducers(
       create(res),
       { mySubmissionsManagement },
     ));
   }
 
   if (challengeId && mySubmission) {
     return Promise.all([
       resolveAction(actions.challenge.getDetailsDone(
         challengeId,
         tokens.tokenV3,
         tokens.tokenV2,
       )),
       resolveAction(actions.challenge.getSubmissionsDone(
         challengeId,
         tokens.tokenV2,
       )),
     ]).then(([challenge, submissions]) => {
       state = {
         ...state,
         loadingSubmissionsForChallengeId: challengeId,
         loadingDetailsForChallengeId: challengeId,
       };
       state = onGetDetailsDone(state, challenge);
       return onGetSubmissionsDone(state, submissions);
     }).then(res => combineReducers(
       create(res),
       { mySubmissionsManagement },
     ));
   }
 
   /* Otherwise this part of Redux state is initialized empty. */
   return Promise.resolve(combineReducers(
     create(state),
     { mySubmissionsManagement },
   ));
 }
 
 /**
  * @static
  * @member default
  * @desc Reducer with default intial state.
  */
 export default combineReducers(create(), { mySubmissionsManagement });