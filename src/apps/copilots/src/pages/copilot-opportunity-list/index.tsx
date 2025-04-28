import { FC, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import classNames from 'classnames'

import {
    ContentLayout,
    LoadingSpinner,
    PageTitle,
    Table,
    TableColumn,
} from '~/libs/ui'

import { CopilotOpportunity } from '../../models/CopilotOpportunity'
import { copilotRoutesMap } from '../../copilots.routes'
import { CopilotOpportunitiesResponse, useCopilotOpportunities } from '../../services/copilot-opportunities'
import { ProjectTypeLabels } from '../../constants'

import styles from './styles.module.scss'

const tableColumns: TableColumn<CopilotOpportunity>[] = [
    {
        label: 'Title',
        propertyName: 'projectName',
        renderer: (copilotOpportunity: CopilotOpportunity) => (
            <div className={styles.title}>
                {copilotOpportunity.projectName}
            </div>
        ),
        type: 'element',
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
        isSortable: false,
        label: 'Skills Required',
        propertyName: 'skills',
        renderer: (copilotOpportunity: CopilotOpportunity) => {
            const visibleSkills = copilotOpportunity.skills.slice(0, 3)
            const remainingSkills = copilotOpportunity.skills.slice(3)
            return (
                <div className={styles.skillsContainer}>
                    {visibleSkills.map((skill: { id: string | number; name: string }) => (
                        <div key={skill.id} className={styles.skillPill}>
                            {skill.name}
                        </div>
                    ))}
                    {remainingSkills.length > 0 && (
                        <div
                            className={styles.skillPill}
                            title={remainingSkills.map(skill => skill.name)
                                .join(', ')}
                        >
                            +
                            {remainingSkills.length}
                        </div>
                    )}
                </div>
            )
        },
        type: 'element',
    },
    {
        label: 'Type',
        propertyName: 'type',
        renderer: (copilotOpportunity: CopilotOpportunity) => (
            <div className={styles.type}>
                {ProjectTypeLabels[copilotOpportunity.projectType]}
            </div>
        ),
        type: 'element',
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
        label: 'Hours/Week',
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
    const navigate = useNavigate()

    const {
        data: opportunities, hasMoreOpportunities, isValidating, size, setSize,
    }: CopilotOpportunitiesResponse = useCopilotOpportunities()

    const tableData = useMemo(() => opportunities.map(opportunity => ({
        ...opportunity,
        type: ProjectTypeLabels[opportunity.projectType] ?? '',
    })), [opportunities])

    function loadMore(): void {
        setSize(size + 1)
    }

    function handleRowClick(opportunity: CopilotOpportunity): void {
        navigate(copilotRoutesMap.CopilotOpportunityDetails.replace(':opportunityId', `${opportunity.id}`))
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
                moreToLoad={hasMoreOpportunities}
                onLoadMoreClick={loadMore}
                onRowClick={handleRowClick}
                removeDefaultSort
            />
            {opportunitiesLoading && (
                <LoadingSpinner overlay />
            ) }

        </ContentLayout>
    )
}

export default CopilotOpportunityList
