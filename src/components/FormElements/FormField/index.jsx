/**
 * FormField
 *
 * A Form Field Is a wrapper for input to add the label to it
 */
import cn from "classnames";
import PT from "prop-types";
import React from "react";
import styles from "./styles.module.scss";

const FormField = ({
  children,
  label = "",
  placeholder = "",
  onChange = (f) => f,
  className,
  styledName,
  disabled,
  helperText,
  ...props
}) => {
  const handleClick = (e) => {
    // focus on input label click
    const inputElement = e.target.closest(".form-field").querySelector("input");
    inputElement && inputElement.focus();
  };
  return (
    <div
      className={cn(
        styles["form-field-wrapper"],
        className || "",
        !!styledName ? styles[styledName] : undefined,
        helperText ? styles["helper"] : null
      )}
    >
      <div
        className={cn(
          styles["form-field"],
          disabled ? styles["disabled"] : null,
          props.formTitleStyle ? styles[props.formTitleStyle] : null
        )}
        {...props}
      >
        <div
          className={cn(
            styles["label"],
            props.labelStyle ? styles[props.labelStyle ]: null,
            props.labelStyle,
          )}
          onClick={handleClick}
          role="presentation"
        >
          {label}
        </div>
        {children}
      </div>
      {helperText && <div className={styles["helperText"]}>{helperText}</div>}

      <div className={cn(styles["error"], "error")}>
        {props.error}
      </div>
    </div>
  );
};

FormField.propTypes = {
  onChange: PT.func,
  label: PT.string,
  placeholder: PT.string,
  children: PT.node,
  error: PT.string,
};

export default FormField;
