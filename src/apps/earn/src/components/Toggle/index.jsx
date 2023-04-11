/**
 * Toggles component.
 */
import React, { useRef, useState, useEffect } from "react";
import PT from "prop-types";
import _ from "lodash";

import config from "../../config";

import styles from "./style.scss";
import { styled as styledCss } from "@earn/utils";
const styled = styledCss(styles)

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
    <label className={styled(`container ${sizeStyle}`)}>
      <input
        checked={internalChecked}
        type="checkbox"
        onChange={(e) => {
          setInternalChecked(e.target.checked);
          delayedOnChange.current(e.target.checked, onChange);
        }}
      />
      <span className={styled("slider")} />
      {sizeStyle === "lgSize" && !internalChecked ? (
        <span className={styled("off")}>off</span>
      ) : null}
      {sizeStyle === "lgSize" && internalChecked ? (
        <span className={styled("on")}>on</span>
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
