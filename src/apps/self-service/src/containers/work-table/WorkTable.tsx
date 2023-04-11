import { FC, useEffect, useMemo } from 'react'
import { NavigateFunction, useNavigate } from 'react-router-dom'

import { Table, TableColumn } from '~/libs/ui'

import { cacheChallengeId, clearCachedChallengeId } from '../../utils/autoSaveBeforeLogin'
import {
    Work,
    WorkStatus,
    WorkStatusFilter,
} from '../../lib'
import { workDetailOrDraftRoute } from '../../self-service.routes'
import { WorkNoResults } from '../../components/work-table'

import { WorkListColumnField, workListColumns } from './work-table.config'

interface WorkTableProps {
    workItems: ReadonlyArray<Work> | undefined
    statusFilter: WorkStatusFilter | undefined
}

const WorkTable: FC<WorkTableProps> = props => {
    const navigate: NavigateFunction = useNavigate()

    // build the columns based on the status
    const columns: ReadonlyArray<TableColumn<Work>> = useMemo(() => {

        // set the columns that should appear by status
        const filteredColumns: Array<TableColumn<Work>> = [...workListColumns]

        if (props.statusFilter === WorkStatusFilter.draft) {
            // if this is the draft status, remove the messages column
            filteredColumns.splice(filteredColumns.findIndex(c => c.label === WorkListColumnField.messages), 1)
        } else if (props.statusFilter !== WorkStatusFilter.all) {
            // if this isn't the draft or all status, remove the action button
            filteredColumns.splice(filteredColumns.findIndex(c => c.type === 'action'), 1)
        }

        // if this is status-specific, remove the status columm
        if (props.statusFilter !== WorkStatusFilter.all) {
            filteredColumns.splice(filteredColumns.findIndex(c => c.label === WorkListColumnField.status), 1)
        }

        return filteredColumns
    }, [props.statusFilter])

    useEffect(() => { clearCachedChallengeId() }, [])

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

    // if we don't have any work after filtering, render no results
    // otherwise, render the table
    return !props.workItems?.length
        ? <WorkNoResults filtered />
        : (
            <Table
                columns={columns}
                data={props.workItems}
                onRowClick={viewSelectedWork}
            />
        )
}

export default WorkTable
