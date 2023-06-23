import React from "react";
import PT from "prop-types";

import styles from "./styles.scss";
import { styled as styledCss } from "@earn/utils";
const styled = styledCss(styles)

const Panel = ({ children }) => <div className={styled("panel")}>{children}</div>;

Panel.propTypes = {
  children: PT.node,
};

const PanelHeader = ({ children }) => (
  <div className={styled("panel-header")}>{children}</div>
);

PanelHeader.propTypes = {
  children: PT.node,
};

const PanelBody = ({ children }) => (
  <div className={styled("panel-body")}>{children}</div>
);

PanelBody.propTypes = {
  children: PT.node,
};

const PanelFooter = ({ children }) => (
  <div className={styled("panel-footer")}>{children}</div>
);

PanelFooter.propTypes = {
  children: PT.node,
};

Panel.Header = PanelHeader;
Panel.Body = PanelBody;
Panel.Footer = PanelFooter;

export default Panel;
