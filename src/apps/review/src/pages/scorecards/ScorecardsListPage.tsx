import { FC, useCallback, useMemo, useState } from 'react'

import { PageTitle, useConfirmationModal } from '~/libs/ui'
import { TableLoading } from '~/apps/admin/src/lib'

import { PageWrapper, ScorecardsFilter, TableNoRecord, TableScorecards } from '../../lib'
import { ScorecardsResponse, useFetchScorecards } from '../../lib/hooks'
import { cloneScorecard } from '../../lib/services'
import { Scorecard } from '../../lib/models'
import { useNavigate } from 'react-router-dom'

// import { mockScorecards } from '../../mock-datas/MockScorecardList'

// import styles from './ScorecardsListPage.module.scss'

export const ScorecardsListPage: FC<{}> = () => {
    const navigate = useNavigate()
    const { confirm, modal: confirmModal } = useConfirmationModal()

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

    const handleFiltersChange = useCallback((newFilters: Partial<typeof filters>) => {
        setFilters(newFilters as typeof filters)
        setPage(1) // Optional: reset page on filter change
    }, [])

    const handleScorecardClone = useCallback(async (scorecard: Scorecard) => {
        if (!await confirm({
            title: 'Clone Scorecard',
            content: `Are you sure you want to clone "${scorecard.name}" scorecard?`,
            action: 'Clone',
        })) {
            return;
        }

        const cloned = await cloneScorecard({id: scorecard.id})
        navigate(`${cloned.id}/details`)
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
                            onClone={handleScorecardClone}
                            totalPages={metadata?.totalPages}
                            page={page}
                            setPage={setPage}
                            datas={scorecards}
                        />
                    )}

                </>
            )}
            {confirmModal}
        </PageWrapper>
    )

}

export default ScorecardsListPage
