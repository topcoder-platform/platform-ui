import _ from "lodash";
import { handleActions } from "redux-actions";

import actions, { SPECS_TAB_STATES } from "../../actions/page/challenge-details";
import { updateQuery } from "../../utils/url";

/**
 * Handles challengeActions.toggleCheckpointFeedback action.
 * @param {Object} state Previous state.
 * @param {Object} action Action.
 */
function onToggleCheckpointFeedback(state, { payload }) {
  return { ...state, feedbackOpen: payload };
}

/**
 * Handles CHALLENGE/SELECT_TAB action.
 * @param {Object} state
 * @param {Object} action
 * @return {Object}
 */
function onSelectTab(state, { payload }) {
  updateQuery({ tab: payload });
  return { ...state, selectedTab: payload };
}

/**
 * Handler for the SET_SPECS_TAB_STATE action.
 * @param {Object} state
 * @param {Object} action
 * @return {Object} New state.
 */
function onSetSpecsTabState(state, { payload }) {
  return { ...state, specsTabState: payload };
}

/**
 * Handler for open state of history of submission.
 * @param {Object} state
 * @param {Object} action
 * @return {Object} New state.
 */
function toggleSubmissionHistory(state, { payload }) {
  const newSubmissionHistoryOpen = _.clone(state.submissionHistoryOpen);
  newSubmissionHistoryOpen[payload.toString()] = !newSubmissionHistoryOpen[
    payload.toString()
  ];
  return { ...state, submissionHistoryOpen: newSubmissionHistoryOpen };
}

/**
 * Handler for open state of testcase of submission.
 * @param {Object} state
 * @param {Object} action
 * @return {Object} New state.
 */
function toggleSubmissionTestcase(state, { payload }) {
  const newSubmissionTestcaseOpen = _.clone(state.submissionTestcaseOpen);
  newSubmissionTestcaseOpen[payload.toString()] = !newSubmissionTestcaseOpen[
    payload.toString()
  ];
  return { ...state, submissionTestcaseOpen: newSubmissionTestcaseOpen };
}

/**
 * Handler for clear state of testcase open of submission.
 * @param {Object} state
 * @return {Object} New state.
 */
function clearSubmissionTestcaseOpen(state) {
  return { ...state, submissionTestcaseOpen: {} };
}

/**
 * Creates a new reducer.
 * @param {Object} state Optional. Initial state.
 * @return {Function} Reducer.
 */
function create(state = {}) {
  const a = actions.page.challengeDetails;
  return handleActions(
    {
      [a.selectTab]: onSelectTab,
      [a.setSpecsTabState]: onSetSpecsTabState,
      [a.toggleCheckpointFeedback]: onToggleCheckpointFeedback,
      [a.submissions.toggleSubmissionHistory]: toggleSubmissionHistory,
      [a.submissions.toggleSubmissionTestcase]: toggleSubmissionTestcase,
      [a.submissions.clearSubmissionTestcaseOpen]: clearSubmissionTestcaseOpen,
    },
    _.defaults(state, {
      feedbackOpen: {},
      specsTabState: SPECS_TAB_STATES.VIEW,
      submissionHistoryOpen: {},
      submissionTestcaseOpen: {},
    })
  );
}

export default create();
