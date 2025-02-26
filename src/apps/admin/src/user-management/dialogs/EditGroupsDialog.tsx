// src/apps/admin/src/user-management/dialogs/EditGroupsDialog.tsx
import React, { useEffect, useState } from 'react';
import { axiosV5 } from '~/libs/useAxiosInstance';
import styles from './Dialog.module.scss';
import { Group } from '../types';

interface EditGroupsDialogProps {
  userId: string;
  userGroups: Group[];
  onClose: () => void;
  onSave: (updatedGroups: Group[]) => void;
}

const EditGroupsDialog: React.FC<EditGroupsDialogProps> = ({
  userId,
  userGroups,
  onClose,
  onSave,
}) => {
  const [currentGroups, setCurrentGroups] = useState<Group[]>([]);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');

  // For responsive rendering, we check the window width
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 600);

  useEffect(() => {
    // Listen to window resize events
    const handleResize = () => {
      setIsMobile(window.innerWidth < 600);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setCurrentGroups(userGroups);

    // Fetch groups from real API GET /v5/groups
    axiosV5.get('/groups')
      .then((response) => {
        console.log('Groups response:', response.data);
        if (Array.isArray(response.data)) {
          setAllGroups(response.data);
        } else if (response.data && response.data.result && Array.isArray(response.data.result.content)) {
          setAllGroups(response.data.result.content);
        }
      })
      .catch((error) => {
        console.error('Error fetching groups', error);
      });
  }, [userGroups]);

  const assignGroupToUser = (groupId: string) => {
    return axiosV5.post(`/groups/${groupId}/members`, {
      memberId: userId,
      universalUID: userId, // Adjust if needed
    });
  };

  const deassignGroupFromUser = (groupId: string) => {
    return axiosV5.delete(`/groups/${groupId}/members/${userId}`);
  };

  const removeGroup = (groupId: string) => {
    deassignGroupFromUser(groupId)
      .then(() => {
        setCurrentGroups((prev) => prev.filter((g) => g.id !== groupId));
      })
      .catch((err) => {
        console.error(`Error removing group ${groupId} from user ${userId}`, err);
      });
  };

  const addGroup = () => {
    if (!selectedGroupId) return;
    const groupToAdd = allGroups.find((g) => g.id === selectedGroupId);
    if (!groupToAdd) return;
    if (currentGroups.some((g) => g.id === groupToAdd.id)) return;

    assignGroupToUser(selectedGroupId)
      .then(() => {
        setCurrentGroups((prev) => [...prev, groupToAdd]);
      })
      .catch((err) => {
        console.error(`Error adding group ${selectedGroupId} to user ${userId}`, err);
      });
  };

  const handleSave = () => {
    onSave(currentGroups);
  };

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalContent}>
        {/* Header */}
        <div className={styles.dialogHeader}>
          <h2>Groups for User {userId}</h2>
        </div>

        {/* Body */}
        <div className={styles.dialogBody}>
          {isMobile ? (
            <div className={styles.groupListMobile}>
              {currentGroups.map((group) => (
                <div key={group.id} className={styles.groupCard}>
                  <div className={styles.groupInfo}>
                    <div className={styles.groupId}>{group.id}</div>
                    <div className={styles.groupName}>{group.name}</div>
                  </div>
                  <button className={styles.removeBtn} onClick={() => removeGroup(group.id)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <table className={styles.groupTable}>
              <thead>
                <tr>
                  <th>Group ID</th>
                  <th>Name</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {currentGroups.map((group) => (
                  <tr key={group.id}>
                    <td>{group.id}</td>
                    <td>{group.name}</td>
                    <td>
                      <button onClick={() => removeGroup(group.id)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <label>Add Group:</label>
          <select
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
          >
            <option value="">-- Select Group --</option>
            {allGroups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          <button className={styles.addButton} onClick={addGroup}>
            Add
          </button>
        </div>

        {/* Footer */}
        <div className={styles.dialogFooter}>
          <button className={styles.cancelBtn} onClick={onClose}>Close</button>
          <button className={styles.saveBtn} onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
};

export default EditGroupsDialog;
