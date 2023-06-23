/**
 * Radio button component.
 */
import { Fragment, useEffect, useRef, useState } from "react";
import PT from "prop-types";
import cn from "classnames";
import _ from "lodash";
import styles from "./styles.scss";
import config from "../../config";

function RadioButton({
  className,
  layout = "",
  options,
  onChange,
  size,
  errorMsg,
}) {
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
    <Fragment>
      <div
        className={cn(styles["radioButtonContainer"], styles[layout], styles[className], styles["radioButtonContainer"], styles[`${sizeStyle}`])}
      >
        {optionsWithKey.map((o) => (
          <div key={o.key} className={styles["radioButton"]}>
            <label className={styles["container"]}>
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
              <span className={cn(styles["checkmark"],styles[`${errorMsg ? "hasError" : ""}`])} />
              {o.label ? <span className={styles["label"]}>{o.label}</span> : null}
            </label>
          </div>
        ))}
      </div>
      {errorMsg ? <span className={styles["errorMessage"]}>{errorMsg}</span> : null}
    </Fragment>
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
