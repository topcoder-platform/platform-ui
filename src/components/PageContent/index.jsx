/**
 * PageContent
 *
 * Main page layout.
 */
import React from "react";
import PT from "prop-types";
import cn from "classnames";
import styles from "./styles.module.scss";

const PageContent = ({ children, styledName, ...props }) => {
  return (
    <div className={cn(styles["page-content"], !!styledName ? styles[styledName] : undefined)} {...props}>
      {children}
    </div>
  );
};

PageContent.propTypes = {
  children: PT.node,
};

export default PageContent;
