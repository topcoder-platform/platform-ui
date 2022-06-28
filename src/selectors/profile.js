import _ from "lodash";

export const getProfile = (state) =>
  _.pick(state.profile, ["firstName", "lastName", "email", "handle"]);

export const isProfileLoading = (state) => state.profile.isLoading;
