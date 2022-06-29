import _ from "lodash";

/**
 * `progress` reducer
 */
import { ACTIONS } from "../constants/";
const initialState = {
  currentStep: 0,
};

const progressReducer = (state = initialState, action) => {
  switch (action.type) {
    case ACTIONS.PROGRESS.SET_ITEM:
      return {
        ...state,
        currentStep: action.payload,
      };
    case ACTIONS.CHALLENGE.GET_CHALLENGE:
      const metaData = action.payload?.metadata
        ? _.find(action.payload.metadata, (m) => m.name === "intake-form")
        : undefined;
      if (!metaData) return state;
      return {
        ...state,
        ..._.get(JSON.parse(_.get(metaData, "value", "{}")), "progress", {}),
      };
    default:
      return state;
  }
};

export default progressReducer;
