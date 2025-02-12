import {
    FC,
    MouseEventHandler,
    PropsWithChildren,
    useEffect,
    useState,
} from 'react'

import { IconOutline, Portal } from '~/libs/ui'

import { ReactComponent as BarsMenuIcon } from '../../../assets/i/bars-menu-icon.svg'
import { useEventCallback } from '../../../hooks'
import { SideNav } from '../SideNav'

import styles from './Layout.module.scss'

export const NullLayout: FC<PropsWithChildren> = props => (
    <>{props.children}</>
)

const Side: FC<PropsWithChildren> = props => (
    <div className={styles.side}>{props.children}</div>
)

const Main: FC<PropsWithChildren> = props => {
    const [openMobileMenu, setOpenMobileMenu] = useState(false)

    useEffect(() => {
        if (openMobileMenu) {
            document.body.style.overflow = 'hidden'
            return () => {
                document.body.style.overflow = ''
            }
        }

        return () => undefined
    }, [openMobileMenu])

    const handleCloseMobileMenu = useEventCallback(() => setOpenMobileMenu(false))
    const handleToggleMobileMenu: MouseEventHandler<HTMLButtonElement>
        = useEventCallback(event => {
            event.stopPropagation()
            setOpenMobileMenu(!openMobileMenu)
        })

    return (
        <div className={styles.main}>
            <div
                className={styles.mobileMenuButtonContainer}
                onClick={handleCloseMobileMenu}
            >
                <button
                    className={styles.mobileMenuButton}
                    onClick={handleToggleMobileMenu}
                    type='button'
                >
                    {openMobileMenu ? (
                        <IconOutline.XIcon
                            className='icon icon-fill'
                            style={{ fontSize: '24px' }}
                        />
                    ) : (
                        <BarsMenuIcon
                            className='icon icon-fill'
                            style={{ fontSize: '24px' }}
                        />
                    )}
                </button>
                {openMobileMenu && (
                    <Portal className='mobileSideNav'>
                        <SideNav />
                    </Portal>
                )}
            </div>

            {props.children}
        </div>
    )
}

export const Layout: FC<PropsWithChildren> = props => (
    <div className={styles.layout}>
        <Side>
            <SideNav />
        </Side>
        <Main>{props.children}</Main>
    </div>
)

export default Layout
