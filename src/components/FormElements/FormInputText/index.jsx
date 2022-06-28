/**
 * FormInputText
 *
 * Form Input Type=text
 */
import cn from "classnames";
import React from "react";
import "./styles.module.scss";

const FormInputText = ({ styleName, ...props }) => {
  return (
    <input
      type="text"
      styleName={cn("form-input-text", styleName || "")}
      {...props}
    />
  );
};

FormInputText.propTypes = {};

export default FormInputText;
