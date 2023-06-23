/**
 * @module "challenge.filter"
 *
 * @desc
 * Universal challenge filter. Must be used in all places where we need filter
 * or fetch challenges. This way we keep all related logic in the same place,
 * which simplifies maintenance and modifications of the code.
 *
 * The state of challenge filter is a plain JS object, containing only plain
 * data fields. It allows to avoid any problems with its storage inside Redux
 * store; with its serialization into / deserialization from a string. Each
 * field of the state describes a single rule for filtering the challenges.
 * The filter allows only those challenges that match all defined rules.
 * Undefined, null fields are ignored.
 *
 * The following fields are supported:
 *
 * endDate {Number|String} - Permits only those challenges with submission
 * deadline before this date.
 *
 * groups {Array} - Permits only the challenges belonging to at least one
 * of the groups which IDs are presented as keys in this object.
 *
 * or {Object[]} - All other filter fields applied to the challenge with AND
 * logic, i.e. a challenge must satisfy each specified filter rule to match the
 * filter as whole. In some cases we want to have OR logic between filter rules,
 * and this array allows to achieve it: each object in this array is treated as
 * an additional filter (these object may have all the same fields as the root
 * filter state object), to be tested with OR logic.
 *
 * registrationOpen {Boolean} - Permits only the challenges with open or closed
 * registration.
 *
 * startDate {Number|String} - Permits only those challenges started after this
 * date.
 *
 * status {Array} - Permits only the challenges with status matching one of
 * the keys of this object.
 *
 * started {Boolean} - Matches only the challenges with start date in past.
 * It turns out that status ACTIVE also includes upcoming activated challenges,
 * thus we need this additional filter.
 *
 * subtracks {Array} - Permits only the challenges belonging to at least one
 * of the competition subtracks presented as keys of this object.
 *
 * tags {Array} - Permits only the challenges that have at least one of the
 * tags within their platform and technology tags (keywords).
 *
 * text {String} - Free-text string which will be matched against challenge
 * name, its platform and technology tags. If not found anywhere, the challenge
 * is filtered out. Case-insensitive.
 *
 * tracks {Object} - Permits only the challenges belonging to at least one of
 * the competition tracks presented as keys of this object.
 *
 * upcoming {Boolean} - Permits only upcoming challenges.
 *
 * users {Array} - Permits only the challenges where the specified (by handles)
 * users are participating.
 */

 import _ from 'lodash';
 import moment from 'moment';
 import { COMPETITION_TRACKS, REVIEW_OPPORTUNITY_TYPES } from '../tc';
 
 /**
  * Here are many similiar filerBy..(challenge, state) functions. Each of them
  * checks whether the given challenge fulfills the corresponding filtering rule
  * from the filter state object, and returns true or false depending on it.
  */
 
 function filterByGroupIds(challenge, state) {
   if (_.isEmpty(state.groupIds)) return true;
   if (_.isEmpty(challenge.groups)) return false;
   return state.groupIds.some(id => challenge.groups.find(gId => gId === id));
 }
 
 function filterByRegistrationOpen(challenge, state) {
   if (_.isUndefined(state.registrationOpen)) return true;
   const isRegOpen = () => {
     if (challenge.registrationOpen) {
       return challenge.registrationOpen === 'Yes';
     }
     if (challenge.challengeType && challenge.challengeType.name === 'Marathon Match') {
       return challenge.status !== 'Past';
     }
     const challengePhases = challenge.allPhases || challenge.phases || [];
     const registrationPhase = challengePhases.find(item => item.name === 'Registration')[0];
     if (!registrationPhase || !registrationPhase.isOpen) {
       return false;
     }
     if (challenge.track === COMPETITION_TRACKS.DES) {
       const checkpointPhase = challengePhases.find(item => item.name === 'Checkpoint Submission')[0];
       return !checkpointPhase || !checkpointPhase.isOpen;
     }
     return true;
   };
   return isRegOpen() === state.registrationOpen;
 }
 
 /**
  * Filter function for Review Opportunity Type, will be used internally in filter.js
  * @param {Object} opp Review Opportunity object
  * @param {Object} state Filter state
  * @return {Boolean} True if opp satifies the filter
  */
 function filterByReviewOpportunityType(opp, state) {
   if (state.reviewOpportunityTypes.length === 0) return false;
   return state.reviewOpportunityTypes.includes(opp.type);
 }
 
 function filterByStartDate(challenge, state) {
   if (!state.startDate) return true;
   const submissionPhase = (challenge.phases || []).filter(d => d.name === 'Submission')[0];
   const submissionEndDate = submissionPhase ? submissionPhase.scheduledEndDate
     : challenge.submissionEndDate;
   return moment(state.startDate).isBefore(submissionEndDate);
 }
 
 function filterByEndDate(challenge, state) {
   if (!state.endDate) return true;
   const registrationPhase = (challenge.phases || []).filter(d => d.name === 'Registration')[0];
   const registrationStartDate = registrationPhase ? registrationPhase.scheduledStartDate
     : challenge.registrationStartDate;
   return moment(state.endDate).isAfter(registrationStartDate);
 }
 
 function filterByStarted(challenge, state) {
   if (_.isUndefined(state.started)) return true;
   return moment(challenge.registrationStartDate).isBefore(Date.now());
 }
 
 function filterByOngoing(challenge, state) {
   if (_.isUndefined(state.ongoing)) return true;
   const registrationPhase = (challenge.phases || []).filter(d => d.name === 'Registration')[0];
   const registrationEndDate = registrationPhase ? registrationPhase.scheduledEndDate
     : challenge.registrationEndDate;
   return moment(registrationEndDate).isBefore(Date.now());
 }
 
 function filterByStatus(challenge, state) {
   if (!state.status) return true;
   return state.status.includes(challenge.status);
 }
 
 function filterByTags(challenge, state) {
   if (_.isEmpty(state.tags)) return true;
   const { platforms, tags } = challenge;
   const str = `${platforms.join(' ')} ${tags.join(' ')}`.toLowerCase();
   return state.tags.some(tag => str.includes(tag.toLowerCase()));
 }
 
 function filterByEvents(challenge, state) {
   if (_.isEmpty(state.events)) return true;
   if (_.isEmpty(challenge.events)) return false;
   return state.events.some(key => challenge.events.find(e => e.key === key));
 }
 
 function filterByText(challenge, state) {
   if (!state.search) return true;
   const str = `${challenge.name} ${challenge.tags} ${challenge.platforms} ${challenge.tags}`
     .toLowerCase();
   return str.includes(state.search.toLowerCase());
 }
 
 function filterByTrack(challenge, state) {
   // if (!state.tracks) return true;
   // eslint-disable-next-line max-len
   return state.tracks[challenge.track] === true;
 }
 
 function filterByTypes(challenge, state) {
   if (state.types.length === 0) return true;
   return state.types.includes(challenge.typeId);
 }
 
 function filterByUpcoming(challenge, state) {
   if (_.isUndefined(state.upcoming)) return true;
   return moment().isBefore(challenge.registrationStartDate);
 }
 
 // function filterByUsers(challenge, state) {
 //   if (!state.userChallenges) return true;
 //   return state.userChallenges.find(ch => challenge.id === ch);
 // }
 
 /**
  * Returns clone of the state with the specified competition track added.
  * @param {Object} state
  * @param {String} track
  * @return {Object} Resulting state.
  */
 export function addTrack(state, track) {
   /* When state has no tracks field all tracks are allowed, thus no need to
    * touch the object. */
   if (!state.tracks) return state;
 
   const res = _.clone(state);
   res.tracks = _.clone(res.tracks);
   res.tracks[track] = true;
 
   /* Selecting all tracks is the same as having no tracks field. To keep the
    * state more simple at any time, we remove tracks field in such case. */
   if (!_.values(COMPETITION_TRACKS).some(item => !res.tracks[item])) {
     delete res.tracks;
   }
 
   return res;
 }
 
 /**
  * Generates filter function for the state.
  * @param {Object} state
  * @return {Function}
  */
 export function getFilterFunction(state) {
   return (challenge) => {
     let test = filterByStatus(challenge, state)
       && filterByTrack(challenge, state)
       && filterByUpcoming(challenge, state)
       && filterByGroupIds(challenge, state)
       && filterByText(challenge, state)
       && filterByTags(challenge, state)
       && filterByEvents(challenge, state)
       && filterByTypes(challenge, state)
       // && filterByUsers(challenge, state)
       && filterByEndDate(challenge, state)
       && filterByStartDate(challenge, state)
       && filterByStarted(challenge, state)
       && filterByOngoing(challenge, state)
       && filterByRegistrationOpen(challenge, state);
     if (!test && state.or) {
       let pos = 0;
       while (!test && pos < state.or.length) {
         test = getFilterFunction(state.or[pos])(challenge);
         pos += 1;
       }
     }
     return test;
   };
 }
 
 /**
  * Generates a Review Opportunities filter function for the provided filter state.
  * @param {Object} state
  * @return {Function}
  */
 export function getReviewOpportunitiesFilterFunction(state, validTypes) {
   return (opp) => {
     const trackAbbr = {
       'Data Science': 'DS',
       Development: 'Dev',
       Design: 'Des',
       'Quality Assurance': 'QA',
     };
     // const newType = _.find(validTypes, { name: opp.challenge.type }) || {};
     const newType = _.find(validTypes, { name: opp.challenge.subTrack === 'FIRST_2_FINISH' ? 'First2Finish' : 'Challenge' }) || {};
 
     // Review Opportunity objects have a challenge field which
     // is largely compatible with many of the existing filter functions
     // especially after a few normalization tweaks
     const challenge = {
       ...opp.challenge,
       // This allows filterByText to search for Review Types and Challenge Titles
       name: `${opp.challenge.title} ${REVIEW_OPPORTUNITY_TYPES[opp.type]}`,
       // registrationStartDate: opp.startDate, // startDate of Review, not Challenge
       // submissionEndDate: opp.startDate, // Currently uses startDate for both date comparisons
       // communities: new Set([ // Used to filter by Track, and communities at a future date
       // opp.challenge.track === 'QA' ? 'Dev' : trackAbbr[opp.challenge.track],
       // ]),
       track: trackAbbr[opp.challenge.track],
       typeId: newType.abbreviation,
       tags: opp.challenge.technologies || [],
       platforms: opp.challenge.platforms || [],
     };
     /**
     console.log(challenge);
     console.log(`=====`);
     console.log(`11111`);
     console.log(filterByTrack(challenge, state));
     console.log(filterByText(challenge, state));
     console.log(filterByTags(challenge, state));
     console.log(filterByEndDate(challenge, state));
     console.log(filterByStartDate(challenge, state));
     console.log(filterByReviewOpportunityType(opp, state));
     */
     return (
       filterByTrack(challenge, state)
       && filterByText(challenge, state)
       && filterByTags(challenge, state)
       && filterByTypes(challenge, state)
       && filterByEndDate(challenge, state)
       && filterByStartDate(challenge, state)
       && filterByReviewOpportunityType(opp, state)
     );
   };
 }
 
 /* ************************************************************************** */
 /* Below is a group of functions that allow to combine multiple challenge
  * filters together. If you are not adding a new filter functionality, just
  * look for the exported combine(..) function.
  *
  * All other helper functions in this section take two filter state objects as
  * arguments, and combine some of the filter rules, merging the resulting one
  * into the first filter state object.
  */
 
 /* NOTE: Current implementation ignores plenty of rules when combining filters.
  * It is fine for the only current use case: we use combine just before calling
  * to mapToBackend(..) function, to map several frontend filters to the
  * matching backend one. The way mapToBackend(..) works, this ignoring of
  * some rules is not a big deal (resulting backend filter will be not that
  * specific, as it probably could be, but due to the current api limitations
  * we cannot be too specific anyway). If you are going to use this for anything
  * else - thing twice what are you doing? If you need it for filtering, it is
  * just a lot easier to filter by each frontend filter in turns, rather than
  * combine them into a single filter. */
 
 /* This ESLint rule is disabled for combineXXX(..) functions, as they are
  * intended to be used only internally, with a newly constructed object
  * passed in as the first argument (i.e. we take care that there is no
  * side-effects to mutate it within this module, and these functions
  * are not exported outside of the module). */
 /* eslint-disable no-param-reassign */
 
 function combineArrayRules(a, b, ruleName, or = false) {
   if (a[ruleName] && b[ruleName]) {
     if (or) a[ruleName] = _.uniq(a[ruleName].concat(b[ruleName]));
     else a[ruleName] = _.intersection(a[ruleName], b[ruleName]);
   } else if (b[ruleName]) a[ruleName] = b[ruleName];
 }
 
 function combineEndDate(a, b) {
   if (a.endDate && b.endDate) {
     a.endDate = moment.min(a.endDate, b.endDate).format();
   } else if (b.endDate) a.endDate = b.endDate;
 }
 
 function combineStartDate(a, b) {
   if (a.startDate && b.startDate) {
     a.startDate = moment.max(a.startDate, b.startDate).format();
   } else if (b.startDate) a.startDate = b.startDate;
 }
 
 function combineTracks(a, b) {
   if (a.tracks && b.tracks) {
     _.forIn(a.tracks, (value, key) => {
       if (!b.tracks[key]) delete a.tracks[key];
     });
   } else if (b.tracks) a.tracks = b.tracks;
 }
 
 /* eslint-enable no-param-reassign */
 
 /**
  * Combines multiple filter state objects together. Resulting state describes
  * the filter, which matches only those challenges that satisfy each of the
  * filters passed in as arguments.
  *
  * The main intended use of this function is to combine multiple frontend
  * challenge filters into a single one, that can be mapped into the
  * corresponding backend filter by mapToBackend(..) function.
  *
  * @param {Object} filters Input filter state objects to combine.
  * @return {Object}
  */
 export function combine(...filters) {
   const res = {};
   filters.forEach((filter) => {
     combineEndDate(res, filter);
     combineArrayRules(res, filter, 'groupIds');
     /* TODO: The registrationOpen rule is just ignored for now. */
     combineStartDate(res, filter);
     combineArrayRules(res, filter, 'or', true);
     combineArrayRules(res, filter, 'status');
     combineArrayRules(res, filter, 'subtracks');
     combineArrayRules(res, filter, 'tags');
     /* TODO: The text rule is just ignored for now. */
     combineTracks(res, filter);
     /* TODO: The upcoming rule is just ignored for now. */
     /* TODO: The users rule is just ignored for now. */
   });
   return res;
 }
 
 /* ************************************************************************** */
 /* Below is a group of function that allow to map a frontend filter into the
  * corresponding backend (api) one. If you are not adding a new filter
  * functionality, just look for the exported mapToBackend(..) function. */
 
 /**
  * Maps the frontend challenge filter into the corresponding backend (api) one.
  * As there is no 1:1 match between the frontend and backend challenge filters,
  * the resulting backend filter is always equal or broader than the given
  * frontend one; i.e. any challenge that satisfies the original frontend filter
  * will pass the backend one, though some of the challenges that pass the
  * backend filter may fail the frontend one.
  *
  * It is assumed that this function will help us to load challenges from the
  * backend more specifically, though it does not prevent as from the need
  * always perform the final filtering at the frontend side.
  *
  * @param {Object} filter
  * @return {Object}
  */
 export function mapToBackend(filter) {
   const res = {};
   if (filter.groupIds) res.groups = filter.groupIds;
   return res;
 }
 
 /**
  * Returns clone of the state with the specified competition track removed.
  * @param {Object} state
  * @param {String} track
  * @return {Object} Resulting state.
  */
 export function removeTrack(state, track) {
   const res = _.clone(state);
   if (res.tracks) res.tracks = _.clone(res.tracks);
   else {
     res.tracks = {};
     _.forIn(COMPETITION_TRACKS, (item) => {
       res.tracks[item] = true;
     });
   }
   delete res.tracks[track];
   return res;
 }
 
 /**
  * Clone the state and sets the end date.
  * @param {Object} state
  * @param {String} date
  * @return {Object}
  */
 export function setEndDate(state, date) {
   if (date) return { ...state, endDate: date };
   if (!state.endDate) return state;
   const res = _.clone(state);
   delete res.endDate;
   return res;
 }
 
 /**
  * Clones the state and sets the review opportunity type.
  * @param {Object} state
  * @param {Array} reviewOpportunityTypes Possible values found in utils/tc REVIEW_OPPORTUNITY_TYPES
  * @return {Object}
  */
 export function setReviewOpportunityType(state, reviewOpportunityTypes) {
   if (reviewOpportunityTypes && reviewOpportunityTypes.length) {
     return { ...state, reviewOpportunityTypes };
   }
   if (!state.reviewOpportunityTypes) return state;
   const res = _.clone(state);
   delete res.reviewOpportunityTypes;
   return res;
 }
 
 /**
  * Clones the state and sets the start date.
  * @param {Object} state
  * @param {String} date ISO date string.
  * @return {Object}
  */
 export function setStartDate(state, date) {
   if (date) return { ...state, startDate: date };
   if (!state.startDate) return state;
   const res = _.clone(state);
   delete res.startDate;
   return res;
 }
 
 /**
  * Clones the state and sets the challenge types.
  * @param {Object} state
  * @param {Array} types
  * @return {Object}
  */
 export function setTypes(state, types) {
   if (types && types.length) return { ...state, types };
   if (!state.types) return state;
   const res = _.clone(state);
   delete res.types;
   return res;
 }
 
 /**
  * Clones the state and sets the tags.
  * @param {Object} state
  * @param {Array} tags String array.
  * @return {Object}
  */
 export function setTags(state, tags) {
   if (tags && tags.length) return { ...state, tags };
   if (!state.tags) return state;
   const res = _.clone(state);
   delete res.tags;
   return res;
 }
 
 /**
  * Clones fitler state and sets the free-text string for the filtering by
  * challenge name and tags. To clear the string set it to anything evaluating
  * to falst (empty string, null, undefined).
  * @param {Object} state
  * @param {String} text
  * @return {Object} Resulting string.
  */
 export function setText(state, text) {
   if (!text && !state.text) return state;
   const res = _.clone(state);
   if (text) res.text = text;
   else delete res.text;
   return res;
 }
 
 export default undefined;