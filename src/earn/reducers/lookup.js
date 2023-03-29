/**
 * @module "reducers.lookup"
 * @desc Reducer for {@link module:actions.lookup} actions.
 *
 * State segment managed by this reducer has the following structure:
 * @param {Array} skillTags='' skill tags.
 */
import _ from "lodash";
import { handleActions } from "redux-actions";
import * as constants from "../constants";
import logger from "../utils/logger";
import actions, { PAGE_SIZE } from "../actions/lookup";

function onGetTagsDone(state, { payload }) {
  return { ...state, tags: payload };
}

function onGetCommunityListInit(state) {
  return {
    ...state,
    isSubCommunitiesLoaded: false,
  };
}

function onGetCommunityListDone(state, { error, payload }) {
  if (error) {
    return { ...state, subCommunities: [] };
  }
  return { ...state, subCommunities: payload, isSubCommunitiesLoaded: true };
}

/**
 * Handles LOOKUP/GET_TYPES_DONE action.
 * @param {Object} state
 * @param {Object} action Payload will be JSON from api call
 * @return {Object} New state
 */
function onGetTypesDone(state, { payload, error }) {
  if (error) {
    logger.error("Failed to get types", payload);
    return { ...state, loadingTypesError: true };
  }

  const types = _.map(_.uniq(payload.sort()), (v) => ({
    key: v,
    name: v,
  }));
  return {
    ...state,
    loadingTypesError: false,
    types,
  };
}

/**
 * Handles LOOKUP/GET_MANUFACTURERS_INIT action.
 * @param {Object} state
 * @param {Object} action Payload will be JSON from api call
 * @return {Object} New state
 */
function onGetManufacturersInit(state) {
  return {
    ...state,
    manufacturers: [],
    models: [],
    oses: [],
  };
}

/**
 * Handles LOOKUP/GET_MANUFACTURERS_DONE action.
 * @param {Object} state
 * @param {Object} action Payload will be JSON from api call
 * @return {Object} New state
 */
function onGetManufacturersDone(state, { payload, error }) {
  if (error) {
    logger.error("Failed to get types", payload);
    return { ...state, loadingManufacturersError: true };
  }

  const manufacturers = _.map(_.uniq(payload.sort()), (v) => ({
    key: v,
    name: v,
  }));
  return {
    ...state,
    loadingManufacturersError: false,
    manufacturers,
  };
}

/**
 * Handles LOOKUP/GET_MODELS_INIT action.
 * @param {Object} state
 * @param {Object} action Payload will be JSON from api call
 * @return {Object} New state
 */
function onGetModelsInit(state, { payload }) {
  // if load more, don't clear state
  if (payload.page > 1) {
    return { ...state, modelPage: payload.page, isModelsLoading: true };
  }
  return {
    ...state,
    models: [],
    oses: [],
    modelPage: payload.page,
    isModelsLoading: true,
  };
}

/**
 * Handles LOOKUP/GET_MODELS_DONE action.
 * @param {Object} state
 * @param {Object} action Payload will be JSON from api call
 * @return {Object} New state
 */
function onGetModelsDone(state, { payload, error }) {
  if (error) {
    logger.error("Failed to get types", payload);
    return { ...state, loadingModelsError: true, isModelsLoading: false };
  }

  let models = payload;
  const hasMore = models.length === PAGE_SIZE;

  if (state.modelPage > 1) {
    models = [...state.models, ...models];
  }
  models = _.orderBy(models, ["model"], ["asc"]);
  models = _.uniqBy(models, (m) => m.model);

  return {
    ...state,
    loadingModelsError: false,
    models,
    hasMoreModels: hasMore,
    isModelsLoading: false,
  };
}

/**
 * Handles LOOKUP/GET_OSES_INIT action.
 * @param {Object} state
 * @param {Object} action Payload will be JSON from api call
 * @return {Object} New state
 */
function onGetOsesInit(state, { payload }) {
  return {
    ...state,
    osPage: payload.page,
    isOsesLoading: true,
  };
}

/**
 * Handles LOOKUP/GET_OSES_DONE action.
 * @param {Object} state
 * @param {Object} action Payload will be JSON from api call
 * @return {Object} New state
 */
