/* eslint jsx-a11y/no-static-element-interactions:0 */
/**
 * components.page.challenge-details.Submit
 * <Submit> Component
 *
 * Description:
 *   Page that is shown when a user is trying to submit a Submission.
 *   Allows user to upload Submission.zip file using a Filestack plugin.
 */
/* eslint-env browser */

import React, { useEffect, useRef } from "react";
import PT from "prop-types";
import _ from "lodash";

import { UiButton } from "~/libs/ui";

import config from '../../../../config';
import LoadingIndicator from "../../../../components/LoadingIndicator";
import { COMPETITION_TRACKS } from "../../../../constants";
import FilePicker from "../FilePicker";
import Uploading from "../Uploading";
import * as util from "../../../../utils/submission";

import styles from "./styles.scss";
import { styled as styledCss } from "@earn/utils";
const styled = styledCss(styles)

const SubmitForm = ({
  challengeId,
  challengeName,
  phases,
  track,
  agreed,
  filePickers,
  submissionFilestackData,
  userId,
  groups,
  communityList,
  isCommunityListLoaded,

  errorMsg,
  isSubmitting,
  submitDone,
  uploadProgress,

  resetForm,
  setAgreed,
  setFilePickerError,
  setFilePickerFileName,
  setFilePickerUploadProgress,
  setFilePickerDragged,
  setSubmissionFilestackData,
  submit,
}) => {
    console.log('HEREEEEEE2', submissionFilestackData);
  const propsRef = useRef();
  propsRef.current = { resetForm };

  const checkboxRef = useRef();

  useEffect(() => {
    return () => {
      propsRef.current.resetForm();
    };
  }, []);

  const getFormData = () => {
    const subType = util.getSubmissionDetail({ phases });

    const formData = new FormData();
    formData.append("type", subType);
    formData.append("url", submissionFilestackData.fileUrl);
    formData.append("memberId", userId || "");
    formData.append("challengeId", challengeId);

    if (submissionFilestackData.fileType) {
      formData.append("fileType", submissionFilestackData.fileType);
    }

    return formData;
  };

  const reset = () => {
    setAgreed(false);
    resetForm();
  };

  /* User has clicked to go retry the submission after an error */
  const retry = () => {
    submit(getFormData());
  };

  /* User has clicked to go back to a new submission after a successful submit */
  const back = () => {
    resetForm();
  };

  /* User has clicked submit, prepare formData for the V2 API and start upload */
  const handleSubmit = (e) => {
    e.preventDefault();
    submit(getFormData());
  };

  const handleAgree = () => {
    checkboxRef.current.checked = !checkboxRef.current.checked;
    setAgreed(checkboxRef.current.checked);
  };

  const id = "file-picker-submission";

  const isLoadingCommunitiesList = !isCommunityListLoaded;
  const isChallengeBelongToTopgearGroup = util.isChallengeBelongToTopgearGroup(
    { groups },
    communityList
  );

  // Find the state for FilePicker with id of 1 or assign default values
  const fpState = filePickers.find((fp) => fp.id === id) || {
    id,
    error: "",
    fileName: "",
    dragged: false,
    uploadProgress: 0,
  };

  const isUploadingState = !(!isSubmitting && !submitDone && !errorMsg);
  if (isUploadingState) {
    return (
      <Uploading
        challengeId={challengeId}
        challengeName={challengeName}
        error={errorMsg}
        isSubmitting={isSubmitting}
        submitDone={submitDone}
        reset={reset}
        retry={retry}
        track={track}
        uploadProgress={uploadProgress}
        back={back}
      />
    );
  }

  return (
    <div className={styled("design-content")}>
      <form
        method="POST"
        name="submitForm"
        encType="multipart/form-data"
        id="submit-form"
        onSubmit={handleSubmit}
      >
        <div className={styled("row")}>
          {/* Left */}
          <div className={styled("left")}>
            <h2>{isChallengeBelongToTopgearGroup ? "URL" : "FILES"}</h2>
            <p>
              Please follow the instructions on the Challenge Details page
              regarding what your submission should contain and how it should be
              organized.
            </p>
          </div>
          {/* Right */}
          <div className={styled("right")}>
            {/* Hints */}
            <div className={styled("submission-hints")}>
              {/* Dev */}
              {track === COMPETITION_TRACKS.DEV && (
                <div>
                  {isChallengeBelongToTopgearGroup ? (
                    <p>Enter the URL to your submission.</p>
                  ) : (
                    <p>Upload your entire submission as a single zip file.</p>
                  )}
                </div>
              )}
              {/* Des */}
              {track === COMPETITION_TRACKS.DES && (
                <div>
                  <ol>
                    <li>
                      Place your submission files into a
                      &quot;Submission.zip&quot; file.
                    </li>
                    <li>
                      Place all of your source files into a
                      &quot;Source.zip&quot; file.
                    </li>
                    <li>Create a JPG preview file.</li>
                    <li>
                      Create a declaration.txt file. Document fonts, stock art
                      and icons used.
                    </li>
                    <li>
                      Zip the 4 files from the previous steps into a single zip
                      file and upload below.
                    </li>
                  </ol>
                  <p>
                    For detailed information on packaging your submission,
                    please visit the &zwnj;
                    <a
                      href="https://help.topcoder.com/hc/en-us/articles/
                        219122667-Formatting-Your-Submission-for-Design-Challenges"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      help center.
                    </a>
                  </p>
                </div>
              )}
            </div>
            {/* File Picker */}
            <div className={styled("file-picker-container")}>
              {isLoadingCommunitiesList ? (
                <LoadingIndicator />
              ) : (
                <FilePicker
                  mandatory
                  title={
                    isChallengeBelongToTopgearGroup ? "" : "Submission Upload"
                  }
                  fileExtensions={[".zip"]}
                  challengeId={challengeId}
                  error={fpState.error}
                  // Bind the set functions to the FilePicker s ID
                  setError={_.partial(setFilePickerError, id)}
                  fileName={fpState.fileName}
                  uploadProgress={fpState.uploadProgress}
                  setFileName={_.partial(setFilePickerFileName, id)}
                  setUploadProgress={_.partial(setFilePickerUploadProgress, id)}
                  dragged={fpState.dragged}
                  setDragged={_.partial(setFilePickerDragged, id)}
                  setFilestackData={setSubmissionFilestackData}
                  userId={userId}
                  isChallengeBelongToTopgearGroup={
                    isChallengeBelongToTopgearGroup
                  }
                />
              )}
            </div>
            {/* Support */}
            {isChallengeBelongToTopgearGroup ? (
              <p>
                If you are having trouble submitting, please send your
                submission to &zwnj;
                <a href="mailto://support@topcoder.com">support@topcoder.com</a>
              </p>
            ) : (
              <p>
                If you are having trouble uploading your file, please send your
                submission to &zwnj;
                <a href="mailto://support@topcoder.com">support@topcoder.com</a>
              </p>
            )}
          </div>
        </div>
        {/* Agree */}
        <div className={styled("row agree")}>
          <p>
            Submitting your files means you hereby agree to the &zwnj;
            <a
              href={config.URL.INFO.TOPCODER_TERMS}
              rel="noreferrer noopener"
              target="_blank"
            >
              Topcoder terms of use
            </a>
            &zwnj; and to the extent your uploaded file wins a topcoder
            Competition, you hereby agree to assign, grant and transfer to
            Topcoder all right and title in and to the Winning Submission (as
            further described in the terms of use).
          </p>
          <div className={styled("tc-checkbox")}>
            <input
              type="checkbox"
              ref={checkboxRef}
              id="agree"
              aria-label="I understand and agree"
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <label htmlFor="agree">
              <input type="hidden" />
            </label>
            <div className={styled("tc-checkbox-label")} onClick={handleAgree}>
              I UNDERSTAND AND AGREE
            </div>
          </div>
          <UiButton
            primary
            size='lg'
            type="submit"
            disabled={
              !agreed ||
              !!fpState.error ||
              !fpState.fileName ||
              fpState.uploadProgress < 100
            }
          >
            Submit
          </UiButton>
        </div>
      </form>
    </div>
  );
};

SubmitForm.defaultProps = {};

SubmitForm.propTypes = {
  challengeId: PT.string,
  challengeName: PT.string,
  phases: PT.arrayOf(PT.shape()),
  track: PT.string,
  agreed: PT.bool,
  filePickers: PT.arrayOf(PT.shape()),
  submissionFilestackData: PT.shape(),
  userId: PT.number,
  groups: PT.arrayOf(PT.shape()),
  communityList: PT.arrayOf(PT.shape()),
  isCommunityListLoaded: PT.bool,

  errorMsg: PT.string,
  isSubmitting: PT.bool,
  submitDone: PT.bool,
  uploadProgress: PT.number,

  resetForm: PT.func,
  setAgreed: PT.func,
  setFilePickerError: PT.func,
  setFilePickerFileName: PT.func,
  setFilePickerUploadProgress: PT.func,
  setFilePickerDragged: PT.func,
  setSubmissionFilestackData: PT.func,
  submit: PT.func,
};

export default SubmitForm;
