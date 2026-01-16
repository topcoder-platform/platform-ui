import { FC, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import { TabsNavbar, TabsNavItem } from '~/libs/ui'

import { rootRoute } from '../../engagements.routes'

import styles from './EngagementsTabs.module.scss'

export type EngagementsTab = 'opportunities' | 'assignments'

interface EngagementsTabsProps {
    activeTab: EngagementsTab
}

const EngagementsTabs: FC<EngagementsTabsProps> = (props: EngagementsTabsProps) => {
    const navigate = useNavigate()

    const tabsConfig = useMemo<TabsNavItem<EngagementsTab>[]>(() => ([
        { id: 'opportunities', title: 'Engagement Opportunities' },
        { id: 'assignments', title: 'My Active Assignments' },
    ]), [])

    const handleTabChange = useCallback((tabId: EngagementsTab) => {
        if (tabId === 'assignments') {
            navigate(`${rootRoute}/assignments`)
            return
        }

        navigate(rootRoute || '/')
    }, [navigate])

    return (
        <div className={styles.tabs}>
            <TabsNavbar defaultActive={props.activeTab} onChange={handleTabChange} tabs={tabsConfig} />
        </div>
    )
}

export default EngagementsTabs
