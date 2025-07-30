import { FC, useMemo } from 'react'

import { Table, TableColumn } from '~/libs/ui'
import { USER_PROFILE_URL } from '~/config/environments/default.env'
import { CopilotOpportunity } from '~/apps/copilots/src/models/CopilotOpportunity'

import { CopilotApplication } from '../../../../models/CopilotApplication'
import { FormattedMembers } from '../../../../services/members'

import CopilotApplicationAction from './CopilotApplicationAction'
import styles from './styles.module.scss'

const tableColumns: TableColumn<CopilotApplication>[] = [
    {
        label: 'Topcoder Handle',
        propertyName: 'handle',
        renderer: (copilotApplication: CopilotApplication) => (
            <a
                href={`${USER_PROFILE_URL}/${copilotApplication.handle}`}
                target='_blank'
                rel='noreferrer'
            >
                {copilotApplication.handle}
            </a>
        ),
        type: 'element',
    },
    {
        label: 'Fulfillment Rating',
        propertyName: 'fulfilment',
        type: 'text',
    },
    {
        label: 'Active Projects',
        propertyName: 'activeProjects',
        type: 'text',
    },
    {
        label: 'Past Projects',
        propertyName: 'pastProjects',
        type: 'text',
    },
    {
        label: 'Status',
        propertyName: 'status',
        renderer: (copilotApplication: CopilotApplication) => (
            <div className={styles.status}>
                {copilotApplication.status}
            </div>
        ),
        type: 'element',
    },
    {
        label: 'Applied Date',
        propertyName: 'createdAt',
        type: 'date',
    },
    {
        label: 'Notes',
        propertyName: 'notes',
        renderer: (copilotApplication: CopilotApplication) => (
            <div className={styles.notes}>
                {copilotApplication.notes}
            </div>
        ),
        type: 'element',
    },
    {
        label: 'Actions',
        propertyName: '',
        renderer: CopilotApplicationAction,
        type: 'element',
    },
]

const CopilotApplications: FC<{
    copilotApplications?: CopilotApplication[]
    members?: FormattedMembers[]
    opportunity: CopilotOpportunity
}> = props => {
    const getData = (): CopilotApplication[] => (props.copilotApplications ? props.copilotApplications.map(item => {
        const member = props.members && props.members.find(each => each.userId === item.userId)
        return {
            ...item,
            activeProjects: member?.activeProjects || 0,
            fulfilment: member?.copilotFulfillment || 0,
            handle: member?.handle,
            opportunityStatus: props.opportunity.status,
            pastProjects: member?.pastProjects || 0,
            projectName: props.opportunity.projectName,
        }
    })
        .sort((a, b) => (b.fulfilment || 0) - (a.fulfilment || 0)) : [])

    const tableData = useMemo(getData, [props.copilotApplications, props.members])

    return (
        <div>
            {
                tableData.length > 0 ? (
                    <Table
                        columns={tableColumns}
                        data={tableData}
                        disableSorting
                        removeDefaultSort
                        preventDefault
                    />
                ) : (
                    <div className={styles.noApplications}>
                        <span>No Applications yet</span>
                    </div>
                )
            }
        </div>
    )
}

export default CopilotApplications
