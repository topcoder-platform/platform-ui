import React from "react";
import PT from "prop-types";
import Dropzone from "react-dropzone";

import { Button } from "~/libs/ui";

import styles from "./styles.scss";

/**
 * FilestackFilePicker component
 */
function ResumeFilePicker({
  onFilePick,
  buttonText,
  infoText,
  options,
  errorMsg,
  inputOptions,
  file,
}) {
  let fileName = file ? file.name : null;
  return (
    <>
      <Dropzone
        onDrop={(acceptedFiles) => {
          fileName = acceptedFiles[0].name;
          onFilePick(acceptedFiles);
        }}
        {...options}
      >
        {({ getRootProps, getInputProps }) => (
          <section
            className={[styles.container, styles[`container ${errorMsg ? "hasError" : ""}`]].join(" ")}
            {...getRootProps()}
          >
            <input {...getInputProps(inputOptions)} />
            {fileName ? (
              <p className={[styles.infoText, styles.withFile].join(" ")}>{fileName}</p>
            ) : (
              <p className={styles.infoText}>
                {infoText}
                <span>OR</span>
              </p>
            )}
            <Button secondary size='md'>{buttonText}</Button>
          </section>
        )}
      </Dropzone>
      {errorMsg ? <span className={styles.errorMessage}>{errorMsg}</span> : null}
    </>
  );
}

ResumeFilePicker.defaultProps = {
  infoText: "",
  btnText: "SELECT A FILE",
  options: {},
  errorMsg: "",
  inputOptions: {},
  file: null,
};

/**
 * Prop Validation
 */
ResumeFilePicker.propTypes = {
  infoText: PT.string,
  btnText: PT.string,
  onFilePick: PT.func.isRequired,
  options: PT.shape(),
  errorMsg: PT.string,
  inputOptions: PT.shape(),
  file: PT.shape(),
};

export default ResumeFilePicker;
