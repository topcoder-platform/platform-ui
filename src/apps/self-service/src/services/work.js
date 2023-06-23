import _ from "lodash";
import moment from "moment";

import { EnvironmentConfig } from "~/config";
import { xhrGetAsync, xhrGetBlobAsync, xhrPatchAsync } from "~/libs/core";

import { WORK_TIMELINE, CHALLENGE_STATUS, WORK_STATUSES } from "../config";
import workUtil from "../utils/work";
import { triggerDownload } from "../utils";

import { getChallengeDetails } from "./challenge";

export const getWork = async (id) => {
  const challengeId = id;

  const response = await xhrGetAsync(
    `${EnvironmentConfig.API.V5}/challenges/${challengeId}`
  );

  const data = response;
  if (data.status.startsWith("Cancelled")) {
    data.status = CHALLENGE_STATUS.CANCELLED;
  }

  return data;
};

export const getSummary = (work) => {
  let timeline = WORK_TIMELINE.map((i) => {
    const date = typeof i.date === "string" ? work[i.date] : i.date(work);
    return {
      name: i.name,
      title: i.title,
      date: date,
      active: typeof i.active === "function" ? i.active(work) : i.active,
      completed:
        typeof i.completed === "function" ? i.completed(work) : i.completed,
      hidden: typeof i.hidden === "function" ? i.hidden(work) : i.hidden,
    };
  });

  // sort by date
  const sendToSolutions = timeline.pop();

  if (!sendToSolutions.hidden) {
    let sorted = [];
    let sendToSolutionsInserted = false;
    for (let i = 0; i < timeline.length - 1; i += 1) {
      const m = timeline[i];
      if (!m.date) {
        sorted.push(m);
      } else if (
        sendToSolutions.date &&
        moment(m.date).isBefore(sendToSolutions.date)
      ) {
        sorted.push(m);
      } else {
        sendToSolutionsInserted = true;
        sorted.push(sendToSolutions);

        const after = timeline
          .slice(i)
          .map((m) => ({ ...m, active: false, completed: false }));

        sorted.push(...after);
        break;
      }
    }
    if (!sendToSolutionsInserted) {
      sorted.push(sendToSolutions);
    }
    timeline = sorted;
  }

  // set index
  timeline = timeline.map((m, index) => ({
    ...m,
    index,
    isFirst: index === 0,
    isLast:
      index === timeline.length - 1 - timeline.filter((i) => i.hidden).length,
  }));

  let status = _.get(
    _.findLast(timeline, "active"),
    "title",
    workUtil.getStatus(work)
  );

  if (
    status === WORK_STATUSES.DirectedToSales.name ||
    status === WORK_STATUSES.PaymentFailed.name
  ) {
    status = "Redirected";
  }

  return {
    status,
    participants: work.numOfRegistrants,
    solutions: work.numOfSubmissions,
    submitDate: work.created,
    workId: work.id,

    timeline,
  };
};

export const getDetails = (work) => {
  const { metadata } = work || {};

  let formData = {};

  // TODO: Fix this
  const filtered = _.filter(metadata, (m) => m.name === "intake-form");
  (filtered || []).forEach((item) => {
    if (item.name && item.name.includes(".")) {
      const data = item.name.split(".");
      const key = data[1];
      formData[data[0]] = {
        ...formData[data[0]],
        [key]: JSON.parse(item.value),
      };
    } else {
      if (item.name) {
        formData[item.name] = JSON.parse(item.value);
      }
    }
  });

  return formData;
};

export const getSolutionsCount = async (workId) => {
  const response = await xhrGetAsync(
    `${EnvironmentConfig.API.V5}/submissions?challengeId=${workId}&perPage=500`
  );
  const submissions = response;
  return submissions.length;

  // const response = await axios.head(
  //   `${EnvironmentConfig.API.V5}/submissions?challengeId=${workId}`
  // );
  // return parseInt(_.get(response.headers, 'X-Total'), 10);
};

export const getSolutions = async (workId) => {
  const challenge = await getChallengeDetails(workId);
  if (!challenge?.winners || challenge?.winners?.length === 0) return [];
  const response = await xhrGetAsync(
    `${EnvironmentConfig.API.V5}/submissions?challengeId=${workId}&perPage=500`
  );

  const submissions = response;
  const res = [];

  for (const winner of challenge.winners) {
    try {
      const memberRes = await xhrGetAsync(
        `${EnvironmentConfig.API.V5}/members/${winner.handle}`
      );
      const { userId } = memberRes;
      res.push({
        ..._.find(
          submissions,
          (s) => _.toString(s.memberId) === _.toString(userId)
        ),
        placement: winner.placement,
      });
    } catch (e) {}
  }
  return _.sortBy(res, "placement");
};

export const downloadSolution = async (solutionId) => {
  const submissionId = solutionId;
  const response = await xhrGetBlobAsync(`${EnvironmentConfig.API.V5}/submissions/${submissionId}/download`);
  triggerDownload(`submission-${solutionId}.zip`, response);
};

export const saveSurvey = async (workId, metadata) => {
  const challengeId = workId;
  const body = { metadata };

  const response = await xhrPatchAsync(
    `${EnvironmentConfig.API.V5}/challenges/${challengeId}`,
    JSON.stringify(body)
  );

  return response;
};

const output = {
  getWork,
  getSummary,
  getDetails,
  getSolutions,
  getSolutionsCount,
  downloadSolution,
  saveSurvey,
};

export default output
