import React from "react";
import PT from "prop-types";
import Tooltip from "components/Tooltip";
import { GIG_STATUS_TOOLTIP } from "../../../../../../constants";
import { keys } from "lodash";
import "./styles.scss";

const StatusTooltip = ({ children }) => {
  const Content = () => (
    <div styleName="status-tooltip">
      <ul>
        {keys(GIG_STATUS_TOOLTIP).map((status) => (
          <li styleName="item" key={status}>
            <div>
              <div styleName="caption">{status}</div>
              <div styleName="text">{GIG_STATUS_TOOLTIP[status]}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <Tooltip overlay={<Content />} placement="bottom">
      {children}
    </Tooltip>
  );
};

StatusTooltip.propTypes = {
  children: PT.node,
};

export default StatusTooltip;
