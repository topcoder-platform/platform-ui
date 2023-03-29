/**
 * Toggles component.
 */
import React, { useRef, useState, useEffect } from "react";
import PT from "prop-types";
import config from "@config";
import _ from "lodash";
import "./style.scss";

function Toggles({ checked, onChange, size }) {
  const [internalChecked, setInternalChecked] = useState(checked);
  let sizeStyle = size === "lg" ? "lgSize" : null;
  const delayedOnChange = useRef(
    _.debounce((q, cb) => cb(q), config.GUIKIT.DEBOUNCE_ON_CHANGE_TIME) // eslint-disable-line no-undef
  );

  if (!sizeStyle) {
    sizeStyle = size === "xs" ? "xsSize" : "smSize";
  }

  useEffect(() => {
    setInternalChecked(checked);
  }, [checked]);

  return (
    <label styleName={`container ${sizeStyle}`}>
      <input
        checked={internalChecked}
        type="checkbox"
        onChange={(e) => {
          setInternalChecked(e.target.checked);
          delayedOnChange.current(e.target.checked, onChange);
        }}
      />
      <span styleName="slider" />
      {sizeStyle === "lgSize" && !internalChecked ? (
        <span styleName="off">off</span>
      ) : null}
      {sizeStyle === "lgSize" && internalChecked ? (
        <span styleName="on">on</span>
      ) : null}
    </label>
  );
}

Toggles.defaultProps = {
  checked: false,
  onChange: () => {},
  size: "sm",
};

Toggles.propTypes = {
  checked: PT.bool,
  onChange: PT.func,
  size: PT.oneOf(["xs", "sm", "lg"]),
};

export default Toggles;
