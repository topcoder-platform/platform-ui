/**
 * Redux Reducer for state.page
 *
 * Description:
 *  Implements reducer factory for the state.page segment of Redux state; and
 *  combines it with the child state.page.x reducer factories.
 */

import { combineReducers } from "redux";
import challengeDetails from "./challenge-details";
import submission from "./submission";
import submission_management from "./submission_management";

export default combineReducers({
  challengeDetails,
  submission,
  submission_management
});
