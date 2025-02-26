// src/libs/useAxiosInstance.ts
import axios, { AxiosHeaders, InternalAxiosRequestConfig, AxiosInstance } from 'axios';
import cookies from 'browser-cookies'; // using browser-cookies for token retrieval
import { EnvironmentConfig } from '~/config';

const createAxiosInstance = (baseUrl: string): AxiosInstance => {
  const instance = axios.create({
    baseURL: baseUrl,
    timeout: 10000,
  });
  console.log("Axios baseURL:", baseUrl);

  instance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig<any>) => {
      try {
        // Get the token from the cookie
        const token = cookies.get('tcjwt');
        console.log('Token from cookie:', token);

        if (token) {
          if (config.headers instanceof AxiosHeaders) {
            config.headers.set('Authorization', `Bearer ${token}`);
          } else if (typeof config.headers === 'object' && config.headers !== null) {
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

  return instance;
};

// Create two instances—one for v3 endpoints and one for v5 endpoints.
export const axiosV3 = createAxiosInstance(EnvironmentConfig.API.V3);
export const axiosV5 = createAxiosInstance(EnvironmentConfig.API.V5);
