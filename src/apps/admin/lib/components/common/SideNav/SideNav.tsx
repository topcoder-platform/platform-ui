import { FC, useCallback, useRef } from 'react'
import { NavLink } from 'react-router-dom'

import { ReactComponent as CloudUploadIcon } from '../../../assets/i/cloud-upload-icon.svg'

import styles from './SideNav.module.scss'

const SideNav: FC = () => {
    const elementRef = useRef<HTMLDivElement>(null)

    const getActiveClassName = useCallback(
        ({ isActive }: { isActive: boolean }) => `${styles.navItem} ${isActive ? styles.active : ''}`,
        [],
    )
    return (
        <div className={styles.sideNav} ref={elementRef}>
            <nav>
                <NavLink
                    to='/admin/challenge-management'
                    className={getActiveClassName}
                >
                    <CloudUploadIcon
                        className='icon icon-fill'
                        style={{ width: '14px' }}
                    />
                    <span>v5 Challenge Management</span>
                </NavLink>
            </nav>
        </div>
    )
}

export default SideNav
