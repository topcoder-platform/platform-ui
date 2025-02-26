// src/apps/admin/src/user-management/UserManagementPage.tsx
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import styles from './UserManagementPage.module.scss';
import { updateUserEmail } from '~/services/updateUserEmail';


import EditEmailDialog from './dialogs/EditEmailDialog';
import EditRolesDialog from './dialogs/EditRolesDialog';
import EditUserStatusDialog from './dialogs/EditUserStatusDialog';
import EditDropdown from './components/EditDropdown';
import EditGroupsDialog from './dialogs/EditGroupsDialog';
import EditTermsDialog from './dialogs/EditTermsDialog';

import { useGetUsers } from '~/services/useGetUsers';
import { User as AdminUser, Role, Group, Term } from './types';

// Map the service user to our AdminUser shape.
function mapServiceUserToAdminUser(serviceUser: any): AdminUser {
  return {
    id: String(serviceUser.id),
    handle: serviceUser.handle || '',
    email: serviceUser.email || '',
    active: serviceUser.active ?? false,
    roles: Array.isArray(serviceUser.roles)
      ? serviceUser.roles.map((r: any) => ({
          id: String(r.id),
          roleName: r.roleName,
        }))
      : [],
    groups: Array.isArray(serviceUser.groups)
      ? serviceUser.groups.map((g: any) => ({
          id: String(g.id),
          name: g.name,
          description: g.description,
          ssoId: g.ssoId,
          updatedBy: g.updatedBy,
          updatedAt: g.updatedAt,
          createdAt: g.createdAt,
          createdBy: g.createdBy,
          privateGroup: g.privateGroup,
          oldId: g.oldId,
          organizationId: g.organizationId,
          selfRegister: g.selfRegister,
          domain: g.domain,
          status: g.status,
        }))
      : [],
      terms: Array.isArray(serviceUser.terms)
      ? serviceUser.terms.map((t: any) => ({
          id: String(t.id),
          title: t.title,
          // map any other fields if present
        }))
      : [],
    modifiedBy: serviceUser.modifiedBy || null,
    modifiedAt: serviceUser.modifiedAt || '',
    createdBy: serviceUser.createdBy || null,
    createdAt: serviceUser.createdAt || '',
    firstName: serviceUser.firstName || '',
    lastName: serviceUser.lastName || '',
    emailActive: serviceUser.emailActive ?? false,
    status: serviceUser.status || '',
    credential: {
      activationCode: serviceUser.credential?.activationCode || null,
      resetToken: serviceUser.credential?.resetToken || null,
      resendToken: serviceUser.credential?.resendToken || null,
      activationBlocked: serviceUser.credential?.activationBlocked ?? false,
      canResend: serviceUser.credential?.canResend ?? false,
      hasPassword: serviceUser.credential?.hasPassword ?? false,
    },
  };
}




type SortField = 'id' | 'handle' | 'email' | 'active';

interface FilterState {
  handle: string;
  email: string;
  userId: string;
  status: string; // "active" | "inactive" | ""
}

