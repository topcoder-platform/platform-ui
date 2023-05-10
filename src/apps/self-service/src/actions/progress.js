import { ACTIONS } from "../config";

export const setProgressItem = (item) => ({
  type: ACTIONS.PROGRESS.SET_ITEM,
  payload: item,
});
