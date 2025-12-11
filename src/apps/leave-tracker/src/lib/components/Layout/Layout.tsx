import { FC, PropsWithChildren } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { Button, ContentLayout, IconOutline } from '~/libs/ui'
import { APP_NAME } from '../../../config/index.config'
import { rootRoute, teamCalendarRouteId } from '../../../config/routes.config'

import styles from './Layout.module.scss'

export const NullLayout: FC<PropsWithChildren> = props => (
    <>{props.children}</>
)

export const Layout: FC<PropsWithChildren> = props => {
    const location = useLocation()
    const navigate = useNavigate()

    const buildPath = (...parts: string[]): string => {
        const cleanedParts = parts
            .filter(Boolean)
            .map(part => part.replace(/^\/+|\/+$/g, ''))

        return `/${cleanedParts.join('/')}` || '/'
    }

    const normalizedRootPath = rootRoute || ''
    const teamCalendarPath = buildPath(normalizedRootPath, teamCalendarRouteId)
    const personalCalendarPath = buildPath(normalizedRootPath)
    const normalizedCurrentPath = location.pathname.replace(/\/+$/, '') || '/'
    const isTeamCalendar = normalizedCurrentPath === teamCalendarPath
    const buttonLabel = isTeamCalendar ? 'View My Calendar' : 'View Team Leave'
    const buttonIcon = isTeamCalendar ? IconOutline.UserIcon : IconOutline.UsersIcon
    const targetPath = isTeamCalendar ? personalCalendarPath : teamCalendarPath

    return (
        <ContentLayout
            innerClass={styles.contentLayoutInner}
            outerClass={styles.contentLayoutOuter}
        >
            <div className={styles.layout}>
                <header className={styles.header}>
                    <h1 className={styles.title}>{APP_NAME}</h1>
                    <div className={styles.headerActions}>
                        <Button
                            secondary
                            icon={buttonIcon}
                            onClick={() => navigate(targetPath)}
                        >
                            {buttonLabel}
                        </Button>
                    </div>
                </header>
                <main className={styles.main}>{props.children}</main>
            </div>
        </ContentLayout>
    )
}

export default Layout
