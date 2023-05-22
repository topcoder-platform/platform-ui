/**
 * components.page.challenge-details.Submit
 * <Submit> Component
 *
 * Description:
 *   Page that is shown when a user is trying to submit a Submission.
 *   Allows user to upload Submission.zip file using a Filestack plugin.
 */
/* eslint-env browser */

import _ from 'lodash';
import React from 'react';
import PT from 'prop-types';

import config from '@earn/config';
import { COMPETITION_TRACKS } from '@earn/utils/tc';
import { styled as styledCss } from "@earn/utils";
import { Button, LoadingCircles } from '~/libs/ui';

import FilestackFilePicker from '../FilestackFilePicker';
import Uploading from '../Uploading';

import styles from "./styles.scss";

const styled = styledCss(styles)

/**
 * Submissions Page shown to develop challengers.
 */
class Submit extends React.Component {
  constructor(props) {
    super(props);

    this.reset = this.reset.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.retry = this.retry.bind(this);
    this.back = this.back.bind(this);
    this.getFormData = this.getFormData.bind(this);
  }

  componentWillUnmount() {
    const { resetForm } = this.props;
    resetForm();
  }

  getFormData() {
    const {
      submissionFilestackData: sub,
      challengeId,
      userId,
    } = this.props;

    const subType = this.getSubDetails();

    const formData = new FormData();
    formData.append('url', sub.fileUrl);
    formData.append('type', subType);
    formData.append('memberId', userId);
    formData.append('challengeId', challengeId);
    if (sub.fileType) {
      formData.append('fileType', sub.fileType);
    }
    return formData;
  }

  // returns both submission type and phase id
  getSubDetails() {
    const {
      phases,
    } = this.props;
    const checkpoint = _.find(phases, {
      name: 'Checkpoint Submission',
    });
    const submission = _.find(phases, {
      name: 'Submission',
    });
    const finalFix = _.find(phases, {
      name: 'Final Fix',
    });
    let subType;

    // Submission type logic
    if (checkpoint && checkpoint.isOpen) {
      subType = 'Checkpoint Submission';
    } else if (checkpoint && !checkpoint.isOpen && submission && submission.isOpen) {
      subType = 'Contest Submission';
    } else if (finalFix && finalFix.isOpen) {
      subType = 'Studio Final Fix Submission';
    } else {
      subType = 'Contest Submission';
    }

    return subType;
  }

  reset() {
    const { resetForm, setAgreed } = this.props;
    setAgreed(false);
    resetForm();
  }

  /* User has clicked submit, prepare formData for the V2 API and start upload */
  handleSubmit(e) {
    const { submitForm } = this.props;
    e.preventDefault();
    submitForm(this.getFormData());
  }

  /* User has clicked to go retry the submission after an error */
  retry() {
    const { submitForm } = this.props;
    submitForm(this.getFormData());
  }

  /* User has clicked to go back to a new submission after a successful submit */
  back() {
    const { resetForm } = this.props;
    resetForm();
  }

