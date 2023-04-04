import React from "react";
import PT from "prop-types";

import "./styles.scss";

const Panel = ({ children }) => <div styleName="panel">{children}</div>;

Panel.propTypes = {
  children: PT.node,
};

const PanelHeader = ({ children }) => (
  <div styleName="panel-header">{children}</div>
);

PanelHeader.propTypes = {
  children: PT.node,
};

const PanelBody = ({ children }) => (
  <div styleName="panel-body">{children}</div>
);

PanelBody.propTypes = {
  children: PT.node,
};

const PanelFooter = ({ children }) => (
  <div styleName="panel-footer">{children}</div>
);

PanelFooter.propTypes = {
  children: PT.node,
};

Panel.Header = PanelHeader;
Panel.Body = PanelBody;
Panel.Footer = PanelFooter;

export default Panel;
