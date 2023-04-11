/**
 * Reducer for state.challengeListing.
 */

import _ from "lodash";
import actions from "../../actions/challenge-listing";
import { handleActions } from "redux-actions";
import { combineReducers } from "../../utils/redux";
import { updateQuery } from "../../utils/url";
import moment from "moment";
import logger from "../../utils/logger";

import actionChallenge from "../../actions/challenge";
import { REVIEW_OPPORTUNITY_TYPES } from "../../utils/tc";
import filterPanel from "./filter-panel";
import sidebar from "./sidebar";

/**
 * On register done
 * @param {Object} state current state
 * @param {Object} param1 payload info
 */
function onRegisterDone(state, { error, payload }) {
  if (error) {
    return state;
  }
  const {
    recommendedChallenges,
    loadingRecommendedChallengesTechnologies,
  } = state;
  if (!loadingRecommendedChallengesTechnologies) {
    return state;
  }

  const { challenges } = recommendedChallenges[
    loadingRecommendedChallengesTechnologies
  ];
  const challenge = _.find(challenges, { id: payload.id });
  if (!challenge) {
    return state;
  }
  // add current user to registed recommended challenges
  challenge.users = payload.users;
  return {
    ...state,
    recommendedChallenges,
  };
}

/**
 * On unregister done
 * @param {Object} state current state
 * @param {Object} param1 payload info
 */
function onUnregisterDone(state, { error, payload }) {
  if (error) {
    return state;
  }
  const {
    recommendedChallenges,
    loadingRecommendedChallengesTechnologies,
  } = state;
  if (!loadingRecommendedChallengesTechnologies) {
    return state;
  }

  const { challenges } = recommendedChallenges[
    loadingRecommendedChallengesTechnologies
  ];
  const challenge = _.find(challenges, { id: payload.id });
  if (!challenge) {
    return state;
  }
  // remove current user from registed recommended challenges
  challenge.users = {};
  return {
    ...state,
    recommendedChallenges,
  };
}

/**
 * Handles CHALLENGE_LISTING/GET_CHALLENGE_SUBTRACKS_DONE action.
 * @param {Object} state
 * @param {Object} action
 * @return {Object}
 */
function onGetChallengeTypesDone(state, action) {
  if (action.error) logger.error(action.payload);
  return {
    ...state,
    challengeTypes: action.error ? [] : action.payload,
    challengeTypesMap: action.error ? {} : _.keyBy(action.payload, "id"),
    loadingChallengeTypes: false,
  };
}

/**
 * Handles CHALLENGE_LISTING/GET_CHALLENGE_TAGS_DONE action.
 * @param {Object} state
 * @param {Object} action
 * @return {Object}
 */
function onGetChallengeTagsDone(state, action) {
  if (action.error) logger.error(action.payload);
  return {
    ...state,
    challengeTags: action.error ? [] : action.payload,
    loadingChallengeTags: false,
  };
}

function onSelectCommunity(state, { payload }) {
  updateQuery({ communityId: payload || undefined });
  return {
    ...state,
    selectedCommunityId: payload,

    /* Page numbers of past/upcoming challenges depend on the filters. To keep
     * the code simple we just reset them each time a filter is modified.
     * (This community selection defines community-specific filter for
     * challenges). */
    // allPastChallengesLoaded: false,
    // lastRequestedPageOfPastChallenges: -1,
    // pastSearchTimestamp: -1,
  };
}

/**
 * @param {Object} state
 * @param {Object} action
 * @return {Object}
 */
