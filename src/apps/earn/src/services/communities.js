/**
 * Isomorphic Communities service.
 */
 import * as communities from './lib/communities';
 
 const preGetService = communities.getService;
 
 /**
  * Returns a new or existing communities service.
  * @param {String} tokenV3 Optional. Auth token for Topcoder API v3.
  * @return {Communities} Communties service object
  */
 let lastInstance = null;
 export function getService(tokenV3) {
   if (!lastInstance || (tokenV3 !== lastInstance.private.tokenV3)) {
     lastInstance = preGetService(tokenV3);
   }
   return lastInstance;
 }
  
 export default undefined;
 