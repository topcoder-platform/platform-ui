import _ from "lodash";
import qs from "qs";
import { GIG_LIST_ROUTE, MY_GIGS_LIST_ROUTE } from "../../constants/routes";
import {
  FACEBOOK_URL,
  GIG_LIST_URL,
  LINKEDIN_URL,
  TWITTER_URL,
} from "../../constants/urls";

/**
 * Return the query string of `params`:
 * `{ p: "" }`      => ""
 * `{ p: null }`      => ""
 * `{ p: undefined }` => ""
 * `{ p: value }`     => "p=value"
 * `{ p: [] }`        => ""
 * `{ p: ['active_jobs', 'open_jobs', 'completed_jobs', 'archived_jobs'] } => "p[]=active_jobs&p[]=open_jobs&p[]=completed_jobs&p[]=archived_jobs`
 * `{ p: { Active: true, Open: true, Completed: false, Archived: false } }` => "p[Active]=true&p[Open]=true&p[Completed]=false&p[Archived]=false"
 *
 * @params {Object<{[key: string]: any}>} params Query string parameters
 * @return {String}
 */
export function buildQueryString(params) {
  params = _.omitBy(params, (p) => p == null || p === "" || p.length === 0);

  let queryString = qs.stringify(params, {
    encode: false,
    arrayFormat: "brackets",
  });
  queryString = queryString ? `?${queryString}` : queryString;

  return queryString;
}

export function parseUrlQuery(queryString) {
  return qs.parse(queryString, { ignoreQueryPrefix: true });
}

export function updateQuery(params) {
  const oldQuery = decodeURIComponent(window.location.search);
  let query = buildQueryString(params);
  query = `?${query.substring(1).split("&").sort().join("&")}`;
  if (query !== oldQuery) {
    window.history.pushState(window.history.state, "", query);
  }
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
  return `${process.env.URL.AUTH}?retUrl=${encodeURIComponent(retUrl)}`;
}

/**
 * Creates a URL for user's profile
 *
 * @param {string} handle Topcoder user handle
 * @returns {string}
 */
export function makeProfileUrl(handle) {
  return `${process.env.URL.PLATFORM_WEBSITE_URL}/profile/${handle}`;
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
    `${process.env.URL.AUTH}?retUrl=${encodeURIComponent(retUrl)}` +
    `&mode=signUp&utm_source=${utmSource}&regSource=${regSource}`
  );
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
