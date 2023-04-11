import _ from "lodash";
import moment from "moment";

import { EnvironmentConfig } from "~/config";
import { xhrGetAsync, xhrPatchAsync, xhrPostAsync } from "~/libs/core";

import * as websiteDesignUtilsLegacy from "../utils/products/WebDesignLegacy";
import {
  formatChallengeCreationBody,
  formatChallengeUpdateBody,
} from "../utils/products";
import { WorkType } from "../lib";


/**
 * Get Challenge challenge details
 * @param {String} challengeId challenge id
 */
export async function getChallengeDetails(challengeId) {
  const response = await xhrGetAsync(
    `${EnvironmentConfig.API.V5}/challenges/${challengeId}`
  );

  return response;
}

/**
 * Get Intake Form challenge details
 * @param {String} userHandle
 */
export async function getIntakeFormChallenges(userHandle, challengeId) {
  let url = `${EnvironmentConfig.API.V5}/challenges?createdBy=${userHandle}&selfService=true&status=New`;
  url += challengeId ? `&id=${challengeId}` : "";
  const response = await xhrGetAsync(url);

  return response;
}

/**
 * Post a New Challenge
 */
export async function createChallenge(workType) {
  const body =
    workType === WorkType.designLegacy
      ? websiteDesignUtilsLegacy.formatChallengeCreationBody()
      : formatChallengeCreationBody(workType);

  const response = await xhrPostAsync(
    `${EnvironmentConfig.API.V5}/challenges`,
    JSON.stringify(body)
  );

  return response;
}

/**
 * Patch a New Challenge
 */
export async function patchChallenge(intakeForm, challengeId) {
  const jsonData = JSON.parse(intakeForm);
  const workType = _.get(jsonData, "form.workType.selectedWorkType");
  const body =
    workType === WorkType.designLegacy
      ? websiteDesignUtilsLegacy.formatChallengeUpdateBodyLegacy(intakeForm)
      : formatChallengeUpdateBody(intakeForm, workType);

  const response = await xhrPatchAsync(
    `${EnvironmentConfig.API.V5}/challenges/${challengeId}`,
    JSON.stringify(body)
  );

  return response;
}

/**
 * Patch a New Challenge
 */
export async function activateChallenge(challengeId) {
  const challenge = await getChallengeDetails(challengeId);
  const newDiscussions = [...(challenge.discussions || [])];
  if (newDiscussions.length > 0) {
    newDiscussions[0].name = challenge.name;
  } else {
    newDiscussions.push({
      name: challenge.name,
      type: "challenge",
      provider: "vanilla",
    });
  }

  let daysToAdd;
  switch (moment(new Date()).weekday()) {
    case moment().day("Friday").weekday():
      daysToAdd = 3;
      break;
    case moment().day("Saturday").weekday():
      daysToAdd = 2;
      break;
    case moment().day("Sunday").weekday():
      daysToAdd = 1;
      break;
    default:
      daysToAdd = 1;
  }

  const body = {
    status: "Draft",
    discussions: [...newDiscussions],
    startDate: moment().add(daysToAdd, "days").format(),
  };
  const response = await xhrPatchAsync(
    `${EnvironmentConfig.API.V5}/challenges/${challengeId}`,
    JSON.stringify(body)
  );

  return response;
}

const output = {
  getChallengeDetails,
  getIntakeFormChallenges,
  createChallenge,
  patchChallenge,
};

export default output
