import { combineReducers } from "redux";
import auth from "./auth";
import challenges from "./challenges";
import filter from "./filter";
import challengeListing from "./challenge-listing";
import lookup from "./lookup";

export default combineReducers({
  auth,
  challenges,
  filter,
  lookup,
  challengeListing,
});
