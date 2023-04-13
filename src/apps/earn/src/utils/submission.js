/**
 * Various submissions functions.
 */
/* eslint-disable no-param-reassign */
import _ from "lodash";

import config from "../config";

function removeDecimal(num) {
  const re = new RegExp("^-?\\d+");
  return num.toString().match(re)[0];
}

function toAcurateFixed(num, decimal) {
  const re = new RegExp(`^-?\\d+(?:.\\d{0,${decimal}})?`);
  return num.toString().match(re)[0];
}

function toFixed(num, decimal) {
  if (_.isNaN(parseFloat(num))) return num;
  num = parseFloat(num);

  const result = _.toFinite(toAcurateFixed(num, decimal));
  const integerResult = _.toFinite(removeDecimal(num));

  if (_.isInteger(result)) {
    return integerResult;
  }
  return result;
}

/**
 * Process each submission rank of MM challenge
 * @param submissions the array of submissions
 */
function processRanks(submissions) {
  let maxFinalScore = 0;
  submissions.sort((a, b) => {
    let pA = _.get(a, "submissions[0]", { provisionalScore: 0 })
      .provisionalScore;
    let pB = _.get(b, "submissions[0]", { provisionalScore: 0 })
      .provisionalScore;
    if (pA === "-") pA = 0;
    if (pB === "-") pB = 0;
    if (pA === pB) {
      const timeA = new Date(_.get(a, "submissions[0].submissionTime"));
      const timeB = new Date(_.get(b, "submissions[0].submissionTime"));
      return timeA - timeB;
    }
    return pB - pA;
  });
  _.each(submissions, (submission, i) => {
    submissions[i].provisionalRank = i + 1;
  });

  submissions.sort((a, b) => {
    let pA = _.get(a, "submissions[0]", { finalScore: 0 }).finalScore;
    let pB = _.get(b, "submissions[0]", { finalScore: 0 }).finalScore;
    if (pA === "-") pA = 0;
    if (pB === "-") pB = 0;
    if (pA > 0) maxFinalScore = pA;
    if (pB > 0) maxFinalScore = pB;
    if (pA === pB) {
      const timeA = new Date(_.get(a, "submissions[0].submissionTime"));
      const timeB = new Date(_.get(b, "submissions[0].submissionTime"));
      return timeA - timeB;
    }
    return pB - pA;
  });
  if (maxFinalScore > 0) {
    _.each(submissions, (submission, i) => {
      submissions[i].finalRank = i + 1;
    });
  }
  return { submissions, maxFinalScore };
}

/**
 * Get provisional score of submission
 * @param submission
 */
export function getProvisionalScore(submission) {
  const { submissions: subs } = submission;
  if (!subs || subs.length === 0) {
    return 0;
  }
  const { provisionalScore } = subs[0];
  if (!provisionalScore || provisionalScore < 0) {
    return 0;
  }
  return provisionalScore;
}

/**
 * Get final score of submission
 * @param submission
 */
export function getFinalScore(submission) {
  const { submissions: subs } = submission;
  if (!subs || subs.length === 0) {
    return 0;
  }
  const { finalScore } = subs[0];
  if (!finalScore || finalScore < 0) {
    return 0;
  }
  return finalScore;
}

/**
 * Process submissions of MM challenge
 * @param submissions the array of submissions
 * @param resources the challenge resources
 * @param registrants the challenge registrants
 */
export function processMMSubmissions(submissions) {
  const data = {};
  const result = [];

  _.each(submissions, (submission) => {
    const { memberId } = submission;
    if (!data[memberId]) {
      data[memberId] = [];
    }
    const validReviews = _.reject(submission.review, [
      "typeId",
      config.AV_SCAN_SCORER_REVIEW_TYPE_ID,
    ]);
    validReviews.sort((a, b) => {
      const dateA = new Date(a.created);
      const dateB = new Date(b.created);
      return dateB - dateA;
    });

    const provisionalScoringIsCompleted = _.some(submission.review, {
      typeId: config.PROVISIONAL_SCORING_COMPLETED_REVIEW_TYPE_ID,
    });

    const provisionalScore = toFixed(_.get(validReviews, "[0].score", "-"), 5);
    const finalScore = toFixed(
      _.get(submission, "reviewSummation[0].aggregateScore", "-"),
      5
    );

    data[memberId].push({
      submissionId: submission.id,
      submissionTime: submission.created,
      provisionalScore,
      finalScore,
      provisionalScoringIsCompleted,
      review: submission.review,
    });
  });

  _.each(data, (value, key) => {
    result.push({
      submissions: [
        ...value.sort(
          (a, b) =>
            new Date(b.submissionTime).getTime() -
            new Date(a.submissionTime).getTime()
        ),
      ],
      memberId: key,
    });
  });

  const { submissions: finalSubmissions, maxFinalScore } = processRanks(result);
  finalSubmissions.sort((a, b) => {
    if (maxFinalScore === 0) {
      return a.provisionalRank - b.provisionalRank;
    }
    return a.finalRank - b.finalRank;
  });

  return finalSubmissions;
}

export const isSubmissionEnded = (challenge) => {
  const { status, phases } = challenge;

  return (
    status === "COMPLETED" ||
    (!_.some(phases, { name: "Submission", isOpen: true }) &&
      !_.some(phases, { name: "Checkpoint Submission", isOpen: true }))
  );
};

export const canSubmitFinalFixes = (challenge, handle) => {
  const { winners, phases } = challenge;
  const hasFirstPlacement =
    !_.isEmpty(winners) && _.some(winners, { placement: 1, handle });

  let canSubmit = false;
  if (hasFirstPlacement && !_.isEmpty(phases)) {
    canSubmit = _.some(phases, { phaseType: "Final Fix", isOpen: true });
  }

  return canSubmit;
};

export const isChallengeBelongToTopgearGroup = (challenge, communityList) => {
  const { groups } = challenge;

  // check if challenge belong to any group
  if (!_.isEmpty(groups)) {
    return false;
  }

  const topGearCommunity = _.find(communityList, { mainSubdomain: "topgear" });
  if (!topGearCommunity) {
    return false;
  }

  // check the group info match with group list
  for (let i = 0; i < groups.length; i += 1) {
    if (groups[i] && _.includes(topGearCommunity.groupIds, groups[i])) {
      return true;
    }
  }

  return false;
};

/* eslint-disable class-methods-use-this */
export const isValidUrl = (url) => {
  return /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(url); /* eslint-disable-line no-useless-escape */
}

export const getSubmissionDetail = (challenge) => {
  const { phases } = challenge;

  const checkpoint = _.find(phases, {
    name: "Checkpoint Submission",
  });
  const submission = _.find(phases, {
    name: "Submission",
  });
  const finalFix = _.find(phases, {
    name: "Final Fix",
  });
  let subType;

  // Submission type logic
  if (checkpoint && checkpoint.isOpen) {
    subType = "Checkpoint Submission";
  } else if (
    checkpoint &&
    !checkpoint.isOpen &&
    submission &&
    submission.isOpen
  ) {
    subType = "Contest Submission";
  } else if (finalFix && finalFix.isOpen) {
    subType = "Studio Final Fix Submission";
  } else {
    subType = "Contest Submission";
  }

  return subType;
};

export default undefined;
