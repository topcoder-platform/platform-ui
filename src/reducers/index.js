/**
 * Root Redux Reducer
 */
import { reducer as toastrReducer } from "react-redux-toastr";
import { combineReducers } from "redux";
import authUserReducer from "../hoc/withAuthentication/reducers";
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
  authUser: authUserReducer,
  progress: progressReducer,
  form: formReducer,
  autoSave: autoSaveReducer,
  challenge: challengeReducer,
  myWork: myWorkReducer,
  profile: profileReducer,
  work: workReducer,
});

export default rootReducer;
