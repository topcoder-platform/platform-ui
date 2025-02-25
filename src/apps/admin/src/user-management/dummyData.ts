// src/apps/admin/src/user-management/dummyData.ts

import { User } from './types';

export const dummyUsers: User[] = [
  {
    id: '101',
    handle: 'jdoe',
    email: 'jdoe@example.com',
    active: true,
    roles: [
      { id: 1, name: 'admin' },
      { id: 2, name: 'user' },
    ], // roles is an array, not null
    modifiedBy: 'admin',
    modifiedAt: '2025-02-01T12:00:00Z',
    createdBy: 'admin',
    createdAt: '2025-01-01T12:00:00Z',
    firstName: 'John',
    lastName: 'Doe',
    emailActive: true,
    status: 'A',
    credential: {
      activationCode: 'ABC123',
      resetToken: null,
      resendToken: null,
      activationBlocked: false, // use false instead of null
      canResend: false,         // use false instead of null
      hasPassword: true,
    },
  },
  {
    id: '102',
    handle: 'asmith',
    email: 'asmith@example.com',
    active: false,
    roles: [], // empty array instead of null
    modifiedBy: null,
    modifiedAt: '2025-02-05T12:00:00Z',
    createdBy: null,
    createdAt: '2025-01-15T12:00:00Z',
    firstName: 'Alice',
    lastName: 'Smith',
    emailActive: false,
    status: '6',
    credential: {
      activationCode: null,
      resetToken: null,
      resendToken: null,
      activationBlocked: false,
      canResend: false,
      hasPassword: true,
    },
  },
  // ...more dummy users
];
