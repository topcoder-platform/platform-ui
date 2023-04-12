/**
 * @module "services.reviewOpportunities"
 * @desc This module provides a service for retrieving Review Opportunities and
 * submitting applications.
 */
 import _ from 'lodash';
 import { COMPETITION_TRACKS, OLD_COMPETITION_TRACKS, OLD_SUBTRACKS } from '@earn/utils/tc';
 import { getApi } from './challenge-api';
 
 /**
  * Sync the fields of V3 and V5 for front-end to process successfully
  * @param opportunities - opportunities to normalize
  */
 export function normalizeChallenges(opportunities) {
   if (opportunities) {
     /* Issue#4739 : Temporary add track to review opportunities challenges
      * until receive API V5 update. */
     _.map(opportunities, (opportunity) => {
       const { challenge } = opportunity;
       challenge.track = COMPETITION_TRACKS.DEV;
       if (challenge.technologies) {
         if (challenge.technologies.includes(COMPETITION_TRACKS.DS)) {
           challenge.track = COMPETITION_TRACKS.DS;
         }
       } else if (challenge.subTrack === OLD_SUBTRACKS.TEST_SUITES
           || challenge.subTrack === OLD_SUBTRACKS.BUG_HUNT
           || challenge.subTrack === OLD_COMPETITION_TRACKS.TEST_SCENARIOS
           || challenge.subTrack === OLD_COMPETITION_TRACKS.TESTING_COMPETITION) {
         challenge.track = COMPETITION_TRACKS.QA;
       } else if (challenge.track === OLD_COMPETITION_TRACKS.DESIGN) {
         challenge.track = COMPETITION_TRACKS.DES;
       }
       return _.defaults(opportunity, { challenge });
     });
   }
 
   return opportunities;
 }
 
 /**
  * Sync the fields of V3 and V5 for front-end to process successfully
  * @param challenge - challenge to normalize
  */
 function normalizeChallengePhases(challenge) {
   return {
     ...challenge,
     phases: _.map(challenge.phases, phase => ({
       ...phase,
       scheduledStartDate: phase.scheduledStartTime,
       scheduledEndDate: phase.scheduledEndTime,
     })),
   };
 }
 
 /**
  * Service class.
  */
 class ReviewOpportunitiesService {
   /**
    * @param {String} tokenV3 Optional. Auth token for Topcoder API v3.
    */
   constructor(tokenV3) {
     this.private = {
       api: getApi('V3', tokenV3),
       tokenV3,
     };
   }
 
   /**
    * Gets a list of currently open Review Opportunities.
    * @param {Number} limit The max number to return in one call.
    * @param {Number} offset Offset, used with limit to lazy load.
    * @return {Promise} Resolves to the api response in JSON.
    */
   getReviewOpportunities(limit, offset) {
     const endpoint = `/reviewOpportunities?limit=${limit}&offset=${offset}`;
     return this.private.api.get(endpoint)
       .then(res => (res.ok ? res.json() : Promise.reject(new Error(`Error Code: ${res.status}`))))
       .then(res => (
         res.result.status === 200
           ? normalizeChallenges(res.result.content)
           : Promise.reject(res.result.content)
       ));
   }
 
   /**
    * Gets the details of the review opportunity for the corresponding challenge
    * @param {Number} challengeId The ID of the challenge (not the opportunity id)
    * @return {Promise} Resolves to the api response in JSON.
    */
   getDetails(challengeId) {
     const endpoint = `/reviewOpportunities/${challengeId}`;
     return this.private.api.get(endpoint)
       .then(res => res.json())
       .then(res => (
         res.result.status === 200
           ? {
             ...res.result.content,
             challenge: normalizeChallengePhases(res.result.content.challenge),
           } : Promise.reject(res.result)
       ));
   }
 
   /**
    * Submits review opportunity application for the specified challenge
    * @param {Number} challengeId The ID of the challenge (not the opportunity id)
    * @param {Array} roleIds List of review role IDs to apply for
    * @return {Promise} Resolves to the api response in JSON.
    */
   submitApplications(challengeId, roleIds) {
     const endpoint = `/reviewOpportunities/${challengeId}/applications?reviewApplicationRoleIds=${roleIds.join(',')}`;
     return this.private.api.post(endpoint, {})
       .then(res => JSON.parse(res));
   }
 
   /**
    * Cancels review opportunity application for the specified challenge
    * @param {Number} challengeId The ID of the challenge (not the opportunity id)
    * @param {Array} roleIds List of review role IDs to cancel applications for
    * @return {Promise} Resolves to the api response in JSON.
    */
   cancelApplications(challengeId, roleIds) {
     const endpoint = `/reviewOpportunities/${challengeId}/applications?reviewApplicationRoleIds=${roleIds.join(',')}`;
     return this.private.api.delete(endpoint, {})
       .then(res => JSON.parse(res));
   }
 }
 
 let lastInstance = null;
 /**
  * Returns a new or existing review opportunities service.
  * @param {String} tokenV3 Optional. Auth token for Topcoder API v3.
  * @return {MembersService} Members service object
  */
 export function getReviewOpportunitiesService(tokenV3) {
   if (!lastInstance || tokenV3 !== lastInstance.private.tokenV3) {
     lastInstance = new ReviewOpportunitiesService(tokenV3);
   }
   return lastInstance;
 }
 
 /* Using default export would be confusing in this case. */
 export default undefined;