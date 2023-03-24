import { createActions } from "redux-actions";
import * as utils from "../utils";

function updateGigFilter(partialUpdate) {
  return partialUpdate;
}

function updateGigQuery(filter) {
  const params = utils.myGig.createGigParams(filter);
  utils.url.updateQuery(params);
  return params;
}

export default createActions({
  UPDATE_GIG_FILTER: updateGigFilter,
  UPDATE_GIG_QUERY: updateGigQuery,
});
