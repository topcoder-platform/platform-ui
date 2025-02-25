// src/apps/admin/src/components/AdminNav.tsx
import React from 'react'
import { NavLink } from 'react-router-dom'
import styles from './AdminNav.module.scss'

const AdminNav: React.FC = () => {
  return (
    <div className={styles.navBar}>
      <NavLink
        to="/system-admin/challenge-management"
        className={({ isActive }) =>
          isActive ? `${styles.navItem} ${styles.active}` : styles.navItem
        }
      >
        Challenge Management
      </NavLink>

      <div className={styles.navItemDropdown}>
        <span>User Management</span>
        <div className={styles.dropdownContent}>
          <NavLink
            to="/system-admin/user-management"
            className={({ isActive }) =>
              isActive ? `${styles.dropdownItem} ${styles.active}` : styles.dropdownItem
            }
          >
            User
          </NavLink>
        </div>
      </div>
    </div>
  )
}

export default AdminNav
