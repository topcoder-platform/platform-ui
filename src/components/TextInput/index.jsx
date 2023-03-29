/**
 * Text input component.
 */
import React, { useState, useRef, useEffect } from "react";
import PT from "prop-types";
import cn from "classnames";
import _ from "lodash";
import styles from "./styles.scss";
import config from "../../../config";

function TextInput({
  className,
  placeholder,
  label,
  errorMsg,
  value,
  name,
  onChange,
  required,
  size,
  type,
  onEnterKey,
  readonly,
}) {
  const [val, setVal] = useState(value);
  const delayedOnChange = useRef(
    _.debounce((q, cb) => cb(q), config.GUIKIT.DEBOUNCE_ON_CHANGE_TIME) // eslint-disable-line no-undef
  ).current;
  const sizeStyle = size === "lg" ? "lgSize" : "xsSize";

  const ref = useRef(null);
  useEffect(() => {
    ref.current.value = value;
    setVal(value);
  }, [value]);

  return (
    <div
      className={`container ${sizeStyle}${readonly ? " readonly" : ""}`}
    >
      <input
        ref={ref}
        readOnly={readonly}
        defaultValue={value}
        type={type}
        name={name}
        placeholder={`${placeholder}${placeholder && required ? " *" : ""}`}
        className={`${value || val ? "haveValue" : ""} ${
          errorMsg ? "haveError" : ""
        }`}
        onChange={(e) => {
          delayedOnChange(e.target.value, onChange);
          setVal(e.target.value);
        }}
        onBlur={(e) => {
          delayedOnChange(e.target.value, onChange);
          setVal(e.target.value);
        }}
        onKeyPress={(e) => {
          if (e.key === "Enter") {
            onEnterKey();
          }
        }}
      />
      {label ? (
        <label htmlFor="textBoxInput" className="textInputLabel">
          {label}
          {required ? <span>&nbsp;*</span> : null}
        </label>
      ) : null}
      {errorMsg ? (
        <span className={styles["errorMessage"]}>
          {errorMsg}
        </span>
      ) : null}
    </div>
  );
}

TextInput.defaultProps = {
  placeholder: "",
  label: "",
  errorMsg: "",
  value: "",
  onChange: () => {},
  required: false,
  size: "lg",
  type: "text",
  onEnterKey: () => {},
  readonly: false,
};

TextInput.propTypes = {
  placeholder: PT.string,
  label: PT.string,
  errorMsg: PT.string,
  value: PT.string,
  onChange: PT.func,
  required: PT.bool,
  size: PT.oneOf(["xs", "lg"]),
  type: PT.string,
  onEnterKey: PT.func,
  readonly: PT.bool,
};

export default TextInput;
