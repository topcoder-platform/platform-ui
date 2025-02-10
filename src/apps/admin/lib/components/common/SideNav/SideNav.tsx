import { FC, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { ReactComponent as CloudUploadIcon } from '../../../assets/i/cloud-upload-icon.svg'
import styles from './SideNav.module.scss'

const SideNav: FC = () => {
    const elementRef = useRef<HTMLDivElement>(null)

    return (
        <div className={styles.sideNav} ref={elementRef}>
            <nav>
                <NavLink
                    to='/admin/challenge-management'
                    className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
                >
                    <CloudUploadIcon className='icon icon-fill' style={{ width: '14px' }} />
                    <span>v5 Challenge Management</span>
                </NavLink>
            </nav>
        </div>
    )
}

export default SideNav
