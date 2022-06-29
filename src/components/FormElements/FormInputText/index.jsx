/**
 * FormInputText
 *
 * Form Input Type=text
 */
import cn from "classnames";
import React from "react";
import styles from "./styles.module.scss";

const FormInputText = ({ styleName, ...props }) => {
  return (
    <input
      type="text"
      className={cn(styles["form-input-text"], !!styleName ? styles[styleName] : undefined)}
      {...props}
    />
  );
};

FormInputText.propTypes = {};

export default FormInputText;
