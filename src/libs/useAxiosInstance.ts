// src/libs/useAxiosInstance.ts
import axios, { AxiosHeaders, InternalAxiosRequestConfig } from 'axios';
import cookies from 'browser-cookies'; // Import the library
import { EnvironmentConfig } from '~/config';

const BaseUrl = `${EnvironmentConfig.API.V3}`;

const useAxiosInstance = () => {
  const axiosInstance = axios.create({
    baseURL: BaseUrl,
    timeout: 10000,
  });
  console.log("Axios baseURL:", BaseUrl);

  axiosInstance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig<any>) => {
      try {
        // Get the token from the cookie
        const token = cookies.get('tcjwt');
        console.log('Token from cookie:', token);

        if (token) {
          if (config.headers instanceof AxiosHeaders) {
            config.headers.set('Authorization', `Bearer ${token}`);
          } else if (typeof config.headers === 'object' && config.headers !== null) {
            // Convert headers to a plain object
            const plainHeaders = { ...(config.headers as Record<string, any>) };
            config.headers = new AxiosHeaders({
              ...plainHeaders,
              Authorization: `Bearer ${token}`,
            });
          } else {
            config.headers = new AxiosHeaders({ Authorization: `Bearer ${token}` });
          }
        }
        return config;
      } catch (error) {
        console.error('Error in interceptor:', error);
        return Promise.reject(error);
      }
    },
    (error) => Promise.reject(error)
  );

  return axiosInstance;
};

export default useAxiosInstance;
