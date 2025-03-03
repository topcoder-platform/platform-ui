import { FC, useMemo } from 'react'
import classNames from 'classnames'

import {
    ContentLayout,
    LoadingSpinner,
    PageTitle,
    Table,
    TableColumn,
} from '~/libs/ui'

import { CopilotOpportunity } from '../../models/CopilotOpportunity'
import { CopilotOpportunitiesResponse, useCopilotOpportunities } from '../../services/copilot-opportunities'

import styles from './styles.module.scss'

const tableColumns: TableColumn<CopilotOpportunity>[] = [
    {
        label: 'Title',
        propertyName: 'projectName',
        type: 'text',
    },
    {
        label: 'Status',
        propertyName: 'status',
        renderer: (copilotOpportunity: CopilotOpportunity) => (
            <div className={classNames(styles.status, copilotOpportunity.status === 'active' && styles.activeStatus)}>
                {copilotOpportunity.status}
            </div>
        ),
        type: 'element',
    },
    {
        label: 'Skills Required',
        propertyName: 'skills',
        renderer: (copilotOpportunity: CopilotOpportunity) => (
            <div className={styles.skillsContainer}>
                {copilotOpportunity.skills.map((skill: any) => (
                    <div key={skill.id} className={styles.skillPill}>
                        {skill.name}
                    </div>
                ))}
            </div>
        ),
        type: 'element',
    },
    {
        label: 'Type',
        propertyName: 'type',
        type: 'text',
    },
    {
        label: 'Starting Date',
        propertyName: 'startDate',
        type: 'date',
    },
    {
        label: 'Complexity',
        propertyName: 'complexity',
        type: 'text',
    },
    {
        label: 'Hours per week needed',
        propertyName: 'numHoursPerWeek',
        type: 'number',
    },
    {
        label: 'Payment',
        propertyName: 'paymentType',
        type: 'text',
    },
]

const CopilotOpportunityList: FC<{}> = () => {

    const {
        data: opportunities, isValidating, size, setSize,
    }: CopilotOpportunitiesResponse = useCopilotOpportunities()

    const tableData = useMemo(() => opportunities, [opportunities])

    function loadMore(): void {
        setSize(size + 1)
    }

    const opportunitiesLoading = isValidating

    return (
        <ContentLayout
            title='Copilot Opportunities'
        >
            <PageTitle>Copilot Opportunities</PageTitle>
            <Table
                columns={tableColumns}
                data={tableData}
                moreToLoad={isValidating || opportunities.length > 0}
                onLoadMoreClick={loadMore}
            />
            {opportunitiesLoading && (
                <LoadingSpinner overlay />
            ) }

        </ContentLayout>
    )
}

export default CopilotOpportunityList
