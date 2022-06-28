/**
 * PageP
 *
 * page content paragraph tag
 */
import cn from "classnames";
import PT from "prop-types";
import React from "react";
import "./styles.module.scss";

const PageP = ({ children, styleName, ...props }) => {
  return (
    <p styleName={cn("page-p", styleName || "")} {...props}>
      {children}
    </p>
  );
};

PageP.propTypes = {
  children: PT.node,
};

export default PageP;
