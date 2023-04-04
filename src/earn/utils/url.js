import _ from "lodash";
import qs from "qs";

/**
 * Return the query string of `params`:
 * `{ p: "" }`      => ""
 * `{ p: null }`      => ""
 * `{ p: undefined }` => ""
 * `{ p: value }`     => "p=value"
 * `{ p: [] }`        => ""
 * `{ p: ['Challenge', 'First2Finish', 'Task'] } => "p[]=Challenge&p[]=First2Finish&p[]=Task`
 * `{ p: ['Design', 'Development', 'Data Science', 'Quality Assurance'] }` => "p[]=Design&p[]=Development&p=Data%20Science&p[]=Quality%20Assurance"
 * `{ p: { Des: true, Dev: true, DS: false, QA: false } }` => "p[Des]=true&p[Dev]=true&p[DS]=false&p[QA]=false"
 *
 * @params {Object<{[key: string]: any}>} params Query string parameters
 * @return {String}
 */
export function buildQueryString(params, disableEncode) {
  params = _.omitBy(params, (p) => p == null || p === "" || p.length === 0);
  if (!disableEncode) {
    params.tags = _.map(params.tags, (t) => encodeURIComponent(t));
  }
  let queryString = qs.stringify(params, {
    encode: false,
    arrayFormat: "brackets",
  });
  queryString = queryString ? `?${queryString}` : queryString;

  return queryString;
}

export function parseUrlQuery(queryString) {
  let params = qs.parse(queryString, { ignoreQueryPrefix: true });
  if (params.tags) {
    params.tags = _.map(params.tags, (t) => decodeURIComponent(t));
  }
  return params;
}

export function updateQuery(params, replace = false) {
  const oldQuery = decodeURIComponent(window.location.search);
  let query = buildQueryString(params);
  query = `?${query.substring(1).split("&").sort().join("&")}`;
  if (query !== oldQuery) {
    if (replace) {
      window.history.replaceState(window.history.state, "", query);
    } else {
      window.history.pushState(window.history.state, "", query);
    }
  }
}

/**
 * Get current URL
 */
export function getCurrentUrl() {
  return window.location.href;
}

/**
 * Get current URL hash parameters as object
 */
export function getHash() {
  return qs.parse(window.location.hash.slice(1));
}

/**
 * Get current URL query parameters as object
 */
export function getQuery() {
  return qs.parse(window.location.search.slice(1));
}

/**
 * Cleans/removes trailing slash from url
 *
 * @param  {String} url The url to clean
 * @return {String}
 */
export function removeTrailingSlash(url) {
  return url.charAt(url.length - 1) === "/" ? url.slice(0, -1) : url;
}
