/**
 * FormField
 *
 * A Form Field Is a wrapper for input to add the label to it
 */
import cn from "classnames";
import PT from "prop-types";
import React from "react";
import "./styles.module.scss";

const FormField = ({
  children,
  label = "",
  placeholder = "",
  onChange = (f) => f,
  className,
  styleName,
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
      className={cn("form-field-wrapper", className || "")}
      styleName={cn(
        "form-field-wrapper",
        styleName || "",
        helperText ? "helper" : null
      )}
    >
      <div
        className={cn("form-field")}
        styleName={cn(
          "form-field",
          disabled ? "disabled" : null,
          props.formTitleStyle ? props.formTitleStyle : null
        )}
        {...props}
      >
        <div
          className={cn(props.labelStyle)}
          styleName={cn("label", props.labelStyle ? props.labelStyle : null)}
          onClick={handleClick}
          role="presentation"
        >
          {label}
        </div>
        {children}
      </div>
      {helperText && <div styleName="helperText">{helperText}</div>}

      <div className="error" styleName="error">
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
