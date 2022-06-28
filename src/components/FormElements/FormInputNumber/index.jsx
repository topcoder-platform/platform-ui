/**
 * FormInputNumber
 *
 * Form Input Type=text
 */
import cn from "classnames";
import React from "react";
import "./styles.module.scss";

const FormInputNumber = ({ styleName, ...props }) => {
  return (
    <input
      type="number"
      styleName={cn("form-input-number", styleName || "")}
      {...props}
    />
  );
};

FormInputNumber.propTypes = {};

export default FormInputNumber;
