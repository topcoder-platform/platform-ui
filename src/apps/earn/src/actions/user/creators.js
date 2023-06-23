import { createActions } from "redux-actions";
import * as ACTION_TYPE from "./types";

const actions = createActions(
  {},
  ACTION_TYPE.LOAD_PROFILE_ERROR,
  ACTION_TYPE.LOAD_PROFILE_PENDING,
  ACTION_TYPE.LOAD_PROFILE_SUCCESS,
  ACTION_TYPE.LOAD_REFERRAL_DATA_ERROR,
  ACTION_TYPE.LOAD_REFERRAL_DATA_PENDING,
  ACTION_TYPE.LOAD_REFERRAL_DATA_SUCCESS,
  { prefix: "USER", namespace: "--" }
);

export default actions;
