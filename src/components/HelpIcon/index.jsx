import React, { useRef } from "react";
import ReactTooltip from "react-tooltip";
import HintIcon from "../../assets/images/icon-hint-green.svg";
import { v4 as uuidv4 } from "uuid";

import "./styles.module.scss";

const HelpIcon = ({
  children,
  inverted,
  arrowColor = "#f4f4f4",
  backgroundColor = "#f4f4f4",
  textColor = "#00000",
}) => {
  const tooltipId = useRef(uuidv4());

  return (
    <div styleName="help-icon">
      <HintIcon data-tip data-for={tooltipId.current} />
      <ReactTooltip
        arrowColor={arrowColor}
        backgroundColor={backgroundColor}
        textColor={textColor}
        styleName={["tooltip", inverted ? "inverted" : ""].join(" ")}
        id={tooltipId.current}
        aria-haspopup="true"
        place="bottom"
        effect="solid"
      >
        {children}
      </ReactTooltip>
    </div>
  );
};

export default HelpIcon;
