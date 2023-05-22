/**
 * components.page.challenge-details.Uploading
 * <Uploading> Component
 *
 * Description:
 *   Full-page component that shows upload progress and informs the user
 *   if there were errors, or that the submission was completed successfully.
 */
import React from 'react';
import PT from 'prop-types';

import { ReactComponent as UploadSuccess } from '@earn/assets/images/upload-success.svg';
import { ReactComponent as UploadLoading } from '@earn/assets/images/upload-loading.svg';
import { ReactComponent as UploadFail } from '@earn/assets/images/upload-fail.svg';
import { COMPETITION_TRACKS } from '@earn/utils/tc';
import { styled as styledCss } from "@earn/utils";
import { LinkButton, Button } from '~/libs/ui';

import styles from "./styles.scss";
const styled = styledCss(styles)

const Uploading = ({
  challengeId,
  challengeName,
  challengesUrl,
  error,
  isSubmitting,
  submitDone,
  reset,
  retry,
  track,
  uploadProgress,
  back,
}) => (
  <div className={styled('container')}>
    <div className={styled('uploading')}>
      {
         isSubmitting
           && (
           <h3>
             UPLOADING SUBMISSION FOR
           </h3>
           )
       }
      {
         submitDone
         && (
         <h3>
           UPLOADING COMPLETED FOR
         </h3>
         )
       }
      {
         error
           && (
           <h3>
             ERROR SUBMITTING FOR
           </h3>
           )
       }
      {
         isSubmitting
           && (
           <h3>
             &ldquo;
             {challengeName }
             &rdquo;
           </h3>
           )
       }
      {
         (submitDone || error)
           && (
           <h4
             className={styled('link')}
           >
             {challengeName}
           </h4>
           )
       }
      {
         (isSubmitting && !submitDone) && <div className={styled('animate')}><UploadLoading /></div>
       }
      {
         (!isSubmitting && submitDone) && <UploadSuccess />
       }
      {
         error
           && <UploadFail />
       }
      {
         isSubmitting
           && (
           <p>
             Hey, your work is AWESOME! Please don&#39;t close this window while uploading,
             Your progress will be lost.
           </p>
           )
       }
      {
         isSubmitting && !submitDone
         && (
         <div className={styled('progress-container')}>
           <div className={styled('progress-bar')} style={{ width: `${(100 * uploadProgress).toFixed()}%` }} />
         </div>
         )
       }
      {
         isSubmitting && !submitDone
           && (
           <p className={styled('submitting')}>
             Uploading:
             {(100 * uploadProgress).toFixed()}
             %
           </p>
           )
       }
      {
         error
           && (
           <p>
             Oh, that’s embarrassing! The file couldn’t be
             uploaded.
           </p>
           )
       }
      {
         error
           && (
           <div className={styled('error-msg')}>
             {error}
           </div>
           )
       }
      {
         error
           && (
           <div className={styled('button-container')}>
             <Button
               onClick={() => reset()}
               secondary
               size='lg'
             >
               Cancel
             </Button>
             <Button
               primary
               onClick={() => retry()}
               size='lg'
             >
               Try Again
             </Button>
           </div>
           )
       }
      {
         submitDone && !error
           && (
           <p>
             Thanks for participating! We’ve received your submission and will
             send you an email shortly to confirm and explain what happens next.
           </p>
           )
       }
      {
         submitDone && !error
           && (
           <div className={styled('button-container')}>
             { track === COMPETITION_TRACKS.DES ? (
               <span>
                 <Button
                   onClick={() => reset()}
                   secondary
                   size='lg'
                 >
                   Add Another Submission
                 </Button>
                 <LinkButton
                   primary
                   size='lg'
                   to={`${challengesUrl}/${challengeId}/my-submissions`}
                   onClick={() => back()}
                 >
                   My Submissions
                 </LinkButton>
               </span>
             ) : (
               <React.Fragment>
                 <Button
                   onClick={() => reset()}
                   secondary
                   size='lg'
                 >
                   ADD SUBMISSION
                 </Button>
                 <LinkButton
                   primary
                   to={`${challengesUrl}/${challengeId}/my-submissions`}
                   onClick={() => back()}
                   size='lg'
                 >
                   MY SUBMISSIONS
                 </LinkButton>
               </React.Fragment>
             )}
           </div>
           )
       }
    </div>
  </div>
);

/**
  * Prop Validation
  */
Uploading.propTypes = {
  challengeId: PT.string.isRequired,
  challengeName: PT.string.isRequired,
  challengesUrl: PT.string.isRequired,
  isSubmitting: PT.bool.isRequired,
  submitDone: PT.bool.isRequired,
  reset: PT.func.isRequired,
  error: PT.string.isRequired,
  track: PT.string.isRequired,
  retry: PT.func.isRequired,
  uploadProgress: PT.number.isRequired,
  back: PT.func.isRequired,
};

export default Uploading;