import { handleActions } from "redux-actions";
import * as ACTION_TYPE from "../../actions/user/types";

const initialState = {
  isLoadingReferralData: true,
  isLoggingIn: true,
  profile: null,
  profileError: null,
  referralData: null,
  referralDataError: null,
};

const onLoadProfileError = (state, { payload: profileError }) => ({
  ...state,
  isLoggingIn: false,
  profileError,
});

const onLoadProfilePending = (state) => ({
  ...state,
  isLoggingIn: true,
  profile: null,
});

const onLoadProfileSuccess = (state, { payload: profile }) => ({
  ...state,
  isLoggingIn: false,
  profile,
});

const onLoadReferralDataError = (state, { payload: referralDataError }) => ({
  ...state,
  isLoadingReferralData: false,
  referralDataError,
});

const onLoadReferralDataPending = (state) => ({
  ...state,
  isLoadingReferralData: true,
  referralData: null,
  referralDataError: null,
});

const onLoadReferralDataSuccess = (state, { payload: referralData }) => ({
  ...state,
  isLoadingReferralData: false,
  referralData,
});

export default handleActions(
  {
    [ACTION_TYPE.LOAD_PROFILE_ERROR]: onLoadProfileError,
    [ACTION_TYPE.LOAD_PROFILE_PENDING]: onLoadProfilePending,
    [ACTION_TYPE.LOAD_PROFILE_SUCCESS]: onLoadProfileSuccess,
    [ACTION_TYPE.LOAD_REFERRAL_DATA_ERROR]: onLoadReferralDataError,
    [ACTION_TYPE.LOAD_REFERRAL_DATA_PENDING]: onLoadReferralDataPending,
    [ACTION_TYPE.LOAD_REFERRAL_DATA_SUCCESS]: onLoadReferralDataSuccess,
  },
  initialState,
  { prefix: "USER", namespace: "--" }
);
