import _ from "lodash";
import qs from "qs";
import config from "../config";
import {
  GIG_LIST_URL,
  GIG_LIST_ROUTE,
  MY_GIGS_LIST_ROUTE,
  FACEBOOK_URL,
  LINKEDIN_URL,
  TWITTER_URL,
} from "../constants";

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

/**
 * Creates an external URL for a gig with referral id parameter.
 *
 * @param {string} externalId gig external id
 * @param {string} referralId user's referral id
 * @returns {string}
 */
export function makeGigReferralUrl(externalId, referralId) {
  return `${
    window.location.origin
  }${GIG_LIST_ROUTE}/${externalId}?referralId=${encodeURIComponent(
    referralId
  )}`;
}

/**
 * Creates a login URL.
 *
 * @param {string} retUrl return URL
 * @returns {string}
 */
export function makeLoginUrl(retUrl) {
  let [path, query = ""] = retUrl.split("?");
  // If query parameters are not encoded twice all parameters except the first
  // are getting lost after returning from authentication flow.
  retUrl = `${path}${query ? `?${encodeURIComponent(query)}` : ""}`;
  return `${config.URL.AUTH}?retUrl=${encodeURIComponent(retUrl)}`;
}

/**
 * Creates a registration URl.
 *
 * @param {string} retUrl return URL
 * @param {string} [utmSource] utm_source
 * @returns {string}
 */
export function makeRegisterUrl(
  retUrl,
  utmSource = "gig_listing",
  regSource = "gigs"
) {
  let [path, query = ""] = retUrl.split("?");
  retUrl = `${path}${query ? `?${encodeURIComponent(query)}` : ""}`;
  return (
    `${config.URL.AUTH}?retUrl=${encodeURIComponent(retUrl)}` +
    `&mode=signUp&utm_source=${utmSource}&regSource=${regSource}`
  );
}

export function makeGigApplicationStatusPath(externalId) {
  return `${MY_GIGS_LIST_ROUTE}?externalId=${externalId}`;
}

/**
 * Creates a URL that can be used to apply for specific gig.
 *
 * @param {string} externalId gig external id
 * @returns {string}
 */
export function makeGigApplyUrl(externalId) {
  return `${GIG_LIST_URL}/${externalId}/apply`;
}

/**
 * Creates a gig application path.
 *
 * @param {string} externalId gig external id
 * @returns {string}
 */
export function makeGigApplyPath(externalId) {
  return `${GIG_LIST_ROUTE}/${externalId}/apply`;
}

/**
 * Creates a path for a gig for local navigation.
 *
 * @param {string} externalId gig external id
 * @returns {string}
 */
export function makeGigPath(externalId) {
  return `${GIG_LIST_ROUTE}/${externalId}`;
}

/**
 * Creates an external URL for a gig.
 *
 * @param {string} externalId gig external id
 * @returns {string}
 */
export function makeGigUrl(externalId) {
  return externalId ? `${window.location.origin}${GIG_LIST_ROUTE}/${externalId}` : "";
}

/**
 * Creates a referral URL.
 *
 * @param {string} referralId referral id
 * @returns {string}
 */
export function makeReferralUrl(referralId) {
  return `${window.location.origin}${GIG_LIST_ROUTE}?referralId=${encodeURIComponent(
    referralId
  )}`;
}

export function makeFacebookUrl(shareUrl) {
  return `${FACEBOOK_URL}${encodeURIComponent(shareUrl)}`;
}

export function makeLinkedInUrl(shareUrl) {
  return `${LINKEDIN_URL}${encodeURIComponent(shareUrl)}`;
}

export function makeTwitterUrl(shareUrl) {
  return `${TWITTER_URL}${encodeURIComponent(shareUrl)}`;
}

/**
 * Creates a URL for user's profile
 *
 * @param {string} handle Topcoder user handle
 * @returns {string}
 */
export function makeProfileUrl(handle) {
  return `${config.URL.PLATFORM_WEBSITE}/profile/${handle}`;
}