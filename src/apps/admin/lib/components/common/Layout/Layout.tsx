import { FC, PropsWithChildren, useEffect, useRef, useState } from 'react'
import { IconOutline, Portal } from '~/libs/ui'
import { useClickOutside } from '~/libs/shared'
import { ReactComponent as BarsMenuIcon } from '../../../assets/i/bars-menu-icon.svg'
import { SideNav } from '../SideNav'
import styles from './Layout.module.scss'

export const NullLayout: FC<PropsWithChildren> = ({ children }) => <>{children}</>

const Side: FC<PropsWithChildren> = ({ children }) => <div className={styles.side}>{children}</div>

const Main: FC<PropsWithChildren> = ({ children }) => {
    const [openMobileMenu, setOpenMobileMenu] = useState(false)

    useEffect(() => {
        if (openMobileMenu) {
            document.body.style.overflow = 'hidden'
            return () => {
                document.body.style.overflow = ''
            }
        }
    }, [openMobileMenu])

    return (
        <div className={styles.main}>
            <div className={styles.mobileMenuButtonContainer} onClick={() => setOpenMobileMenu(false)}>
                <button
                    className={styles.mobileMenuButton}
                    onClick={event => {
                        event.stopPropagation()
                        setOpenMobileMenu(!openMobileMenu)
                    }}
                >
                    {openMobileMenu ? (
                        <IconOutline.XIcon className='icon icon-fill' style={{ fontSize: '24px' }} />
                    ) : (
                        <BarsMenuIcon className='icon icon-fill' style={{ fontSize: '24px' }} />
                    )}
                </button>
                {openMobileMenu && (
                    <Portal className='mobileSideNav'>
                        <SideNav />
                    </Portal>
                )}
            </div>

            {children}
        </div>
    )
}

export const Layout: FC<PropsWithChildren> = ({ children }) => (
    <div className={styles.layout}>
        <Side>
            <SideNav />
        </Side>
        <Main>{children}</Main>
    </div>
)

export default Layout
