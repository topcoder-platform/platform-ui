/**
 * components.page.challenge-details.FilestackFilePicker
 * <FilePicker> Component
 *
 * Description:
 *   Component for uploading a file using Filestack Picker
 *   and Drag + Drop.  Does not store the file contents in form.  Instead,
 *   uploads file to S3 storage container and sets the
 *   S3 storage details to Redux store for submission.
 */
/* eslint-env browser */

import _ from 'lodash';
import React from 'react';
import PT from 'prop-types';
import { client as filestack } from 'filestack-react';

import { Button } from '~/libs/ui';
import config from '@earn/config';
import errors from '@earn/actions/errors';
import { styled as styledCss } from "@earn/utils";

import styles from "./styles.scss";
const styled = styledCss(styles)

const { fireErrorMessage } = errors;

/**
 * FilestackFilePicker component
 */
class FilestackFilePicker extends React.Component {
  constructor(props) {
    super(props);
    this.onSuccess = this.onSuccess.bind(this);
    this.onClickPick = this.onClickPick.bind(this);
    this.onUpdateInputUrl = this.onUpdateInputUrl.bind(this);

    this.state = {
      inputUrl: '',
      invalidUrl: false,
    };
  }

  componentDidMount() {
    const {
      setFileName,
      setError,
      setDragged,
    } = this.props;

    this.filestack = filestack.init(config.FILESTACK.API_KEY);

    setFileName('');
    setError('');
    setDragged(false);
  }

  /* Called when a file is successfully stored in the S3 container */
  onSuccess(file, filePath) {
    const {
      filename,
      mimetype,
      size,
      key,
      container,
      source,
      originalPath,
    } = file;
    const {
      setFileName,
      setFilestackData,
      challengeId,
      isChallengeBelongToTopgearGroup,
    } = this.props;
    // container doesn't seem to get echoed from Drag and Drop
    const cont = container || config.FILESTACK.SUBMISSION_CONTAINER;
    // In case of url we need to submit the original url not the S3
    const fileUrl = source === 'url' ? originalPath : `https://s3.amazonaws.com/${cont}/${filePath}`;

    setFileName(filename);

    const fileStackData = {
      filename,
      challengeId,
      fileUrl,
      mimetype,
      size,
      key,
      container: cont,
    };

    if (isChallengeBelongToTopgearGroup) {
      fileStackData.fileType = 'url';
    }

    setFilestackData(fileStackData);
  }

  onClickPick() {
    const {
      setDragged,
      isChallengeBelongToTopgearGroup,
    } = this.props;
    const {
      inputUrl,
    } = this.state;

    if (!isChallengeBelongToTopgearGroup) {
      return;
    }
    if (this.isValidUrl(inputUrl)) {
      this.setState({ invalidUrl: false });
      const path = this.generateFilePath();
      const filename = inputUrl.substring(inputUrl.lastIndexOf('/') + 1);
      setDragged(false);
      this.onSuccess({
        source: 'url',
        filename,
        mimetype: '',
        size: 0,
        key: '',
        originalPath: inputUrl,
      }, path);
    } else {
      this.setState({ invalidUrl: true });
    }
  }

  onUpdateInputUrl(e) {
    this.setState({ inputUrl: e.target.value });
  }

  /* eslint-disable class-methods-use-this */
  isValidUrl(url) {
    return /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(url); /* eslint-disable-line no-useless-escape */
  }

  /**
   * Returns the path where the picked up file should be stored.
   * @return {String}
   */
  generateFilePath() {
    const { userId, challengeId } = this.props;
    return `${challengeId}-${userId}-SUBMISSION_ZIP-${Date.now()}.zip`;
  }

