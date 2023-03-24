/* global process */
import { keys } from "lodash";
import * as utils from "../../utils/gigs";
import config from "../../../config";

async function doFetch(endpoint, options = {}, v3, baseUrl) {
  const headers = options.headers ? { ...options.headers } : {};
  //TODO: Add uninav token
  const token = null;
  let url;
  if (baseUrl) {
    url = baseUrl;
  } else if (v3) {
    url = config.API.V3;
  } else {
    url = config.API.V5;
  }

  if (token) {
    headers.Authorization = `Bearer ${token.tokenV3}`;
  }

  return fetch(`${url}${endpoint}`, {
    ...options,
    headers,
  });
}

async function get(endpoint, baseUrl) {
  const options = { headers: { ["Content-Type"]: "application/json" } };
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

export default {
  doFetch,
  get,
  post,
  put,
  patch,
};
