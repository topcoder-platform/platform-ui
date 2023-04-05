import { createActions } from "redux-actions";
import _ from "lodash";
import service from "../services/challenges";
import * as util from "../utils/challenge";
import * as constants from "../constants";
import { decodeToken } from "tc-auth-lib";
import { getAuthUserTokens } from "../utils/auth";

async function doGetChallenges(filter, cancellationSignal) {
  return service.getChallenges(filter, cancellationSignal);
}

async function getAllActiveChallenges(filter, signal) {
  const allActiveFilter = {
    ...util.createChallengeCriteria(filter),
    ...util.createAllActiveChallengeCriteria(),
  };
  return doGetChallenges(allActiveFilter, signal);
}

async function getOpenForRegistrationChallenges(filter, signal) {
  const openForRegistrationFilter = {
    ...util.createChallengeCriteria(filter),
    ...util.createOpenForRegistrationChallengeCriteria(),
  };
  return doGetChallenges(openForRegistrationFilter, signal);
}

async function getClosedChallenges(filter, signal) {
  const closedFilter = {
    ...util.createChallengeCriteria(filter),
    ...util.createClosedChallengeCriteria(),
  };
  return doGetChallenges(closedFilter, signal);
}

async function getMyChallenges(filter, signal) {
  const { tokenV3 } = await getAuthUserTokens();
  const user = decodeToken(tokenV3);

  const myFilter = {
    ...util.createChallengeCriteria(filter),
    ...util.createMyChallengeCriteria(user.userId),
  };
  return doGetChallenges(myFilter, signal);
}

async function getReviewOpportunities(filter, signal) {
  const reviewOpportunities = await service.getReviewOpportunities(signal);
  
  //Convert from the reviewOpportunity into a challenge object for display in the UI
  const challenges = reviewOpportunities.result.content.map((item) => {
    let challenge={};
    challenge.id = item.id;
    challenge.name = item.challenge.title;
    challenge.legacy = {};
    challenge.legacy.id = item.challenge.id;
    challenge.track = item.challenge.track;
    challenge.overview = {};
    challenge.overview.totalPrizes = item.payments[0].payment;
    challenge.reviewPayment = item.payments[0].payment;
    challenge.type = "Contest Review";
    challenge.tags = item.challenge.technologies;
    challenge.openPositions = item.openPositions;
    challenge.numOfSubmissions = item.submissions;

    return challenge;
  })
  return challenges;
}

async function getOpenForRegistrationCount(filter, signal) {
  const openForRegistrationCountCriteria = {
    ...util.createChallengeCriteria(filter),
    ...util.createOpenForRegistrationCountCriteria(),
  };
  return doGetChallenges(openForRegistrationCountCriteria, signal);
}

async function getChallenges(filter, signal) {
  const ALL_ACTIVE_CHALLENGES_BUCKET = constants.FILTER_BUCKETS[0];
  const OPEN_FOR_REGISTRATION_BUCKET = constants.FILTER_BUCKETS[1];
  const CLOSED_CHALLENGES = constants.FILTER_BUCKETS[2];
  const MY_CHALLENGES = constants.FILTER_BUCKETS[3];
  const REVIEW_OPPORTUNITIES = constants.FILTER_BUCKETS[4];

  let challenges;
  let total;
  let openForRegistrationCount;

  const getChallengesByBucket = async (f) => {
    const promises = [];
    switch (f.bucket) {
      case ALL_ACTIVE_CHALLENGES_BUCKET:
        promises.push(getAllActiveChallenges(f, signal));
        break;
      case OPEN_FOR_REGISTRATION_BUCKET:
        promises.push(getOpenForRegistrationChallenges(f, signal));
        break;
      case CLOSED_CHALLENGES:
        promises.push(getClosedChallenges(f, signal));
        break;
      case MY_CHALLENGES:
        promises.push(getMyChallenges(f, signal));
        break;
      case REVIEW_OPPORTUNITIES:
        promises.push(getReviewOpportunities(f, signal));
        break;
      default:
        return [util.createEmptyResult(), 0];
    }
    promises.push(getOpenForRegistrationCount(f, signal));
    return Promise.all(promises).then((result) => [
      result[0],
      result[1].meta.total,
    ]);
  };

  if (!util.checkRequiredFilterAttributes(filter)) {
    return {
      challenges: [],
      total: 0,
      openForRegistrationCount: 0,
    };
  }

  [challenges, openForRegistrationCount] = await getChallengesByBucket(filter);
  if(challenges.meta)
    total = challenges.meta.total;
  else
    total = 0

  return { challenges, total, openForRegistrationCount };
}

export default createActions({
  GET_CHALLENGES_INIT: _.noop(),
  GET_CHALLENGES_DONE: getChallenges,
  GET_CHALLENGES_FAILURE: _.noop,
});
