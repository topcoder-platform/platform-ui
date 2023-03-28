/**
 * PageH2
 *
 * page content heading 3
 */
import React from "react";
import PT from "prop-types";
import cn from "classnames";
import styles from "./styles.module.scss";

const PageH3 = ({ children, styledName, ...props }) => {
  return (
    <h3 className={cn(styles["page-h3"], !!styledName ? styles[styledName] : undefined)} {...props}>
      {children}
    </h3>
  );
};

PageH3.propTypes = {
  children: PT.node,
};

export default PageH3;
