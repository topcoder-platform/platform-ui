import React from "react";
import PT from "prop-types";
import Tooltip from "components/Tooltip";
import IconCheck from "assets/icons/checkpoint-small.svg";

import "./styles.scss";

const ProgressTooltip = ({ job, children }) => {
  const Content = () => (
    <div styleName="progress-tooltip">
      <div styleName="progress-tooltip-content">
        <div
          styleName={`progress-phase pre-previous ${
            !job.previous ? "hidden" : ""
          }`}
        >
          <span styleName={`indicator ${!job.next ? "hidden" : ""}`}>
            <i styleName="before">
              <IconCheck />
            </i>
            <i styleName="after" />
          </span>
        </div>
        <div
          styleName={`progress-phase previous ${
            !job.previous ? "hidden" : ""
          } ${job.next ? "has-next" : ""}`}
        >
          <span styleName={`indicator ${!job.next ? "hidden" : ""}`}>
            <i styleName="before">
              <IconCheck />
            </i>
            <i styleName="after" />
          </span>
          <h5 styleName="name">{job.previous}</h5>
          <p styleName="note">{job.previousNote}</p>
        </div>
        <div styleName={`progress-phase next ${!job.next ? "hidden" : ""}`}>
          <span styleName="indicator">
            <i styleName="before">
              <IconCheck />
            </i>
            <i styleName="after" />
          </span>
          <h5 styleName="name">NEXT: {job.next}</h5>
          <p styleName="note">{job.nextNote}</p>
        </div>
      </div>
    </div>
  );

  return (
    <Tooltip overlay={<Content />} placement="bottom">
      {children}
    </Tooltip>
  );
};

ProgressTooltip.propTypes = {
  job: PT.shape(),
  children: PT.node,
};

export default ProgressTooltip;
