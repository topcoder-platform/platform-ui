/**
 * @module "services.challenges"
 * @desc This module provides a service for convenient manipulation with
 *  Topcoder challenges via TC API.
 */

import _ from "lodash";
import moment from "moment";
import qs from "qs";

import { decodeToken } from "../utils/token";
import logger from "../utils/logger";
import { setErrorIcon, ERROR_ICON_TYPES } from "../utils/errors";
import { COMPETITION_TRACKS, getApiResponsePayload } from "../utils/tc";

import { getApi } from "./challenge-api";
import { getService as getMembersService } from "./members";
import { getService as getSubmissionsService } from "./submissions";

/**
 * Search challenges
 *
 * @return {Array<Object>} challenges
 */
 async function getChallenges(filter, cancellationSignal) {
  const challengeQuery = buildQueryString(filter, true);
  return api.get(
    `/challenges/${challengeQuery}`,
    undefined,
    cancellationSignal
  );
}


/**
 * Get review opportunities
 *
 * @return {Array<Object>} challenges
 */
 async function getReviewOpportunities(cancellationSignal) {
  const { API } = config;
  return api.get(
    //TODO - this should be moved to v5
    `/reviewOpportunities/?limit=1000&offset=0`,
    API.V3,
    cancellationSignal
  );
}

 export function getFilterUrl(backendFilter, frontFilter) {
   const ff = _.clone(frontFilter);
   // eslint-disable-next-line object-curly-newline
   const { tags, tracks, types, groups, events } = ff;
   delete ff.tags;
   delete ff.tracks;
   delete ff.types;
   delete ff.communityId;
   delete ff.groups;
   delete ff.events;

   // console.log(ff);

   let urlFilter = qs.stringify(_.reduce(ff, (result, value, key) => {
     // eslint-disable-next-line no-param-reassign
     if (value) result[key] = value;
     return result;
   }, {}));
   // console.log(urlFilter);

   const ftags = _.map(tags, val => `tags[]=${val}`).join('&');
   const ftracks = _.map(_.reduce(tracks, (result, value, key) => {
     // eslint-disable-next-line no-unused-expressions
     tracks[key] && result.push(key);
     return result;
   }, []), val => `tracks[]=${val}`).join('&');
   const ftypes = _.map(types, val => `types[]=${val}`).join('&');
   const fgroups = _.map(groups, val => `groups[]=${val}`).join('&');
   const fevents = _.map(events, val => `events[]=${val}`).join('&');
   if (ftags.length > 0) urlFilter += `&${ftags}`;
   if (ftracks.length > 0) urlFilter += `&${ftracks}`;
   if (ftypes.length > 0) urlFilter += `&${ftypes}`;
   if (fgroups.length > 9) urlFilter += `&${fgroups}`;
   if (fevents.length > 0) urlFilter += `&${fevents}`;
   return urlFilter;
 }

 export const ORDER_BY = {
   SUBMISSION_END_DATE: 'submissionEndDate',
 };

 /**
  * Normalizes a regular challenge object received from the backend.
  * NOTE: This function is copied from the existing code in the challenge listing
  * component. It is possible, that this normalization is not necessary after we
  * have moved to Topcoder API, but it is kept for now to minimize a risk of
  * breaking anything.
  * @todo Should be used only internally!
  * @param {Object} challenge Challenge object received from the backend.
  * @param {String} username Optional.
  */
 export function normalizeChallenge(challenge, username) {
   const phases = challenge.allPhases || challenge.phases || [];
   const registration = phases.filter(d => d.name === 'Registration')[0];
   let registrationOpen = 'No';
   let registrationStartDate;
   let registrationEndDate;
   if (registration) {
     registrationStartDate = registration.actualStartDate || registration.scheduledStartDate;
     if (registration.isOpen) {
       registrationOpen = 'Yes';
     }
     registrationEndDate = registration.actualEndDate || registration.scheduledEndDate;
   }
   const groups = {};
   if (challenge.groups) {
     challenge.groups.forEach((id) => {
       groups[id] = true;
     });
   }
   /* eslint-disable no-param-reassign */
   if (!challenge.prizeSets) challenge.prizeSets = [];
   if (!challenge.tags) challenge.tags = [];
   if (!challenge.platforms) challenge.platforms = [];

   let submissionEndTimestamp = phases.filter(d => d.name === 'Submission')[0];
   if (submissionEndTimestamp) {
     submissionEndTimestamp = submissionEndTimestamp.scheduledEndDate;
   }
   const placementPrizes = _.find(challenge.prizeSets, { type: 'placement' });
   const prizes = _.get(placementPrizes, 'prizes', []);
   _.defaults(challenge, {
     communities: new Set([COMPETITION_TRACKS[challenge.track]]),
     groups,
     registrationOpen,
     submissionEndTimestamp,
     registrationStartDate,
     registrationEndDate,
     totalPrize: prizes.reduce((acc, prize) => acc + prize.value, 0),
     submissionEndDate: submissionEndTimestamp,
     users: username ? { [username]: true } : {},
   });
 }

 /**
  * Helper method that checks for HTTP error response and throws Error in this case.
  * @param {Object} res HTTP response object
  * @return {Object} API JSON response object
  * @private
  */
 async function checkError(res) {
   if (!res.ok) {
     if (res.status >= 500) {
       setErrorIcon(ERROR_ICON_TYPES.API, '/challenges', res.statusText);
     }
     throw new Error(res.statusText);
   }
   const jsonRes = (await res.json()).result;
   if (jsonRes.status !== 200) throw new Error(jsonRes.content);
   return jsonRes;
 }

 /**
  * Helper method that checks for HTTP error response v5 and throws Error in this case.
  * @param {Object} res HTTP response object
  * @return {Object} API JSON response object
  * @private
  */
 async function checkErrorV5(res) {
   if (!res.ok) {
     if (res.status >= 500) {
       setErrorIcon(ERROR_ICON_TYPES.API, '/challenges', res.statusText);
     }
     throw new Error(res.statusText);
   }
   const jsonRes = (await res.json());
   if (jsonRes.message) {
     throw new Error(res.message);
   }
   return {
     result: jsonRes,
     headers: res.headers,
   };
 }

 /**
  * Challenge service.
  */
 class ChallengesService {
   /**
    * Creates a new ChallengeService instance.
    * @param {String} tokenV3 Optional. Auth token for Topcoder API v3.
    * @param {String} tokenV2 Optional. Auth token for Topcoder API v2.
    */
   constructor(tokenV3, tokenV2) {
     /**
      * Private function being re-used in all methods related to getting
      * challenges. It handles query-related arguments in the uniform way:
      * @param {String} endpoint API endpoint, where the request will be send.
      * @param {Object} filters Optional. A map of filters to pass as `filter`
      *  query parameter (this function takes care to stringify it properly).
      * @param {Object} params Optional. A map of any other parameters beside
      *  `filter`.
      */
     const getChallenges = async (
       endpoint,
       filter,
     ) => {
       let res = {};
       if (_.some(filter.frontFilter.tracks, val => val)
         && !_.isEqual(filter.frontFilter.types, [])) {
         const query = getFilterUrl(filter.backendFilter, filter.frontFilter);
         const url = `${endpoint}?${query}`;
         res = await this.private.apiV5.get(url).then(checkErrorV5);
       }
       return {
         challenges: res.result || [],
         totalCount: res.headers ? res.headers.get('x-total') : 0,
         meta: {
           allChallengesCount: res.headers ? res.headers.get('x-total') : 0,
           allRecommendedChallengesCount: 0,
           myChallengesCount: 0,
           ongoingChallengesCount: 0,
           openChallengesCount: 0,
           totalCount: res.headers ? res.headers.get('x-total') : 0,
         },
       };
     };

     const getChallengeDetails = async (
       endpoint,
       legacyInfo,
     ) => {
       let query = '';
       if (legacyInfo) {
         query = `legacyId=${legacyInfo.legacyId}`;
       }
       const url = `${endpoint}?${query}`;
       const res = await this.private.apiV5.get(url).then(checkErrorV5);
       return {
         challenges: res.result || [],
       };
     };

     /**
      * Private function being re-used in all methods related to getting
      * challenges. It handles query-related arguments in the uniform way:
      * @param {String} endpoint API endpoint, where the request will be send.
      * @param {Object} filters Optional. A map of filters to pass as `filter`
      *  query parameter (this function takes care to stringify it properly).
      * @param {Object} params Optional. A map of any other parameters beside
      *  `filter`.
      */
     const getMemberChallenges = async (
       endpoint,
       filters = {},
       params = {},
     ) => {
       const memberId = decodeToken(this.private.tokenV3).userId;
       const query = {
         ...params,
         ...filters,
         memberId,
       };
       const url = `${endpoint}?${qs.stringify(_.omit(query, ['limit', 'offset', 'technologies']))}`;
       const res = await this.private.apiV5.get(url).then(checkError);
       const totalCount = res.length;
       return {
         challenges: res || [],
         totalCount,
       };
     };

     this.private = {
       api: getApi('V4', tokenV3),
       apiV5: getApi('V5', tokenV3),
       apiV2: getApi('V2', tokenV2),
       apiV3: getApi('V3', tokenV3),
       getChallenges,
       getChallengeDetails,
       getMemberChallenges,
       tokenV2,
       tokenV3,
       memberService: getMembersService(),
       submissionsService: getSubmissionsService(tokenV3),
     };
   }

   /**
    * Gets challenge statistics.
    * @param {Number} challengeId
    * @return {Promise} The array of statistics
    */
   async getChallengeStatistics(challengeId) {
     return this.private.apiV5.get(`/challenges/${challengeId}/statistics`)
       .then(res => (res.ok ? res.json() : new Error(res.statusText)))
       .then(res => (
         res.message
           ? new Error(res.message)
           : res
       ));
   }

   /**
    * Activates the specified challenge.
    * @param {Number} challengeId
    * @return {Promise} Resolves to null value in case of success; otherwise it
    *  is rejected.
    */
   async activate(challengeId) {
     const params = {
       status: 'Active',
     };

     let res = await this.private.apiV5.patch(`/challenge/${challengeId}`, params);

     if (!res.ok) throw new Error(res.statusText);
     res = (await res.json()).result;
     if (res.status !== 200) throw new Error(res.content);
     return res.content;
   }

   /**
    * Closes the specified challenge.
    * @param {Number} challengeId
    * @return {Promise} Resolves to null value in case of success; otherwise it
    *  is rejected.
    */
   async close(challengeId) {
     const params = {
       status: 'Completed',
     };
     let res = await this.private.apiV5.patch(`/challenges/${challengeId}`, params);
     if (!res.ok) throw new Error(res.statusText);
     res = (await res.json()).result;
     if (res.status !== 200) throw new Error(res.content);
     return res.content;
   }

   /**
    * Creates a new payment task.
    * @param {Number} projectId
    * @param {Number} accountId Billing account ID.
    * @param {String} title
    * @param {String} description
    * @param {String} assignee
    * @param {Number} payment
    * @param {String} submissionGuidelines
    * @param {Number} copilotId
    * @param {Number} copilotFee
    * @param {?} tags
    * @return {Promise} Resolves to the created challenge object (payment task).
    */
   async createTask(
     projectId,
     accountId,
     title,
     description,
     assignee,
     payment,
     submissionGuidelines,
     copilotId,
     copilotFee,
     tags,
   ) {
     const registrationPhase = await this.private.apiV5.get('/challenge-phases?name=Registration');

     const payload = {
       param: {
         name: title,
         typeId: 'e885273d-aeda-42c0-917d-bfbf979afbba',
         description,
         legacy: {
           track: 'FIRST_2_FINISH',
           reviewType: 'INTERNAL',
           confidentialityType: 'public',
           billingAccountId: accountId,
         },
         phases: [
           {
             phaseId: registrationPhase.id,
             scheduledEndDate: moment().toISOString(),
           },
         ],
         prizeSets: [
           {
             type: 'Challenge Prizes',
             description: 'Challenge Prize',
             prizes: [
               {
                 value: payment,
                 type: 'First Placement',
               },
             ],
           },
         ],
         tags,
         projectId,
       },
     };
     if (copilotId) {
       _.assign(payload.param, {
         copilotId,
         copilotFee,
       });
     }
     let res = await this.private.apiV5.postJson('/challenges', payload);
     if (!res.ok) throw new Error(res.statusText);
     res = (await res.json()).result;
     if (res.status !== 200) throw new Error(res.content);
     return res.content;
   }

   /**
    * Gets challenge details from Topcoder API.
    * NOTE: This function also uses API v2 and other endpoints for now, due
    * to some information is missing or
    * incorrect in the main endpoint. This may change in the future.
    * @param {Number|String} challengeId
    * @return {Promise} Resolves to the challenge object.
    */
   async getChallengeDetails(challengeId) {
     const memberId = this.private.tokenV3 ? decodeToken(this.private.tokenV3).userId : null;
     let challenge = {};
     let registrants = [];
     let submissions = [];
     let isLegacyChallenge = false;
     let isRegistered = false;
     const userDetails = { roles: [] };

     // condition based on ROUTE used for Review Opportunities, change if needed
     if (/^[\d]{5,8}$/.test(challengeId)) {
       isLegacyChallenge = true;
       challenge = await this.private.getChallengeDetails('/challenges/', { legacyId: challengeId })
         .then(res => res.challenges[0] || {});
     } else {
       challenge = await this.private.getChallengeDetails(`/challenges/${challengeId}`)
         .then(res => res.challenges);
     }

     if (challenge) {
       registrants = await this.getChallengeRegistrants(challenge.id);

       // This TEMP fix to colorStyle, this will be fixed with issue #4530
       registrants = _.map(registrants, r => ({
         ...r, colorStyle: 'color: #151516',
       }));

       /* Prepare data to logged user */
       if (memberId) {
         isRegistered = _.some(registrants, r => `${r.memberId}` === `${memberId}`);

         const subParams = {
           challengeId,
           perPage: 100,
         };

         submissions = await this.private.submissionsService.getSubmissions(subParams);

         if (submissions) {
           // Remove AV Scan, SonarQube Review and Virus Scan review types
           const reviewScans = await this.private.submissionsService.getScanReviewIds();
           submissions.forEach((s, i) => {
             submissions[i].review = _.reject(s.review, r => r && _.includes(reviewScans, r.typeId));
           });

           // Add submission date to registrants
           registrants.forEach((r, i) => {
             const submission = submissions.find(s => `${s.memberId}` === `${r.memberId}`);
             if (submission) {
               registrants[i].submissionDate = submission.created;
             }
           });
         }
         userDetails.roles = await this.getUserRolesInChallenge(challengeId);
       }

       challenge = {
         ...challenge,
         isLegacyChallenge,
         isRegistered,
         registrants,
         submissions,
         userDetails,
         events: _.map(challenge.events, e => ({
           eventName: e.key,
           eventId: e.id,
           description: e.name,
         })),
         fetchedWithAuth: Boolean(this.private.apiV5.private.token),
       };
     }

     return challenge;
   }

   /**
    * Gets challenge registrants from Topcoder API.
    * @param {Number|String} challengeId
    * @return {Promise} Resolves to the challenge registrants array.
    */
   async getChallengeRegistrants(challengeId) {
     /* If no token provided, resource will return Submitter role only */
     const roleId = this.private.tokenV3 ? await this.getRoleId('Submitter') : null;
     let params = {
       challengeId,
     };

     if (roleId) {
       params = { ...params, roleId };
     }

     let registrants = await this.private.apiV5.get(`/resources?${qs.stringify(params)}`)
       .then(checkErrorV5).then(res => res.result);

     /* API will return all roles to currentUser, so need to filter in FE */
     if (roleId) {
       registrants = _.filter(registrants, r => r.roleId === roleId);
     }

     return registrants || [];
   }

   /**
    * Gets possible challenge types.
    * @return {Promise} Resolves to the array of subtrack names.
    */
   getChallengeTypes() {
     return this.private.apiV5.get('/challenge-types')
       .then(res => (res.ok ? res.json() : new Error(res.statusText)))
       .then(res => (
         res.message
           ? new Error(res.message)
           : res
       ));
   }

   /**
    * Get the ID from a challenge type by abbreviation
    * @param {String} abbreviation
    * @return {Promise} ID from first abbreviation match
    */
   async getChallengeTypeId(abbreviation) {
     const ret = await this.private.apiV5.get(`/challenge-types?abbreviation=${abbreviation}`)
       .then(checkErrorV5).then(res => res);

     if (_.isEmpty(ret.result)) {
       throw new Error('Challenge typeId not found!');
     }

     return ret.result[0].id;
   }

   /**
    * Gets possible challenge tags (technologies).
    * @return {Promise} Resolves to the array of tag strings.
    */
   getChallengeTags() {
     return this.private.api.get('/technologies')
       .then(res => (res.ok ? res.json() : new Error(res.statusText)))
       .then(res => (
         res.result.status === 200
           ? res.result.content
           : new Error(res.result.content)
       ));
   }

   /**
    * Gets challenges.
    * @param {Object} filters Optional.
    * @param {Object} params Optional.
    * @return {Promise} Resolves to the api response.
    */
   async getChallenges(filter) {
     return this.private.getChallenges('/challenges/', filter)
       .then((res) => {
         res.challenges.forEach(item => normalizeChallenge(item));
         return res;
       });
   }

   /**
    * Gets challenges.
    * @param {Object} filters Optional.
    * @param {Object} params Optional.
    * @param {String} handle user handle
    * @return {Promise} Resolves to the api response.
    */
   async getRecommendedChallenges(filter, handle) {
     filter.frontFilter.per_page = filter.frontFilter.perPage;
     delete filter.frontFilter.perPage;

     const query = getFilterUrl(filter.backendFilter, filter.frontFilter);

     let res = {};
     let totalCount = 0;
     if (_.some(filter.frontFilter.tracks, val => val)
       && !_.isEqual(filter.frontFilter.types, [])) {
       const url = `/recommender-api/${handle}?${query}`;
       res = await this.private.apiV5.get(url).then(checkErrorV5);
       totalCount = res.headers.get('x-total') || 0;
     }

     const challenges = res.result ? res.result.filter(ch => ch.bucket) : [];
     return {
       challenges,
       totalCount,
       meta: {
         allChallengesCount: totalCount,
         allRecommendedChallengesCount: 0,
         myChallengesCount: 0,
         ongoingChallengesCount: 0,
         openChallengesCount: 0,
         totalCount,
       },
     };
   }

   /**
    * Gets SRM matches.
    * @param {Object} params
    * @return {Promise}
    */
   async getSrms(params) {
     const res = await this.private.api.get(`/srms/?${qs.stringify(params)}`);
     return getApiResponsePayload(res);
   }

   static updateFiltersParamsForGettingMemberChallenges(filters, params) {
     if (params && params.perPage) {
       // eslint-disable-next-line no-param-reassign
       params.offset = (params.page - 1) * params.perPage;
       // eslint-disable-next-line no-param-reassign
       params.limit = params.perPage;
     }
   }

   /**
    * Gets challenges of the specified user.
    * @param {String} userId User id whose challenges we want to fetch.
    * @return {Promise} Resolves to the api response.
    */
   async getUserChallenges(userId, filters, params) {
     const userFilters = _.cloneDeep(filters);
     ChallengesService.updateFiltersParamsForGettingMemberChallenges(userFilters, params);

     const query = {
       ...params,
       ...userFilters,
       memberId: userId,
     };
     const url = `/challenges?${qs.stringify(_.omit(query, ['limit', 'offset', 'technologies']))}`;
     const userChallenges = await this.private.apiV5.get(url)
       .then(checkErrorV5)
       .then((res) => {
         res.result.forEach(item => normalizeChallenge(item, userId));
         return res.result;
       });

     return {
       challenges: userChallenges,
       totalCount: userChallenges.length,
     };
   }

   /**
    * Gets challenges of the specified user from v4 api.
    * @param {String} username User name whose challenges we want to fetch.
    * @return {Promise} Resolves to the api response.
    */
   async getUserChallengesV4(username, filters, params) {
     const endpoint = `/members/${username.toLowerCase()}/challenges/`;
     const query = {
       filter: qs.stringify(filters, { encode: false }),
       ...params,
     };
     const url = `${endpoint}?${qs.stringify(query)}`;
     const res = await this.private.api.get(url).then(checkError);
     return {
       challenges: res.content || [],
       totalCount: res.metadata.totalCount,
     };
   }

   /**
    * Gets user resources.
    * @param {String} userId User id whose challenges we want to fetch.
    * @param {Number} page Current page for paginated API response (default 1)
    * @param {Number} perPage Page size for paginated API response (default 1000)
    * @return {Promise} Resolves to the api response.
    */
   async getUserResources(userId, page = 1, perPage = 1000) {
     const res = await this.private.apiV5.get(`/resources/${userId}/challenges?page=${page}&perPage=${perPage}`);
     return res.json();
   }

   /**
    * Gets marathon matches of the specified user.
    * @param {String} memberId User whose challenges we want to fetch.
    * @param {Object} filter
    * @param {Object} params
    * @return {Promise} Resolves to the api response.
    */
   async getUserMarathonMatches(memberId, filter, params) {
     const newParams = {
       ...filter,
       ...params,
       tag: 'Marathon Match',
       memberId,
     };

     const res = await this.private.apiV5.get(`/challenges?${qs.stringify(newParams)}`);
     return res.json();
   }

   /**
    * Gets SRM matches related to the user.
    * @param {String} handle
    * @param {Object} params
    * @return {Promise}
    */
   async getUserSrms(handle, params) {
     const url = `/members/${handle}/srms/?${qs.stringify(params)}`;
     const res = await this.private.api.get(url);
     return getApiResponsePayload(res);
   }

   /**
    * Get the Resource Role ID from provided Role Name
    * @param {String} roleName
    * @return {Promise}
    */
   async getRoleId(roleName) {
     const params = {
       name: roleName,
       isActive: true,
     };
     const roles = await this.private.apiV5.get(`/resource-roles?${qs.stringify(params)}`)
       .then(checkErrorV5).then(res => res.result);

     if (_.isEmpty(roles)) {
       throw new Error('Resource Role not found!');
     }

     return roles[0].id;
   }

   /**
    * Registers user to the specified challenge.
    * @param {String} challengeId
    * @return {Promise}
    */
   async register(challengeId) {
     const user = decodeToken(this.private.tokenV3);
     const roleId = await this.getRoleId('Submitter');
     const params = {
       challengeId,
       memberHandle: encodeURIComponent(user.handle),
       roleId,
     };
     const res = await this.private.apiV5.postJson('/resources', params);
     if (!res.ok) throw new Error(res.statusText);
     return res.json();
   }

   /**
    * Unregisters user from the specified challenge.
    * @param {String} challengeId
    * @return {Promise}
    */
   async unregister(challengeId) {
     const user = decodeToken(this.private.tokenV3);
     const roleId = await this.getRoleId('Submitter');
     const params = {
       challengeId,
       memberHandle: encodeURIComponent(user.handle),
       roleId,
     };
     const res = await this.private.apiV5.delete('/resources', JSON.stringify(params));
     if (!res.ok) throw new Error(res.statusText);
     return res.json();
   }

   /**
    * Gets count of user's active challenges.
    * @param {String} handle Topcoder user handle.
    * @return {Action} Resolves to the api response.
    */
   getActiveChallengesCount(handle) {
     const filter = { status: 'Active' };
     const params = { limit: 1, offset: 0 };
     return this.getUserChallenges(handle, filter, params).then(res => res.totalCount);
   }

   /**
    * Submits a challenge submission.  Uses APIV2 for Development submission
    * and APIV3 for Design submisisons.
    * @param {Object} body
    * @param {String} challengeId
    * @param {String} track Either DESIGN or DEVELOP
    * @return {Promise}
    */
   submit(body, challengeId, track, onProgress) {
     let api;
     let contentType;
     let url;

     if (track === COMPETITION_TRACKS.DES) {
       ({ api } = this.private);
       contentType = 'application/json';
       url = '/submissions/'; // The submission info is contained entirely in the JSON body
     } else {
       api = this.private.apiV2;
       // contentType = 'multipart/form-data';
       contentType = null;
       url = `/develop/challenges/${challengeId}/upload`;
     }

     return api.upload(url, {
       body,
       headers: { 'Content-Type': contentType },
       method: 'POST',
     }, onProgress).then((res) => {
       const jres = JSON.parse(res);
       // Return result for Develop submission
       if (track === COMPETITION_TRACKS.DEV) {
         return jres;
       }
       // Design Submission requires an extra "Processing" POST
       const procId = jres.result.content.id;
       return api.upload(`/submissions/${procId}/process/`, {
         body: JSON.stringify({ param: jres.result.content }),
         headers: { 'Content-Type': contentType },
         method: 'POST',
       }, onProgress).then(procres => JSON.parse(procres));
     }, (err) => {
       logger.error(`Failed to submit to the challenge #${challengeId}`, err);
       throw err;
     });
   }

   /**
    * Updates the challenge (saves the give challenge to the API).
    * @param {Object} challenge
    * @param {String} tokenV3
    * @return {Promise}
    */
   async updateChallenge(challenge) {
     const url = `/challenges/${challenge.id}`;
     let res = await this.private.apiV5.put(url, challenge);
     if (!res.ok) throw new Error(res.statusText);
     res = (await res.json()).result;
     if (res.status !== 200) throw new Error(res.content);
     return res.content;
   }

   /**
    * Gets roles of a user in the specified challenge. The user tested is
    * the owner of authentication token used to instantiate the service.
    *
    * Notice, if you have already loaded the challenge as that user, these roles
    * are attached to the challenge object under `userDetails.roles` path during
    * challenge normalization. However, if you have not, this method is the most
    * efficient way to get them, as it by-passes any unnecessary normalizations
    * of the challenge object.
    *
    * @param {Number} challengeId Challenge ID.
    */
   async getUserRolesInChallenge(challengeId) {
     const user = decodeToken(this.private.tokenV3);
     const url = `/resources?challengeId=${challengeId}&memberHandle=${user.handle}`;
     const getResourcesResponse = await this.private.apiV5.get(url);
     const resources = await getResourcesResponse.json();
     if (resources) return _.map(_.filter(resources, r => r.memberHandle === user.handle), 'roleId');
     throw new Error(`Failed to fetch user role from challenge #${challengeId}`);
   }
 }

 let lastInstance = null;
 /**
  * Returns a new or existing challenges service.
  * @param {String} tokenV3 Optional. Auth token for Topcoder API v3.
  * @param {String} tokenV2 Optional. Auth token for Topcoder API v2.
  * @return {ChallengesService} Challenges service object
  */
 export function getService(tokenV3, tokenV2) {
   if (!lastInstance || lastInstance.private.tokenV3 !== tokenV3
     || lastInstance.tokenV2 !== tokenV2) {
     lastInstance = new ChallengesService(tokenV3, tokenV2);
   }
   return lastInstance;
 }

 export default {
  getChallenges,
  getReviewOpportunities
};
