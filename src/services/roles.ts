// src/services/roles.ts
import axios from 'axios';
import { EnvironmentConfig } from '~/config';
import { useAuth0 } from '@auth0/auth0-react';
import cookies from 'browser-cookies';
import useAxiosInstance from '~/libs/useAxiosInstance';

export interface RoleData {
  id: number;
  name: string;
}

// Get all roles
export async function getRoles(): Promise<RoleData[]> {
  const axiosInstance = useAxiosInstance();
  const response = await axiosInstance.get<{ roles: RoleData[] }>(`/roles`);
  return response.data.roles;
}

// Assign a role (POST /v3/roles/{roleId}/assign)
export async function assignRole(roleId: number, userId: string): Promise<void> {
  const axiosInstance = useAxiosInstance();
  // Some APIs might require a payload; if not, send an empty object
  await axiosInstance.post(`/roles/${roleId}/assign`, { userId });
}

// Deassign a role (DELETE /v3/roles/{roleId}/deassign)
export async function deassignRole(roleId: number, userId: string): Promise<void> {
  const axiosInstance = useAxiosInstance();
  await axiosInstance.delete(`/roles/${roleId}/deassign`, {
    data: { userId },
  });
}
