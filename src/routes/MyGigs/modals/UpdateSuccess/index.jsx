import React from "react";
import PT from "prop-types";
import Button from "components/Button";
import IconUpdateSuccess from "assets/icons/update-success.svg";

import "./styles.scss";

const UpdateSuccess = ({ onClose }) => {
  return (
    <div styleName="update-success">
      <h4 styleName="title">
        <IconUpdateSuccess styleName="icon" />
        RESUME UPDATED!
      </h4>
      <p styleName="text">Your resume has been successfuly updated.</p>
      <Button size="large" onClick={onClose}>
        CLOSE
      </Button>
    </div>
  );
};

UpdateSuccess.propTypes = {
  onClose: PT.func,
};

export default UpdateSuccess;
