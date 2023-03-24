import { handleActions } from "redux-actions";
import * as constants from "../../constants";
import _ from "lodash";

const defaultState = {
  gig: {
    status: constants.GIGS_FILTER_STATUSES.OPEN_JOBS,
  },
};

function onUpdateGigFilter(state, { payload }) {
  return {
    ...state,
    gig: {
      ...state.gig,
      ...payload,
    },
  };
}

export default handleActions(
  {
    UPDATE_GIG_FILTER: onUpdateGigFilter,
  },
  defaultState
);

export const initialGigFilter = _.cloneDeep(defaultState.gig);
