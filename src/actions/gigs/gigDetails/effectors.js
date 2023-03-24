import actions from "../../../actions/gigs/gigDetails/creators";
import * as gigsSelectors from "../../../reducers/gigs/gigs/selectors";
import * as selectors from "../../../reducers/gigs/gigDetails/selectors";
import * as services from "../../../services/gigs/gigDetails";
import { loadSkills } from "../../../actions/gigs/gigs/effectors";
import { isAbort } from "../../../utils/gigs/fetch";

export const loadDetails = async (store, externalId) => {
  const { dispatch, getState } = store;
  const skillsPromise = loadSkills(store);
  let tokens = null;
  try {
    //TODO - fix with actual auth
    //tokens = await getAuthUserTokens();
    tokens=null;
  } catch (error) {}
  const [promise, controller] = services.fetchGig(externalId, tokens?.tokenV3);
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
