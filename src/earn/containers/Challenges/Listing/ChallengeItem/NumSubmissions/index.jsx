import React from "react";
import PT from "prop-types";
import { ReactComponent as IconSubmission} from "../../../../../assets/icons/submission.svg";

import "./styles.scss";

const NumSubmissions = ({ numOfSubmissions }) => (
  <div styleName="submissions">
    <IconSubmission /> {numOfSubmissions}
  </div>
);

NumSubmissions.propTypes = {
  numOfSubmissions: PT.number,
};

export default NumSubmissions;
