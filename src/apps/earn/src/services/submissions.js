/**
 * @module "services.submission"
 * @desc This module provides a service for convenient manipulation with
 *  Topcoder submissions via TC API. Currently only used for MM challenges
 */
import _ from "lodash";
import qs from "qs";
import { setErrorIcon, ERROR_ICON_TYPES } from "../utils/errors";
import { getApi } from "./challenge-api";

/**
 * Helper method that checks for HTTP error response v5 and throws Error in this case.
 * @param {Object} res HTTP response object
 * @return {Object} API JSON response object
 * @private
 */
async function checkErrorV5(res) {
  if (!res.ok) {
    if (res.status >= 500) {
      setErrorIcon(ERROR_ICON_TYPES.API, "/challenges", res.statusText);
    }
    throw new Error(res.statusText);
  }
  const jsonRes = await res.json();
  if (jsonRes.message) {
    throw new Error(res.message);
  }
  return {
    result: jsonRes,
    headers: res.headers,
  };
}

/**
 * Submission service.
 */
class SubmissionsService {
  /**
   * Creates a new SubmissionService instance.
   * @param {String} tokenV3 Optional. Auth token for Topcoder API v3.
   */
  constructor(tokenV3) {
    this.private = {
      apiV5: getApi("V5", tokenV3),
      tokenV3,
    };
  }

  /**
   * Get submissions of challenge
   * @param {Object} filters
   * @param {Object} params
   * @return {Promise} Resolves to the api response.
   */
  async getSubmissions(filters, params) {
    const query = {
      ...filters,
      ...params,
    };

    const url = `/submissions?${qs.stringify(query, { encode: false })}`;
    return this.private.apiV5
      .get(url)
      .then(checkErrorV5)
      .then((res) => res.result);
  }

  /**
   * Get scan reviews types
   * @returns {Promise} Resolves to the api response.
   */
  async getScanReviewIds() {
    const reviews = await Promise.all([
      this.private.apiV5
        .get("/reviewTypes?name=AV Scan")
        .then(checkErrorV5)
        .then((res) => res.result),
      this.private.apiV5
        .get("/reviewTypes?name=SonarQube Review")
        .then(checkErrorV5)
        .then((res) => res.result),
      this.private.apiV5
        .get("/reviewTypes?name=Virus Scan")
        .then(checkErrorV5)
        .then((res) => res.result),
    ]).then(([av, sonar, virus]) => _.concat(av, sonar, virus));

    return reviews.map((r) => r.id);
  }

  /**
   * Get submission information by submission id
   * @param submissionId The submission id
   * @returns {Promise} Resolves to the api response.
   */
  async getSubmissionInformation(submissionId) {
    const url = `/submissions/${submissionId}`;
    return this.private.apiV5
      .get(url)
      .then((res) => (res.ok ? res.json() : new Error(res.statusText)))
      .then((res) => res);
  }

  /**
   * Download submission.
   * @param {Number|String} submissionId Submission ID.
   * @return {Promise} Resolves to the list of submission object.
   */
  async downloadSubmission(submissionId) {
    return this.private.apiV5
      .get(`/submissions/${submissionId}/download`)
      .then((response) => response.blob());
  }
}

let lastInstance = null;
/**
 * Returns a new or existing submissions service.
 * @param {String} tokenV3 Optional. Auth token for Topcoder API v3.
 * @return {SubmissionsService} Submissions service object
 */
export function getService(tokenV3) {
  if (!lastInstance || lastInstance.private.tokenV3 !== tokenV3) {
    lastInstance = new SubmissionsService(tokenV3);
  }
  return lastInstance;
}

/* Using default export would be confusing in this case. */
export default undefined;
