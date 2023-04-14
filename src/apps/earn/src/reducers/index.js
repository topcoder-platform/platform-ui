import { combineReducers } from "redux";
import challenges from "./challenges";
import filter from "./filter";
import lookup from "./lookup";
import challenge from "./challenge";
import challengeListing from './challenge-listing';
import page from "./page";
import terms from "./terms";
import auth from "./auth";
import errors from "./errors";
import submission from "./submission";
import submissionManagement from "./submissionManagement";
import gigApply from "./gig-apply";
import gigDetails from "./gig-details";
import gigs from "./gigs";
import myGigs from "./my-gigs";
import user from "./user";

export default combineReducers({
  challenges,
  filter,
  lookup,
  challenge,
  challengeListing,
  page,
  terms,
  auth,
  submission,
  submissionManagement,
  errors,
  gigApply,
  gigDetails,
  gigs,
  myGigs,
  user,
});
