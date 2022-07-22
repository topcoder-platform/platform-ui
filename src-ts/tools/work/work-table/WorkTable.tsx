import { Dispatch, FC, SetStateAction, useContext, useEffect, useState } from 'react'
import { NavigateFunction, Params, useNavigate, useParams } from 'react-router-dom'

import { cacheChallengeId } from '../../../../src/autoSaveBeforeLogin' // TODO: move to src-ts
import {
    LoadingSpinner,
    routeContext,
    RouteContextData,
    Table,
    TableColumn,
    TabsNavbar,
    TabsNavItem,
} from '../../../lib'
import {
    Work,
    WorkByStatus,
    workContext,
    WorkContextData,
    workGetGroupedByStatus,
    workGetStatusFilter,
    WorkStatus,
    WorkStatusFilter,
    WorkType,
} from '../work-lib'
import { WorkIntakeFormRoutes } from '../work-lib/work-provider/work-functions/work-store/work-intake-form-routes.config'
import { selfServiceStartRoute, workDetailRoute } from '../work.routes'

import { workDashboardTabs } from './work-nav.config'
import { WorkNoResults } from './work-no-results'
import { WorkListColumnField, workListColumns } from './work-table.config'
import styles from './WorkTable.module.scss'

const WorkTable: FC<{}> = () => {

    const workContextData: WorkContextData = useContext(workContext)
    const { hasWork, work, initialized }: WorkContextData = workContextData

    const { rootLoggedInRoute }: RouteContextData = useContext(routeContext)

    const [statusGroups, setStatusGroups]: [{ [status: string]: WorkByStatus } | undefined,
        Dispatch<SetStateAction<{ [status: string]: WorkByStatus } | undefined>>]
        = useState<{ [status: string]: WorkByStatus }>()

    const [tabs, setTabs]: [ReadonlyArray<TabsNavItem>, Dispatch<SetStateAction<ReadonlyArray<TabsNavItem>>>]
        = useState<ReadonlyArray<TabsNavItem>>([...workDashboardTabs])

    const [columns, setColumns]: [ReadonlyArray<TableColumn<Work>>, Dispatch<ReadonlyArray<TableColumn<Work>>>]
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

        // if the status filter is all, just set the default columns
        if (workStatusFilter === WorkStatusFilter.all) {
            setColumns([...workListColumns])
            return
        }

        const filteredColumns: Array<TableColumn<Work>> = [...workListColumns]
        filteredColumns.splice(workListColumns.findIndex(c => c.label === WorkListColumnField.status), 1)
        setColumns(filteredColumns)
    }, [
        initialized,
        work,
        workStatusFilter,
    ])

    // if we couldn't find a workstatusfilter,
    // redirect to the dashboard
    if (!workStatusFilter) {
        navigate(rootLoggedInRoute)
        return <></>
    }

    function onChangeTab(active: string): void {
        navigate(`${rootLoggedInRoute}/${active}`)
    }

    function viewWorkDetails(selectedWork: Work): void {

        const isDraft: boolean = selectedWork.status === WorkStatus.draft

        // TODO: move the tabs definition to src-ts
        // so we don't have to hard-code this tab id
        let url: string = workDetailRoute(selectedWork.id, selectedWork.status === WorkStatus.ready ? 'solutions' : undefined)

        if (isDraft) {
            if (selectedWork.draftStep) {
                url = `${WorkIntakeFormRoutes[selectedWork.type][selectedWork.draftStep]}/${selectedWork.id}`
            } else {
                cacheChallengeId(selectedWork.id)
                url = selfServiceStartRoute
            }
        }

        navigate(url)
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
                <div className={styles.loader}>
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
                onRowClick={viewWorkDetails}
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
            if (!!info.count) {
                tab.badges = [
                    {
                        count: info.count,
                        type: 'info',
                    },
                ]
            }
        })
    setTabs(badgedTabs)
}
