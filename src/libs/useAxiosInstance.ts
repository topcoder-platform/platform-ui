import axios, { AxiosHeaders, InternalAxiosRequestConfig } from 'axios';
import { useAuth0 } from '@auth0/auth0-react';
import { EnvironmentConfig } from '~/config'; // adjust the path if needed

const BaseUrl = `${EnvironmentConfig.API.V3}`;

const useAxiosInstance = () => {
  const { getAccessTokenSilently } = useAuth0();
  const axiosInstance = axios.create({
    baseURL: BaseUrl,
    timeout: 10000,
  });
  console.log("Axios baseURL:", BaseUrl);


  axiosInstance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig<any>) => {
      try {
        const token = await getAccessTokenSilently();
        console.log("Token:", token);
        if (token) {
          if (config.headers instanceof AxiosHeaders) {
            config.headers.set('Authorization', `Bearer ${token}`);
          } else if (typeof config.headers === 'object' && config.headers !== null) {
            // Explicitly cast config.headers to a plain object so that the spread operator works.
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
        return Promise.reject(error);
      }
    },
    (error) => Promise.reject(error)
  );

  return axiosInstance;
};

export default useAxiosInstance;
