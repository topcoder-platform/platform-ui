import { FC, PropsWithChildren, useEffect, useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'

import { ContentLayout } from '~/libs/ui'

import { roleErrorRouteId } from '../../../config/routes.config'
import { NavTabs } from '../NavTabs'

import styles from './Layout.module.scss'

function resetScrollPosition(): void {
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0

    document.querySelectorAll('#root, .root-container')
        .forEach((element: Element) => {
            if (element instanceof HTMLElement) {
                element.scrollTop = 0
            }
        })
}

export const NullLayout: FC<PropsWithChildren> = props => (
    <>{props.children}</>
)

export const Layout: FC<PropsWithChildren> = props => {
    const { pathname }: { pathname: string } = useLocation()
    const hideNavTabs = isRoleErrorPath(pathname)

    useEffect(() => {
        if ('scrollRestoration' in window.history) {
            window.history.scrollRestoration = 'manual'
        }
    }, [])

    useLayoutEffect(() => {
        resetScrollPosition()

        const frameId = requestAnimationFrame(() => {
            resetScrollPosition()
        })

        return () => cancelAnimationFrame(frameId)
    }, [pathname])

    return (
        <>
            {!hideNavTabs && <NavTabs />}
            <ContentLayout
                innerClass={styles.contantentLayoutInner}
                outerClass={styles.contentLayoutOuter}
            >
                <div className={styles.layout}>
                    <div className={styles.main} key={pathname}>
                        {props.children}
                    </div>
                </div>
            </ContentLayout>
        </>
    )
}

function isRoleErrorPath(pathname: string): boolean {
    const normalizedPath = pathname === '/'
        ? pathname
        : pathname.replace(/\/+$/, '')

    return normalizedPath === `/${roleErrorRouteId}`
        || normalizedPath.endsWith(`/${roleErrorRouteId}`)
}

export default Layout
