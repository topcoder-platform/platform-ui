// src/apps/admin/src/user-management/components/EditDropdown.tsx
import React, { useState } from 'react'
import { User } from '../types';
import styles from './EditDropdown.module.scss'

interface EditDropdownProps {
  user: User
  onEditEmail: (user: User) => void
  onEditRoles: (user: User) => void
  onEditGroups: (user: User) => void
  onEditTerms: (user: User) => void
  onEditStatus: (user: User) => void

}

const EditDropdown: React.FC<EditDropdownProps> = ({
  user,
  onEditEmail,
  onEditRoles,
  onEditGroups,
  onEditTerms,
  onEditStatus,
}) => {
  const [open, setOpen] = useState<boolean>(false)

  // Toggle the dropdown menu
  const toggleDropdown = () => {
    setOpen((prev) => !prev)
  }

  return (
    <div className={styles.dropdownWrapper}>
      <button className={styles.editButton} onClick={toggleDropdown}>
        Edit <span className={styles.caret}>▼</span>
      </button>
      {open && (
        <div className={styles.dropdownMenu}>
          <button
            onClick={() => {
              onEditEmail(user)
              setOpen(false)
            }}
          >
            Primary Email
          </button>
          <button
            onClick={() => {
              onEditRoles(user)
              setOpen(false)
            }}
          >
            Roles
          </button>
          <button
            onClick={() => {
              onEditGroups(user)
              setOpen(false)
            }}
          >
            Groups
          </button>
          <button
            onClick={() => {
              onEditTerms(user)
              setOpen(false)
            }}
          >
            Terms
          </button>
          <button
            onClick={() => {
              onEditStatus(user)
              setOpen(false)
            }}
          >
            Status
          </button>
        </div>
      )}
    </div>
  )
}

export default EditDropdown
