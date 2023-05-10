export const getAbortController = (state) => state.gigDetails.abortController;

export const getDetails = (state) => state.gigDetails.details;

export const getDetailsError = (state) => state.gigDetails.detailsError;

export const getGigExternalId = (state) =>
  state.gigDetails.details?.jobExternalId;

export const getIsLoadingDetails = (state) =>
  !!state.gigDetails.abortController;

export const getStateSlice = (state) => state.gigDetails;
