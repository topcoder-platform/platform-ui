import { useSelector } from "react-redux";
import { Route, Routes } from "react-router-dom";

import { lazyLoad } from "~/libs/core";

import ErrorMessage from '../../components/ErrorMessage'
import { clearErrorMesssage } from "../../utils/logger";

const Submission = lazyLoad(
  () => import('../../containers/Submission'),
)

const SubmissionManagement = lazyLoad(
  () => import('../../containers/SubmissionManagement'),
)


export const ChallengeSubmissions = () => {
  const alert = useSelector((state) => state.errors.alerts[0]);
    
  return (
    <>
      <Routes>
        <Route exact element={<Submission />} path='submit' />
        <Route exact element={<SubmissionManagement />} path='my-submissions' />
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

