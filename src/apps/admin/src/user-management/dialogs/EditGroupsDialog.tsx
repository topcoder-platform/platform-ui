// src/apps/admin/src/user-management/dialogs/EditGroupsDialog.tsx
import React, { useEffect, useState } from 'react'
import styles from './Dialog.module.scss'

/** Example Group interface */
interface Group {
  id: string
  name: string
}

interface EditGroupsDialogProps {
  userId: number
  existingGroups: Group[]  // The user’s current groups
  onClose: () => void
  onSave: (updatedGroups: Group[]) => void
}

const EditGroupsDialog: React.FC<EditGroupsDialogProps> = ({
  userId,
  existingGroups,
  onClose,
  onSave,
}) => {
  const [currentGroups, setCurrentGroups] = useState<Group[]>([])
  const [allGroups, setAllGroups] = useState<Group[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<string>('')

  useEffect(() => {
    // Initialize current groups from props
    setCurrentGroups(existingGroups)

    // For real code, fetch from GET /v5/groups
    // Dummy data for demonstration:
    setAllGroups([
      { id: 'group-123', name: 'WiproGroup' },
      { id: 'group-456', name: 'AnotherGroup' },
      { id: 'group-999', name: 'DummyGroup' },
    ])
  }, [existingGroups])

  /** Remove group from user */
  const removeGroup = (groupId: string) => {
    setCurrentGroups((prev) => prev.filter((g) => g.id !== groupId))
  }

  /** Add group to user */
  const addGroup = () => {
    if (!selectedGroupId) return
    const groupToAdd = allGroups.find((g) => g.id === selectedGroupId)
    if (!groupToAdd) return
    // Avoid duplicates
    if (currentGroups.some((g) => g.id === groupToAdd.id)) return
    setCurrentGroups((prev) => [...prev, groupToAdd])
  }

  /** Handle Save */
  const handleSave = () => {
    // In real code, for each new group => POST /v5/groups/{Group ID}/members
    // For each removed group => DELETE /v5/groups/{Group ID}/members/{User ID}
    onSave(currentGroups)
  }

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalContent}>
        <div className={styles.dialogHeader}>
          <h2>Groups of guest{userId}</h2>
        </div>
        <div className={styles.dialogBody}>
          <table>
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
                    <button onClick={() => removeGroup(group.id)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <label>Add group:</label>
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
          <button onClick={addGroup} style={{ marginLeft: '0.5rem' }}>Add</button>
        </div>
        <div className={styles.dialogFooter}>
          <button className="cancelBtn" onClick={onClose}>Close</button>
          <button className="saveBtn" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  )
}

export default EditGroupsDialog
