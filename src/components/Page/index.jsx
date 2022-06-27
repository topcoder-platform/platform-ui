/**
 * Page
 *
 * Handles common stuff for pages.
 * Should wrap each page.
 */
import cn from "classnames";
import PT from "prop-types";
import React from "react";
import "./styles.module.scss";

const Page = ({ children, styleName, ...props }) => {
  return (
    <div styleName={cn("page", styleName || "")} {...props}>
      {children}
    </div>
  );
};

Page.propTypes = {
  children: PT.node,
};

export default Page;
