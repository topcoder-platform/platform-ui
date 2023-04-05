import { handleActions } from "redux-actions";
import _ from "lodash";
import {
  CHALLENGE_SORT_BY_MOST_RECENT,
  FILTER_BUCKETS,
  FILTER_CHALLENGE_TRACKS,
  FILTER_CHALLENGE_TYPES,
  PAGINATION_PER_PAGES,
} from "../constants";

const defaultState = {
  challenge: {
    types: FILTER_CHALLENGE_TYPES,
    tracks: FILTER_CHALLENGE_TRACKS,
    search: "",
    tags: [],
    groups: [],
    events: [],
    startDateEnd: null,
    endDateStart: null,
    page: 1,
    perPage: PAGINATION_PER_PAGES[0],
    sortBy: CHALLENGE_SORT_BY_MOST_RECENT,
    totalPrizesFrom: 0,
    totalPrizesTo: 10000,
    memberId: null,
    // ---

    bucket: FILTER_BUCKETS[1],
  },
};

function onInitApp(state, { payload }) {
  return {
    ...state,
    challenge: { ...state.challenge, ...payload },
  };
}

function onUpdateFilter(state, { payload }) {
  return {
    ...state,
    challenge: { ...state.challenge, ...payload },
  };
}

function onClearChallengeFilter(state, { payload }) {
  return { ...state, challenge: { ...state.challenge, ...payload } };
}

export default handleActions(
  {
    INIT_APP: onInitApp,
    UPDATE_FILTER: onUpdateFilter,
    CLEAR_CHALLENGE_FILTER: onClearChallengeFilter,
  },
  defaultState
);

export const initialChallengeFilter = _.cloneDeep(defaultState.challenge);
