export const getAgreedDuration = (state) => state.gigApply.agreedDuration;

export const getAgreedTerms = (state) => state.gigApply.agreedTerms;

export const getAgreedTimezone = (state) => state.gigApply.agreedTimezone;

export const getApplication = (state) => state.gigApply.application;

export const getApplicationData = (state) => state.gigApply.application.data;

export const getApplicationError = (state) => state.gigApply.application.error;

export const getCandidateTerms = (state) => state.gigApply.candidateTerms;

export const getCity = (state) => state.gigApply.city;

export const getCountry = (state) => state.gigApply.country;

export const getEqualityPolicy = (state) => state.gigApply.equalityPolicy;

export const getIsFormValid = (state) => !state.gigApply.invalidFields[0].size;

export const getIsSendingApplication = (state) =>
  state.gigApply.application.isSending;

export const getPayment = (state) => state.gigApply.payment;

export const getPhone = (state) => state.gigApply.phone;

export const getReferral = (state) => state.gigApply.referral;

export const getResume = (state) => state.gigApply.resume;

export const getSkills = (state) => state.gigApply.skills;

export const getStateSlice = (state) => state.gigApply;
