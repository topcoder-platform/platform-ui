// src/apps/admin/src/user-management/dialogs/EditRolesDialog.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import cookies from 'browser-cookies';
import { EnvironmentConfig } from '~/config';
import styles from './Dialog.module.scss';

interface Role {
  id: string;
  roleName: string;
}


export interface EditRolesDialogProps {
  userId: string;
  userRoles: Role[];
  onClose: () => void;
  onSave: (updatedRoles: Role[]) => void;
}

const EditRolesDialog: React.FC<EditRolesDialogProps> = ({
  userId,
  userRoles,
  onClose,
  onSave,
}) => {
  const [currentRoles, setCurrentRoles] = useState<Role[]>(userRoles);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');

  // Get token from cookie "tcjwt"
  const token = cookies.get('tcjwt');
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const API_BASE = EnvironmentConfig.API.V3;

  useEffect(() => {
    axios
      .get(`${API_BASE}/roles`, { headers })
      .then((res) => {
        // Convert each role: convert id to number and rename roleName to name
        const roles = res.data.result.content.map((r: any) => ({
          id: Number(r.id),
          name: r.roleName,
        }));
        setAllRoles(roles);
      })
      .catch((err) => {
        console.error('Error fetching roles:', err);
      });
  }, [API_BASE, headers]);
  

  const removeRole = (roleId: string) => {
    setCurrentRoles((prev) => prev.filter((r) => r.id !== roleId));
  };

  const addRole = () => {
    if (!selectedRoleId) return;
    const roleToAdd = allRoles.find((r) => r.id === selectedRoleId);
    if (!roleToAdd) return;
    // Avoid duplicates
    if (currentRoles.some((r) => r.id === roleToAdd.id)) return;
    setCurrentRoles((prev) => [...prev, roleToAdd]);
  };
  

  const handleSave = async () => {
    // Compute which roles were added and which were removed.
    const addedRoles = currentRoles.filter(
      (r) => !userRoles.some((ur) => ur.id === r.id)
    );
    const removedRoles = userRoles.filter(
      (r) => !currentRoles.some((cr) => cr.id === r.id)
    );

    try {
      // For each role added, call the assign endpoint.
      await Promise.all(
        addedRoles.map((role) =>
          axios.post(`${API_BASE}/roles/${role.id}/assign`, null, { headers })
        )
      );

      // For each role removed, call the deassign endpoint.
      await Promise.all(
        removedRoles.map((role) =>
          axios.delete(`${API_BASE}/roles/${role.id}/deassign`, { headers })
        )
      );

      // Call the parent's onSave callback to update state.
      onSave(currentRoles);
    } catch (error: any) {
      console.error('Error updating roles:', error);
      // You can show a toast or alert error here.
    }
  };

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalContent}>
        <div className={styles.dialogHeader}>
          <h2>Roles for user {userId}</h2>
        </div>
        <div className={styles.dialogBody}>
          <table>
            <thead>
              <tr>
                <th>Role ID</th>
                <th>Name</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
            {currentRoles.map((role) => (
              <tr key={role.id}>
                <td>{role.id}</td>
                <td>{role.roleName}</td>
                <td>
                <button onClick={() => removeRole(role.id)}>Remove</button>

                </td>
              </tr>
            ))}
          </tbody>

          </table>
          <label>Add role:</label>
          <select
          value={selectedRoleId}
          onChange={(e) => setSelectedRoleId(e.target.value)}
        >
          <option value="">-- Select Role --</option>
          {allRoles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.roleName}
            </option>
          ))}
        </select>

          <button className={styles.addButton} onClick={addRole}>
            Add
          </button>
        </div>
        <div className={styles.dialogFooter}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Close
          </button>
          <button className={styles.saveBtn} onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditRolesDialog;