function onSetFilter(state, { payload }) {
  // console.log(`bbbbbb`);
  // console.log(payload);
  /* Validation of filter parameters: they may come from URL query, thus
   * validation is not a bad idea. As you may note, at the moment we do not
   * do it very carefuly (many params are not validated). */
  const filter = _.pickBy(
    _.pick(payload, [
      "tags",
      "types",
      "search",
      "startDateEnd",
      "endDateStart",
      "groups",
      "events",
      "tracks",
    ]),
    (value) =>
      (!_.isArray(value) && value && value !== "") ||
      (_.isArray(value) && value.length > 0)
  );

  const emptyArrayAllowedFields = ["types"];
  emptyArrayAllowedFields.forEach((field) => {
    if (_.isEqual(payload[field], [])) {
      filter[field] = payload[field];
    }
  });

  // if (_.isPlainObject(filter.tags)) {
  //   filter.tags = _.values(filter.tags);
  // }
  // if (_.isPlainObject(filter.subtracks)) {
  //   filter.subtracks = _.values(filter.subtracks);
  // }
  if (filter.startDateEnd && !moment(filter.startDateEnd).isValid()) {
    delete filter.startDateEnd;
  }
  if (filter.endDateStart && !moment(filter.endDateStart).isValid()) {
    delete filter.endDateStart;
  }
  // console.log(`aaaaa`);
  // console.log(filter);
  /* Update of URL and generation of the state. */
  updateQuery(filter);
  // console.log(payload);
  // console.log(`======`);
  return {
    ...state,
    filter: _.assign({}, state.filter, payload),

    /* Page numbers of past/upcoming challenges depend on the filters. To keep
     * the code simple we just reset them each time a filter is modified. */
    // allPastChallengesLoaded: false,
    // lastRequestedPageOfPastChallenges: -1,
    // pastSearchTimestamp: -1,
  };
}

/**
 * Creates a new Challenge Listing reducer with the specified initial state.
 * @param {Object} initialState Optional. Initial state.
 * @return Challenge Listing reducer.
 */
