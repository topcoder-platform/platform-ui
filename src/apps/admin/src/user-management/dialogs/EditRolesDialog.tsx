// src/apps/admin/src/user-management/dialogs/EditRolesDialog.tsx
import React, { useEffect, useState } from 'react'
import styles from './Dialog.module.scss'

interface Role {
  id: number
  name: string
}

interface EditRolesDialogProps {
  userId: string
  userRoles: Role[]
  onClose: () => void
  onSave: (updatedRoles: Role[]) => void
}

const EditRolesDialog: React.FC<EditRolesDialogProps> = ({
  userId,
  userRoles,
  onClose,
  onSave,
}) => {
  const [currentRoles, setCurrentRoles] = useState<Role[]>([])
  const [allRoles, setAllRoles] = useState<Role[]>([])
  const [selectedRoleId, setSelectedRoleId] = useState<number>(0)

  useEffect(() => {
    // Initialize current roles from props
    setCurrentRoles(userRoles)

    // For real code, fetch from GET /v3/roles
    // Dummy roles for now
    setAllRoles([
      { id: 2, name: 'copilot' },
      { id: 137, name: 'Topcoder Talent' },
      { id: 999, name: 'Dummy Role' },
    ])
  }, [userRoles])

  const removeRole = (roleId: number) => {
    setCurrentRoles((prev) => prev.filter((r) => r.id !== roleId))
  }

  const addRole = () => {
    if (!selectedRoleId) return
    const roleToAdd = allRoles.find((r) => r.id === selectedRoleId)
    if (!roleToAdd) return
    // Avoid duplicates
    if (currentRoles.some((r) => r.id === roleToAdd.id)) return
    setCurrentRoles((prev) => [...prev, roleToAdd])
  }

  const handleSave = () => {
    onSave(currentRoles)
  }

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalContent}>
        <div className={styles.dialogHeader}>
          <h2>Roles of user {userId}</h2>
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
                  <td>{role.name}</td>
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
            onChange={(e) => setSelectedRoleId(Number(e.target.value))}
          >
            <option value={0}>-- Select Role --</option>
            {allRoles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <button className={styles.addButton} onClick={addRole}>Add</button>
        </div>
        <div className={styles.dialogFooter}>
          <button className={styles.cancelBtn} onClick={onClose}>Close</button>
          <button className={styles.saveBtn} onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  )
}

export default EditRolesDialog