  render() {
    const {
      fileName,
      fileExtensions,
      title,
      error,
      dragged,
      setDragged,
      setFileName,
      setUploadProgress,
      uploadProgress,
      isChallengeBelongToTopgearGroup,
    } = this.props;

    const {
      invalidUrl,
      inputUrl,
    } = this.state;

    return (
      <div className={styled('container')}>
        <div className={styled('desc')}>
          <p>
            {title}
          </p>
        </div>
        <div
          className={styled(`file-picker ${error ? 'error' : ''} ${dragged ? 'drag' : ''}`)}
        >
          {
            !fileName && !isChallengeBelongToTopgearGroup && (
            <p>
              Drag and drop your{' '}
              {fileExtensions.join(' or ')}
              {' '}
              file here.
            </p>
            )
          }
          {
            !fileName && !isChallengeBelongToTopgearGroup && (
            <span>
              or
            </span>
            )
          }
          {
            fileName && (
            <p className={styled('file-name')}>
              {fileName}
            </p>
            )
          }
          {
            _.isNumber(uploadProgress) && uploadProgress < 100 ? (
              <p className={styled('file-name')}>
                Uploading:
                {uploadProgress}
                %
              </p>
            ) : null
          }
          {
            isChallengeBelongToTopgearGroup && (
              <div className={styled('url-input-container')}>
                {invalidUrl && (<div className={styled('invalid-url-message')}>* Invalid URL</div>)}
                <input className={styled((invalidUrl ? 'invalid' : ''))} id="name" name="name" type="text" placeholder="URL" onChange={this.onUpdateInputUrl} value={inputUrl} required />
              </div>
            )
          }
          <Button
            onClick={this.onClickPick}
            primary
            size='lg'
          >
            {isChallengeBelongToTopgearGroup ? 'Set URL' : 'SELECT A FILE'}
          </Button>
          {!isChallengeBelongToTopgearGroup && (
            <div
              onClick={() => {
                const path = this.generateFilePath();
                this.filestack.picker({
                  accept: fileExtensions,
                  fromSources: [
                    'local_file_system',
                    'googledrive',
                    'dropbox',
                    'onedrive',
                    'github',
                    'url',
                  ],
                  maxSize: 500 * 1024 * 1024,
                  onFileUploadFailed: () => setDragged(false),
                  onFileUploadFinished: (file) => {
                    setDragged(false);
                    this.onSuccess(file, path);
                  },
                  startUploadingWhenMaxFilesReached: true,
                  storeTo: {
                    container: config.FILESTACK.SUBMISSION_CONTAINER,
                    path,
                    region: config.FILESTACK.REGION,
                  },
                }).open();
              }}
              onKeyPress={() => {
                const path = this.generateFilePath();
                this.filestack.picker({
                  accept: fileExtensions,
                  fromSources: [
                    'local_file_system',
                    'googledrive',
                    'dropbox',
                    'onedrive',
                    'github',
                    'url',
                  ],
                  maxSize: 500 * 1024 * 1024,
                  onFileUploadFailed: () => setDragged(false),
                  onFileUploadFinished: (file) => {
                    setDragged(false);
                    this.onSuccess(file, path);
                  },
                  startUploadingWhenMaxFilesReached: true,
                  storeTo: {
                    container: config.FILESTACK.SUBMISSION_CONTAINER,
                    path,
                    region: config.FILESTACK.REGION,
                  },
                }).open();
              }}
              onDragEnter={() => setDragged(true)}
              onDragLeave={() => setDragged(false)}
              onDragOver={e => e.preventDefault()}
              onDrop={(e) => {
                setDragged(false);
                e.preventDefault();
                const path = this.generateFilePath();
                const filename = e.dataTransfer.files[0].name;
                if (!fileExtensions.some(ext => filename.endsWith(ext))) {
                  return fireErrorMessage('Wrong file type!', '');
                }
                setFileName(e.dataTransfer.files[0].name);
                setUploadProgress(0);
                this.filestack.upload(e.dataTransfer.files[0], {
                  onProgress: ({ totalPercent }) => {
                    setUploadProgress(totalPercent);
                  },
                  progressInterval: 1000,
                }, {
                  container: config.FILESTACK.SUBMISSION_CONTAINER,
                  path,
                  region: config.FILESTACK.REGION,
                }).then(file => this.onSuccess(file, path));
                return undefined;
              }}
              role="tab"
              className={styled('drop-zone-mask')}
              tabIndex={0}
              aria-label="Select file to upload"
            />
          )}
        </div>
        {
          error
          && (
          <div className={styled('error-container')}>
            {error}
          </div>
          )
        }
      </div>
    );
  }
}

FilestackFilePicker.defaultProps = {
  error: '',
  fileName: '',
  uploadProgress: null,
  isChallengeBelongToTopgearGroup: false,
};

/**
 * Prop Validation
 */
FilestackFilePicker.propTypes = {
  error: PT.string,
  userId: PT.string.isRequired,
  challengeId: PT.string.isRequired,
  fileName: PT.string,
  fileExtensions: PT.arrayOf(PT.string).isRequired,
  title: PT.string.isRequired,
  setError: PT.func.isRequired,
  setFileName: PT.func.isRequired,
  setUploadProgress: PT.func.isRequired,
  dragged: PT.bool.isRequired,
  setDragged: PT.func.isRequired,
  setFilestackData: PT.func.isRequired,
  uploadProgress: PT.number,
  isChallengeBelongToTopgearGroup: PT.bool,
};

export default FilestackFilePicker;
