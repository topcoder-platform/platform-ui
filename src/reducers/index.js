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
});

export default rootReducer;
