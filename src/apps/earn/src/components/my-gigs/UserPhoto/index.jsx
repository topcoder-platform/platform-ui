import React, { useMemo } from "react";
import PT from "prop-types";
import * as util from "../../../utils/my-gig";

import styles from "./styles.scss";

const UserPhoto = ({ handle, photoURL }) => {
  const imgSrc = useMemo(() => {
    if (!photoURL) {
      const text = handle || "";
      return util.createTextImage(text.toUpperCase().slice(0, 2));
    }

    return photoURL;
  }, [handle, photoURL]);

  return (
    <div className={styles["user-photo"]}>
      <img src={imgSrc} alt="user" />
    </div>
  );
};

UserPhoto.propTypes = {
  handle: PT.string,
  photoURL: PT.string,
};

export default UserPhoto;
