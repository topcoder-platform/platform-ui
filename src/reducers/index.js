/**
 * Root Redux Reducer
 */
import { reducer as toastrReducer } from "react-redux-toastr";
import { combineReducers } from "redux";

import autoSaveReducer from "./autoSave";
import challengeReducer from "./challenge";
import formReducer from "./form";
import myWorkReducer from "./myWork";
import profileReducer from "./profile";
import progressReducer from "./progress";
import workReducer from "./work";

import filter from "./gigs/filter";
import gigApply from "./gigs/gigApply";
import gigDetails from "./gigs/gigDetails";
import gigs from "./gigs/gigs";
import lookup from "./gigs/lookup";
import myGigs from "./gigs/myGigs";
import user from "./gigs/user";

// redux root reducer
const rootReducer = combineReducers({
  toastr: toastrReducer,
  progress: progressReducer,
  form: formReducer,
  autoSave: autoSaveReducer,
  challenge: challengeReducer,
  myWork: myWorkReducer,
  profile: profileReducer,
  work: workReducer,
  filter,
  gigApply,
  gigDetails,
  gigs,
  lookup,
  myGigs,
  user,
});

export default rootReducer;
