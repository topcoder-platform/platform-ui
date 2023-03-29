/**
 * This module provides a service for conventient access to Topcoder APIs.
 */

import _ from "lodash";
import "isomorphic-fetch"; /* global fetch */
import { config } from "topcoder-react-utils";

/**
 * API service object. It is reused for both Topcoder API v2 and v3,
 * as in these cases we are fine with the same interface, and the only
 * thing we need to be different is the base URL and auth token to use.
 */
export default class Api {
  /**
   * @param {String} base Base URL of the API.
   * @param {String} token Optional. Authorization token.
   */
  constructor(base, token) {
    this.private = { base, token };
  }

  /**
   * Sends a request to the specified endpoint of the API. This method just
   * wraps fetch() in a convenient way. If this object was created with the
   * auth token, it will be automatically added to auth header of all
   * requests.
   * For additional details see https://github.github.io/fetch/
   * @param {String} enpoint Should start with slash, like /endpoint.
   * @param {Object} options Optional. Fetch options.
   * @return {Promise} It resolves to the HTTP response object. To get the
   *  actual data you probably want to call .json() method of that object.
   *  Mind that this promise rejects only on network errors. In case of
   *  HTTP errors (404, etc.) the promise will be resolved successfully,
   *  and you should check .status or .ok fields of the response object
   *  to find out the response status.
   */
  fetch(endpoint, options) {
    const p = this.private;
    const headers = { "Content-Type": "application/json" };
    if (p.token) headers.Authorization = `Bearer ${p.token}`;
    const ops = _.merge(_.cloneDeep(options) || {}, { headers });
    return fetch(`${p.base}${endpoint}`, ops);
  }

  /**
   * Sends DELETE request to the specified endpoint.
   * @param {String} endpoint
   * @param {Blob|BufferSource|FormData|String} body
   * @return {Promise}
   */
  delete(endpoint, body) {
    return this.fetch(endpoint, { body, method: "DELETE" });
  }

  /**
   * Sends GET request to the specified endpoint.
   * @param {String} endpoint
   * @return {Promise}
   */
  get(endpoint) {
    return this.fetch(endpoint);
  }

  /**
   * Sends POST request to the specified endpoint.
   * @param {String} endpoint
   * @param {Blob|BufferSource|FormData|String} body
   * @return {Promise}
   */
  post(endpoint, body) {
    return this.fetch(endpoint, { body, method: "POST" });
  }

  /**
   * Sends POST request to the specified endpoint, with JSON payload.
   * @param {String} endpoint
   * @param {JSON} json
   * @return {Promise}
   */
  postJson(endpoint, json) {
    return this.post(endpoint, JSON.stringify(json));
  }

  /**
   * Sends PUT request to the specified endpoint.
   * @param {String} endpoint
   * @param {Blob|BufferSource|FormData|String} body
   * @return {Promise}
   */
  put(endpoint, body) {
    return this.fetch(endpoint, { body, method: "PUT" });
  }

  /**
   * Sends PUT request to the specified endpoint.
   * @param {String} endpoint
   * @param {JSON} json
   * @return {Promise}
   */
  putJson(endpoint, json) {
    return this.put(endpoint, JSON.stringify(json));
  }
}

/*
 * Topcoder API
 */
const lastApiInstances = {};

/**
 * Returns a new or existing Api object for Topcoder API.
 * @param {String} version The API version.
 * @param {String} token Optional. Auth token for Topcoder API.
 * @return {Api} API service object.
 */
export function getApi(version, token) {
  if (!version || !config.API[version]) {
    throw new Error(`${version} is not a valid API version`);
  }
  if (
    !lastApiInstances[version] ||
    lastApiInstances[version].private.token !== token
  ) {
    lastApiInstances[version] = new Api(config.API[version], token);
  }
  return lastApiInstances[version];
}

/**
 * Keep the old API factories for backwards compatibility
 * DO NOT USE THEM FOR NEW IMPLEMENTATIONS.
 * USE THE getApi(version, token) FACTORY.
 */
export const getApiV2 = (token) => getApi("V2", token);
export const getApiV3 = (token) => getApi("V3", token);
export const getApiV4 = (token) => getApi("V4", token);
