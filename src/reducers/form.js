/**
 * `form` reducer
 */
import moment from "moment";
import "moment-timezone";
import _ from "lodash";
import config from "../../config";
import { ACTIONS } from "constants/";

const initialState = {
  pagePrice: 0,
  workType: null,
  basicInfo: null,
  websitePurpose: null,
  pageDetails: {
    pages: [
      {
        pageName: "",
        pageDetails: "",
      },
    ],
  },
  branding: null,
  reviewConfirmed: false,
  updatedAt: "",
  showSupportModal: false,
};

const formReducer = (state = initialState, action) => {
  const updatedAt = moment().tz(config.TIME_ZONE).format();
  switch (action.type) {
    case ACTIONS.FORM.SAVE_FORM:
      return {
        ...state,
        ...action.payload,
        updatedAt,
      };
    case ACTIONS.CHALLENGE.GET_CHALLENGE:
      const metaData = action.payload?.metadata
        ? _.find(action.payload.metadata, (m) => m.name === "intake-form")
        : undefined;
      return {
        ...state,
        ..._.get(JSON.parse(_.get(metaData, "value", "{}")), "form", {}),
      };
    case ACTIONS.FORM.RESET_INTAKE_FORM:
      return {
        ...state,
        ...initialState,
        updatedAt,
      };
    case ACTIONS.FORM.SAVE_WORK_TYPE:
      return {
        ...state,
        workType: {
          ...state.workType,
          ...action.payload,
        },
        updatedAt,
      };
    case ACTIONS.FORM.REVIEW_CONFIRMED:
      return {
        ...state,
        reviewConfirmed: action.payload,
        updatedAt,
      };
    case ACTIONS.FORM.SAVE_BASIC_INFO:
      return {
        ...state,
        basicInfo: action.payload,
        updatedAt,
      };
    case ACTIONS.FORM.SAVE_WEBSITE_PURPOSE:
      return {
        ...state,
        websitePurpose: action.payload,
        updatedAt,
      };
    case ACTIONS.FORM.SAVE_PAGE_DETAILS:
      return {
        ...state,
        pageDetails: action.payload,
        updatedAt,
      };
    case ACTIONS.FORM.SAVE_BRANDING:
      return {
        ...state,
        branding: action.payload,
        updatedAt,
      };
    case ACTIONS.FORM.TOGGLE_SUPPORT_MODAL:
      // if we don't have a payload, just toggle the modal
      // otherwise, override the toggle w/the payload
      const showSupportModal =
        action.payload === null ? !state.showSupportModal : action.payload;
      return {
        ...state,
        showSupportModal,
      };
    default:
      return state;
  }
};

export default formReducer;
