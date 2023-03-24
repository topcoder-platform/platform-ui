import React from "react";
import PT from "prop-types";
import Tooltip from "../../../../../components/Tooltip";
import * as util from "../../../../../utils/challenge";
import _ from "lodash";
import moment from "moment";

import "./styles.scss";

const ProgressTooltip = ({ children, challenge, placement }) => {
  const Phase = ({ date, last, phase, progress, started }) => {
    const limitProgress = parseFloat(_.replace(progress, "%", ""));
    const limitWidth = limitProgress <= 100 ? limitProgress : 100;

    return (
      <div styleName="phase">
        <div>{phase}</div>
        <div
          styleName={`bar ${last ? "last" : ""} ${started ? "started" : ""}`}
        >
          <div styleName="point" />
          <div styleName="inner-bar" style={{ width: `${limitWidth}%` }} />
        </div>
        <div styleName="date">{`${getDate(date)}, ${getTime(date)}`}</div>
      </div>
    );
  };

  const Content = ({ c }) => {
    let steps = [];

    const allPhases = c.phases || [];
    const endPhaseDate = Math.max(
      ...allPhases.map((p) => util.phaseEndDate(p))
    );
    const registrationPhase =
      allPhases.find((phase) => phase.name === "Registration") || {};
    const submissionPhase =
      allPhases.find((phase) => phase.name === "Submission") || {};
    const checkpointPhase =
      allPhases.find((phase) => phase.name === "Checkpoint Submission") || {};

    if (!_.isEmpty(registrationPhase)) {
      steps.push({
        date: util.phaseStartDate(registrationPhase),
        name: "Start",
      });
    }
    if (!_.isEmpty(checkpointPhase)) {
      steps.push({
        date: util.phaseEndDate(checkpointPhase),
        name: "Checkpoint",
      });
    }
    const iterativeReviewPhase = allPhases.find(
      (phase) => phase.isOpen && phase.name === "Iterative Review"
    );
    if (iterativeReviewPhase) {
      steps.push({
        date: util.phaseEndDate(iterativeReviewPhase),
        name: "Iterative Review",
      });
    } else if (!_.isEmpty(submissionPhase)) {
      steps.push({
        date: util.phaseEndDate(submissionPhase),
        name: "Submission",
      });
    }
    steps.push({
      date: new Date(endPhaseDate),
      name: "End",
    });

    steps = steps.sort((a, b) => a.date.getTime() - b.date.getTime());
    const currentPhaseEnd = new Date();
    steps = steps.map((step, index) => {
      let progress = 0;
      if (index < steps.length - 1) {
        if (steps[1 + index].date.getTime() < currentPhaseEnd.getTime())
          progress = 100;
        else if (step.date.getTime() > currentPhaseEnd.getTime()) progress = 0;
        else {
          const left = currentPhaseEnd.getTime() - step.date.getTime();
          if (left < 0) progress = -1;
          else {
            progress =
              100 *
              (left /
                (steps[1 + index].date.getTime() -
                  steps[index].date.getTime()));
          }
        }
      }

      const phaseId = index;
      return (
        <Phase
          date={step.date}
          key={phaseId}
          last={index === steps.length - 1}
          phase={step.name}
          progress={`${progress}%`}
          started={step.date.getTime() < currentPhaseEnd.getTime()}
        />
      );
    });

    return (
      <div styleName="progress-bar-tooltip">
        <div styleName="tip">{steps}</div>
      </div>
    );
  };

  return (
    <Tooltip placement={placement} overlay={<Content c={challenge} />}>
      {children}
    </Tooltip>
  );
};

ProgressTooltip.defaultProps = {
  placement: "bottom",
};

ProgressTooltip.propTypes = {};

export default ProgressTooltip;

function getDate(date) {
  return moment(date).format("MMM DD");
}

function getTime(date) {
  const duration = moment(date);
  const hour = duration.hours();
  const hString = hour < 10 ? `0${hour}` : hour;
  const min = duration.minutes();
  const mString = min < 10 ? `0${min}` : min;
  const res = `${hString}:${mString}`;
  return res[1] === "-" ? "Late" : `${res}`;
}
