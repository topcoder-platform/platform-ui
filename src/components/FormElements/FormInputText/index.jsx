/**
 * FormInputText
 *
 * Form Input Type=text
 */
import cn from "classnames";
import React from "react";
import styles from "./styles.module.scss";

const FormInputText = ({ styledName, ...props }) => {
  return (
    <input
      type="text"
      className={cn(styles["form-input-text"], !!styledName ? styles[styledName] : undefined)}
      {...props}
    />
  );
};

FormInputText.propTypes = {};

export default FormInputText;
