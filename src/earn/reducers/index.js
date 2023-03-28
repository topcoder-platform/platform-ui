import { combineReducers } from "redux";
import auth from "./auth";
import challenges from "./challenges";
import filter from "./filter";
import challengeListing from "./challenge-listing";

export default combineReducers({
  auth,
  challenges,
  filter,
  challengeListing,
});
