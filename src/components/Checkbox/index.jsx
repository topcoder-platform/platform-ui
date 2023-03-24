import styles from "./styles.module.scss";
import React, { useCallback } from "react";
import PT from "prop-types";
import cn from "classnames";
import IconTick from "assets/icons/icon-tick-white.svg";

/**
 * Displays checkbox with label.
 *
 * @param {Object} props component properties
 * @param {boolean} props.checked whether checkbox is checked
 * @param {Object} [props.children] checkbox label
 * @param {string} [props.className] class name added to root element
 * @param {string} [props.impostorClassName] class name added to checkbox impostor
 * @param {boolean} [props.isDisabled] whether checkbox is disabled
 * @param {boolean} [props.isRequired] whether checkbox must have enabled value
 * @param {string} props.name name for input element
 * @param {() => void} props.onChange function called when checkbox changes state
 * @param {() => void} [props.onFocus] function called when checkbox gains focus
 * @param {'large'|'medium'|'small'} [props.size] checkbox size
 * @param {string} [props.value] value for checkbox input
 * @param {boolean|string} [props.error] error flag or message
 * @returns {JSX.Element}
 */
const Checkbox = ({
  checked,
  children,
  className,
  impostorClassName,
  isDisabled = false,
  name,
  onChange,
  onFocus,
  size = "medium",
  value,
  error = false,
}) => {
  const onToggle = useCallback(
    (event) => {
      onChange(event.target.checked);
    },
    [onChange]
  );

  return (
    <label
      className={cn(
        styles.container,
        styles[size],
        { [styles.single]: !children, [styles.error]: !!error },
        className
      )}
    >
      <input
        type="checkbox"
        disabled={isDisabled}
        className={styles.checkbox}
        name={name}
        onChange={onToggle}
        onFocus={onFocus}
        checked={checked}
        value={value}
      />
      <span className={cn(styles.impostor, impostorClassName)}>
        <IconTick />
      </span>
      {!!children && <span className={styles.label}>{children}</span>}
    </label>
  );
};

Checkbox.propTypes = {
  checked: PT.bool,
  children: PT.node,
  className: PT.string,
  impostorClassName: PT.string,
  isDisabled: PT.bool,
  label: PT.string,
  name: PT.string.isRequired,
  size: PT.oneOf(["medium", "small"]),
  onChange: PT.func.isRequired,
  onFocus: PT.func,
  value: PT.string.isRequired,
  error: PT.oneOfType([PT.bool, PT.string]),
};

export default Checkbox;
