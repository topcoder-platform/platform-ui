import { ACTIONS as ALL_ACTIONS } from "../config";

const ACTIONS = ALL_ACTIONS.MY_WORK;

const cancelSourceDummy = { cancel() {} };

const initialState = {
  works: [],
  worksCancelSource: cancelSourceDummy,
  worksError: null,
};

const reducer = (state = initialState, action) => {
  const handler = actionHandlers[action.type];
  return handler ? handler(state, action.payload) : state;
};

export default reducer;

const actionHandlers = {
  [ACTIONS.LOAD_WORKS_ERROR]: (state, worksError) => ({
    ...state,
    worksCancelSource: null,
    worksError,
  }),
  [ACTIONS.LOAD_WORKS_PENDING]: (state, worksCancelSource) => ({
    ...state,
    worksCancelSource,
  }),
  [ACTIONS.LOAD_WORKS_SUCCESS]: (state, works) => {
    return {
      ...state,
      works,
      worksCancelSource: null,
    };
  },
};
