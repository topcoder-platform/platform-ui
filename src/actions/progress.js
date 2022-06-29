import { ACTIONS } from "../constants";

export const setProgressItem = (item) => ({
  type: ACTIONS.PROGRESS.SET_ITEM,
  payload: item,
});
