import { useNavigate } from 'react-router-dom'
import { FC, useCallback, useMemo, useState } from 'react'
import { toast } from 'react-toastify'

import { PageTitle, useConfirmationModal } from '~/libs/ui'
import { TableLoading } from '~/apps/admin/src/lib'

import { Scorecard } from '../../../lib/models'
import { cloneScorecard } from '../../../lib/services'
import { PageWrapper, ScorecardsFilter, TableNoRecord, TableScorecards } from '../../../lib'
import { ScorecardsResponse, useFetchScorecards } from '../../../lib/hooks'

import styles from './ScorecardsListPage.module.scss'

export const ScorecardsListPage: FC<{}> = () => {
    const navigate = useNavigate()
    const confirmation = useConfirmationModal()

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

    const handleScorecardClone = useCallback(async (scorecard: Scorecard) => {
        if (!await confirmation.confirm({
            action: 'Clone',
            content: `Are you sure you want to clone "${scorecard.name}" scorecard?`,
            title: 'Clone Scorecard',
        })) {
            return
        }

        try {
            const cloned = await cloneScorecard({ id: scorecard.id })
            if (!cloned || !cloned.id) {
                toast.error('Failed to clone scorecard!')
                return
            }

            toast.success('Scorecard cloned successfully!')
            navigate(`${cloned.id}/details`)
        } catch (error) {
            toast.error('Failed to clone scorecard!')
            console.error('Failed to clone scorecard:', error)
        }
    }, [navigate, confirmation])

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
                            onClone={handleScorecardClone}
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
            {confirmation.modal}
        </PageWrapper>
    )

}

export default ScorecardsListPage