const UserManagementPage: React.FC = () => {
  // Dialog states
  const [editEmailOpen, setEditEmailOpen] = useState(false);
  const [selectedUserForEmail, setSelectedUserForEmail] = useState<AdminUser | null>(null);
  const [editRolesOpen, setEditRolesOpen] = useState(false);
  const [selectedUserForRoles, setSelectedUserForRoles] = useState<AdminUser | null>(null);
  const [editStatusOpen, setEditStatusOpen] = useState(false);
  const [selectedUserForStatus, setSelectedUserForStatus] = useState<AdminUser | null>(null);
  const [editGroupsOpen, setEditGroupsOpen] = useState(false);
  const [selectedUserForGroups, setSelectedUserForGroups] = useState<AdminUser | null>(null);
  const [editTermsOpen, setEditTermsOpen] = useState(false);
  const [selectedUserForTerms, setSelectedUserForTerms] = useState<AdminUser | null>(null);



  // Main UI states
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<FilterState>({
    handle: '',
    email: '',
    userId: '',
    status: '',
  });
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [error, setError] = useState<string>('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Fetch real data from GET /v3/users using the custom hook
  const { data, error: fetchError } = useGetUsers();

  useEffect(() => {
    if (fetchError) {
      console.error('Error fetching users:', fetchError);
      setError(fetchError.message || 'Failed to fetch users');
      toast.error(`Failed to fetch users: ${fetchError.message}`);
    }
    if (data && data.result && Array.isArray(data.result.content)) {
      const adminUsers = data.result.content.map((su: any) => mapServiceUserToAdminUser(su));
      setUsers(adminUsers);
      // Reset to first page when new data comes in
      setCurrentPage(1);
    }
  }, [data, fetchError]);

  // Dialog open/close handlers
  const openEditEmailDialog = (user: AdminUser) => {
    setSelectedUserForEmail(user);
    setEditEmailOpen(true);
  };
  const closeEditEmailDialog = () => {
    setEditEmailOpen(false);
    setSelectedUserForEmail(null);
  };
  
  const openEditRolesDialog = (user: AdminUser) => {
    setSelectedUserForRoles(user);
    setEditRolesOpen(true);
  };
  const closeEditRolesDialog = () => {
    setEditRolesOpen(false);
    setSelectedUserForRoles(null);
  };
  const openEditGroupsDialog = (user: AdminUser) => {
    setSelectedUserForGroups(user);
    setEditGroupsOpen(true);
  };
  
  // Close the edit groups dialog
  const closeEditGroupsDialog = () => {
    setEditGroupsOpen(false);
    setSelectedUserForGroups(null);
  };

  const openEditTermsDialog = (user: AdminUser) => {
    setSelectedUserForTerms(user);
    setEditTermsOpen(true);
  };
  
  const closeEditTermsDialog = () => {
    setEditTermsOpen(false);
    setSelectedUserForTerms(null);
  };

  const openEditStatusDialog = (user: AdminUser) => {
    setSelectedUserForStatus(user);
    setEditStatusOpen(true);
  };
  const closeEditStatusDialog = () => {
    setEditStatusOpen(false);
    setSelectedUserForStatus(null);
  };

  // Save handlers (placeholders)
  const handleSaveEmail = async (newEmail: string) => {
    if (!selectedUserForEmail) return;
    const userId = selectedUserForEmail.id;
    try {
      await updateUserEmail(userId, newEmail);
      // Update local state with new email
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, email: newEmail } : u))
      );
      toast.success('Email updated successfully.');
    } catch (error: any) {
      console.error('Failed to update email:', error);
      toast.error(`Error updating email: ${error.message}`);
    } finally {
      closeEditEmailDialog();
    }
  };

  const handleSaveRoles = (updatedRoles: Role[]): void => {
    if (!selectedUserForRoles) return;
    const userId = selectedUserForRoles.id;
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, roles: updatedRoles } : u))
    );
    closeEditRolesDialog();
  };

  const handleSaveGroups = (updatedGroups: Group[]): void => {
    if (!selectedUserForGroups) return;
    const userId = selectedUserForGroups.id;
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, groups: updatedGroups } : u))
    );
    closeEditGroupsDialog();
  };

  const handleSaveTerms = (updatedTerms: Term[]) => {
    if (!selectedUserForTerms) return;
    const userId = selectedUserForTerms.id;
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, terms: updatedTerms } : u
      )
    );
    closeEditTermsDialog();
  };
  

  const handleSaveStatus = async (newStatus: string, comment: string) => {
    if (!selectedUserForStatus) return;
    const userId = selectedUserForStatus.id;
    // PATCH /v3/users/{userId}/status call here.
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
    );
    closeEditStatusDialog();
  };

  /** Filtering logic */
  const onFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilter((prev) => ({ ...prev, [name]: value }));
  };

  const filteredUsers = users.filter((u) => {
    if (filter.handle && !u.handle.toLowerCase().includes(filter.handle.toLowerCase()))
      return false;
    if (filter.email && !u.email.toLowerCase().includes(filter.email.toLowerCase()))
      return false;
    if (filter.userId && u.id !== filter.userId)
      return false;
    if (filter.status) {
      const isActive = u.active ? 'active' : 'inactive';
      if (isActive !== filter.status) return false;
    }
    return true;
  });

  /** Sorting logic */
  const onSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let valA: string | number | boolean;
    let valB: string | number | boolean;

    switch (sortField) {
      case 'id':
        valA = a.id;
        valB = b.id;
        break;
      case 'handle':
        valA = a.handle;
        valB = b.handle;
        break;
      case 'email':
        valA = a.email;
        valB = b.email;
        break;
      case 'active':
        valA = a.active;
        valB = b.active;
        break;
      default:
        valA = a.id;
        valB = b.id;
        break;
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);
  const paginatedUsers = sortedUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  /** Toggle expandable rows */
  const toggleExpandRow = (id: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  /** Copy activation code */
  const copyCode = (code: string | null) => {
    if (!code) return;
    navigator.clipboard
      .writeText(code)
      .then(() => toast.success(`Copied activation code: ${code}`))
      .catch(() => toast.error('Failed to copy code.'));
  };

  /** Edit button (placeholder) */
  const onEdit = (user: AdminUser) => {
    toast.info(`Edit user ${user.handle} (not implemented yet)`);
  };

  /** Deactivate/Activate button (placeholder) */
  const onToggleActive = (user: AdminUser) => {
    const action = user.active ? 'Deactivate' : 'Activate';
    toast.info(`${action} user ${user.handle} (not implemented yet)`);
  };

  return (
    <div className={styles.pageContainer}>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {/* Header */}
      <div className={styles.header}>
        <h2>User Management</h2>
        <div className="actions">
          <button>Export CSV</button>
          <button>Refresh</button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className={styles.filters}>
        <label>
          Handle
          <input
            name="handle"
            value={filter.handle}
            onChange={onFilterChange}
            placeholder="Search handle..."
          />
        </label>
        <label>
          Email
          <input
            name="email"
            value={filter.email}
            onChange={onFilterChange}
            placeholder="Search email..."
          />
        </label>
        <label>
          User ID
          <input
            name="userId"
            value={filter.userId}
            onChange={onFilterChange}
            placeholder="e.g. 101"
          />
        </label>
        <label>
          Status
          <select name="status" value={filter.status} onChange={onFilterChange}>
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.userTable}>
          <thead>
            <tr>
              <th onClick={() => onSort('id')}>
                User ID {sortField === 'id' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th onClick={() => onSort('handle')}>
                Handle {sortField === 'handle' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th onClick={() => onSort('email')}>
                Primary Email {sortField === 'email' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th onClick={() => onSort('active')}>
                User Active {sortField === 'active' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.map((user) => {
              const expanded = expandedRows.has(user.id);
              return (
                <React.Fragment key={user.id}>
                  <tr>
                    <td>{user.id}</td>
                    <td>{user.handle}</td>
                    <td>{user.email || 'N/A'}</td>
                    <td>
                      <span
                        className={`${styles.statusBadge} ${
                          user.active ? styles.active : styles.inactive
                        }`}
                      >
                        {user.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className={styles.actionsCell}>
                      <button
                        className={styles.actionsCellButtons}
                        onClick={() => toggleExpandRow(user.id)}
                      >
                        {expanded ? 'Hide Details' : 'Show Details'}
                      </button>
                      <EditDropdown
                        user={user}
                        onEditEmail={openEditEmailDialog}
                        onEditRoles={openEditRolesDialog}
                        onEditStatus={openEditStatusDialog}
                        onEditGroups={openEditGroupsDialog}
                        onEditTerms={openEditTermsDialog}
                      />
                      <button
                        className={`${styles.actionsCellButtons} ${
                          user.active ? styles.deactivate : styles.activate
                        }`}
                        onClick={() => onToggleActive(user)}
                      >
                        {user.active ? 'Deactivate' : 'Activate'}
                      </button>

                    </td>
                  </tr>
                  {expanded && (
                    <tr className={styles.expandedRow}>
                      <td colSpan={5}>
                        <div className={styles.details}>
                          <p>
                            <strong>Name:</strong> {user.firstName} {user.lastName}
                          </p>
                          <p>
                            <strong>Status:</strong> {user.status}
                          </p>
                          <p>
                            <strong>Email Active:</strong>{' '}
                            {user.emailActive ? 'Active' : 'Inactive'}
                          </p>
                          <p>
                            <strong>Created At:</strong> {user.createdAt}
                          </p>
                          <p>
                            <strong>Modified At:</strong> {user.modifiedAt}
                          </p>
                          <p>
                            <strong>Activation Code:</strong>{' '}
                            {user.credential.activationCode ? user.credential.activationCode : 'N/A'}{' '}
                            {user.credential.activationCode && (
                              <button onClick={() => copyCode(user.credential.activationCode)}>
                                Copy
                              </button>
                            )}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className={styles.pagination}>
      <button
        disabled={currentPage === 1}
        onClick={() => setCurrentPage((prev) => prev - 1)}
      >
        Previous
      </button>
      <span>
        Page {currentPage} of {totalPages}
      </span>
      <button
        disabled={currentPage === totalPages}
        onClick={() => setCurrentPage((prev) => prev + 1)}
      >
        Next
      </button>
    </div>


      {/* Render dialogs */}
      {editEmailOpen && selectedUserForEmail && (
        <EditEmailDialog
          userId={selectedUserForEmail.id}
          currentEmail={selectedUserForEmail.email}
          onClose={closeEditEmailDialog}
          onSave={handleSaveEmail}
        />
      )}
      {editRolesOpen && selectedUserForRoles && (
        <EditRolesDialog
          userId={selectedUserForRoles.id}
          userRoles={selectedUserForRoles.roles}
          onClose={closeEditRolesDialog}
          onSave={handleSaveRoles}
        />
      )}
      {editGroupsOpen && selectedUserForGroups && (
      <EditGroupsDialog
        userId={selectedUserForGroups.id}
        userGroups={selectedUserForGroups.groups || []}
        onClose={closeEditGroupsDialog}
        onSave={handleSaveGroups}
      />
    )}

{editTermsOpen && selectedUserForTerms && (
  <EditTermsDialog
    userId={selectedUserForTerms.id}
    userTerms={selectedUserForTerms.terms || []}
    onClose={closeEditTermsDialog}
    onSave={handleSaveTerms}
  />
)}

      {editStatusOpen && selectedUserForStatus && (
        <EditUserStatusDialog
          userId={selectedUserForStatus.id}
          currentStatus={selectedUserForStatus.status}
          onClose={closeEditStatusDialog}
          onSave={handleSaveStatus}
        />
      )}
    </div>
  );
};

export default UserManagementPage;
