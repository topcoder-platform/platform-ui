export const getIsLoadingReferralData = (state) =>
  state.user.isLoadingReferralData;

export const getIsLoggedIn = (state) =>
  !state.user.isLoggingIn && !!state.user.profile;

export const getIsLoggingIn = (state) => state.user.isLoggingIn;

export const getProfile = (state) => state.user.profile;

export const getReferralData = (state) => state.user.referralData;

export const getReferralId = (state) => state.user.referralData?.id;

export const getStateSlice = (state) => state.user;