function create(initialState) {
  const a = actions.challengeListing;
  return handleActions(
    {
      [a.dropChallenges]: (state) => ({
        ...state,
        allActiveChallengesLoaded: false,
        allMyChallengesLoaded: false,
        allChallengesLoaded: false,
        allRecommendedChallengesLoaded: false,
        allOpenForRegistrationChallengesLoaded: false,
        allPastChallengesLoaded: false,
        // allReviewOpportunitiesLoaded: false,
        challenges: [],
        allChallenges: [],
        myChallenges: [],
        myPastChallenges: [],
        openForRegistrationChallenges: [],
        pastChallenges: [],
        lastRequestedPageOfActiveChallenges: -1,
        lastRequestedPageOfOpenForRegistrationChallenges: -1,
        lastRequestedPageOfMyChallenges: -1,
        lastRequestedPageOfMyPastChallenges: -1,
        lastRequestedPageOfAllChallenges: -1,
        lastRequestedPageOfRecommendedChallenges: -1,
        lastRequestedPageOfPastChallenges: -1,
        // lastRequestedPageOfReviewOpportunities: -1,
        // lastUpdateOfActiveChallenges: 0,
        loadingActiveChallengesUUID: "",
        loadingOpenForRegistrationChallengesUUID: "",
        loadingMyChallengesUUID: "",
        loadingMyPastChallengesUUID: "",
        // loadingRestActiveChallengesUUID: '',
        loadingPastChallengesUUID: "",
        // loadingReviewOpportunitiesUUID: '',

        loadingTotalChallengesCountUUID: "",
        // reviewOpportunities: [],
        // filter: {
        //   tracks: {
        //     Dev: true,
        //     Des: true,
        //     DS: true,
        //     QA: true,
        //   },
        //   name: '',
        //   tags: [],
        //   types: [],
        //   communityId: 'All',
        //   startDateStart: '',
        //   endDateEnd: '',
        // },
        // meta: {
        //   allChallengesCount: 0,
        //   myChallengesCount: 0,
        //   ongoingChallengesCount: 0,
        //   openChallengesCount: 0,
        //   totalCount: 0,
        // },
      }),
      [a.dropActiveChallenges]: (state) => ({
        ...state,
        challenges: [],
        lastRequestedPageOfActiveChallenges: -1,
        loadingActiveChallengesUUID: "",
      }),
      [a.dropOpenForRegistrationChallenges]: (state) => ({
        ...state,
        openForRegistrationChallenges: [],
        lastRequestedPageOfOpenForRegistrationChallenges: -1,
        loadingOpenForRegistrationChallengesUUID: "",
      }),
      [a.dropMyChallenges]: (state) => ({
        ...state,
        myChallenges: [],
        lastRequestedPageOfMyChallenges: -1,
        loadingMyChallengesUUID: "",
      }),
      [a.dropMyPastChallenges]: (state) => ({
        ...state,
        myPastChallenges: [],
        lastRequestedPageOfMyPastChallenges: -1,
        loadingMyPastChallengesUUID: "",
      }),
      [a.dropAllChallenges]: (state) => ({
        ...state,
        allChallenges: [],
        lastRequestedPageOfAllChallenges: -1,
        loadingAllChallengesUUID: "",
      }),
      [a.dropRecommendedChallenges]: (state) => ({
        ...state,
        lastRequestedPageOfRecommendedChallenges: -1,
        loadingAllChallengesUUID: "",
      }),
      [a.dropPastChallenges]: (state) => ({
        ...state,
        pastChallenges: [],
        lastRequestedPageOfPastChallenges: -1,
        loadingPastChallengesUUID: "",
      }),
      [a.expandTag]: (state, { payload }) => ({
        ...state,
        expandedTags: [...state.expandedTags, payload],
      }),

      [actionChallenge.registerDone]: onRegisterDone,
      [actionChallenge.unregisterDone]: onUnregisterDone,

      [a.getChallengeTypesInit]: (state) => ({
        ...state,
        loadingChallengetypes: true,
      }),
      [a.getChallengeTypesDone]: onGetChallengeTypesDone,

      [a.getChallengeTagsInit]: (state) => ({
        ...state,
        loadingChallengeTags: true,
      }),
      [a.getChallengeTagsDone]: onGetChallengeTagsDone,

      [a.selectCommunity]: onSelectCommunity,

      [a.setFilter]: onSetFilter,
      [a.setSort]: (state, { payload }) => ({
        ...state,
        sorts: {
          ...state.sorts,
          [payload.bucket]: payload.sort,
        },
      }),
    },
    _.defaults(_.clone(initialState) || {}, {
      allActiveChallengesLoaded: false,
      allMyChallengesLoaded: false,
      allMyPastChallengesLoaded: false,
      allOpenForRegistrationChallengesLoaded: false,
      allChallengesLoaded: false,
      allRecommendedChallengesLoaded: false,
      allPastChallengesLoaded: false,
      allReviewOpportunitiesLoaded: false,

      challenges: [],
      allChallenges: [],
      myChallenges: [],
      openForRegistrationChallenges: [],
      pastChallenges: [],
      myPastChallenges: [],
      recommendedChallenges: [],
      challengeTypes: [],
      challengeTypesMap: {},
      challengeTags: [],

      expandedTags: [],

      keepPastPlaceholders: false,

      lastRequestedPageOfActiveChallenges: -1,
      lastRequestedPageOfOpenForRegistrationChallenges: -1,
      lastRequestedPageOfMyChallenges: -1,
      lastRequestedPageOfAllChallenges: -1,
      lastRequestedPageOfRecommendedChallenges: -1,
      lastRequestedPageOfMyPastChallenges: -1,
      lastRequestedPageOfPastChallenges: -1,
      lastRequestedPageOfReviewOpportunities: -1,
      // lastUpdateOfActiveChallenges: 0,

      loadingActiveChallengesUUID: "",
      loadingOpenForRegistrationChallengesUUID: "",
      loadingMyChallengesUUID: "",
      loadingAllChallengesUUID: "",
      loadingMyPastChallengesUUID: "",
      loadingRecommendedChallengesUUID: "",
      // loadingRestActiveChallengesUUID: '',
      loadingRecommendedChallengesTechnologies: "",
      loadingTotalChallengesCountUUID: "",
      loadingPastChallengesUUID: "",
      loadingReviewOpportunitiesUUID: "",

      loadingChallengeTypes: false,
      loadingChallengeTags: false,

      reviewOpportunities: [],
      filter: {
        tracks: {
          Dev: true,
          Des: true,
          DS: true,
          QA: true,
        },
        search: "",
        tags: [],
        types: [],
        groups: [],
        events: [],
        startDateEnd: null,
        endDateStart: null,
        reviewOpportunityTypes: _.keys(REVIEW_OPPORTUNITY_TYPES),
      },

      selectedCommunityId: "All",

      sorts: {
        ongoing: "startDate",
        openForRegistration: "startDate",
        my: "startDate",
        all: "startDate",
        // past: 'updated',
        reviewOpportunities: "review-opportunities-start-date",
        allPast: "startDate",
        myPast: "startDate",
      },

      srms: {
        data: [],
        loadingUuid: "",
        timestamp: 0,
      },

      meta: {
        allChallengesCount: 0,
        allRecommendedChallengesCount: 0,
        myChallengesCount: 0,
        ongoingChallengesCount: 0,
        openChallengesCount: 0,
        pastChallengesCount: 0,
        myPastChallengesCount: 0,
        totalCount: 0,
      },

      // pastSearchTimestamp: -1,
    })
  );
}

/* Default reducer with empty initial state. */
export default combineReducers(create(), { filterPanel, sidebar });
