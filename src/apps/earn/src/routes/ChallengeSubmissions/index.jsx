import { useSelector } from "react-redux";
import { Route, Routes, useParams } from "react-router-dom";
import { useRef } from "react";

import { lazyLoad } from "~/libs/core";

import ErrorMessage from '../../components/ErrorMessage'
import { clearErrorMesssage } from "../../utils/logger";

const Submission = lazyLoad(
  () => import('../../containers/Submission'),
)

const SubmissionManagement = lazyLoad(
  () => import('../../containers/SubmissionManagement'),
)

export const ChallengeSubmissions = (props) => {
  const alert = useSelector((state) => state.errors.alerts[0]);
  const { auth } = props;
  const { challengeId } = useParams()
  const init = useRef(false)

  return (
    <>
      <Routes>
        <Route exact element={<Submission {...props} challengeId={challengeId}/>} path='submit' />
        <Route exact element={<SubmissionManagement {...props} challengeId={challengeId}/>} path='my-submissions' />
      </Routes>
      <div id="tooltips-container-id" />
      {alert && (
        <ErrorMessage
          title={alert.title}
          details={alert.details}
          onOk={() => clearErrorMesssage()}
        />
      )}
    </>
  );
};

