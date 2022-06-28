/**
 * FormInputTextArea
 *
 * Form Input textarea
 */
import cn from "classnames";
import React from "react";
import "./styles.module.scss";

const FormInputTextArea = ({ styleName, ...props }) => {
  return (
    <textarea
      styleName={cn("form-input-textarea", styleName || "")}
      {...props}
      cols={10}
    />
  );
};

FormInputTextArea.propTypes = {};

export default FormInputTextArea;
