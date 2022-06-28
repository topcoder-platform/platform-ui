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
    <div className={cn(styles["styles.inline"])}>
      <label className={cn(styles["styles.form-input-checkbox"], !!styleName ? styles[styleName] : undefined)}>
        <Checkbox
          className={"form-input-rc-checkbox"}
          onChange={onChange}
          {...props}
        />
        <span className={styles["styles.label"]}>
          {label} {additionalContent}
        </span>
      </label>
    </div>
  ) : (
    // eslint-disable-next-line jsx-a11y/label-has-associated-control
    <label className={cn(styles["styles.form-input-checkbox"], !!styleName ? styles[styleName] : undefined)}>
      <Checkbox
        className={"form-input-rc-checkbox"}
        onChange={onChange}
        {...props}
      />
      <span className={styles["styles.label"]}>
        {label} {additionalContent}
      </span>
    </label>
  );
};

FormInputCheckbox.propTypes = {
  label: PT.string,
};

export default FormInputCheckbox;
