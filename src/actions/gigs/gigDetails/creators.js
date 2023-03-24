import { createActions } from "redux-actions";
import * as ACTION_TYPE from "./types";

const actions = createActions(
  {},
  ACTION_TYPE.LOAD_DETAILS_ERROR,
  ACTION_TYPE.LOAD_DETAILS_PENDING,
  ACTION_TYPE.LOAD_DETAILS_SUCCESS,
  ACTION_TYPE.RESET_DETAILS,
  ACTION_TYPE.SET_CANCEL_RESET,
  { prefix: "GIG-DETAILS", namespace: "--" }
);

export default actions;
