import styles from "./styles.scss";
import React, { useCallback } from "react";
import PT from "prop-types";
import cn from "classnames";

import { ReactComponent as IconMagnifier } from "../../assets/icons/icon-magnifier.svg";

/**
 * Displays search input field.
 *
 * @param {Object} props component properties
 * @param {string} [props.className] class name added to root element
 * @param {string} props.id id for input element
 * @param {string} props.placeholder placeholder text
 * @param {string} props.name name for input element
 * @param {'medium'|'small'} [props.size] field size
 * @param {function} props.onChange function called when input value changes
 * @param {string} props.value input value
 * @returns {JSX.Element}
 */
const SearchField = ({
  className,
  id,
  name,
  size = "medium",
  onChange,
  placeholder,
  value,
}) => {
  const onInputChange = useCallback(
    (event) => {
      onChange(event.target.value);
    },
    [onChange]
  );

  return (
    <div className={cn(styles.container, styles[size], className)}>
      <IconMagnifier className={styles.icon} />
      <input
        type="text"
        className={styles.input}
        id={id}
        name={name}
        onChange={onInputChange}
        placeholder={placeholder}
        value={value}
      />
    </div>
  );
};

SearchField.propTypes = {
  className: PT.string,
  id: PT.string.isRequired,
  size: PT.oneOf(["medium", "small"]),
  name: PT.string.isRequired,
  onChange: PT.func.isRequired,
  placeholder: PT.string,
  value: PT.oneOfType([PT.number, PT.string]),
};

export default SearchField;
