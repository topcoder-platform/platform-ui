import { FC, useContext, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import classNames from 'classnames'

import {
    ButtonProps,
    ContentLayout,
    LoadingSpinner,
    PageTitle,
    Table,
    TableColumn,
} from '~/libs/ui'
import { profileContext, ProfileContextData, UserRole } from '~/libs/core'

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

    const { profile }: ProfileContextData = useContext(profileContext)
    const isAdminOrPM: boolean = useMemo(
        () => !!profile?.roles?.some(role => role === UserRole.tcaAdmin || role === UserRole.projectManager),
        [profile],
    )

    const {
        data: opportunities, isValidating, size, setSize,
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

    const addNewRequestButton: ButtonProps = {
        label: 'New Copilot Request',
        onClick: () => navigate(copilotRoutesMap.CopilotRequestForm),
    }

    return (
        <ContentLayout
            title='Copilot Opportunities'
            buttonConfig={isAdminOrPM ? addNewRequestButton : undefined}
        >
            <PageTitle>Copilot Opportunities</PageTitle>
            <Table
                columns={tableColumns}
                data={tableData}
                moreToLoad={isValidating || opportunities.length > 0}
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
