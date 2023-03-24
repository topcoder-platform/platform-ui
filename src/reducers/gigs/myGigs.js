import { size, sortBy } from "lodash";
import { handleActions } from "redux-actions";
import * as constants from "../../constants";

const defaultState = {
  loadingMyGigs: false,
  loadingMyGigsError: null,
  [constants.GIGS_FILTER_STATUSES.ACTIVE_JOBS]: {
    myGigs: null,
    page: 1,
    numLoaded: 0,
    total: 0,
  },
  [constants.GIGS_FILTER_STATUSES.OPEN_JOBS]: {
    myGigs: null,
    page: 1,
    numLoaded: 0,
    total: 0,
  },
  [constants.GIGS_FILTER_STATUSES.COMPLETED_JOBS]: {
    myGigs: null,
    page: 1,
    numLoaded: 0,
    total: 0,
  },
  [constants.GIGS_FILTER_STATUSES.ARCHIVED_JOBS]: {
    myGigs: null,
    page: 1,
    numLoaded: 0,
    total: 0,
  },
  profile: {},
  loadingProfile: true,
  loadingProfileError: null,
  updatingProfile: false,
  updatingProfileError: null,
  updatingProfileSuccess: null,
  checkingGigs: false,
};

function onGetMyActiveGigsInit(state) {
  return { ...state, loadingMyGigs: true, loadingMyGigsError: null };
}

function onGetMyActiveGigsDone(state, { payload }) {
  const currentGigs =
    payload.page == 1
      ? []
      : state[constants.GIGS_FILTER_STATUSES.ACTIVE_JOBS].myGigs || [];
  return {
    ...state,
    [constants.GIGS_FILTER_STATUSES.ACTIVE_JOBS]: {
      myGigs: sortBy(currentGigs.concat(payload.myGigs), ["sortPrio"]),
      total: payload.total,
      numLoaded: currentGigs.length + payload.myGigs.length,
      page: payload.page,
    },
    loadingMyGigs: false,
    loadingMyGigsError: null,
  };
}

function onGetMyOpenGigsInit(state) {
  return { ...state, loadingMyGigs: true, loadingMyGigsError: null };
}

function onGetMyOpenGigsDone(state, { payload }) {
  const currentGigs =
    payload.page == 1
      ? []
      : state[constants.GIGS_FILTER_STATUSES.OPEN_JOBS].myGigs || [];
  return {
    ...state,
    [constants.GIGS_FILTER_STATUSES.OPEN_JOBS]: {
      myGigs: sortBy(currentGigs.concat(payload.myGigs), ["sortPrio"]),
      total: payload.total,
      numLoaded: currentGigs.length + payload.myGigs.length,
      page: payload.page,
    },
    loadingMyGigs: false,
    loadingMyGigsError: null,
  };
}

function onGetMyCompletedGigsInit(state) {
  return { ...state, loadingMyGigs: true, loadingMyGigsError: null };
}

function onGetMyCompletedGigsDone(state, { payload }) {
  const currentGigs =
    payload.page == 1
      ? []
      : state[constants.GIGS_FILTER_STATUSES.COMPLETED_JOBS].myGigs || [];
  return {
    ...state,
    [constants.GIGS_FILTER_STATUSES.COMPLETED_JOBS]: {
      myGigs: sortBy(currentGigs.concat(payload.myGigs), ["sortPrio"]),
      total: payload.total,
      numLoaded: currentGigs.length + payload.myGigs.length,
      page: payload.page,
    },
    loadingMyGigs: false,
    loadingMyGigsError: null,
  };
}

function onGetMyArchivedGigsInit(state) {
  return { ...state, loadingMyGigs: true, loadingMyGigsError: null };
}

function onGetMyArchivedGigsDone(state, { payload }) {
  const currentGigs =
    payload.page == 1
      ? []
      : state[constants.GIGS_FILTER_STATUSES.ARCHIVED_JOBS].myGigs || [];
  return {
    ...state,
    [constants.GIGS_FILTER_STATUSES.ARCHIVED_JOBS]: {
      myGigs: sortBy(currentGigs.concat(payload.myGigs), ["sortPrio"]),
      total: payload.total,
      numLoaded: currentGigs.length + payload.myGigs.length,
      page: payload.page,
    },
    loadingMyGigs: false,
    loadingMyGigsError: null,
  };
}

function onGetProfileInit(state) {
  return { ...state, loadingProfile: true, loadingProfileError: null };
}

function onGetProfileDone(state, { payload }) {
  return {
    ...state,
    profile: { ...payload },
    loadingProfile: false,
    loadingProfileError: null,
  };
}

function onGetProfileFailure(state, { payload }) {
  return {
    ...state,
    loadingProfile: false,
    loadingProfileError: payload,
    profile: {},
  };
}

function onUpdateProfileInit(state) {
  return {
    ...state,
    updatingProfile: true,
    updatingProfileError: null,
    updatingProfileSuccess: null,
  };
}

function onUpdateProfileDone(state, { payload }) {
  return {
    ...state,
    profile: { ...payload },
    updatingProfile: false,
    updatingProfileError: null,
    updatingProfileSuccess: true,
  };
}

function onUpdateProfileFailure(state, { payload }) {
  return {
    ...state,
    updatingProfile: false,
    updatingProfileError: payload,
    updatingProfileSuccess: false,
  };
}

function onUpdateProfileReset(state) {
  return {
    ...state,
    updatingProfile: false,
    updatingProfileError: null,
    updatingProfileSuccess: null,
  };
}

function onCheckingGigsInit(state) {
  return {
    ...state,
    checkingGigs: true,
  };
}

function onCheckingGigsDone(state) {
  return {
    ...state,
    checkingGigs: false,
  };
}

export default handleActions(
  {
    GET_MY_ACTIVE_GIGS_PENDING: onGetMyActiveGigsInit,
    GET_MY_ACTIVE_GIGS_SUCCESS: onGetMyActiveGigsDone,
    GET_MY_OPEN_GIGS_PENDING: onGetMyOpenGigsInit,
    GET_MY_OPEN_GIGS_SUCCESS: onGetMyOpenGigsDone,
    GET_MY_COMPLETED_GIGS_PENDING: onGetMyCompletedGigsInit,
    GET_MY_COMPLETED_GIGS_SUCCESS: onGetMyCompletedGigsDone,
    GET_MY_ARCHIVED_GIGS_PENDING: onGetMyArchivedGigsInit,
    GET_MY_ARCHIVED_GIGS_SUCCESS: onGetMyArchivedGigsDone,

    GET_PROFILE_PENDING: onGetProfileInit,
    GET_PROFILE_SUCCESS: onGetProfileDone,
    GET_PROFILE_ERROR: onGetProfileFailure,
    UPDATE_PROFILE_PENDING: onUpdateProfileInit,
    UPDATE_PROFILE_SUCCESS: onUpdateProfileDone,
    UPDATE_PROFILE_ERROR: onUpdateProfileFailure,
    UPDATE_PROFILE_RESET: onUpdateProfileReset,
    START_CHECKING_GIGS_PENDING: onCheckingGigsInit,
    START_CHECKING_GIGS_SUCCESS: onCheckingGigsDone,
  },
  defaultState
);
