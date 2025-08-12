import { FC, useCallback, useMemo, useState } from 'react'

import { PageTitle } from '~/libs/ui'
import { TableLoading } from '~/apps/admin/src/lib'

import { PageWrapper, ScorecardsFilter, TableNoRecord, TableScorecards } from '../../lib'
import { ScorecardsResponse, useFetchScorecards } from '../../lib/hooks'

import styles from './ScorecardsListPage.module.scss'

export const ScorecardsListPage: FC<{}> = () => {
    const [filters, setFilters] = useState({
        category: '',
        name: '',
        projectType: '',
        status: '',
        type: '',
    })
    const [page, setPage] = useState(1)
    const perPage = 10

    const breadCrumb = useMemo(
        () => [{ index: 1, label: 'Scorecards' }],
        [],
    )

    const {
        scoreCards: scorecards,
        metadata,
        isValidating: isLoadingScorecards,
    }: ScorecardsResponse = useFetchScorecards({
        challengeTrack: filters.projectType,
        challengeType: filters.category,
        name: filters.name,
        page,
        perPage,
        scorecardType: filters.type,
        status: filters.status,
    })

    const handleFiltersChange = useCallback((newFilters: typeof filters) => {
        setFilters(newFilters)
        setPage(1)
    }, [])

    return (
        <PageWrapper
            pageTitle='Scorecards'
            breadCrumb={breadCrumb}
        >
            <PageTitle>Scorecards</PageTitle>
            <div className={styles.totalScorecards}>
                {metadata?.total}
                {' '}
                scorecards
            </div>
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
                            datas={scorecards.map((item, i) => ({
                                ...item,
                                index: (page - 1) * perPage + i + 1,
                            }))}
                            metadata={metadata}
                            perPage={perPage}
                        />
                    )}

                </>
            )}

        </PageWrapper>
    )

}

export default ScorecardsListPage
