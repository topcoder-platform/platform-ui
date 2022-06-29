import { ACTIONS } from "../constants";
import { createSupportTicket } from "../services/form";

export const saveForm = (form) => ({
  type: ACTIONS.FORM.SAVE_FORM,
  payload: form,
});

export const resetIntakeForm = (isReset) => ({
  type: ACTIONS.FORM.RESET_INTAKE_FORM,
  payload: isReset,
});

export const saveWorkType = (workType) => ({
  type: ACTIONS.FORM.SAVE_WORK_TYPE,
  payload: workType,
});

export const saveBasicInfo = (basicInfo) => ({
  type: ACTIONS.FORM.SAVE_BASIC_INFO,
  payload: basicInfo,
});

export const saveWebsitePurpose = (websitePurpose) => ({
  type: ACTIONS.FORM.SAVE_WEBSITE_PURPOSE,
  payload: websitePurpose,
});

export const savePageDetails = (pageDetails) => ({
  type: ACTIONS.FORM.SAVE_PAGE_DETAILS,
  payload: pageDetails,
});

export const saveBranding = (branding) => ({
  type: ACTIONS.FORM.SAVE_BRANDING,
  payload: branding,
});

export const reviewConfirmed = (confirmed) => ({
  type: ACTIONS.FORM.REVIEW_CONFIRMED,
  payload: confirmed,
});

export const toggleSupportModal = (show = null) => ({
  type: ACTIONS.FORM.TOGGLE_SUPPORT_MODAL,
  payload: show,
});

export const createNewSupportTicket =
  (request, challengeId, selfService) => (dispatch) => {
    return createSupportTicket(request, challengeId, selfService)
      .then((ticket) => {
        dispatch(() => ({
          type: ACTIONS.FORM.CREATE_SUPPORT_TICKET,
          payload: ticket,
        }));
      })
      .catch((e) => {});
  };
