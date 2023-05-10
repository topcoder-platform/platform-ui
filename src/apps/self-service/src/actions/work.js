import { ACTIONS } from "../config";
import workService from "../services/work";

export const getWork = (id) => {
  return {
    type: ACTIONS.WORK.GET_WORK,
    payload: workService.getWork(id),
  };
};

export const getSummary = (work) => {
  return {
    type: ACTIONS.WORK.GET_SUMMARY,
    payload: workService.getSummary(work),
  };
};

export const getDetails = (work) => {
  const formData = workService.getDetails(work);
  return {
    type: ACTIONS.WORK.GET_DETAILS,
    payload: formData,
  };
};

export const getSolutions = (workId) => {
  return {
    type: ACTIONS.WORK.GET_SOLUTIONS,
    payload: workService.getSolutions(workId),
  };
};

export const getSolutionsCount = (workId) => {
  return {
    type: ACTIONS.WORK.GET_SOLUTIONS_COUNT,
    payload: workService.getSolutionsCount(workId),
  };
};

export const downloadSolution = (solutionId) => {
  return {
    type: ACTIONS.WORK.DOWNLOAD_SOLUTION,
    payload: workService.downloadSolution(solutionId),
  };
};

export const saveSurvey = (workId, metadata) => {
  return {
    type: ACTIONS.WORK.SAVE_SURVEY,
    payload: workService.saveSurvey(workId, metadata),
  };
};

export const setIsSavingSurveyDone = (value) => {
  return {
    type: ACTIONS.WORK.SET_IS_SAVING_SURVEY_DONE,
    payload: value,
  };
};
