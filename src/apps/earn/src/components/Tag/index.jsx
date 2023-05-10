import React from "react";
import PT from "prop-types";

import styles from "./styles.scss";

const Tag = ({ tag, onClick }) => (
  <span
    role="button"
    tabIndex="0"
    className={styles.tag}
    onClick={() => {
      onClick(tag);
    }}
  >
    {tag}
  </span>
);

Tag.propTypes = {
  tag: PT.string,
  onClick: PT.func,
};

export default Tag;
