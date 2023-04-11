/**
 * Radio button component.
 */
import React, { useEffect, useRef, useState } from "react";
import PT from "prop-types";
import _ from "lodash";

import config from "../../config";

import styles from "./styles.module.scss";
import { styled as styledCss } from "@earn/utils";
const styled = styledCss(styles)

function RadioButton({ options, onChange, size, errorMsg }) {
  const [internalOptions, setInternalOptions] = useState(options);
  const optionsWithKey = internalOptions.map((o, oIndex) => ({
    ...o,
    key: oIndex,
  }));
  let sizeStyle = size === "lg" ? "lgSize" : null;
  if (!sizeStyle) {
    sizeStyle = size === "xs" ? "xsSize" : "smSize";
  }
  const delayedOnChange = useRef(
    _.debounce((q, cb) => cb(q), config.GUIKIT.DEBOUNCE_ON_CHANGE_TIME) // eslint-disable-line no-undef
  ).current;

  useEffect(() => {
    setInternalOptions(options);
  }, [options]);

  return (
    <React.Fragment>
      <div
        className={styled(`radioButtonContainer ${sizeStyle}`)}
      >
        {optionsWithKey.map((o) => (
          <div key={o.key} className={styled("radioButton", "radioButton")}>
            <label className={styled("container")}>
              <input
                type="radio"
                checked={o.value}
                onChange={() => {
                  const newOptions = optionsWithKey.map((oWithKeyTmp) => ({
                    label: oWithKeyTmp.label,
                    value: o.key === oWithKeyTmp.key,
                  }));
                  setInternalOptions(newOptions);
                  delayedOnChange(_.cloneDeep(newOptions), onChange);
                }}
              />
              <span className={styled(`checkmark ${errorMsg ? "hasError" : ""}`)} />
              {o.label ? <span className={styled("label")}>{o.label}</span> : null}
            </label>
          </div>
        ))}
      </div>
      {errorMsg ? <span className={styled("errorMessage")}>{errorMsg}</span> : null}
    </React.Fragment>
  );
}

RadioButton.defaultProps = {
  onChange: () => {},
  size: "sm",
  errorMsg: "",
};

RadioButton.propTypes = {
  options: PT.arrayOf(
    PT.shape({
      label: PT.string,
      value: PT.bool.isRequired,
    })
  ).isRequired,
  onChange: PT.func,
  size: PT.oneOf(["xs", "sm", "lg"]),
  errorMsg: PT.string,
};

export default RadioButton;
