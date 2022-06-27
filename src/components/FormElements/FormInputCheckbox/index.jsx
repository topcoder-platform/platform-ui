/* eslint-disable jsx-a11y/label-has-associated-control */
/**
 * FormInputCheckbox
 *
 * Form Input Checkbox
 */
import cn from "classnames";
import PT from "prop-types";
import Checkbox from "rc-checkbox";
import "rc-checkbox/assets/index.css";
import React from "react";
import styles from "./styles.module.scss";

const FormInputCheckbox = ({
  label,
  additionalContent,
  onChange = (f) => f,
  styleName,
  inline,
  ...props
}) => {
  return inline ? (
    <div styleName={cn("styles.inline")}>
      <label styleName={cn("styles.form-input-checkbox", styleName || "")}>
        <Checkbox
          className={"form-input-rc-checkbox"}
          onChange={onChange}
          {...props}
        />
        <span styleName="styles.label">
          {label} {additionalContent}
        </span>
      </label>
    </div>
  ) : (
    // eslint-disable-next-line jsx-a11y/label-has-associated-control
    <label styleName={cn("styles.form-input-checkbox", styleName || "")}>
      <Checkbox
        className={"form-input-rc-checkbox"}
        onChange={onChange}
        {...props}
      />
      <span styleName="styles.label">
        {label} {additionalContent}
      </span>
    </label>
  );
};

FormInputCheckbox.propTypes = {
  label: PT.string,
};

export default FormInputCheckbox;
