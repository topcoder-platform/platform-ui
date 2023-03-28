import React from "react";
import PT from "prop-types";
import IconRegistrant from "@earn/assets/icons/registrant.svg";

import "./styles.scss";

const NumRegistrants = ({ numOfRegistrants }) => (
  <div styleName="registrants">
    <IconRegistrant /> {numOfRegistrants}
  </div>
);

NumRegistrants.propTypes = {
  numOfRegistrants: PT.number,
};

export default NumRegistrants;
