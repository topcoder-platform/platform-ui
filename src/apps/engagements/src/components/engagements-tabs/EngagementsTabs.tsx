import { FC, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import { useProfileContext } from '~/libs/core'
import { TabsNavbar, TabsNavItem } from '~/libs/ui'

import { rootRoute } from '../../engagements.routes'

import styles from './EngagementsTabs.module.scss'

export type EngagementsTab = 'opportunities' | 'applications' | 'assignments'

interface EngagementsTabsProps {
    activeTab: EngagementsTab
}

const EngagementsTabs: FC<EngagementsTabsProps> = (props: EngagementsTabsProps) => {
    const navigate = useNavigate()
    const profileContext = useProfileContext()
    const isLoggedIn = profileContext.isLoggedIn

    const tabsConfig = useMemo<TabsNavItem<EngagementsTab>[]>(() => {
        const tabs: TabsNavItem<EngagementsTab>[] = [
            { id: 'opportunities', title: 'Engagement Opportunities' },
        ]

        if (isLoggedIn) {
            tabs.push(
                { id: 'applications', title: 'My Applications' },
                { id: 'assignments', title: 'My Assignments' },
            )
        }

        return tabs
    }, [isLoggedIn])

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

        navigate(rootRoute || '/')
    }, [navigate])

    return (
        <div className={styles.tabs}>
            <TabsNavbar defaultActive={activeTab} onChange={handleTabChange} tabs={tabsConfig} />
        </div>
    )
}

export default EngagementsTabs
