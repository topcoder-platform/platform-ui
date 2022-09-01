import { Dispatch, FC, SetStateAction, useContext, useEffect, useState } from 'react'
import { NavigateFunction, Params, useNavigate, useParams } from 'react-router-dom'

import { cacheChallengeId, clearCachedChallengeId } from '../../../../src/autoSaveBeforeLogin' // TODO: move to src-ts
import {
    LoadingSpinner,
    routeContext,
    RouteContextData,
    Table,
    TableColumn,
    tabNavItemBadgeSet,
    TabsNavbar,
    TabsNavItem,
} from '../../../lib'
import '../../../lib/styles/index.scss'
import {
    Work,
    WorkByStatus,
    workContext,
    WorkContextData,
    workGetGroupedByStatus,
    workGetStatusFilter,
    WorkStatus,
    WorkStatusFilter,
} from '../work-lib'
import { workDashboardRoute, workDetailOrDraftRoute } from '../work.routes'

import { workDashboardTabs } from './work-nav.config'
import { WorkNoResults } from './work-no-results'
import { WorkListColumnField, workListColumns } from './work-table.config'

const WorkTable: FC<{}> = () => {

    const {
        hasWork,
        initialized,
        messagesInitialized,
        work,
    }: WorkContextData = useContext(workContext)
    const { rootLoggedInRoute }: RouteContextData = useContext(routeContext)

    const [statusGroups, setStatusGroups]: [{ [status: string]: WorkByStatus } | undefined,
        Dispatch<SetStateAction<{ [status: string]: WorkByStatus } | undefined>>]
        = useState<{ [status: string]: WorkByStatus }>()

    const [tabs, setTabs]: [
        ReadonlyArray<TabsNavItem>,
        Dispatch<SetStateAction<ReadonlyArray<TabsNavItem>>>,
    ]
        = useState<ReadonlyArray<TabsNavItem>>([...workDashboardTabs])

    const [columns, setColumns]: [
        ReadonlyArray<TableColumn<Work>>,
        Dispatch<SetStateAction<ReadonlyArray<TableColumn<Work>>>>,
    ]
        = useState<ReadonlyArray<TableColumn<Work>>>([...workListColumns])

    const { statusKey }: Readonly<Params<string>> = useParams()
    const workStatusFilter: WorkStatusFilter | undefined = workGetStatusFilter(statusKey)

    const navigate: NavigateFunction = useNavigate()

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

        // init the columns based on the status
        initializeColumns(workStatusFilter, setColumns)

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

    // if we couldn't find a workstatusfilter,
    // redirect to the dashboard
    if (!workStatusFilter) {
        navigate(rootLoggedInRoute)
        return <></>
    }

    function onChangeTab(active: string): void {
        navigate(workDashboardRoute(active))
    }

    function viewSelectedWork(selectedWork: Work): void {

        // if this is a draft and there is no step saved
        // for the work, cache its ID so we can go back
        // to the beginning
        if (selectedWork.status === WorkStatus.draft && !selectedWork.draftStep) {
            cacheChallengeId(selectedWork.id)
        }

        // go to the specified step
        navigate(workDetailOrDraftRoute(selectedWork))
    }

    // define the tabs so they can be displayed on various results
    const tabsElement: JSX.Element = (
        <TabsNavbar
            tabs={tabs}
            defaultActive={workStatusFilter}
            onChange={onChangeTab}
        />
    )

    // if we haven't loaded the work yet, render the spinner
    if (!initialized) {
        return (
            <>
                {tabsElement}
                <div className='full-height-frame'>
                    <LoadingSpinner />
                </div>
            </>
        )
    }

    // if we don't have any work at all, render no results
    if (!hasWork) {
        return <WorkNoResults filtered={false} />
    }

    // get the filtered list
    const filteredResults: ReadonlyArray<Work> | undefined = statusGroups?.[workStatusFilter].results

    // if we don't have any work after filtering, render no results
    // otherwise, render the table
    const resultsElement: JSX.Element = !filteredResults?.length
        ? <WorkNoResults filtered={true} />
        : (
            <Table
                columns={columns}
                data={filteredResults}
                onRowClick={viewSelectedWork}
            />
        )

    return (
        <>
            {tabsElement}
            {resultsElement}
        </>
    )
}

export default WorkTable

function initializeColumns(
    workStatusFilter: WorkStatusFilter,
    setColumns: Dispatch<SetStateAction<ReadonlyArray<TableColumn<Work>>>>,
): void {

    // set the columns that should appear by status
    const filteredColumns: Array<TableColumn<Work>> = [...workListColumns]

    if (workStatusFilter === WorkStatusFilter.draft) {
        // if this is the draft status, remove the messages column
        filteredColumns.splice(filteredColumns.findIndex(c => c.label === WorkListColumnField.messages), 1)
    } else if (workStatusFilter !== WorkStatusFilter.all) {
        // if this isn't the draft or all status, remove the action button
        filteredColumns.splice(filteredColumns.findIndex(c => c.type === 'action'), 1)
    }

    // if this is status-specific, remove the status columm
    if (workStatusFilter !== WorkStatusFilter.all) {
        filteredColumns.splice(filteredColumns.findIndex(c => c.label === WorkListColumnField.status), 1)
    }

    setColumns(filteredColumns)
}

function initializeStatusGroups(
    initialized: boolean,
    work: ReadonlyArray<Work>,
    setStatusGroups: Dispatch<SetStateAction<{ [status: string]: WorkByStatus } | undefined>>,
    tabs: ReadonlyArray<TabsNavItem>,
    setTabs: Dispatch<SetStateAction<ReadonlyArray<TabsNavItem>>>
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
