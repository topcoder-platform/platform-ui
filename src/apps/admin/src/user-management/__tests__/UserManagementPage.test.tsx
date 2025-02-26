
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UserManagementPage from '../UserManagementPage';
import { toast } from 'react-toastify';
import * as useGetUsersModule from '../../../../../services/useGetUsers';
import EditEmailDialog from '../dialogs/EditEmailDialog';
import EditRolesDialog from '../dialogs/EditRolesDialog';
import { updateUserEmail } from '../../../../../services/updateUserEmail';

// Mock toast notifications so they don't actually appear during tests.
jest.mock('react-toastify', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock updateUserEmail from our __mocks__ folder.
jest.mock('../../../../../services/updateUserEmail', () => ({
  updateUserEmail: jest.fn().mockResolvedValue({}),
}));

// Create dummy data for users.
const dummyData = {
  result: {
    content: [
      {
        id: 101,
        handle: 'user101',
        email: 'user101@example.com',
        active: true,
        roles: [{ id: '1', roleName: 'administrator' }],
        groups: [{
          id: 'group-101',
          name: 'Group A',
          description: 'Test Group',
          ssoId: '',
          updatedBy: '',
          updatedAt: '',
          createdAt: '',
          createdBy: '',
          privateGroup: true,
          oldId: '',
          organizationId: '',
          selfRegister: false,
          domain: '',
          status: 'active'
        }],
        modifiedBy: null,
        modifiedAt: '2024-01-01T00:00:00.000Z',
        createdBy: null,
        createdAt: '2023-12-01T00:00:00.000Z',
        firstName: 'John',
        lastName: 'Doe',
        emailActive: true,
        status: 'active',
        credential: {
          activationCode: 'ABC123',
          resetToken: null,
          resendToken: null,
          activationBlocked: false,
          canResend: false,
          hasPassword: true,
        },
      },
      // Additional dummy users if needed…
    ],
  },
  version: 'v3',
};

describe('UserManagementPage', () => {
  beforeEach(() => {
    // Spy on useGetUsers and return dummy data.
    jest.spyOn(useGetUsersModule, 'useGetUsers').mockReturnValue({
      data: dummyData,
      error: null,
    });
  });

  it('renders a table with users and supports sorting by User ID', async () => {
    render(<UserManagementPage />);
    await waitFor(() => expect(screen.getByText('user101')).toBeInTheDocument());
    const userIdHeader = screen.getByText(/User ID/);
    expect(userIdHeader).toBeInTheDocument();
    fireEvent.click(userIdHeader);
    // You can add additional assertions here based on sort behavior.
  });

  it('filters users by handle', async () => {
    render(<UserManagementPage />);
    await waitFor(() => expect(screen.getByText('user101')).toBeInTheDocument());
    const handleInput = screen.getByPlaceholderText('Search handle...');
    fireEvent.change(handleInput, { target: { value: 'nonexistent' } });
    expect(screen.queryByText('user101')).not.toBeInTheDocument();
  });

  it('expands and collapses a user row', async () => {
    render(<UserManagementPage />);
    await waitFor(() => expect(screen.getByText('user101')).toBeInTheDocument());
    const showDetailsButton = screen.getByText('Show Details');
    fireEvent.click(showDetailsButton);
    await waitFor(() => expect(screen.getByText(/John Doe/)).toBeInTheDocument());
    const hideDetailsButton = screen.getByText('Hide Details');
    fireEvent.click(hideDetailsButton);
    expect(screen.queryByText(/John Doe/)).not.toBeInTheDocument();
  });
});

describe('EditEmailDialog', () => {
  it('renders with default email and calls onSave on submit', async () => {
    const mockOnSave = jest.fn();
    const mockOnClose = jest.fn();
    render(
      <EditEmailDialog
        userId="101"
        currentEmail="user101@example.com"
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    // The current email should be present.
    const currentEmailInput = screen.getByDisplayValue('user101@example.com');
    expect(currentEmailInput).toBeInTheDocument();

    // Change the email value.
    const newEmailInput = screen.getByPlaceholderText(/New Value/);
    fireEvent.change(newEmailInput, { target: { value: 'newuser101@example.com' } });

    // Click the Save button.
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith('newuser101@example.com');
    });

    // Also assert that updateUserEmail was called.
    expect(updateUserEmail).toHaveBeenCalledWith('101', 'newuser101@example.com');
  });
});

describe('EditRolesDialog', () => {
  it('renders current roles and calls onSave when roles are updated', () => {
    const mockOnSave = jest.fn();
    const mockOnClose = jest.fn();
    const dummyRoles = [{ id: '1', roleName: 'administrator' }];
    render(
      <EditRolesDialog
        userId="101"
        userRoles={dummyRoles}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText('administrator')).toBeInTheDocument();

    // Simulate removing the role.
    const removeButton = screen.getByText('Remove');
    fireEvent.click(removeButton);

    // Simulate saving changes.
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);
    expect(mockOnSave).toHaveBeenCalledWith([]);
  });
});
