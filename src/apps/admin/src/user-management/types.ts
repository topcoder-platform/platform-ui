// src/apps/admin/src/user-management/types.ts

export interface Role {
    id: number;
    name: string;
  }
export interface Credential {
  activationCode: string | null;
  resetToken: string | null;
  resendToken: string | null;
  activationBlocked: boolean;
  canResend: boolean;
  hasPassword: boolean;
}

export interface User {
  id: string; // our mapping will convert the id to a string
  handle: string;
  email: string;
  active: boolean;
  roles: Role[];
  modifiedBy: string | null;
  modifiedAt: string;
  createdBy: string | null;
  createdAt: string;
  firstName: string;
  lastName: string;
  emailActive: boolean;
  status: string;
  credential: Credential;
}
