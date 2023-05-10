import qs from "qs";
import { LOCATION, SORT_BY_TO_API } from "../../constants";

// maps parameter keys to API query parameters
export const PARAM_KEY_TO_API = {
  location: "jobLocation",
  pageNumber: "page",
  pageSize: "perPage",
  paymentMax: "maxSalary",
  paymentMin: "minSalary",
  sortBy: "sortBy",
  sortOrder: "sortOrder",
  special: "specialJob",
  title: "title",
  featured: "featured",
};

/**
 * Converts provided parameters to search query string that can be used for
 * sending GET or POST requests to /jobs API.
 *
 * @param {Object} params
 * @returns {string}
 */
export function convertToApiQuery(params) {
  const apiParams = {};
  if (params.sortBy) {
    params.sortBy = SORT_BY_TO_API[params.sortBy];
  }
  for (let paramKey in params) {
    let apiKey = PARAM_KEY_TO_API[paramKey];
    if (!apiKey) {
      continue;
    }
    let value = params[paramKey];
    if (typeof value !== "boolean" && typeof value !== "number" && !value) {
      continue;
    }
    if (paramKey === "location" && value === LOCATION.ALL) {
      continue;
    }
    apiParams[apiKey] = value;
  }
  return qs.stringify(apiParams);
}

/**
 * Converts state parameters to JSON-encoded request body that can be used
 * for sending POST requests to /jobs API.
 *
 * @param {Object} params
 * @returns {string}
 */
export function convertToApiBody({ skills }) {
  if (!skills || !skills.length) {
    return JSON.stringify({});
  }
  let skillIds = [];
  for (let skill of skills) {
    skillIds.push(skill.id);
  }
  return JSON.stringify({ bodySkills: skillIds });
}
