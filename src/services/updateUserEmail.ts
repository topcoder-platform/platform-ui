// src/services/updateUserEmail.ts
import axios from 'axios';
import cookies from 'browser-cookies';
import { EnvironmentConfig } from '~/config';

const API_BASE = EnvironmentConfig.API.V3;

export async function updateUserEmail(userId: string, newEmail: string): Promise<any> {
  // Retrieve the token from cookie 'tcjwt'
  const token = cookies.get('tcjwt');
  if (!token) {
    throw new Error('Authorization token not found');
  }

  // Construct the endpoint URL
  const url = `${API_BASE}/users/${userId}/email`;

  // Set headers explicitly
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // Use a plain JSON object as the payload
  const payload = { email: newEmail };

  console.log('PATCH URL:', url);
  console.log('PATCH payload:', payload);

  // Send the PATCH request
  return axios.patch(url, payload, { headers });
}
