/* global process */
/**
 * @module "services.api"
 * @desc This module provides a service for conventient access to Topcoder APIs.
 */

import _ from "lodash";
import config from "@config";
import { delay } from "@earn/utils/time";
import { setErrorIcon, ERROR_ICON_TYPES } from "@earn/utils/errors";

/* The minimal delay [ms] between API calls. To avoid problems with the requests
 * rate limits configured in Topcoder APIs, we throttle requests rate at the
 * client side, and at server-side, in dev mode (which is meant to be used for
 * local development. */
const MIN_API_CALL_DELAY = process.env.APPMODE === "development" ? 1000 : 200;

let lastApiCallTimestamp = Date.now();

/**
 * @static
 * @member default
 * @desc The default export from the module is
 *  {@link module:services.api~Api} class.
 */

/**
 * API service object. It is reused for both Topcoder API v2 and v3,
 * as in these cases we are fine with the same interface, and the only
 * thing we need to be different is the base URL and auth token to use.
 */
class Api {
  /**
   * Creates a new Api object.
   * @param {String} base Base URL of the API.
   * @param {String} token Optional. Authorization token.
   */
  constructor(base, token) {
    this.private = {
      base,
      token,
    };
  }

  /**
   * Sends HTTP request to the specified API endpoint. This method is just
   * a convenient wrapper around isomorphic fetch(..):
   *
   *  - If API service has auth token, Authorization header is automatically
   *    added to the request;
   *
   *  - If no Content-Type header set in options, it is automatically set to
   *    "application/json". In case you want to avoid it, pass null into
   *    Content-Type header option.
   *
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
  async fetch(endpoint, options = {}) {
    const { base, token } = this.private;
    const headers = options.headers ? _.clone(options.headers) : {};
    if (token) headers.Authorization = `Bearer ${token}`;

    switch (headers["Content-Type"]) {
      case null:
        delete headers["Content-Type"];
        break;
      case undefined:
        headers["Content-Type"] = "application/json";
        break;
      default:
    }

    const now = Date.now();
    lastApiCallTimestamp += MIN_API_CALL_DELAY;
    if (lastApiCallTimestamp > now) {
      await delay(lastApiCallTimestamp - now);
    } else lastApiCallTimestamp = now;

    return fetch(`${base}${endpoint}`, {
      ...options,
      headers,
    }).catch((e) => {
      setErrorIcon(ERROR_ICON_TYPES.NETWORK, `${base}${endpoint}`, e.message);
      throw e;
    });
  }

  /**
   * Sends DELETE request to the specified endpoint.
   * @param {String} endpoint
   * @param {Blob|BufferSource|FormData|String} body
   * @return {Promise}
   */
  delete(endpoint, body) {
    return this.fetch(endpoint, {
      body,
      method: "DELETE",
    });
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
    return this.fetch(endpoint, {
      body,
      method: "POST",
    });
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
    return this.fetch(endpoint, {
      body,
      method: "PUT",
    });
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

  /**
   * Sends PATCH request to the specified endpoint.
   * @param {String} endpoint
   * @param {Blob|BufferSource|FormData|String} body
   * @return {Promise}
   */
  patch(endpoint, body) {
    return this.fetch(endpoint, {
      body,
      method: "PATCH",
    });
  }

  /**
   * Sends PATCH request to the specified endpoint.
   * @param {String} endpoint
   * @param {JSON} json
   * @return {Promise}
   */
  patchJson(endpoint, json) {
    return this.patch(endpoint, JSON.stringify(json));
  }

  /**
   * Upload with progress
   * @param {String} endpoint
   * @param {Object} body and headers
   * @param {Function} callback handler for update progress only works for client side for now
   * @return {Promise}
   */
  // upload(endpoint, options, onProgress) {
  //   const { base, token } = this.private;
  //   const headers = options.headers ? _.clone(options.headers) : {};
  //   if (token) headers.Authorization = `Bearer ${token}`;
  //   if (isomorphy.isClientSide()) {
  //     return new Promise((res, rej) => {
  //       const xhr = new XMLHttpRequest(); //eslint-disable-line
  //       xhr.open(options.method, `${base}${endpoint}`);
  //       Object.keys(headers).forEach((key) => {
  //         if (headers[key] != null) {
  //           xhr.setRequestHeader(key, headers[key]);
  //         }
  //       });
  //       xhr.onload = (e) => res(e.target.responseText);
  //       xhr.onerror = rej;
  //       if (xhr.upload && onProgress) {
  //         xhr.upload.onprogress = (evt) => {
  //           if (evt.lengthComputable) onProgress(evt.loaded / evt.total);
  //         };
  //       }
  //       xhr.send(options.body);
  //     });
  //   }
  //   return this.fetch(endpoint, options);
  // }
}

export default Api;

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
export const getApiV5 = (token) => getApi("V5", token);
