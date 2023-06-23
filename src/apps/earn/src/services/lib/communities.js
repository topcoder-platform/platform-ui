/**
 * @module "services.communities"
 * @desc Communities service.
 */
 import _ from 'lodash';
 import fetch from 'isomorphic-fetch';
 import qs from 'qs';
 import config from '@earn/config';
 
 /**
  * Returns Community App URL, or throws an error if URL cannot be found in
  * config.
  */
 function getCommunityAppUrl() {
   const url = _.get(config, 'URL.COMMUNITY_APP');
   if (!url) throw new Error('No URL.COMMUNITY_APP param found in config');
   return url;
 }
 
 /**
  * Client-side version of the service.
  */
 class Communities {
   /**
    * Creates a new {@link module:services.communities~Communities} instance.
    * @param {String} tokenV3
    */
   constructor(tokenV3) {
     this.private = { tokenV3 };
   }
 
   /**
    * Gets the list of communities accessible to the member of specified groups.
    * @param {String[]} userGroupIds
    * @return {Promise} Resolves to the array of community data objects. Each of
    *  the objects indludes only the most important data on the community.
    */
   async getList(userGroupIds) {
     let url = getCommunityAppUrl();
     url += '/community-app-assets/api/tc-communities?';
     url += qs.stringify({ groups: userGroupIds });
     const res = await fetch(url, {
       headers: {
         authorization: this.private.tokenV3,
       },
     });
     return res.json();
   }
 
   /**
    * Gets metadata for the specified community.
    * @param {String} communityId
    * @return {Promise} Resolves to the community metadata.
    */
   async getMetadata(communityId) {
     let url = getCommunityAppUrl();
     url += `/community-app-assets/api/tc-communities/${communityId}/meta`;
     const res = await fetch(url, {
       headers: {
         authorization: this.private.tokenV3,
       },
     });
     return res.json();
   }
 }
 
 let lastInstance = null;
 
 /**
  * Returns a new or existing communities service.
  * @param {String} tokenV3 Optional. Auth token for Topcoder API v3.
  * @return {Communities} Communties service object
  */
 export function getService(tokenV3) {
   if (!lastInstance || (tokenV3 !== lastInstance.private.tokenV3)) {
     lastInstance = new Communities(tokenV3);
   }
   return lastInstance;
 }
 
 export default Communities;