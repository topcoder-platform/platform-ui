/* eslint-disable jsx-a11y/label-has-for */
/* eslint-disable jsx-a11y/label-has-associated-control */
/**
 * Radio button component.
 */
import PT from "prop-types";
import _ from "lodash";
import React, { useEffect, useState } from "react";
import "./styles.module.scss";

function RadioButton({ options, onChange, size, errorMsg }) {
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
        className="radioButtonContainer"
        styleName={`radioButtonContainer ${sizeStyle}`}
      >
        {internalOptions.map((o) => (
          <div key={o.key} styleName="radioButton" className="radioButton">
            <label styleName="container">
              <input
                type="radio"
                checked={o.value}
                onChange={() => {
                  const newOptions = internalOptions.map((oWithKeyTmp) => ({
                    ...oWithKeyTmp,
                    value: o.key === oWithKeyTmp.key,
                  }));
                  setInternalOptions(newOptions);
                  onChange(newOptions);
                }}
              />
              <span styleName={`checkmark ${errorMsg ? "hasError" : ""}`} />
            </label>
            {o.label ? <span styleName="label">{o.label}</span> : null}
          </div>
        ))}
      </div>
      {errorMsg ? <span styleName="errorMessage">{errorMsg}</span> : null}
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
