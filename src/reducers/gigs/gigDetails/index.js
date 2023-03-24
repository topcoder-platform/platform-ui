import { handleActions } from "redux-actions";
import * as ACTION_TYPE from "../../../actions/gigs/gigDetails/types";
import { LOCATION } from "../../../constants/gigs";

const abortControllerDummy = { abort() {} };

const initState = () => ({
  abortController: abortControllerDummy,
  cancelReset: false,
  details: null,
  detailsError: null,
});

const initialState = initState();

const onLoadDetailsError = (state, { payload: detailsError }) => ({
  ...state,
  abortController: null,
  detailsError,
});

const onLoadDetailsPending = (state, { payload: abortController }) => ({
  ...state,
  abortController,
});

const onLoadDetailsSuccess = (state, { payload: details }) => {
  if (!details.location) {
    details.location = LOCATION.ANYWHERE;
  }
  return {
    ...state,
    abortController: null,
    details,
  };
};

const onResetDetails = () => initState();

const onSetCancelReset = (state, { payload: cancelReset }) => ({
  ...state,
  cancelReset,
});

export default handleActions(
  {
    [ACTION_TYPE.LOAD_DETAILS_ERROR]: onLoadDetailsError,
    [ACTION_TYPE.LOAD_DETAILS_PENDING]: onLoadDetailsPending,
    [ACTION_TYPE.LOAD_DETAILS_SUCCESS]: onLoadDetailsSuccess,
    [ACTION_TYPE.RESET_DETAILS]: onResetDetails,
    [ACTION_TYPE.SET_CANCEL_RESET]: onSetCancelReset,
  },
  initialState,
  { prefix: "GIG-DETAILS", namespace: "--" }
);
