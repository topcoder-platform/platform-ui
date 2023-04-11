import qs from "qs";
import _ from "lodash";
import api from "./api";

import * as util from "../utils/api";

async function submit(data, onProgress) {
  const url = "/submissions/";
  return api
    .upload(
      url,
      {
        body: data,
        method: "POST",
      },
      onProgress
    )
    .then(
      (res) => {
        const jres = JSON.parse(res);
        return jres;
      },
      (err) => {
        throw err;
      }
    );
}

function deleteSubmission(submissionId) {
  return api
    .delete(`/submissions/${submissionId}`)
    .then(util.tryThrowError)
    .then(() => submissionId);
}

function downloadSubmission(track, submissionId) {
  return api
    .download(`/submissions/${submissionId}/download`)
    .then(util.tryThrowError)
    .then((res) => {
      return res.blob();
    });
}

function getSubmissions(filter) {
  return api
    .get(`/submissions?${qs.stringify(filter, { encode: false })}`)
    .then(util.tryThrowError)
    .then((res) => res);
}

export default {
  submit,
  deleteSubmission,
  downloadSubmission,
  getSubmissions,
};
