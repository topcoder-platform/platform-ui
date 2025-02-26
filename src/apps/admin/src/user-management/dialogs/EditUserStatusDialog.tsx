// src/apps/admin/src/user-management/dialogs/EditUserStatusDialog.tsx
import React, { useState } from 'react'
import styles from './Dialog.module.scss'

interface EditUserStatusDialogProps {
  userId: string
  currentStatus: string
  onClose: () => void
  onSave: (newStatus: string, comment: string) => void
}

const EditUserStatusDialog: React.FC<EditUserStatusDialogProps> = ({
  userId,
  currentStatus,
  onClose,
  onSave,
}) => {
  const [newStatus, setNewStatus] = useState<string>(currentStatus)
  const [comment, setComment] = useState<string>('')

  const handleSubmit = () => {
    onSave(newStatus, comment)
  }

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalContent}>
        <div className={styles.dialogHeader}>
          <h2>Edit User Status</h2>
        </div>
        <div className={styles.dialogBody}>
          <div>
            <label>New Status</label>
            <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
              <option value="Verified">Verified</option>
              <option value="Inactive - Duplicate account">Inactive - Duplicate account</option>
              <option value="Inactive - Member wanted account removed">Inactive - Member wanted account removed</option>
              <option value="Inactive - Deactivated for cheating">Inactive - Deactivated for cheating</option>
            </select>
          </div>
          <div>
            <label>Comment (Optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment..."
              rows={3}
              style={{ width: '100%' }}
            ></textarea>
          </div>
        </div>
        <div className={styles.dialogFooter}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.saveBtn} onClick={handleSubmit}>Save</button>
        </div>
      </div>
    </div>
  )
}

export default EditUserStatusDialog
