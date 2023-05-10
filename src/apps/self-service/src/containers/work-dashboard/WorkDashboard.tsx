import { Dispatch, FC, SetStateAction, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { NavigateFunction, Params, useNavigate, useParams } from 'react-router-dom'
import { useDispatch } from 'react-redux'

import { routerContext, RouterContextData } from '~/libs/core'
import { ButtonProps, ContentLayout, LoadingSpinner, tabNavItemBadgeSet, TabsNavbar, TabsNavItem } from '~/libs/ui'

import {
    Work,
    WorkByStatus,
    workContext,
    WorkContextData,
    workGetGroupedByStatus,
    workGetStatusFilter,
    WorkStatusFilter,
} from '../../lib'
import { clearAutoSavedForm, clearCachedChallengeId } from '../../utils/autoSaveBeforeLogin'
import { getWorkDashboardRoute } from '../../self-service.routes'
import { WorkTable } from '../work-table'
import { WorkNoResults } from '../../components/work-table'
import { resetIntakeForm } from '../../actions/form'
import { selfServiceStartRoute } from '../../config'

import { workDashboardTabs } from './work-nav.config'

const WorkDashboard: FC<{}> = () => {
    const dispatch: Dispatch<any> = useDispatch()

    const { rootLoggedInRoute }: RouterContextData = useContext(routerContext)

    const {
        hasWork,
        initialized,
        messagesInitialized,
        work,
    }: WorkContextData = useContext(workContext)

    const [statusGroups, setStatusGroups]: [{ [status: string]: WorkByStatus } | undefined,
        Dispatch<SetStateAction<{ [status: string]: WorkByStatus } | undefined>>]
        = useState<{ [status: string]: WorkByStatus }>()

    const [tabs, setTabs]: [
        ReadonlyArray<TabsNavItem>,
        Dispatch<SetStateAction<ReadonlyArray<TabsNavItem>>>,
    ]
        = useState<ReadonlyArray<TabsNavItem>>([...workDashboardTabs])

    const { statusKey }: Readonly<Params<string>> = useParams()
    const workStatusFilter: WorkStatusFilter | undefined = workGetStatusFilter(statusKey)

    const navigate: NavigateFunction = useNavigate()

    const startWork: () => void = useCallback(() => {
        clearCachedChallengeId()
        clearAutoSavedForm()
        dispatch(resetIntakeForm(true))
        navigate(selfServiceStartRoute)
    }, [
        dispatch,
        navigate,
    ])

    // it's super annoying that you have to define this hook before the conditionals
    // to return non-table results, but just another joy of react
    useEffect(() => {
        // if we don't have a status filter, we have a problem,
        // so don't do anything
        if (!workStatusFilter) {
            return
        }

        // init the status groups and set the tab badges
        initializeStatusGroups(initialized, work, setStatusGroups, tabs, setTabs)

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        initialized,
        messagesInitialized,
        // tabs change every render so we can't make it a dependency
        // tabs,
        work,
        workStatusFilter,
    ])

    useEffect(() => {
        clearCachedChallengeId()
    }, [])

    const buttonConfig: ButtonProps = useMemo(() => ({
        label: 'Start work',
        onClick: startWork,
    }), [startWork])

    // if we couldn't find a workstatusfilter,
    // redirect to the dashboard
    if (!workStatusFilter) {
        navigate(rootLoggedInRoute)
        return <></>
    }

    function onChangeTab(active: string): void {
        navigate(getWorkDashboardRoute(active))
    }

    // get the filtered list
    const filteredResults: ReadonlyArray<Work> | undefined = statusGroups?.[workStatusFilter].results

    return (
        <ContentLayout
            buttonConfig={buttonConfig}
            title='My Work'
        >
            <div className='full-height-frame'>
                <LoadingSpinner hide={initialized} />

                {initialized && (
                    !hasWork ? (
                        <WorkNoResults filtered={false} />
                    ) : (
                        <>
                            <TabsNavbar
                                tabs={tabs}
                                defaultActive={workStatusFilter}
                                onChange={onChangeTab}
                            />
                            <WorkTable
                                workItems={filteredResults}
                                statusFilter={workStatusFilter}
                            />
                        </>
                    )
                )}
            </div>
        </ContentLayout>

    )
}

function initializeStatusGroups(
    initialized: boolean,
    work: ReadonlyArray<Work>,
    setStatusGroups: Dispatch<SetStateAction<{ [status: string]: WorkByStatus } | undefined>>,
    tabs: ReadonlyArray<TabsNavItem>,
    setTabs: Dispatch<SetStateAction<ReadonlyArray<TabsNavItem>>>,
): void {

    // if we're not initialized, nothing else to do
    if (!initialized) {
        return
    }

    const groups: { [status: string]: WorkByStatus } = workGetGroupedByStatus(work)
    setStatusGroups(groups)

    // set the count tab badges
    const badgedTabs: ReadonlyArray<TabsNavItem> = [...tabs]
    badgedTabs
        // don't add badges for done or all
        .filter(tab => ![WorkStatusFilter.all, WorkStatusFilter.done]
            .includes(WorkStatusFilter[tab.id as keyof typeof WorkStatusFilter]))
        .forEach(tab => {
            const info: WorkByStatus = groups[tab.id]
            tab.badges = tab.badges || []
            tabNavItemBadgeSet(tab.badges, 'info', info.count)
            tabNavItemBadgeSet(tab.badges, 'important', info.messageCount)
        })
    setTabs(badgedTabs)
}

export default WorkDashboard
