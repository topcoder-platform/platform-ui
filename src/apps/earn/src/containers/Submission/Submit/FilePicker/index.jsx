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

import { useEffect, useState, useRef } from "react";
import PT from "prop-types";
import _ from "lodash";
import { client as filestack } from "filestack-react";

import { fireErrorMessage } from "../../../../utils/logger";
import config from "../../../../config";
import * as util from "../../../../utils/submission";

import styles from "./styles.scss";
import { styled as styledCss } from "@earn/utils";
import { UiButton } from "~/libs/ui";
const styled = styledCss(styles)

const FilePicker = ({
  mandatory,
  title,
  fileExtensions,
  challengeId,
  error,
  setError,
  fileName,
  uploadProgress,
  setFileName,
  setUploadProgress,
  dragged,
  setDragged,
  setFilestackData,
  userId,
  isChallengeBelongToTopgearGroup,
}) => {
  const propsRef = useRef();
  propsRef.current = { setFileName, setError, setDragged };

  const [inputUrl, setInputUrl] = useState("");
  const [invalidUrl, setInvalidUrl] = useState(false);
  const filestackRef = useRef();

  useEffect(() => {
    filestackRef.current = filestack.init(config.FILESTACK.API_KEY);

    propsRef.current.setFileName("");
    propsRef.current.setError("");
    propsRef.current.setDragged(false);
  }, []);

  const onSuccess = (file, filePath) => {
    const {
      filename,
      mimetype,
      size,
      key,
      container,
      source,
      originalPath,
    } = file;
    // container doesn't seem to get echoed from Drag and Drop
    const cont = container || config.FILESTACK.SUBMISSION_CONTAINER;
    // In case of url we need to submit the original url not the S3
    const fileUrl =
      source === "url"
        ? originalPath
        : `https://s3.amazonaws.com/${cont}/${filePath}`;

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
      fileStackData.fileType = "url";
    }

    setFilestackData(fileStackData);
  };

  /**
   * Returns the path where the picked up file should be stored.
   * @return {String}
   */
  const generateFilePath = () => {
    return `${challengeId}-${userId}-SUBMISSION_ZIP-${Date.now()}.zip`;
  };

  const onClickPick = () => {
    if (!isChallengeBelongToTopgearGroup) {
      return;
    }

    if (util.isValidUrl(inputUrl)) {
      setInvalidUrl(false);
      const path = generateFilePath();
      const filename = inputUrl.substring(inputUrl.lastIndexOf("/") + 1);
      setDragged(false);
      onSuccess(
        {
          source: "url",
          filename,
          mimetype: "",
          size: 0,
          key: "",
          originalPath: inputUrl,
        },
        path
      );
    } else {
      setInvalidUrl(true);
    }
  };

  const onUpdateInputUrl = (e) => {
    setInputUrl(e.target.value);
  };

  return (
    <div className={styled("container")}>
      <div className={styled("desc")}>
        <p>{title}</p>
        {mandatory && <p className={styled("mandatory")}>*mandatory</p>}
      </div>

      <div
        className={styled(`file-picker ${error ? "error" : ""} ${
          dragged ? "drag" : ""
        }`)}
      >
        {!fileName && !isChallengeBelongToTopgearGroup && (
          <p>
            Drag and drop your
            {fileExtensions.join(" or ")} file here.
          </p>
        )}
        {!fileName && !isChallengeBelongToTopgearGroup && <span>or</span>}
        {fileName && <p className={styled("file-name")}>{fileName}</p>}
        {_.isNumber(uploadProgress) && uploadProgress < 100 && (
          <p className={styled("file-name")}>Uploading: {uploadProgress}%</p>
        )}
        {isChallengeBelongToTopgearGroup && (
          <div className={styled("url-input-container")}>
            {invalidUrl && (
              <div className={styled("invalid-url-message")}>* Invalid URL</div>
            )}
            <input
              className={styled(invalidUrl ? "invalid" : "")}
              id="name"
              name="name"
              type="text"
              placeholder="URL"
              onChange={onUpdateInputUrl}
              value={inputUrl}
              required
            />
          </div>
        )}
        <UiButton primary size='lg' onClick={onClickPick}>
          {isChallengeBelongToTopgearGroup ? "Set URL" : "Pick a File"}
        </UiButton>

        {!isChallengeBelongToTopgearGroup && (
          <div
            onClick={() => {
              const path = generateFilePath();
              filestackRef.current
                .picker({
                  accept: fileExtensions,
                  fromSources: [
                    "local_file_system",
                    "googledrive",
                    "dropbox",
                    "onedrive",
                    "github",
                    "url",
                  ],
                  maxSize: 500 * 1024 * 1024,
                  onFileUploadFailed: () => setDragged(false),
                  onFileUploadFinished: (file) => {
                    setDragged(false);
                    onSuccess(file, path);
                  },
                  startUploadingWhenMaxFilesReached: true,
                  storeTo: {
                    container: config.FILESTACK.SUBMISSION_CONTAINER,
                    path,
                    region: config.FILESTACK.REGION,
                  },
                })
                .open();
            }}
            onKeyPress={() => {
              const path = generateFilePath();
              filestackRef.current
                .picker({
                  accept: fileExtensions,
                  fromSources: [
                    "local_file_system",
                    "googledrive",
                    "dropbox",
                    "onedrive",
                    "github",
                    "url",
                  ],
                  maxSize: 500 * 1024 * 1024,
                  onFileUploadFailed: () => setDragged(false),
                  onFileUploadFinished: (file) => {
                    setDragged(false);
                    onSuccess(file, path);
                  },
                  startUploadingWhenMaxFilesReached: true,
                  storeTo: {
                    container: config.FILESTACK.SUBMISSION_CONTAINER,
                    path,
                    region: config.FILESTACK.REGION,
                  },
                })
                .open();
            }}
            onDragEnter={() => setDragged(true)}
            onDragLeave={() => setDragged(false)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              setDragged(false);
              e.preventDefault();
              const path = generateFilePath();
              const filename = e.dataTransfer.files[0].name;
              if (!fileExtensions.some((ext) => filename.endsWith(ext))) {
                fireErrorMessage("Wrong file type!", "");
                return;
              }
              setFileName(e.dataTransfer.files[0].name);
              setUploadProgress(0);
              filestackRef.current
                .upload(
                  e.dataTransfer.files[0],
                  {
                    onProgress: ({ totalPercent }) => {
                      setUploadProgress(totalPercent);
                    },
                    progressInterval: 1000,
                  },
                  {
                    container: config.FILESTACK.SUBMISSION_CONTAINER,
                    path,
                    region: config.FILESTACK.REGION,
                  }
                )
                .then((file) => onSuccess(file, path));
            }}
            role="tab"
            className={styled("drop-zone-mask")}
            tabIndex={0}
            aria-label="Select file to upload"
          />
        )}
      </div>

      {error && <div className={styled("error-container")}>{error}</div>}
    </div>
  );
};

FilePicker.defaultProps = {};

FilePicker.propTypes = {
  mandatory: PT.bool,
  title: PT.string,
  fileExtensions: PT.arrayOf(PT.string),
  challengeId: PT.string,
  error: PT.string,
  setError: PT.func,
  fileName: PT.string,
  uploadProgress: PT.number,
  setFileName: PT.func,
  setUploadProgress: PT.func,
  dragged: PT.bool,
  setDragged: PT.func,
  setFilestackData: PT.func,
  userId: PT.number,
  isChallengeBelongToTopgearGroup: PT.bool,
};

export default FilePicker;
