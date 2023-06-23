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

function updateGigFilter(partialUpdate) {
  return partialUpdate;
}

function updateGigQuery(filter) {
  const params = utils.myGig.createGigParams(filter);
  utils.url.updateQuery(params);
  return params;
}

export default createActions({
  UPDATE_FILTER: updateFilter,
  CLEAR_CHALLENGE_FILTER: clearChallengeFilter,
  UPDATE_CHALLENGE_QUERY: updateChallengeQuery,
  UPDATE_GIG_FILTER: updateGigFilter,
  UPDATE_GIG_QUERY: updateGigQuery,
});
