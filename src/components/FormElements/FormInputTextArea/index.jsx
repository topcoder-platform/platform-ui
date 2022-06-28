/**
 * FormInputTextArea
 *
 * Form Input textarea
 */
import cn from "classnames";
import React from "react";
import styles from "./styles.module.scss";

const FormInputTextArea = ({ styleName, ...props }) => {
  return (
    <textarea
      className={cn(styles["form-input-textarea"], !!styleName ? styles[styleName] : undefined)}
      {...props}
      cols={10}
      value={!!props.value || ''}
    />
  );
};

FormInputTextArea.propTypes = {};

export default FormInputTextArea;
