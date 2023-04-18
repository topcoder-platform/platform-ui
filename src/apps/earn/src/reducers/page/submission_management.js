/**
 * TODO: Most probably it is not fully functional, I believe a piece of
 * these functionality still should be moved to `topcoder-react-lib`.
 */

import _ from 'lodash';
import actions from '@earn/actions/page/submission_management';
import { handleActions } from "redux-actions";

function onShowDetails(state, { payload: id }) {
  const showDetails = _.clone(state.showDetails);
  if (showDetails[id]) delete showDetails[id];
  else showDetails[id] = true;
  return { ...state, showDetails };
}

function create(initialState = {}) {
  const a = actions.page.submissionManagement;
  return handleActions({
    [a.showDetails]: onShowDetails,

    [a.confirmDelete]: (state, { payload }) => ({
      ...state,
      showModal: true,
      toBeDeletedId: payload,
    }),

    [a.cancelDelete]: state => ({
      ...state,
      showModal: false,
      toBeDeletedId: '',
      deletionSucceed: false,
    }),

    'SMP/DELETE_SUBMISSION_INIT': (state, { payload }) => ({
      ...state,
      deletingSubmission: false,
      deletionSucceed: false,
      showModal: false,
      toBeDeletedId: payload,
    }),

    'SMP/DELETE_SUBMISSION_FAIL': state => ({
      ...state,
      deletingSubmission: false,
      showModal: false,
      toBeDeletedId: '',
      deletionSucceed: true,
    }),

    'SMP/DELETE_SUBMISSION_DONE': (state, { payload }) => ({
      ...state,
      deletingSubmission: false,
      showModal: false,
      toBeDeletedId: payload,
      deletionSucceed: true,
    }),

  }, _.defaults(initialState, {
    showDetails: {},
    showModal: false,
    toBeDeletedId: '',
    deletionSucceed: false,
  }));
}

export default create();
