import { combineReducers } from "redux";
import challenges from "./challenges";
import filter from "./filter";
import challengeListing from "./challenge-listing";

export default combineReducers({
  challenges,
  filter,
  challengeListing,
});
