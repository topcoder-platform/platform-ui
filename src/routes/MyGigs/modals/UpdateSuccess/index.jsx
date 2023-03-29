import React from "react";
import PT from "prop-types";
import GigsButton from "../../../../components/GigsButton";
import { ReactComponent as IconUpdateSuccess } from "../../../../assets/icons/update-success.svg";

import styles from "./styles.scss";

const UpdateSuccess = ({ onClose }) => {
  return (
    <div className={styles["update-success"]}>
      <h4 className={styles["title"]}>
        <IconUpdateSuccess className={styles["icon"]} />
        RESUME UPDATED!
      </h4>
      <p className={styles["text"]}>Your resume has been successfuly updated.</p>
      <GigsButton size="lg" onClick={onClose}>
        CLOSE
      </GigsButton>
    </div>
  );
};

UpdateSuccess.propTypes = {
  onClose: PT.func,
};

export default UpdateSuccess;
