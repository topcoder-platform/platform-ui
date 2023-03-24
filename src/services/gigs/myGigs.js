/* global process */
import { get, keys, size, sortBy, values } from "lodash";
import {
  ACTIONS_AVAILABLE_FOR_MY_GIG_PHASE,
  AVAILABLE_REMARK_BY_JOB_STATUS,
  JOB_STATUS_MAPPER,
  JOB_STATUS_MESSAGE_MAPPER,
  SORT_STATUS_ORDER,
  PHASES_FOR_JOB_STATUS,
  MY_GIG_PHASE,
  GIG_STATUS,
} from "../constants";
import api from "./api";

const PROFILE_URL = `${process.env.API_BASE_PATH}/profile`;
/**
 * Maps the data from api to data to be used by application
 * @param {Object} serverResponse data returned by the api
 * @returns
 */
const mapMyGigsData = (serverResponse) => {
  const phaseActionKeys = keys(ACTIONS_AVAILABLE_FOR_MY_GIG_PHASE);

  return (
    serverResponse
      .map((myGig) => {
        const gigPhase = JOB_STATUS_MAPPER[myGig.status];
        const action = phaseActionKeys.find((key) =>
          ACTIONS_AVAILABLE_FOR_MY_GIG_PHASE[key].includes(gigPhase)
        );
        const phases = PHASES_FOR_JOB_STATUS[myGig.status];
        const statusIndex = phases.findIndex((key) => key === gigPhase);
        let previousStatus = null;
        if (statusIndex >= 1) {
          previousStatus = phases[statusIndex - 1];
        }
        const sortPrio = SORT_STATUS_ORDER.findIndex(
          (status) => status === gigPhase
        );

        return {
          label: (gigPhase || "").toUpperCase(),
          title: myGig.title,
          rbStartDate: myGig.rbStartDate || "",
          rbEndDate: myGig.rbEndDate || "",
          paymentTotal: myGig.paymentTotal || 0,
          updatedAt: myGig.updatedAt || "",
          jobExternalId: myGig.jobExternalId,
          paymentRangeFrom: myGig.payment.min,
          paymentRangeTo: myGig.payment.max,
          paymentRangeRateType: myGig.payment.frequency,
          currency: myGig.payment.currency,
          location: myGig.location,
          duration: myGig.duration,
          hours: myGig.hoursPerWeek,
          workingHours: myGig.workingHours,
          note: JOB_STATUS_MESSAGE_MAPPER[gigPhase],
          phase: gigPhase,
          phaseNote: JOB_STATUS_MESSAGE_MAPPER[gigPhase],
          phaseAction: action,
          phaseStatus: "Active",
          remark: AVAILABLE_REMARK_BY_JOB_STATUS.includes(myGig.status)
            ? myGig.remark
            : "",
          previous:
            gigPhase == MY_GIG_PHASE.APPLIED ? gigPhase : previousStatus,
          next: gigPhase == MY_GIG_PHASE.APPLIED ? null : gigPhase,
          previousNote:
            gigPhase == MY_GIG_PHASE.APPLIED
              ? JOB_STATUS_MESSAGE_MAPPER[gigPhase]
              : JOB_STATUS_MESSAGE_MAPPER[previousStatus],
          nextNote:
            gigPhase == MY_GIG_PHASE.APPLIED
              ? null
              : JOB_STATUS_MESSAGE_MAPPER[gigPhase],
          status: myGig.status,
          // in case there's some status not taken in account, it will show last.
          sortPrio: sortPrio === -1 ? SORT_STATUS_ORDER.length + 1 : sortPrio,
        };
      })
      // enforce that all have a valid status. Those without a status should be ignored.
      .filter((gig) => gig.status)
  );
};
/**
 * Fetches MyGigs data from service
 * @param {*} page page number to request
 * @param {*} perPage item per page to request
 * @returns
 */
async function getMyGigs(status, page, perPage) {
  const response = await api.get(
    `${process.env.API_BASE_PATH}/myJobApplications?status=${status}&page=${page}&perPage=${perPage}`,
    process.env.URL.PLATFORM_WEBSITE_URL
  );

  return {
    myGigs: mapMyGigsData(response),
    total: response.meta.total,
    page: response.meta.page,
  };
}

/**
 * Get the profile info
 * @returns {Object}
 */
async function getProfile() {
  const profile = await api.get(
    PROFILE_URL,
    process.env.URL.PLATFORM_WEBSITE_URL
  );

  return {
    handle: profile.handle,
    photoURL: profile.profilePhoto,
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    city: profile.city,
    country: profile.country,
    phone: profile.phone,
    file: null,
    existingResume: profile.resume,
    hasProfile: profile.hasProfile,
    salaryExpectation: profile.salaryExpectation,
    skill: profile.skill,
    status: profile.availability
      ? GIG_STATUS.AVAILABLE
      : GIG_STATUS.UNAVAILABLE,
  };
}

/**
 * Updates the profile
 * @param {Object} profile - profile info to be updated
 * @returns
 */
async function updateProfile(profile) {
  const payload = {
    city: profile.city,
    country: profile.country,
    countryName: profile.countryName,
    phone: profile.phone,
    availability: profile.status === GIG_STATUS.AVAILABLE ? true : false,
  };
  if (profile.file) {
    payload.resume = profile.file;
  }

  // add info to formData to send to server
  const formData = new FormData();
  keys(payload).forEach((key) => formData.append(key, payload[key]));

  const response = await api.post(
    PROFILE_URL,
    formData,
    process.env.URL.PLATFORM_WEBSITE_URL
  );

  // in case of error, throw the server error
  if (response.status !== 200 && response.status !== 204) {
    const error = await response.json();
    throw new Error(error.message);
  }
  return response;
}

async function startCheckingGigs(externalId) {
  const res = await api.get(
    `${process.env.API_BASE_PATH}/job?externalId=${externalId}`,
    process.env.URL.PLATFORM_WEBSITE_URL
  );
  return res;
}

export default {
  getMyGigs,
  getProfile,
  updateProfile,
  startCheckingGigs,
};
