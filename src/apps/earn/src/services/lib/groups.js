/**
 * @module "services.groups"
 * @desc Service for communication with group-related part of Topcoder API.
 *
 * NOTE: Through this file, and in related contexts, by loading a user group,
 * or user groups data, we refer to loading the information about descendant
 * user groups; i.e. given some user group(s) we speak about loading the sub-
 * three of related child groups.
 *
 * By group maps we refer to the object having group IDs as the keys, and
 * group data objects as the values. Any group object included into a group map
 * has its "subGroups" array (if present) replaced by "subGroupIds", that lists
 * only the IDs of immediate child groups; actual child group objects from
 * "subGroups" are recursively added to the top level of the group map.
 * Also each group in the group map is timestamped to keep caching of
 * the loaded data.
 */

 import _ from 'lodash';
 import config from '@earn/config';
 import logger from '@earn/utils/logger';
 import { getApi } from '../challenge-api';
 import { setErrorIcon, ERROR_ICON_TYPES } from '@earn/utils/errors';
 
 /* The value of USER_GROUP_MAXAGE constant converted to [ms]. */
 const USER_GROUP_MAXAGE = config.USER_GROUP_MAXAGE * 1000;
 
 /**
  * Given an array of IDs (or a single ID) of user groups, and a map of known
  * user groups, it returns the array including all specified user groups, and
  * all their known descendant groups.
  * @param {String|String[]} groupIds
  * @param {Object} knownGroups
  * @return {String[]}
  */
 export function addDescendantGroups(groupIds, knownGroups) {
   let res = _.isArray(groupIds) ? groupIds : [groupIds];
   const visitedGroupsIds = new Set();
   let pos = 0;
   while (pos < res.length) {
     const id = res[pos];
     if (!visitedGroupsIds.has(id)) {
       visitedGroupsIds.add(id);
       const g = knownGroups[id];
       if (g && g.subGroupIds) res = res.concat(g.subGroupIds);
     }
     pos += 1;
   }
   return _.uniq(res);
 }
 
 /**
  * Splits the given list of group IDs into the lists of groups being loaded,
  * loaded, and others.
  * @param {String|String[]} groupIds ID, or an array of IDs, of the group(s) we
  *  are interested in.
  * @param {Object} knownGroups Optional. The map of already known groups (some
  *  of them may be outdated, though). This should be of the same format as the
  *  object on "groups.groups" path of the Redux store. Defaults to empty object.
  * @param {Object} loadingGroups Optional. Set of groups beign loaded now. This
  *  should be of the same format as the object on "groups.loading" path of the
  *  Redux store. Defaults to empty object.
  * @return {Object} Resulting object may hold four arrays with group IDs from
  *  "groupIds" (empty arrays will not be included into the result object):
  *  - "loaded" - the groups that are present in "knownGroups" and are not
  *    outdated;
  *  - "loading" - the groups that are not present in "knownGroups" (or present,
  *    but outdated); but they are already being loaded;
  *  - "missing" - the groups that are not present in "knownGroups"
  *    (or outdated), and are not being loaded.
  *  - "unknown" - the groups that are absent in "knownGroups" map.
  */
 export function checkGroupsStatus(groupIds, knownGroups = {}, loadingGroups = {}) {
   const loaded = [];
   const loading = [];
   const missing = [];
   const unknown = [];
   const now = Date.now();
   const tested = new Set();
   const ids = _.isArray(groupIds) ? groupIds : [groupIds];
   ids.forEach((id) => {
     if (tested.has(id)) return;
     tested.add(id);
     const g = knownGroups[id];
     if (!g) unknown.push(id);
     if (g && (now - g.timestamp || 0) < USER_GROUP_MAXAGE) loaded.push(id);
     else if (loadingGroups[id]) loading.push(id);
     else missing.push(id);
   });
   return {
     loaded: loaded.length ? loaded : null,
     loading: loading.length ? loading : null,
     missing: missing.length ? missing : null,
     unknown: unknown.length ? unknown : null,
   };
 }
 
 /**
  * Returns "true" if "userGroups" arrays includes any group specified by
  * "groupIds", or any group descendant from a group specified by "groupIds".
  * The is the map of known groups
  * @param {String|String[]} groupIds
  * @param {Object[]|String[]} userGroups Array of user's groups or their IDs.
  * @param {Object} knownGroups Map of known groups.
  * @return {Boolean}
  */
 export function checkUserGroups(groupIds, userGroups, knownGroups) {
   const queue = _.isArray(groupIds) ? groupIds : [groupIds];
   if (!queue.length) return true;
   if (!userGroups.length) return false;
 
   /* Algorithmically, "knownGroups" stores, in compressed form, data on
    * known trees of user groups; and we want to check whether any of groups
    * from "userGroups" belong to sub-trees having groups from "groupIds" as
    * their roots. So, we do a breadth-frist search through the group trees. */
   const userGroupIds = new Set();
   const visitedGroupIds = new Set();
   userGroups.forEach(g => userGroupIds.add(_.isObject(g) ? g.id : g));
   let pos = 0;
   while (pos < queue.length) {
     const id = queue[pos];
     if (userGroupIds.has(id)) return true;
     visitedGroupIds.add(id);
     const g = knownGroups[id];
     if (g && g.subGroupIds) {
       g.subGroupIds.forEach(sgId => (
         !visitedGroupIds.has(sgId) ? queue.push(sgId) : null
       ));
     }
     pos += 1;
   }
   return false;
 }
 
 
 /**
  * Private. Handles given response from the groups API.
  * @param {Object} response
  * @return {Promise} On success resolves to the data fetched from the API.
  */
 function handleApiResponse(response) {
   if (!response.ok) throw new Error(response.statusText);
   return response.json();
 }
 
 /**
  * Helper method that checks for HTTP error response v5 and throws Error in this case.
  * @param {Object} res HTTP response object
  * @return {Object} API JSON response object
  * @private
  */
 async function checkErrorV5(res) {
   if (!res.ok) {
     if (res.status === 403) {
       setErrorIcon(ERROR_ICON_TYPES.API, 'Auth0', res.statusText);
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
  * Private. Merges given user group (possibly a tree of user groups) into
  * groups map. This function intended only for internal use inside this module,
  * as it may mutate both arguments (hence, the corresponding ESLint rule is
  * disabled within this function), thus should be used only where it is safe.
  * For external use a similar function is provided by "utils/tc" module.
  * @param {Object} groups
  * @param {Object} group
  */
 function mergeGroup(groups, group) {
   /* eslint-disable no-param-reassign */
   const sg = group.subGroups;
   group.timestamp = Date.now();
   if (sg && sg.length) {
     group.subGroupIds = sg.map(g => g.id);
     sg.forEach(g => mergeGroup(groups, g));
   }
   delete group.subGroups;
   groups[group.id] = group;
   /* eslint-enable no-param-reassign */
 }
 
 /**
  * Given a group tree, reduces it to the array of all group IDs encountered in
  * the tree.
  * @param {Object} group
  * @return {String[]} Array of IDs.
  */
 export function reduceGroupIds({ id, subGroups }) {
   let res = [id];
   if (subGroups) {
     subGroups.forEach((g) => {
       res = res.concat(reduceGroupIds(g));
     });
   }
   return res;
 }
 
 /**
  * Service class.
  */
 class GroupService {
   /**
    * @param {String} tokenV3 Optional. Auth token for Topcoder API v3.
    */
   constructor(tokenV3) {
     const now = Date.now();
     this.private = {
       api: getApi('V5', tokenV3),
       cache: {
         groupTreeIds: {
           lastCleanUp: now,
           data: {},
         },
       },
       tokenV3,
     };
   }
 
   /**
    * Adds new member to the group.
    * @param {String} groupId
    * @param {String} memberId
    * @param {String} membershipType
    * @return {Promise}
    */
   async addMember(groupId, memberId, membershipType) {
     const response = await this.private.api.postJson(`/groups/${groupId}/members`, {
       memberId, membershipType,
     });
 
     return handleApiResponse(response);
   }
 
   /**
    * Gets detailed information about the group.
    *
    * Notice, when "withSubGroups" argument is true (default) this method returns
    * a tree of group data objects, connected via their "subGroups" fields.
    * getMap(..) method below wraps this functionality in a more practical way!
    *
    * @param {String} groupId
    * @param {Boolean} withSubGroups Optional. Defaults to true. Specifies,
    *  whether the response should information about sub-groups, if any.
    * @return {Promise} On success resolves to the group data object.
    */
   async getGroup(groupId, withSubGroups = true) {
     let url = `/groups/${groupId}`;
     if (withSubGroups) {
       url = `${url}/?includeSubGroups=true&oneLevel=false`;
     }
 
     const response = await this.private.api.get(url);
     return handleApiResponse(response);
   }
 
   /**
    * Gets detailed information about the specified user group(s) and their
    * descendant sub-groups.
    *
    * @param {String|String[]} groupIds Group ID, or an array of group IDs,
    *  to query from Topcoder API.
    * @return {Promise} Resolves to the group map. That object will have group
    *  IDs as the keys, and corresponding group data objects as the values. In
    *  each group data object the "subGroups" field, if any, will be replaced by
    * "subGroupIds" (array of IDs of the immediate child groups), and the actual
    *  data on the sub-groups will be moved to the root of the map object.
    *  It also timestamps each fetched group.
    */
   getGroupMap(groupIds) {
     const res = {};
     const seen = new Set();
     const query = _.isArray(groupIds) ? groupIds : [groupIds];
     const promises = query.map((id) => {
       if (seen.has(id)) return null;
       seen.add(id);
       return this.getGroup(id)
         .then(group => mergeGroup(res, group))
         .catch((err) => {
           /* In case we have failed to get some of the requested groups,
           * we just send error message to logs, and serve the result with
           * those groups that we managed to get. Otherwise it will be to
           * easy to break our code by minor mistakes in the group-related
           * configuration in the API and in the App. */
           logger.error(`Failed to get user group #${id}`, err);
 
           /* Empty group with timestamp is added to the result, as we still
           * want to cache the result, even if the result is that we cannot
           * load this group, at least for this visitor. */
           res[id] = { id, timestamp: Date.now() };
         });
     });
     return Promise.all(promises).then(() => res);
   }
 
   /**
    * Given a root group ID, returns an ID array that contains the root group ID,
    * and IDs of all descendant groups in the group (sub-)tree rooted at the
    * specified group.
    *
    * Results are cached inside the class instance to minimize the load on TC
    * Group API. To take advantage of that, be sure to keep and reuse the same
    * class instance.
    *
    * The reason to have such strange method and pay an extra attention to its
    * optimization for smaller API load is that it is essential for authorization
    * checks.
    *
    * @param {String} rootGroupId
    * @param {Number} maxage Optional. Max age [ms] of records served from the
    *  cache. Defaults to 5 minutes.
    * @return {Promise} Resolves to ID array.
    */
   async getGroupTreeIds(rootGroupId) {
     const rootGroupURL = `/groups/${rootGroupId}`;
     const rootGroupRes = await this.private.api.get(rootGroupURL);
     const rootGroupJSON = await handleApiResponse(rootGroupRes);
 
     const url = `/groups/${rootGroupJSON.id}?flattenGroupIdTree=true`;
     const response = await this.private.api.get(url);
     const responseJSON = await handleApiResponse(response);
 
     const treeIds = responseJSON.flattenGroupIdTree;
     treeIds.unshift(responseJSON.id);
 
     return treeIds;
   }
 
   /**
    * Gets group members.
    * @param {String} groupId
    * @return {Promise} On sucess resolves to the array of member objects,
    *  which include user IDs, membership time, and some bookkeeping data.
    */
   async getMembers(groupId) {
     const response = await this.private.api.get(`/groups/${groupId}/members`);
     return handleApiResponse(response);
   }
 
   /**
    * Gets the number of members in the group.
    * @param {Number|String} groupId ID of the group.
    * @param {Boolean} withSubGroups Optional. When this flag is set, the count
    *  will include members of sub-groups of the specified group.
    * @return {Promise} Resolves to the members count.
    */
   async getMembersCount(groupId, withSubGroups) {
     let url = `/groups/${groupId}/membersCount`;
     if (withSubGroups) url += '?includeSubGroups=true';
     let res = await this.private.api.get(url);
     if (!res.ok) throw new Error(res.statusText);
     res = (await res.json());
     // if (!res.success) throw new Error(res.content);
     return Number(res.count);
   }
 
   /**
    * Returns TC Auth Token V3 used by the service instance.
    * @return {String} Token.
    */
   getTokenV3() {
     return this.private.tokenV3;
   }
 
   /**
    * Gets the corresponding user's groups information
    * @param {*} userId the userId
    * @returns
    */
   async getMemberGroups(userId) {
     const url = `/groups/memberGroups/${userId}`;
     const response = await this.private.api.get(url)
       .then(res => checkErrorV5(res))
       .then(r => r.result || [])
       .catch(() => []);
 
     return response;
   }
 }
 
 let lastInstance = null;
 /**
  * Returns a new or existing instance of challenge service, which works with
  * the specified auth token.
  * @param {String} tokenV3 Optional. Topcoder API v3 auth token.
  * @return {GroupService} Instance of the service.
  */
 export function getService(tokenV3) {
   if (!lastInstance || tokenV3 !== lastInstance.private.tokenV3) {
     lastInstance = new GroupService(tokenV3);
   }
   return lastInstance;
 }
 
 export default undefined;