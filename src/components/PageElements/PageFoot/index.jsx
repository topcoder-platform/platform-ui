/**
 * PageFoot
 *
 * page bottom section
 */
import React from "react";
import PT from "prop-types";
import cn from "classnames";
import styles from "./styles.module.scss";

const PageFoot = ({ children, align = "right", styledName, ...props }) => {
  return (
    <div
      className={cn(styles["page-foot"], styles[`align-${align}`], !!styledName ? styles[styledName] : undefined)}
      {...props}
    >
      {children}
    </div>
  );
};

PageFoot.propTypes = {
  children: PT.node,
};

export default PageFoot;
