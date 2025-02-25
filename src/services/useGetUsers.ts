// src/services/useGetUsers.ts
import { useEffect, useState } from 'react';
import useAxiosInstance from '~/libs/useAxiosInstance';

export interface User { /* ... */ }
export interface GetUsersResponse {
  result: {
    content: User[];
  };
}

export const useGetUsers = () => {
  const axiosInstance = useAxiosInstance();
  const [data, setData] = useState<GetUsersResponse | null>(null);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await axiosInstance.get<GetUsersResponse>('/users');
        setData(response.data);
      } catch (err) {
        setError(err);
      }
    }
    fetchData();
    // Use an empty dependency array if you're sure that axiosInstance is stable.
  }, []); 

  return { data, error };
};
