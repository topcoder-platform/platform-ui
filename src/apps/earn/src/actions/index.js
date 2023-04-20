import auth from "./auth";
import challenge from "./challenge.js";
import challengeListing from "./challenge-listing";
import challenges from "./challenges";
import errors from "./errors";
import filter from "./filter";
import lookup from "./lookup";
import myGigs from "./my-gigs";
import page from "./page/challenge-details";
import submission from "./submission";
import submissionManagement from "./submissionManagement";
import smp from "./smp";

export const actions = {
  challenges,
  filter,
  myGigs,
  submission,
  submissionManagement,
  ...smp,
  ...challenge,
  ...challengeListing,
  ...auth,
  ...lookup,
  ...page,
  ...errors,
};

export default actions;
