/**
 * @module "actions.lookup"
 * @desc Actions related to lookup data.
 */
import { createActions } from "redux-actions";
import service, { getService } from "../services/lookup";

async function getTags() {
  return service.getTags();
}

async function getCommunityList() {
  return service.getCommunityList();
}
/*
 * device api PAGE_SIZE
 */
export const PAGE_SIZE = 100;

/**
 * @static
 * @desc Creates an action that signals beginning of getting all deveice types
 * @return {Action}
 */
function getTypesInit() {}

/**
 * @static
 * @desc Creates an action that get all deveice types
 * @return {Action}
 */
function getTypesDone() {
  return getService().getTypes();
}

/**
 * @static
 * @desc Creates an action that signals beginning of getting all manufacturers
 * @return {Action}
 */
function getManufacturersInit() {}

/**
 * @static
 * @desc Creates an action that get all deveice manufacturers
 * @param {String} type
 * @return {Action}
 */
function getManufacturersDone(type) {
  return getService().getManufacturers(type);
}

/**
 * @static
 * @desc Creates an action that signals beginning of getting models
 * @param {Number} page
 * @return {Action}
 */
function getModelsInit(page) {
  return {
    page,
  };
}

/**
 * @static
 * @desc Creates an action that get all deveice models
 * @param {Number} page
 * @param {String} manufacturer
 * @param {String} type
 * @return {Action}
 */
function getModelsDone(page, type, manufacturer) {
  return getService().getDevices(page, PAGE_SIZE, type, manufacturer);
}

/**
 * @static
 * @desc Creates an action that signals beginning of getting operation systems
 *
 * @param {Number} page
 * @return {Action}
 */
function getOsesInit(page) {
  return {
    page,
  };
}

/**
 * @static
 * @desc Creates an action that get all operation systems
 * @param {Number} page
 * @param {String} manufacturer
 * @param {String} type
 * @param {String} model
 * @return {Action}
 */
function getOsesDone(page, type, manufacturer, model) {
  return getService().getDevices(page, PAGE_SIZE, type, manufacturer, model);
}

/**
 * @static
 * @desc Creates an action that signals beginning of getting all skill tags.
 * @return {Action}
 */
function getSkillTagsInit() {}

/**
 * @static
 * @desc Creates an action that gets all skill tags.
 * @return {Action}
 */
function getSkillTagsDone() {
  const params = {
    filter: {
      domain: "SKILLS",
      status: "APPROVED",
    },
    limit: {
      limit: 1000,
    },
  };
  return getService().getTags(params);
}

/**
 * @static
 * @desc Creates an action that signals beginning of getting all countries.
 * @return {Action}
 */
function getCountriesInit() {}

/**
 * @static
 * @desc Creates an action that gets all countries.
 * @return {Action}
 */
function getCountriesDone() {
  return getService().getCountries();
}

/**
 * @static
 * @desc Creates an action that signals beginning of getting all review types.
 * @return {Action}
 */
function getReviewTypesInit() {}

/**
 * @static
 * @desc Creates an action that gets all review types.
 * @param {String} tokenV3 Optional. Auth token for Topcoder API v3.
 * @return {Action}
 */
function getReviewTypesDone(tokenV3) {
  return getService(tokenV3).getReviewTypes();
}

/**
 * @static
 * @desc Creates an action that signals beginning of getting all countries api version 5.
 * @return {Action}
 */
function getAllCountriesInit() {}

/**
 * @static
 * @desc Creates an action that gets all countries api version 5.
 * @param {String} tokenV3 Optional. Auth token for Topcoder API v3.
 * @return {Action}
 */
function getAllCountriesDone(tokenV3) {
  return getService(tokenV3).getAllCountries();
}

export default createActions({
  LOOKUP: {
    GET_TAGS_DONE: getTags,
    GET_COMMUNITY_LIST_DONE: getCommunityList,
    GET_TYPES_INIT: getTypesInit,
    GET_TYPES_DONE: getTypesDone,
    GET_MANUFACTURERS_INIT: getManufacturersInit,
    GET_MANUFACTURERS_DONE: getManufacturersDone,
    GET_MODELS_INIT: getModelsInit,
    GET_MODELS_DONE: getModelsDone,
    GET_OSES_INIT: getOsesInit,
    GET_OSES_DONE: getOsesDone,
    GET_SKILL_TAGS_INIT: getSkillTagsInit,
    GET_SKILL_TAGS_DONE: getSkillTagsDone,
    GET_COUNTRIES_INIT: getCountriesInit,
    GET_COUNTRIES_DONE: getCountriesDone,
    GET_REVIEW_TYPES_INIT: getReviewTypesInit,
    GET_REVIEW_TYPES_DONE: getReviewTypesDone,
    GET_ALL_COUNTRIES_INIT: getAllCountriesInit,
    GET_ALL_COUNTRIES_DONE: getAllCountriesDone,
  },
});
