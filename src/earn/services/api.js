import { getAuthUserTokens } from "../utils/auth";
import _, { keys } from "lodash";
import * as utils from "../utils";

import config from '@earn/config';

const { API } = config;

async function doFetch(endpoint, options = {}, v3, baseUrl) {
  const headers = options.headers ? { ...options.headers } : {};
  const token = await getAuthUserTokens();
  let url;
  if (baseUrl) {
    url = baseUrl;
  } else if (v3) {
    url = API.V3;
  } else {
    url = API.V5;
  }

  if (token) {
    headers.Authorization = `Bearer ${token.tokenV3}`;
  }

  return fetch(`${url}${endpoint}`, {
    ...options,
    headers,
  });
}

async function download(endpoint, baseUrl, cancellationSignal) {
  const options = {
    headers: { ["Content-Type"]: "application/json" },
    signal: cancellationSignal,
  };
  const response = await doFetch(endpoint, options, undefined, baseUrl);

  return response;
}

async function get(endpoint, baseUrl, cancellationSignal) {
  const options = {
    headers: { ["Content-Type"]: "application/json" },
    signal: cancellationSignal,
  };
  const response = await doFetch(endpoint, options, undefined, baseUrl);
  const meta = utils.pagination.getResponseHeaders(response);
  const result = await response.json();
  // only add pagination info if any field is filled
  if (keys(meta).some((key) => meta[key] !== 0)) result.meta = meta;

  return result;
}

async function post(endpoint, body, baseUrl) {
  const response = await doFetch(
    endpoint,
    {
      body,
      method: "POST",
    },
    undefined,
    baseUrl
  );
  // not all responses are json (example http code: 204), so returning just the response.
  return response;
}

async function put(endpoint, body) {
  const response = await doFetch(endpoint, {
    body,
    method: "PUT",
  });
  return response.json();
}

async function patch(endpoint, body) {
  const response = await doFetch(endpoint, {
    body,
    method: "PATCH",
  });
  return response.json();
}

/**
 * Upload with progress
 * @param {String} endpoint
 * @param {Object} body and headers
 * @param {Function} onProgress handler for update progress only works for client side for now
 * @return {Promise}
 */
async function upload(endpoint, options, onProgress) {
  const base = API.V5;
  const { tokenV3 } = await getAuthUserTokens();
  const headers = options.headers ? _.clone(options.headers) : {};
  if (tokenV3) headers.Authorization = `Bearer ${tokenV3}`;

  return new Promise((res, rej) => {
    const xhr = new XMLHttpRequest(); //eslint-disable-line
    xhr.open(options.method, `${base}${endpoint}`);
    Object.keys(headers).forEach((key) => {
      if (headers[key] != null) {
        xhr.setRequestHeader(key, headers[key]);
      }
    });
    xhr.onload = (e) => res(e.target.responseText);
    xhr.onerror = rej;
    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable) onProgress(evt.loaded / evt.total);
      };
    }
    xhr.send(options.body);
  });
}

export default {
  doFetch,
  get,
  post,
  put,
  patch,
  upload,
  download,
};
