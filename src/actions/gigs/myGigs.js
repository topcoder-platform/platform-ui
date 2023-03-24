import { createActions } from "redux-actions";
import _ from "lodash";
import {
  PER_PAGE,
  CHECKING_GIG_TIMES,
  DELAY_CHECK_GIG_TIME,
} from "../constants";
import service from "../services/myGigs";

async function getMyActiveGigs(
  status = "active_jobs",
  page = 1,
  perPage = PER_PAGE
) {
  return service.getMyGigs(status, page, perPage);
}

async function getMyOpenGigs(
  status = "open_jobs",
  page = 1,
  perPage = PER_PAGE
) {
  return service.getMyGigs(status, page, perPage);
}

async function getMyCompletedGigs(
  status = "completed_jobs",
  page = 1,
  perPage = PER_PAGE
) {
  return service.getMyGigs(status, page, perPage);
}

async function getMyArchivedGigsDone(
  status = "archived_jobs",
  page = 1,
  perPage = PER_PAGE
) {
  return service.getMyGigs(status, page, perPage);
}

async function getProfile() {
  return service.getProfile();
}

async function updateProfile(profile) {
  return service.updateProfile(profile);
}

async function startCheckingGigs(externalId) {
  let i = 0;
  while (i < CHECKING_GIG_TIMES) {
    const res = await service.startCheckingGigs(externalId);
    if (res && !res.synced) {
      await new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, DELAY_CHECK_GIG_TIME);
      });
      i++;
      continue;
    } else {
      return {};
    }
  }
  return {};
}

export default createActions({
  GET_MY_ACTIVE_GIGS: getMyActiveGigs,
  GET_MY_OPEN_GIGS: getMyOpenGigs,
  GET_MY_COMPLETED_GIGS: getMyCompletedGigs,
  GET_MY_ARCHIVED_GIGS: getMyArchivedGigsDone,
  GET_PROFILE: getProfile,
  UPDATE_PROFILE: updateProfile,
  UPDATE_PROFILE_RESET: _.noop,
  START_CHECKING_GIGS: startCheckingGigs,
});
