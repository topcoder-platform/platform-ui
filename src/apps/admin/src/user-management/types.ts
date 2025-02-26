// src/apps/admin/src/user-management/types.ts

export interface Role {
  id: string;
  roleName: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  ssoId?: string;
  updatedBy?: string;
  updatedAt?: string;
  createdAt?: string;
  createdBy?: string;
  privateGroup?: boolean;
  oldId?: string;
  organizationId?: string;
  selfRegister?: boolean;
  domain?: string;
  status?: string;
}

export interface Term {
  id: string;
  legacyId?: number;
  title: string;
  agreeabilityTypeId?: string;
  typeId?: number;
  agreeabilityType?: string;
  type?: string;
  url?: string;
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
  groups?: Group[]; // <-- Added groups property for user's groups
  terms?: Term[];
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
