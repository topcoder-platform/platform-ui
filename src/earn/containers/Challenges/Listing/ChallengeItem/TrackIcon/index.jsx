import React from "react";
import PT from "prop-types";
import * as util from "../../../../../utils/icon";

import "./styles.scss";

const TrackIcon = ({ track, type, tcoEligible, onClick }) => (
  <span
    role="button"
    tabIndex="0"
    onClick={(event) => {
      event.preventDefault();
      onClick(track);
    }}
  >
    {util.createTrackIcon(track, type, tcoEligible)}
  </span>
);

TrackIcon.propTypes = {
  track: PT.string,
  type: PT.string,
  tcoEligible: PT.any,
  onClick: PT.func,
};

export default TrackIcon;
