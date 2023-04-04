/**
 * PageH2
 *
 * page content heading 2
 */
import React from "react";
import PT from "prop-types";
import cn from "classnames";
import styles from "./styles.module.scss";

const PageH2 = ({ children, styledName, ...props }) => {
  return (
    <h2 className={cn(styles["page-h2"], !!styledName ? styles[styledName] : undefined)} {...props}>
      {children}
    </h2>
  );
};

PageH2.propTypes = {
  children: PT.node,
};

export default PageH2;
