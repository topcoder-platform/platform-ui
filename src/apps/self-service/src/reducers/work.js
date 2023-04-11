/**
 * Work item reducer
 */
import { ACTIONS } from "../config";

const initialState = {
  work: null,
  workItem: {},
  error: null,
  isLoadingWork: false,
  isLoadingSolutions: false,
  isSavingSurveyDone: false,
};

const workReducer = (state = initialState, action) => {
  switch (action.type) {
    case ACTIONS.WORK.GET_WORK_PENDING:
      return {
        ...state,
        work: null,
        workItem: {},
        isLoadingWork: true,
        error: null,
      };
    case ACTIONS.WORK.GET_WORK_SUCCESS:
      return {
        ...state,
        work: action.payload,
        isLoadingWork: false,
      };
    case ACTIONS.WORK.GET_WORK_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoadingWork: false,
      };
    case ACTIONS.WORK.GET_SUMMARY:
      return {
        ...state,
        workItem: {
          ...state.workItem,
          summary: action.payload,
        },
      };
    case ACTIONS.WORK.GET_DETAILS:
      return {
        ...state,
        workItem: {
          ...state.workItem,
          details: action.payload,
        },
      };
    case ACTIONS.WORK.GET_SOLUTIONS_PENDING:
      return {
        ...state,
        isLoadingSolutions: true,
        error: null,
        workItem: {
          ...state.workItem,
          solutions: undefined,
        },
      };
    case ACTIONS.WORK.GET_SOLUTIONS_SUCCESS:
      return {
        ...state,
        isLoadingSolutions: false,
        workItem: {
          ...state.workItem,
          solutions: action.payload,
        },
      };
    case ACTIONS.WORK.GET_SOLUTIONS_ERROR:
      return {
        ...state,
        isLoadingSolutions: false,
        error: action.payload,
      };
    case ACTIONS.WORK.GET_SOLUTIONS_COUNT_PENDING:
      return {
        ...state,
        isLoadingSolutions: true,
        error: null,
        workItem: {
          ...state.workItem,
          solutionsCount: undefined,
        },
      };
    case ACTIONS.WORK.GET_SOLUTIONS_COUNT_SUCCESS:
      return {
        ...state,
        isLoadingSolutions: false,
        workItem: {
          ...state.workItem,
          solutionsCount: action.payload,
        },
      };
    case ACTIONS.WORK.GET_SOLUTIONS_COUNT_ERROR:
      return {
        ...state,
        isLoadingSolutions: false,
        error: action.payload,
      };
    case ACTIONS.WORK.SAVE_SURVEY_SUCCESS:
      return {
        ...state,
        isSavingSurveyDone: true,
        work: {
          ...state.work,
          metadata: action.payload.metadata,
        },
      };
    case ACTIONS.WORK.SET_IS_SAVING_SURVEY_DONE:
      return {
        ...state,
        isSavingSurveyDone: action.payload,
      };
    default:
      return state;
  }
};

export default workReducer;
