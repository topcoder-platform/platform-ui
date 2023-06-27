/* eslint-disable jsx-a11y/label-has-for */
/* eslint-disable jsx-a11y/label-has-associated-control */
/**
 * Radio button component.
 */
import PT from "prop-types";
import _ from "lodash";
import React, { useEffect, useState } from "react";
import styles from "./styles.module.scss";
import classNames from "classnames";

function RadioButton({ options, onChange, size, errorMsg, disabled }) {
  const [internalOptions, setInternalOptions] = useState(
    (options || []).map((o, i) => ({ ...o, key: i }))
  );
  let sizeStyle = size === "lg" ? "lgSize" : null;
  if (!sizeStyle) {
    sizeStyle = size === "xs" ? "xsSize" : "smSize";
  }

  useEffect(() => {
    if (
      !options ||
      !options.length ||
      _.isEqualWith(internalOptions, options, "label")
    ) {
      return;
    } else if (!internalOptions || !internalOptions.length) {
      setInternalOptions(
        options.map((option, index) => ({ ...option, key: index }))
      );
    } else {
      const newOptions = _.cloneDeep(internalOptions);
      for (let i = 0; i < options.length; i += 1) {
        newOptions[i].label = options[i]?.label;
        newOptions[i].key = i;
        if (
          _.isUndefined(newOptions[i].value) &&
          !_.isUndefined(options[i].value)
        ) {
          newOptions[i].value = options[i].value;
        }
      }
      setInternalOptions(newOptions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options]);

  return (
    <React.Fragment>
      <div
        className={classNames("radioButtonContainer", styles['radioButtonContainer'], styles[sizeStyle])}
      >
        {internalOptions.map((o) => (
          <div key={o.key} className={classNames(styles["radioButton"], "radioButton")}>
            <label className={styles["container"]}>
              <input
                type="radio"
                checked={o.value}
                disabled={disabled}
                onChange={() => {
                  const newOptions = internalOptions.map((oWithKeyTmp) => ({
                    ...oWithKeyTmp,
                    value: o.key === oWithKeyTmp.key,
                  }));
                  setInternalOptions(newOptions);
                  onChange(newOptions);
                }}
              />
              <span className={classNames(styles["checkmark"], !!errorMsg ? styles["hasError"] : "")} />
            </label>
            {o.label ? <span className={styles["label"]}>{o.label}</span> : null}
          </div>
        ))}
      </div>
      {errorMsg ? <span className={styles["errorMessage"]}>{errorMsg}</span> : null}
    </React.Fragment>
  );
}

RadioButton.defaultProps = {
  onChange: () => { },
  size: "sm",
  errorMsg: "",
  disabled: false,
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
  disabled: PT.bool,
};

export default RadioButton;
