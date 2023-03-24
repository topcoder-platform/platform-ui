import React from "react";
import PT from "prop-types";
import Dropzone from "react-dropzone";
import Button from "components/Button";

import "./styles.scss";

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
            styleName={`container ${errorMsg ? "hasError" : ""}`}
            {...getRootProps()}
          >
            <input {...getInputProps(inputOptions)} />
            {fileName ? (
              <p styleName="infoText withFile">{fileName}</p>
            ) : (
              <p styleName="infoText">
                {infoText}
                <span>OR</span>
              </p>
            )}
            <Button>{buttonText}</Button>
          </section>
        )}
      </Dropzone>
      {errorMsg ? <span styleName="errorMessage">{errorMsg}</span> : null}
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
