import React from "react";
import PT from "prop-types";
import RCTooltip from "rc-tooltip";

import "./styles.scss";

const Tooltip = ({ children, placement, trigger, overlay }) => (
  <RCTooltip
    placement={placement}
    overlay={overlay}
    overlayClassName="tooltip tooltip-container"
    destroyTooltipOnHide={{ keepParent: false }}
    trigger={trigger}
    showAction="contextMenu"
    getTooltipContainer={() => document.getElementById("tooltips-container-id")}
  >
    {children}
  </RCTooltip>
);

Tooltip.defaultProps = {
  trigger: ["hover", "click"],
};

Tooltip.propTypes = {
  placement: PT.oneOf([
    "left",
    "right",
    "top",
    "bottom",
    "topLeft",
    "topRight",
    "bottomLeft",
    "bottomRight",
  ]),
};

export default Tooltip;
