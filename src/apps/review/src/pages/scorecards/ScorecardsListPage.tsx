import { FC, useCallback, useMemo, useState } from 'react'

import { PageTitle } from '~/libs/ui'
import { TableLoading } from '~/apps/admin/src/lib'

import { PageWrapper, ScorecardsFilter, TableNoRecord, TableScorecards } from '../../lib'
import { ScorecardsResponse, useFetchScorecards } from '../../lib/hooks'

// import { mockScorecards } from '../../mock-datas/MockScorecardList'

// import styles from './ScorecardsListPage.module.scss'

export const ScorecardsListPage: FC<{}> = () => {
    const [filters, setFilters] = useState({
        category: '',
        name: '',
        projectType: '',
        status: '',
        type: '',
    })
    const [page, setPage] = useState(1)

    const breadCrumb = useMemo(
        () => [{ index: 1, label: 'Scorecards' }],
        [],
    )
    // const scorecards: Scorecard[] = mockScorecards

    const {
        scoreCards: scorecards,
        metadata,
        error,
        isValidating: isLoadingScorecards,
    }: ScorecardsResponse = useFetchScorecards({
        challengeTrack: filters.projectType,
        name: filters.name,
        page,
        perPage: 10,
        status: filters.status,
        type: filters.type,
    })

    console.log(error)

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
            {isLoadingScorecards ? (
                <TableLoading />
            ) : (
                <>
                    {scorecards.length === 0 ? (
                        <TableNoRecord />
                    ) : (
                        <TableScorecards
                            totalPages={metadata?.totalPages}
                            page={page}
                            setPage={setPage}
                            datas={scorecards}
                        />
                    )}

                </>
            )}

        </PageWrapper>
    )

}

export default ScorecardsListPage
