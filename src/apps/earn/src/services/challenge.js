import api from "./api";
import { decodeToken, } from "tc-auth-lib";
import qs from "qs";
import _ from "lodash";
import * as util from "../utils/api";
import { getAuthUserTokens } from "../utils/auth";

/**
 * @internal
 */
async function getChallengeDetails(endpoint, legacyInfo) {
  let query = "";
  if (legacyInfo) {
    query = `legacyId=${legacyInfo.legacyId}`;
  }

  const url = `${endpoint}?${query}`;
  const result = await api.get(url).then(util.tryThrowError);

  return {
    challenge: legacyInfo ? result[0] : result,
  };
}

/**
 * Gets challenge registrants from Topcoder API.
 * @param {Number|String} challengeId
 * @return {Promise} Resolves to the challenge registrants array.
 * @internal
 */
async function getChallengeRegistrants(challengeId) {
  /* If no token provided, resource will return Submitter role only */
  const roleId = (await isLoggedIn())
    ? await getRoleId("Submitter")
    : undefined;
  const params = {
    challengeId,
    roleId,
  };

  let registrants = await api
    .get(`/resources?${qs.stringify(params)}`)
    .then(util.tryThrowError);

  /* API will return all roles to currentUser, so need to filter in FE */
  if (roleId) {
    registrants = _.filter(registrants, (r) => r.roleId === roleId);
  }

  return registrants || [];
}

/**
 * @internal
 */
async function isLoggedIn() {
  const { tokenV3 } = await getAuthUserTokens();
  return !!tokenV3;
}

/**
 * Get the Resource Role ID from provided Role Name
 * @param {String} roleName
 * @return {Promise}
 * @internal
 */
async function getRoleId(roleName) {
  const params = {
    name: roleName,
    isActive: true,
  };
  const roles = await api
    .get(`/resource-roles?${qs.stringify(params)}`)
    .then(util.tryThrowError);

  if (_.isEmpty(roles)) {
    throw new Error("Resource Role not found!");
  }

  return roles[0].id;
}

async function getChallenge(challengeId) {
  let challenge = {};
  let isLegacyChallenge = false;
  let isRegistered = false;
  let registrants = [];
  const { tokenV3 } = await getAuthUserTokens();
  const memberId = tokenV3 ? decodeToken(tokenV3).userId : null;
  alert("In service getChallenge");
  if (/^[\d]{5,8}$/.test(challengeId)) {
    isLegacyChallenge = true;
    challenge = await getChallengeDetails("/challenges/", {
      legacyId: challengeId,
    }).then((res) => res.challenge);
  } else {
    challenge = await getChallengeDetails(`/challenges/${challengeId}`).then(
      (res) => res.challenge
    );
  }

  if (challenge) {
    registrants = await getChallengeRegistrants(challenge.id);
    isRegistered =
      memberId && _.some(registrants, (r) => `${r.memberId}` === `${memberId}`);
  }

  return {
    ...challenge,
    isRegistered,
  };
}

export default {
  getChallenge,
  getChallengeRegistrants,
};
