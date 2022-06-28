/**
 * `profile` reducer
 */

import { ACTIONS } from "constants/";

const initialState = {
  email: "",
  firstName: "",
  lastName: "",
  handle: "",
  isLoading: true,
};

const progressReducer = (state = initialState, action) => {
  switch (action.type) {
    case ACTIONS.PROFILE.GET_PROFILE:
      return {
        ...state,
        ...action.payload,
        isLoading: false,
      };
    case ACTIONS.PROFILE.UPDATE_BASIC_INFO_PENDING:
      return {
        ...state,
        isLoading: true,
      };
    case ACTIONS.PROFILE.UPDATE_BASIC_INFO_SUCCESS:
      return {
        ...state,
        firstName: action.payload.firstName,
        lastName: action.payload.lastName,
        isLoading: false,
      };
    case ACTIONS.PROFILE.UPDATE_BASIC_INFO_ERROR:
      return {
        ...state,
        isLoading: false,
      };
    default:
      return state;
  }
};

export default progressReducer;
