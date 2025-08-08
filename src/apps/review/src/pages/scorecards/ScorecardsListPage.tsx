import { FC, useCallback, useMemo, useState } from 'react'

import { PageTitle } from '~/libs/ui'

import { PageWrapper, ScorecardsFilter, TableNoRecord, TableScorecards } from '../../lib'
import { Scorecard } from '../../lib/models'
import { mockScorecards } from '../../mock-datas/MockScorecardList'

// import styles from './ScorecardsListPage.module.scss'

export const ScorecardsListPage: FC<{}> = () => {
    const [filters, setFilters] = useState({
        category: '',
        projectType: '',
        search: '',
        status: '',
        type: '',
    })
    const [page, setPage] = useState(1)

    const breadCrumb = useMemo(
        () => [{ index: 1, label: 'Scorecards' }],
        [],
    )
    const scorecards: Scorecard[] = mockScorecards

    const filteredScorecards = mockScorecards
        .filter(sc => {
            const matchesSearch = filters.search
                ? sc.name.toLowerCase()
                    .includes(filters.search.toLowerCase())
                : true
            const matchesType = filters.type ? sc.type === filters.type : true
            const matchesProject = filters.projectType ? sc.projectType === filters.projectType : true
            const matchesCategory = filters.category ? sc.category === filters.category : true
            const matchesStatus = filters.status ? sc.status === filters.status : true

            return matchesSearch && matchesType && matchesProject && matchesCategory && matchesStatus
        })
        .map((item, i) => ({
            ...item,
            index: i + 1, // Add index after filtering
        }))

    const handleFiltersChange = useCallback((newFilters: typeof filters) => {
        setFilters(newFilters)
        setPage(1) // Optional: reset page on filter change
    }, [])

    return (
        <PageWrapper
            pageTitle='Scorecards'
            breadCrumb={breadCrumb}
        >
            <PageTitle>Scorecards</PageTitle>
            <ScorecardsFilter
                filters={filters}
                onFiltersChange={handleFiltersChange}
            />
            {scorecards.length === 0 ? (
                <TableNoRecord />
            ) : (
                <TableScorecards
                    totalPages={20}
                    page={page}
                    setPage={setPage}
                    datas={filteredScorecards}
                />
            )}

        </PageWrapper>
    )

}

export default ScorecardsListPage
