import styles from "./styles.scss";
import React, { useCallback, useEffect, useState } from "react";
import PT from "prop-types";
import cn from "classnames";
import debounce from "lodash/debounce";
import {
  convertNumberStringToNumber,
  integerFormatter,
  isValidNumberString,
} from "../../utils/gigs/gigs/formatting";
import { DEBOUNCE_ON_CHANGE_TIME } from "../../constants/index.js";
import { PAYMENT_MAX_VALUE } from "../../constants/gigs";
import { isNumber } from "lodash";

/**
 * Displays currency input field.
 *
 * @param {Object} props component properties
 * @param {string} [props.className] class name added to root element
 * @param {string} props.currency currency abbreviation
 * @param {string} props.id id for input element
 * @param {string} props.label field label
 * @param {number} [props.maxValue] maximum value
 * @param {number} [props.minValue] minimum value
 * @param {string} props.name name for input element
 * @param {(v: string) => void} props.onChange function called when input value changes
 * @param {(v: number) => void} props.onCommit function called after some delay
 * when input value changes and it is valid
 * @param {boolean} [props.required] whether the field required non-empty value
 * @param {*} props.value input value
 * @returns {JSX.Element}
 */
const CurrencyField = ({
  className,
  currency,
  id,
  label,
  maxValue,
  minValue,
  name,
  rangeError,
  onError,
  onChange,
  onCommit,
  required = false,
  value,
}) => {
  const [error, setError] = useState("");

  const checkValue = useCallback(
    debounce(
      (value) => {
        if (!value) {
          if (required) {
            setError("Required");
          }
          return;
        }
        let num = convertNumberStringToNumber(value);
        let min = isNumber(minValue)
          ? minValue
          : convertNumberStringToNumber(minValue);
        let max = isNumber(maxValue)
          ? maxValue
          : convertNumberStringToNumber(maxValue);
        if (isValidNumberString(value) && !isNaN(num)) {
          setError("");
          if (num < min || num > max) {
            onError("Please put in a valid range.");
          } else {
            onError("");
            onCommit(num);
          }
        } else {
          onError("");
          setError("Invalid format");
        }
      },
      DEBOUNCE_ON_CHANGE_TIME,
      { leading: false }
    ),
    [maxValue, minValue, onCommit, required]
  );

  const onChangeValue = useCallback(
    (event) => {
      let value = event.target.value;
      setError("");
      if (value && isValidNumberString(value)) {
        let num = convertNumberStringToNumber(value);
        if (!isNaN(num)) {
          value = integerFormatter.format(num);
        }
      }
      onChange(value);
      checkValue(value);
    },
    [checkValue, onChange]
  );

  useEffect(() => {
    checkValue(value);
  }, [checkValue, value]);

  return (
    <div className={[className, styles["container"]].join(' ')}>
      {label && (
        <label className={styles["label"]} htmlFor={id}>
          {label}
        </label>
      )}
      <div className={[styles["field"], error || rangeError ? styles["has-errors"] : ""].join(' ')}>
        <input
          type="text"
          className={styles["input"]}
          id={id}
          name={name}
          onChange={onChangeValue}
          value={
            typeof value === "number" ? integerFormatter.format(value) : value
          }
        />
        <span className={styles["currency"]}>{currency}</span>
        {error && <span className={styles["error"]}>{error}</span>}
      </div>
    </div>
  );
};

CurrencyField.defaultProps = {
  maxValue: PAYMENT_MAX_VALUE,
  minValue: 0,
};

CurrencyField.propTypes = {
  className: PT.string,
  currency: PT.string.isRequired,
  id: PT.string.isRequired,
  label: PT.string,
  rangeError: PT.string,
  maxValue: PT.oneOfType([PT.number, PT.string]),
  minValue: PT.oneOfType([PT.number, PT.string]),
  name: PT.string.isRequired,
  onError: PT.func.isRequired,
  onChange: PT.func.isRequired,
  onCommit: PT.func.isRequired,
  required: PT.bool,
  value: PT.oneOfType([PT.number, PT.string]).isRequired,
};

export default CurrencyField;
