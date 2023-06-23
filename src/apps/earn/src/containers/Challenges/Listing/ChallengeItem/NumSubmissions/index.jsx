import React from "react";
import PT from "prop-types";
import { ReactComponent as IconSubmission} from "../../../../../assets/icons/submission.svg";

import styles from "./styles.scss";

const NumSubmissions = ({ numOfSubmissions }) => (
  <div className={styles.submissions}>
    <IconSubmission /> {numOfSubmissions}
  </div>
);

NumSubmissions.propTypes = {
  numOfSubmissions: PT.number,
};

export default NumSubmissions;
