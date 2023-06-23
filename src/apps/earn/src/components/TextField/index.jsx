import React, { useCallback, useState } from "react";
import PT from "prop-types";
import cn from "classnames";
import styles from "./styles.module.scss";

/**
 * Displays text field with optional label.
 *
 * @param {Object} props component properties
 * @returns {JSX.Element}
 */
const TextField = ({
  className,
  id,
  isDisabled = false,
  isReadonly = false,
  isRequired = false,
  label,
  name,
  onBlur,
  onChange,
  onFocus,
  placeholder,
  size = "medium",
  value,
  error,
}) => {
  id = id || name;

  const onInputChange = useCallback(
    (event) => {
      onChange(event.target.value);
    },
    [onChange]
  );

  const [focused, setFocused] = useState(false);

  return (
    <div
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={() => setFocused(false)}
      className={cn(
        styles.container,
        styles[size],
        {
          [styles.focused]: focused,
          [styles.hasLabel]: !!label,
          [styles.disabled]: isDisabled,
          [styles.invalid]: !!error,
          [styles.readonly]: isReadonly,
        },
        className
      )}
    >
      {label && <label htmlFor={id}>{label + (isRequired ? " *" : "")}</label>}
      <input
        className={styles.input}
        disabled={isDisabled}
        readOnly={isReadonly}
        id={id}
        name={name}
        placeholder={placeholder}
        type="text"
        value={value}
        onBlur={onBlur}
        onChange={onInputChange}
        onFocus={onFocus}
      />
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
};

TextField.propTypes = {
  className: PT.string,
  id: PT.string,
  isDisabled: PT.bool,
  label: PT.string,
  name: PT.string.isRequired,
  onBlur: PT.func,
  onChange: PT.func,
  onFocus: PT.func,
  size: PT.oneOf(["small", "medium"]),
  value: PT.oneOfType([PT.number, PT.string]).isRequired,
  error: PT.string,
};

export default TextField;
