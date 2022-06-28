import { WORK_STATUS_ORDER, WORK_STATUSES, CHALLENGE_STATUS } from "constants";
import _ from "lodash";
import moment from "moment";

export const getStatus = (work) => {
  const workStatus = _.find(WORK_STATUSES, { value: work.status });
  return workStatus ? workStatus.name : work.status;
};

export const isReviewPhaseEnded = (work) => {
  const allPhases = work.phases || [];

  for (let i = allPhases.length - 1; i >= 0; i -= 1) {
    const phase = allPhases[i];
    if (
      (phase.name === "Review" || phase.name === "Iterative Review") &&
      !phase.isOpen &&
      moment(phase.scheduledStartDate).isBefore() &&
      WORK_STATUS_ORDER[work.status] >=
        WORK_STATUS_ORDER[WORK_STATUSES.InProgress.value]
    ) {
      return true;
    }
  }

  return false;
};

export const phaseEndDate = (phase) => {
  if (phase.isOpen || moment(phase.scheduledStartDate).isAfter()) {
    return phase.scheduledEndDate;
  }

  return phase.actualEndDate || phase.scheduledEndDate;
};

export const phaseStartDate = (phase) => {
  if (phase.isOpen !== true && moment(phase.scheduledStartDate).isAfter()) {
    return phase.scheduledStartDate;
  }

  return phase.actualStartDate;
};

export const isMessagesDisabled = (work) => {
  const { status } = work || {};
  return (
    status === CHALLENGE_STATUS.NEW ||
    status === CHALLENGE_STATUS.DRAFT ||
    status === CHALLENGE_STATUS.CANCELLED ||
    status === CHALLENGE_STATUS.APPROVED
  );
};

export default {
  getStatus,
  isReviewPhaseEnded,
  phaseEndDate,
  phaseStartDate,
  isMessagesDisabled,
};
