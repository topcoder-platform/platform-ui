/**
 * Challenge listing actions.
 */

import _ from "lodash";
import { createActions } from "redux-actions";
import "isomorphic-fetch";
import { getService } from "../../services/challenges";

/**
 * Gets possible challenge types.
 * @return {Promise}
 */
function getChallengeTypesDone() {
  return getService()
    .getChallengeTypes()
    .then((res) => res.sort((a, b) => a.name.localeCompare(b.name)));
}

/**
 * Gets possible challenge tags (technologies).
 * @return {Promise}
 */
function getChallengeTagsDone() {
  return getService()
    .getChallengeTags()
    .then((res) =>
      res.map((item) => item.name).sort((a, b) => a.localeCompare(b))
    );
}

export default createActions({
  CHALLENGE_LISTING: {
    DROP_CHALLENGES: _.noop,
    DROP_ACTIVE_CHALLENGES: _.noop,
    DROP_OPEN_FOR_REGISTRATION_CHALLENGES: _.noop,
    DROP_MY_CHALLENGES: _.noop,
    DROP_ALL_CHALLENGES: _.noop,
    DROP_PAST_CHALLENGES: _.noop,
    DROP_RECOMMENDED_CHALLENGES: _.noop,

    GET_CHALLENGE_TYPES_INIT: _.noop,
    GET_CHALLENGE_TYPES_DONE: getChallengeTypesDone,

    GET_CHALLENGE_TAGS_INIT: _.noop,
    GET_CHALLENGE_TAGS_DONE: getChallengeTagsDone,

    EXPAND_TAG: (id) => id,

    SET_FILTER: _.identity,

    SET_SORT: (bucket, sort) => ({ bucket, sort }),
  },
});
