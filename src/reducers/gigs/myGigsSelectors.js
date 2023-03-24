import _ from "lodash";

export const getIsLoggedIn = (state) =>
  !state.myGigs.loadingProfile && !!state.myGigs.profile?.email;

export const getHasProfile = (state) => !!state.myGigs.profile?.hasProfile;

export const getIsLoggingIn = (state) => state.myGigs.loadingProfile;

export const getProfile = (state) => state.myGigs.profile;

export const getProfileError = (state) => state.myGigs.loadingProfileError;

export const getExistingResume = (state) =>
  state.myGigs.profile?.existingResume;

export const isEmptyProfile = (state) => _.isEmpty(state.myGigs.profile);
