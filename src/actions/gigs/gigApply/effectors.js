import store from "../../../store";
import applyActions from "./creators";
import * as applySelectors from "../../../reducers/gigs/gigApply/selectors";
import * as detailsSelectors from "../../../reducers/gigs/gigDetails/selectors";
import * as gigsSelectors from "../../../reducers/gigs/gigs/selectors";
import * as lookupSelectors from "../../../reducers/gigs/lookupSelectors";
import * as myGigsSelectors from "../../../reducers/gigs/myGigsSelectors";
import lookupActions from "../../../actions/gigs/lookup";
import * as detailsEffectors from "../../../actions/gigs/gigDetails/effectors";
import * as applyServices from "../../../services/gigs/gigApply";
import { composeApplication } from "../../../utils/gigs/gigApply";

/**
 * Loads gig details and countries. Must be called after the user's profile
 * has loaded.
 */
export const loadInitialData = async (externalId) => {
  const { dispatch, getState } = store;
  const promises = [];
  let details = detailsSelectors.getDetails(getState());
  if (!details) {
    promises.push(detailsEffectors.loadDetails(store, externalId));
  }
  let countryByCode = lookupSelectors.getCountryByCode(getState());
  if (!countryByCode) {
    promises.push(dispatch(lookupActions.getAllCountries()));
  }
  try {
    await Promise.all(promises);
  } catch (error) {
    console.error(error);
  }
  const state = getState();
  const profile = myGigsSelectors.getProfile(state);
  countryByCode = lookupSelectors.getCountryByCode(state);
  const country = countryByCode[profile.country]?.name || "";
  const skillsByName = gigsSelectors.getSkillsByName(state);
  const skillNames = profile.skill?.split(",") || [];
  let skills = null;
  for (let name of skillNames) {
    let skill = skillsByName[name];
    if (skill) {
      // initialize it with empty array as long as we have at least one skill
      if (!skills) skills = [];
      skills.push(skill);
    }
  }
  dispatch(applyActions.initProfileData({ country, profile, skills }));
};

export const sendApplication = async () => {
  const { dispatch, getState } = store;
  const state = getState();
  dispatch(applyActions.validateUntouched());
  const isFormValid = applySelectors.getIsFormValid(state);
  
  if (!isFormValid) {
    // stop the application by return directly
    return;
  }
  const { jobExternalId } = detailsSelectors.getDetails(state);
  const formData = composeApplication(state);
  dispatch(applyActions.sendApplicationPending());
  let data = null;
  try {
    data = await applyServices.sendApplication(jobExternalId, formData);
  } catch (error) {
    dispatch(applyActions.sendApplicationError(error.toString()));
    return;
  }
  dispatch(applyActions.sendApplicationSuccess(data));
};
