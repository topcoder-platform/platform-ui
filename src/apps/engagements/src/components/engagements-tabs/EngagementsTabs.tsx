import { FC, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import { TabsNavbar, TabsNavItem } from '~/libs/ui'
import {
    useFetchEngagementTimesheets,
    UseFetchEngagementTimesheetsResult,
} from '~/apps/work/src/lib'

import { rootRoute } from '../../engagements.routes'
import { AuthCtx, useAuth } from '../../lib/utils/auth'

import styles from './EngagementsTabs.module.scss'

export type EngagementsTab = 'opportunities' | 'applications' | 'assignments' | 'timesheets'

interface EngagementsTabsProps {
    activeTab: EngagementsTab
}

const EngagementsTabs: FC<EngagementsTabsProps> = (props: EngagementsTabsProps) => {
    const navigate = useNavigate()
    const authCtx: AuthCtx = useAuth()
    const { timesheets }: UseFetchEngagementTimesheetsResult = useFetchEngagementTimesheets()
    const isAdminOrManager = authCtx.isAdmin || authCtx.isTm || timesheets.length

    const tabsConfig = useMemo<TabsNavItem<EngagementsTab>[]>(() => {
        const tabs: TabsNavItem<EngagementsTab>[] = [
            { id: 'opportunities', title: 'Engagement Opportunities' },
        ]

        if (authCtx.isLoggedIn) {
            tabs.push(
                { id: 'applications', title: 'My Applications' },
                { id: 'assignments', title: 'My Assignments' },
            )
        }

        if (isAdminOrManager) {
            tabs.push({
                id: 'timesheets',
                title: 'Timesheets',
            })
        }

        return tabs
    }, [authCtx.isLoggedIn, isAdminOrManager])

    const activeTab = useMemo(
        () => (tabsConfig.some(tab => tab.id === props.activeTab) ? props.activeTab : 'opportunities'),
        [props.activeTab, tabsConfig],
    )

    const handleTabChange = useCallback((tabId: EngagementsTab) => {
        if (tabId === 'assignments') {
            navigate(`${rootRoute}/assignments`)
            return
        }

        if (tabId === 'applications') {
            navigate(`${rootRoute}/my-applications`)
            return
        }

        if (tabId === 'timesheets') {
            navigate(`${rootRoute}/timesheets`)
            return
        }

        navigate(rootRoute || '/')
    }, [navigate])

    return (
        <div className={styles.tabs}>
            <TabsNavbar defaultActive={activeTab} onChange={handleTabChange} tabs={tabsConfig} />
        </div>
    )
}

export default EngagementsTabs
