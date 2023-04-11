import { tokenGetAsync } from "~/libs/core";

import * as gigsSelectors from "../../reducers/gigs/selectors";
import * as selectors from "../../reducers/gig-details/selectors";
import * as services from "../../services/gig-details";
import { loadSkills } from "../gigs/effectors";
import { isAbort } from "../../utils/fetch";

import actions from "./creators";

export const loadDetails = async (store, externalId) => {
  const { dispatch, getState } = store;
  const skillsPromise = loadSkills(store);
  const { token: tokenV3 } = await tokenGetAsync();

  const [promise, controller] = services.fetchGig(externalId, tokenV3);
  dispatch(actions.loadDetailsPending(controller));
  let details = null;
  try {
    details = await promise;
  } catch (error) {
    if (!isAbort(error)) {
      dispatch(actions.loadDetailsError(error.toString()));
    }
    return;
  }
  try {
    await skillsPromise;
  } catch (error) {
    // This should never be reachable but just in case.
    console.error(error);
  }
  const skillsById = gigsSelectors.getSkillsById(getState());
  if (details.skills?.length && skillsById) {
    const skills = [];
    for (let id of details.skills) {
      let skill = skillsById[id];
      if (skill) {
        skills.push(skill);
      }
    }
    details.skills = skills;
  }
  dispatch(actions.loadDetailsSuccess(details));
};

export const resetDetails = ({ dispatch, getState }) => {
  const { abortController, cancelReset } = selectors.getStateSlice(getState());
  if (cancelReset) {
    return;
  }
  abortController?.abort();
  dispatch(actions.resetDetails());
};
