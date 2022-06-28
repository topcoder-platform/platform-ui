/**
 * PageFoot
 *
 * page bottom section
 */
import React from "react";
import PT from "prop-types";
import cn from "classnames";
import styles from "./styles.module.scss";

const PageFoot = ({ children, align = "right", styleName, ...props }) => {
  return (
    <div
      className={cn(styles["page-foot"], styles[`align-${align}`], !!styleName ? styles[styleName] : undefined)}
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
