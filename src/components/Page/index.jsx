/**
 * Page
 *
 * Handles common stuff for pages.
 * Should wrap each page.
 */
import cn from "classnames";
import PT from "prop-types";
import React from "react";
import styles from "./styles.module.scss";

const Page = ({ children, styledName, ...props }) => {
  return (
    <div className={cn(styles["page"], !!styledName ? styles[styledName] : undefined)} {...props}>
      {children}
    </div>
  );
};

Page.propTypes = {
  children: PT.node,
};

export default Page;
