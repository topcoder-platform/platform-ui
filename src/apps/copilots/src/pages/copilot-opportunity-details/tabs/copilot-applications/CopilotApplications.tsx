import { FC, useMemo } from 'react'

import { Table, TableColumn } from '~/libs/ui'

import { CopilotApplication } from '../../../../models/CopilotApplication'
import { FormattedMembers } from '../../../../services/members'

import styles from './styles.module.scss'

const tableColumns: TableColumn<CopilotApplication>[] = [
    {
        label: 'Topcoder Handle',
        propertyName: 'handle',
        type: 'text',
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
        label: 'Applied Date',
        propertyName: 'createdAt',
        type: 'date',
    },
    {
        label: 'Notes',
        propertyName: 'notes',
        renderer: (copilotApplication: CopilotApplication) => (
            <div className={styles.title}>
                {copilotApplication.notes}
            </div>
        ),
        type: 'element',
    },
]

const CopilotApplications: FC<{
    copilotApplications?: CopilotApplication[]
    members?: FormattedMembers[]
}> = props => {
    const getData = (): CopilotApplication[] => (props.copilotApplications ? props.copilotApplications.map(item => {
        const member = props.members && props.members.find(each => each.userId === item.userId)
        return {
            ...item,
            activeProjects: member?.activeProjects,
            fulfilment: member?.copilotFulfillment,
            handle: member?.handle,
        }
    })
        .sort((a, b) => (b.fulfilment || 0) - (a.fulfilment || 0)) : [])

    const tableData = useMemo(getData, [props.copilotApplications, props.members])

    return (
        <div>
            <Table
                columns={tableColumns}
                data={tableData}
                disableSorting
            />
        </div>
    )
}

export default CopilotApplications
