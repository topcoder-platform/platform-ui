/**
 * FormPasswordField
 *
 * Form Input Type=text
 */
import cn from "classnames";
import React, { useState } from "react";
import EyeIcon from "../../../assets/images/eye.svg";
import "./styles.module.scss";

const FormPasswordField = ({ styleName, ...props }) => {
  const [inputType, setInputType] = useState("password");

  const handleViewPassword = () => {
    setInputType(inputType === "password" ? "text" : "password");
  };

  return (
    <>
      <input
        type={inputType}
        styleName={cn("form-password-field", styleName || "")}
        {...props}
      />
      <div
        styleName="eye-icon"
        onClick={handleViewPassword}
        role="presentation"
      >
        <EyeIcon />
      </div>
    </>
  );
};

FormPasswordField.propTypes = {};

export default FormPasswordField;