  render() {
    const {
      userId,
      challengeId,
      challengeName,
      challengesUrl,
      communitiesList,
      errorMsg,
      isSubmitting,
      submitDone,
      track,
      uploadProgress,
      agreed,
      setAgreed,
      filePickers,
      setFilePickerError,
      setFilePickerFileName,
      setFilePickerUploadProgress,
      setFilePickerDragged,
      setSubmissionFilestackData,
      submitForm,
      groups,
    } = this.props;

    const id = 'file-picker-submission';

    let isLoadingCommunitiesList = false;
    let isChallengeBelongToTopgearGroup = false;
    // check if challenge belong to any group
    if (!_.isEmpty(groups)) {
      // check if communitiesList is loaded
      if (communitiesList.timestamp > 0) {
        const topGearCommunity = _.find(communitiesList.data, { mainSubdomain: 'topgear' });
        if (topGearCommunity) {
          // check the group info match with group list
          _.forOwn(groups, (value) => {
            if (value && _.includes(topGearCommunity.groupIds, value)) {
              isChallengeBelongToTopgearGroup = true;
              return false;
            }
            return true;
          });
        }
      } else {
        isLoadingCommunitiesList = true;
      }
    }

    // Find the state for FilePicker with id of 1 or assign default values
    const fpState = filePickers.find(fp => fp.id === id) || ({
      id,
      error: '',
      fileName: '',
      dragged: false,
    });

    const disabled = !agreed || !!fpState.error || !fpState.fileName;

    return (
      (!isSubmitting && !submitDone && !errorMsg) ? (
        <div className={styled('design-content')}>
          <form
            method="POST"
            name="submitForm"
            encType="multipart/form-data"
            id="submit-form"
            onSubmit={this.handleSubmit}
          >
            <div className={styled('row')}>
              <div className={styled('left')}>
                <h2>
                  { isChallengeBelongToTopgearGroup ? 'URL' : 'SUBMISSION UPLOAD'}
                </h2>
                <p className={styled('note')}>
                  Please follow the instructions on the Challenge Details page regarding
                  what your submission should contain and how it should be organized.
                </p>
                {/* eslint-disable-next-line max-len */}
                { track === COMPETITION_TRACKS.DEV || track === COMPETITION_TRACKS.DS || track === COMPETITION_TRACKS.QA ? (
                  <p className={styled('additional-note')}>
                    Upload your entire submission as a single zip file. If you are having
                    trouble uploading your file, please send your submission to <a href="mailto:support@topcoder.com">support@topcoder.com</a>
                  </p>
                ) : null }
                <div className={styled('submission-hints')}>
                  { track === COMPETITION_TRACKS.DEV ? (
                    <div>
                      {!!isChallengeBelongToTopgearGroup
                      && (<p>Enter the URL to your submission.</p>)}
                    </div>
                  ) : null }
                  { track === COMPETITION_TRACKS.DES ? (
                    <div className={styled('additional-note')}>
                      <ol>
                        <li>Place your submission files into a &quot;Submission.zip&quot; file.</li>
                        <li>Place all of your source files into a &quot;Source.zip&quot; file.</li>
                        <li>Create a .jpg preview file</li>
                        {/* eslint-disable-next-line max-len */}
                        <li>Create a “Declaration.txt” file that documents all fonts, stock art, and icons used</li>
                        {/* eslint-disable-next-line max-len */}
                        <li>Zip the 4 files from the previous steps into a single .zip file and upload.</li>
                      </ol>
                      <p>
                        For detailed information on packaging your submissions, please visit the
                        &nbsp;
                        <a
                          href="https://help.topcoder.com/hc/en-us/articles/
                            219122667-Formatting-Your-Submission-for-Design-Challenges"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Help Center.
                        </a>
                        &nbsp;
                        If you are having trouble uploading your file, please send your submission to <a href="mailto:support@topcoder.com">support@topcoder.com</a>
                      </p>
                    </div>
                  ) : null }
                </div>
              </div>
              <div className={styled('right')}>
                <div className={styled('file-picker-container')}>
                  { isLoadingCommunitiesList ? (<LoadingCircles />) : (
                    <FilestackFilePicker
                      mandatory
                      fileExtensions={['.zip']}
                      id={id}
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
                      submitForm={submitForm}
                      isChallengeBelongToTopgearGroup={isChallengeBelongToTopgearGroup}
                    />
                  )}
                </div>
              </div>
            </div>
            <hr className={styled('hr')} />
            <div className={styled('row agree')}>
              <p>
                Submitting your files means you hereby agree to the
                &zwnj;
                <a
                  href={config.URL.INFO.TOPCODER_TERMS}
                  rel="noreferrer noopener"
                  target="_blank"
                >
                  Topcoder terms of use
                </a>
                &zwnj;
                and to the extent your uploaded file wins a topcoder Competition,
                you hereby assign, grant and transfer and agree to assign, grant and
                transfer to topcoder all right and title in and to the Winning Submission
                (as further described in the terms of use).
              </p>
              <div className={styled('tc-checkbox')}>
                <input
                  type="checkbox"
                  id="agree"
                  aria-label="I understand and agree"
                  onChange={e => setAgreed(e.target.checked)}
                />
                <label htmlFor="agree">
                  <input type="hidden" />
                </label>
                <div className={styled('tc-checkbox-label')}>
                  I understand and agree
                </div>
              </div>
            </div>
            <hr className={styled('hr')} />
            <div className={styled('submitArea')}>
              <Button
                primary
                type="submit"
                disabled={disabled}
                size='lg'
              >
                SUBMIT
              </Button>
            </div>
          </form>
        </div>
      )
        : (
          <Uploading
            challengeId={challengeId}
            challengeName={challengeName}
            challengesUrl={challengesUrl}
            error={errorMsg}
            isSubmitting={isSubmitting}
            submitDone={submitDone}
            reset={this.reset}
            retry={this.retry}
            track={track}
            uploadProgress={uploadProgress}
            back={this.back}
          />
        )
    );
  }
}

Submit.defaultProps = {
  errorMsg: '',
};

/* Reusable prop validation for Filestack data objects */
const filestackDataProp = PT.shape({
  filename: PT.string.isRequired,
  mimetype: PT.string.isRequired,
  size: PT.number.isRequired,
  key: PT.string.isRequired,
  container: PT.string.isRequired,
  challengeId: PT.string.isRequired,
  fileUrl: PT.string.isRequired,
  fileType: PT.string,
});

/**
 * Prop Validation
 */
Submit.propTypes = {
  phases: PT.arrayOf(PT.object).isRequired,
  userId: PT.string.isRequired,
  challengeId: PT.string.isRequired,
  challengeName: PT.string.isRequired,
  challengesUrl: PT.string.isRequired,
  communitiesList: PT.shape({
    data: PT.arrayOf(PT.shape({
      challengeFilter: PT.shape(),
      communityId: PT.string.isRequired,
    })).isRequired,
    loadingUuid: PT.string.isRequired,
    timestamp: PT.number.isRequired,
  }).isRequired,
  groups: PT.arrayOf(PT.shape()).isRequired,
  isSubmitting: PT.bool.isRequired,
  submitDone: PT.bool.isRequired,
  errorMsg: PT.string,
  submitForm: PT.func.isRequired,
  resetForm: PT.func.isRequired,
  track: PT.string.isRequired,
  uploadProgress: PT.number.isRequired,
  setAgreed: PT.func.isRequired,
  agreed: PT.bool.isRequired,
  filePickers: PT.arrayOf(PT.shape({
    id: PT.string.isRequired,
    error: PT.string.isRequired,
    fileName: PT.string.isRequired,
  }).isRequired).isRequired,
  setFilePickerError: PT.func.isRequired,
  setFilePickerFileName: PT.func.isRequired,
  setFilePickerUploadProgress: PT.func.isRequired,
  setFilePickerDragged: PT.func.isRequired,
  setSubmissionFilestackData: PT.func.isRequired,
  submissionFilestackData: filestackDataProp.isRequired,
};

export default Submit;