import axios from "axios";
import _ from "lodash";
import { getAuthUserTokens } from "@topcoder/mfe-header";

const CancelToken = axios.CancelToken;

export { CancelToken };

export const axiosInstance = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
});

// request interceptor to pass auth token
axiosInstance.interceptors.request.use((config) => {
  return getAuthUserTokens()
    .then(({ tokenV3: token }) => {
      config.headers["Authorization"] = `Bearer ${token}`;
      return config;
    })
    .catch(() => config);
});

// response interceptor to handle error
axiosInstance.interceptors.response.use(
  (config) => {
    // return the response
    return config;
  },
  (error) => {
    const serverErrorMessage = _.get(error, "response.data.message");

    // if there is server error message, then return it inside `message` property of error
    if (serverErrorMessage) {
      error.message = serverErrorMessage;
    }

    return Promise.reject(error);
  }
);
