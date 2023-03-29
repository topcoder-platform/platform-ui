import React from "react";
import PT from "prop-types";
import Tooltip from "../../../../../../components/Tooltip";

import styles from "./styles.scss";

const NoteTooltip = ({ children }) => {
  const Content = () => <div className={styles["note-tooltip"]}>Remarks/Notes</div>;

  return (
    <Tooltip overlay={<Content />} placement="top">
      {children}
    </Tooltip>
  );
};

NoteTooltip.propTypes = {
  children: PT.node,
};

export default NoteTooltip;
