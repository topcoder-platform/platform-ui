// src/apps/admin/src/user-management/dialogs/EditEmailDialog.tsx
import React, { useState } from 'react'
import styles from './Dialog.module.scss'

interface EditEmailDialogProps {
  userId: string
  currentEmail: string
  onClose: () => void
  onSave: (newEmail: string) => void
}

const EditEmailDialog: React.FC<EditEmailDialogProps> = ({
  userId,
  currentEmail,
  onClose,
  onSave,
}) => {
  const [newEmail, setNewEmail] = useState<string>(currentEmail)

  const handleSubmit = () => {
    onSave(newEmail)
  }

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalContent}>
        {/* Header */}
        <div className={styles.dialogHeader}>
          <h2>Edit Primary Email</h2>
        </div>

        {/* Body */}
        <div className={styles.dialogBody}>
          <label>ID (User ID)</label>
          <input type="text" value={userId} readOnly />

          <label>Email (Original)</label>
          <input type="text" value={currentEmail} readOnly />

          <label>New Value</label>
          <input
            type="text"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          />
        </div>

        {/* Footer */}
        <div className={styles.dialogFooter}>
          <button className="cancelBtn" onClick={onClose}>Close</button>
          <button className="saveBtn" onClick={handleSubmit}>Save</button>
        </div>
      </div>
    </div>
  )
}

export default EditEmailDialog
