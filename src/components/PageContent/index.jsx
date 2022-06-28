/**
 * PageContent
 *
 * Main page layout.
 */
import React, { useEffect } from "react";
import PT from "prop-types";
import cn from "classnames";
import "./styles.module.scss";

const PageContent = ({ children, styleName, ...props }) => {
  return (
    <div styleName={cn("page-content", styleName || "")} {...props}>
      {children}
    </div>
  );
};

PageContent.propTypes = {
  children: PT.node,
};

export default PageContent;
