import React, { useEffect, useRef } from "react";
import PT from "prop-types";
import { Link, useNavigate } from "react-router-dom";
import { PrimaryButton, DefaultButton as Button } from "../../../../components/Buttons";
import { COMPETITION_TRACKS, CHALLENGES_URL } from "../../../../constants";
import RobotHappy from "../../../../assets/icons/robot-happy.svg";
import RobotSad from "../../../../assets/icons/robot-embarassed.svg";

import styles from "./styles.scss";
import { styled as styledCss } from "@earn/utils";
const styled = styledCss(styles)

const Uploading = ({
  challengeId,
  challengeName,
  error,
  isSubmitting,
  submitDone,
  reset,
  retry,
  track,
  uploadProgress,
  back,
}) => {
  const navigate = useNavigate();
  const propsRef = useRef();
  propsRef.current = { submitDone, challengeId };

  useEffect(() => {
    return () => {
      if (propsRef.current.submitDone) {
        const backUrl = window.location.pathname;
        if (backUrl === `${CHALLENGES_URL}/${challengeId}`) {
          navigate(
            `${CHALLENGES_URL}/${propsRef.current.challengeId}?reload=true`
          );
        }
      }
    }; // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styled("container")}>
      <div className={styled("uploading")}>
        {isSubmitting && <h3>UPLOADING SUBMISSION FOR</h3>}
        {submitDone && <h3>SUBMISSION COMPLETED FOR</h3>}
        {error && <h3>ERROR SUBMITTING FOR</h3>}

        {isSubmitting && <h3>&ldquo;{challengeName}&rdquo;</h3>}
        {(submitDone || error) && (
          <Link className={styled("link")} to={`${CHALLENGES_URL}/${challengeId}`}>
            {challengeName}
          </Link>
        )}

        {(isSubmitting || submitDone) && <RobotHappy />}
        {error && <RobotSad />}

        {isSubmitting && (
          <p>
            Hey, your work is AWESOME! Please don&#39;t close this window while
            I&#39;m working, you&#39;ll lose all files!
          </p>
        )}
        {isSubmitting && !submitDone && (
          <div className={styled("progress-container")}>
            <div
              className={styled("progress-bar")}
              style={{ width: `${(100 * uploadProgress).toFixed()}%` }}
            />
          </div>
        )}

        {isSubmitting && !submitDone && (
          <p className={styled("submitting")}>
            Uploaded: {(100 * uploadProgress).toFixed()}%
          </p>
        )}
        {error && (
          <p>
            Oh, that’s embarrassing! The file couldn’t be uploaded, I’m so
            sorry.
          </p>
        )}

        {error && <div className={styled("error-msg")}>{error}</div>}
        {error && (
          <div className={styled("button-container")}>
            <Button onClick={() => reset()}>Cancel</Button>
            <PrimaryButton onClick={() => retry()}>Try Again</PrimaryButton>
          </div>
        )}
        {submitDone && !error && (
          <p>
            Thanks for participating! We’ve received your submission and will
            send you an email shortly to confirm and explain what happens next.
          </p>
        )}
        {submitDone && !error && (
          <div className={styled("button-container")}>
            {track === COMPETITION_TRACKS.DES ? (
              <span>
                <Button onClick={() => reset()}>Add Another Submission</Button>
                <PrimaryButton
                  to={`${CHALLENGES_URL}/${challengeId}/my-submissions`}
                  onClick={() => back()}
                >
                  View My Submissions
                </PrimaryButton>
              </span>
            ) : (
              <span>
                <Button onClick={() => reset()}>Submit Again</Button>
                <PrimaryButton
                  to={`${CHALLENGES_URL}/${challengeId}`}
                  onClick={() => back()}
                >
                  Back to Challenge
                </PrimaryButton>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

Uploading.defaultProps = {};

Uploading.propTypes = {
  challengeId: PT.string,
  challengeName: PT.string,
  error: PT.string,
  isSubmitting: PT.bool,
  submitDone: PT.string,
  reset: PT.func,
  retry: PT.func,
  track: PT.string,
  uploadProgress: PT.number,
  back: PT.func,
};

export default Uploading;
