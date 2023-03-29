import { createActions } from "redux-actions";
import * as utils from "../utils";

function updateFilter(partialUpdate) {
  return partialUpdate;
}

function clearChallengeFilter(defaultFilter) {
  return defaultFilter;
}

function updateChallengeQuery(filter) {
  const params = utils.challenge.createChallengeParams(filter);
  utils.url.updateQuery(params);
  return params;
}

export default createActions({
  UPDATE_FILTER: updateFilter,
  CLEAR_CHALLENGE_FILTER: clearChallengeFilter,
  UPDATE_CHALLENGE_QUERY: updateChallengeQuery,
});