function onGetOsesDone(state, { payload, error }) {
  if (error) {
    logger.error("Failed to get types", payload);
    return { ...state, loadingOsesError: true, isOsesLoading: false };
  }

  let oses = payload;
  const hasMore = oses.length === PAGE_SIZE;
  if (state.osPage > 1) {
    oses = [...state.oses, ...oses];
  }
  oses = _.orderBy(payload, ["operatingSystem"], ["asc"]);

  oses = _.uniqBy(oses, (m) => m.operatingSystem);
  return {
    ...state,
    loadingOsesError: false,
    oses,
    hasMoreOses: hasMore,
    isOsesLoading: false,
  };
}

/**
 * Handles LOOKUP/GET_SKILL_TAGS_DONE action.
 * @param {Object} state
 * @param {Object} action Payload will be JSON from api call
 * @return {Object} New state
 */
function onGetSkillTagsDone(state, { payload, error }) {
  if (error) {
    logger.error("Failed to get skill tags", payload);
    return { ...state, loadingSkillTagsError: true };
  }

  return {
    ...state,
    loadingSkillTagsError: false,
    skillTags: payload,
  };
}

/**
 * Handles LOOKUP/GET_COUNTRIES_DONE action.
 * @param {Object} state
 * @param {Object} action Payload will be JSON from api call
 * @return {Object} New state
 */
function onGetCountriesDone(state, { payload, error }) {
  if (error) {
    logger.error("Failed to get countries", payload);
    return { ...state, loadingCountriesError: true };
  }

  return {
    ...state,
    loadingCountriesError: false,
    countries: payload,
  };
}

/**
 * Handles LOOKUP/GET_REVIEW_TYPES_DONE action.
 * @param {Object} state
 * @param {Object} action Payload will be JSON from api call
 * @return {Object} New state
 */
function onGetReviewTypesDone(state, { payload, error }) {
  if (error) {
    logger.error("Failed to get review types", payload);
    return { ...state, loadingReviewTypesError: true };
  }

  return {
    ...state,
    loadingReviewTypesError: false,
    reviewTypes: payload,
  };
}

/**
 * Handles LOOKUP/GET_ALL_COUNTRIES_DONE action.
 * @param {Object} state
 * @param {Object} action Payload will be JSON from api call
 * @return {Object} New state
 */
function onGetAllCountriesDone(state, { payload, error }) {
  if (error) {
    logger.error("Failed to get all countries", payload);
    return { ...state, loadingAllCountriesError: true };
  }

  return {
    ...state,
    loadingAllCountriesError: false,
    allCountries: payload,
  };
}

/**
 * Creates a new Lookup reducer with the specified initial state.
 * @param {Object} initialState Optional. Initial state.
 * @return {Function} Lookup reducer.
 */
function create(initialState = {}) {
  const a = actions.lookup;
  return handleActions(
    {
      [a.getTagsDone]: onGetTagsDone,
      [a.getCommunityListInit]: onGetCommunityListInit,
      [a.getCommunityListDone]: onGetCommunityListDone,
      [a.getTypesInit]: (state) => state,
      [a.getTypesDone]: onGetTypesDone,
      [a.getManufacturersInit]: onGetManufacturersInit,
      [a.getManufacturersDone]: onGetManufacturersDone,
      [a.getModelsInit]: onGetModelsInit,
      [a.getModelsDone]: onGetModelsDone,
      [a.getOsesInit]: onGetOsesInit,
      [a.getOsesDone]: onGetOsesDone,
      [a.getSkillTagsInit]: (state) => state,
      [a.getSkillTagsDone]: onGetSkillTagsDone,
      [a.getCountriesInit]: (state) => state,
      [a.getCountriesDone]: onGetCountriesDone,
      [a.getReviewTypesInit]: (state) => state,
      [a.getReviewTypesDone]: onGetReviewTypesDone,
      [a.getAllCountriesInit]: (state) => state,
      [a.getAllCountriesDone]: onGetAllCountriesDone,
    },
    _.defaults(initialState, {
      skillTags: [],
      countries: [],
      allCountries: [],
      manufacturers: [],
      models: [],
      modelPage: 1,
      hasMoreModels: false,
      oses: [],
      osPage: 1,
      hasMoreOses: false,
      reviewTypes: [],
      buckets: constants.FILTER_BUCKETS,
      types: constants.FILTER_CHALLENGE_TYPES,
      tracks: constants.FILTER_CHALLENGE_TRACKS,
      tags: [],
      subCommunities: [],
      isLoggedIn: null,
      isSubCommunitiesLoaded: false,
    })
  );
}

/**
 * @static
 * @member default
 * @desc Reducer with default initial state.
 */
export default create();
