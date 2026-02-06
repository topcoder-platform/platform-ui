import {
    ChangeEvent,
    FC,
    useEffect,
    useMemo,
    useState,
} from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'

import {
    Button,
    InputSelect,
    InputSelectOption,
    LinkButton,
    LoadingSpinner,
} from '~/libs/ui'

import { rootRoute } from '../../config/routes.config'
import { FieldHandleSelect, PageWrapper } from '../../lib/components'
import { useEventCallback } from '../../lib/hooks'
import {
    Challenge,
    ChallengeFilterCriteria,
    ChallengePrizeSet,
    ChallengeWinner,
    SelectOption,
} from '../../lib/models'
import { getChallengeById, updateChallengeById } from '../../lib/services'
import { createChallengeQueryString, handleError } from '../../lib/utils'

import styles from './ChallengeDetailsPage.module.scss'

const CHALLENGE_STATUS_OPTIONS: string[] = [
    'NEW',
    'DRAFT',
    'APPROVED',
    'ACTIVE',
    'COMPLETED',
    'DELETED',
    'CANCELLED',
    'CANCELLED_FAILED_REVIEW',
    'CANCELLED_FAILED_SCREENING',
    'CANCELLED_ZERO_SUBMISSIONS',
    'CANCELLED_WINNER_UNRESPONSIVE',
    'CANCELLED_CLIENT_REQUEST',
    'CANCELLED_REQUIREMENTS_INFEASIBLE',
    'CANCELLED_ZERO_REGISTRATIONS',
    'CANCELLED_PAYMENT_FAILED',
]

type WinnersByPlacement = Record<number, SelectOption | undefined>

type RouteState = {
    previousChallengeListFilter?: ChallengeFilterCriteria
}

type WinnerUpdate = Pick<ChallengeWinner, 'handle' | 'placement' | 'userId'>

function formatStatusLabel(rawStatus: string): string {
    const normalized = rawStatus
        .trim()
        .toUpperCase()
    if (normalized.startsWith('CANCELLED_')) {
        const reason = normalized
            .replace('CANCELLED_', '')
            .toLowerCase()
            .replace(/_/g, ' ')
            .replace(/\b\w/g, char => char.toUpperCase())
        return `Cancelled: ${reason}`
    }

    return normalized
        .toLowerCase()
        .replace(/_/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase())
}

function getOrdinal(place: number): string {
    if (place % 100 >= 11 && place % 100 <= 13) {
        return `${place}th`
    }

    switch (place % 10) {
        case 1: {
            return `${place}st`
        }

        case 2: {
            return `${place}nd`
        }

        case 3: {
            return `${place}rd`
        }

        default: {
            return `${place}th`
        }
    }
}

function getPlacementPrizeSet(challenge?: Challenge): ChallengePrizeSet | undefined {
    return challenge?.prizeSets?.find(
        prizeSet => `${prizeSet.type}`.toUpperCase() === 'PLACEMENT',
    )
}

function getPlacementCount(challenge?: Challenge): number {
    const placementPrizeSet = getPlacementPrizeSet(challenge)
    const placementPrizeCount = placementPrizeSet?.prizes?.length ?? 0
    const winnerPlacementCount = Math.max(
        0,
        ...(challenge?.winners ?? []).map(winner => winner.placement),
    )

    return Math.max(placementPrizeCount, winnerPlacementCount)
}

function createWinnersByPlacement(challenge?: Challenge): WinnersByPlacement {
    const totalPlacements = getPlacementCount(challenge)
    const winnersByPlacement: WinnersByPlacement = {}
    const winnerLookup = new Map<number, SelectOption>()
    const winners = challenge?.winners ?? []

    winners.forEach(winner => {
        winnerLookup.set(winner.placement, {
            label: winner.handle,
            value: winner.userId,
        })
    })

    for (let placement = 1; placement <= totalPlacements; placement += 1) {
        winnersByPlacement[placement] = winnerLookup.get(placement)
    }

    return winnersByPlacement
}

function createWinnerPayload(
    placements: number[],
    winnersByPlacement: WinnersByPlacement,
): WinnerUpdate[] {
    const payload: WinnerUpdate[] = []

    placements.forEach(placement => {
        const selectedWinner = winnersByPlacement[placement]
        if (!selectedWinner) {
            return
        }

        const userId = Number(selectedWinner.value)
        if (!Number.isFinite(userId) || userId <= 0) {
            return
        }

        payload.push({
            handle: `${selectedWinner.label}`,
            placement,
            userId,
        })
    })

    return payload
}

/**
 * Challenge details management page.
 */
export const ChallengeDetailsPage: FC = () => {
    const { challengeId = '' }: { challengeId?: string }
        = useParams<{ challengeId: string }>()
    const location = useLocation()
    const routeState = (location.state || {}) as RouteState
    const [challengeInfo, setChallengeInfo] = useState<Challenge>()
    const [selectedStatus, setSelectedStatus] = useState('')
    const [winnersByPlacement, setWinnersByPlacement] = useState<WinnersByPlacement>({})
    const [isLoading, setIsLoading] = useState(false)
    const [isSavingStatus, setIsSavingStatus] = useState(false)
    const [isSavingWinners, setIsSavingWinners] = useState(false)

    const hydrateChallenge = useEventCallback((challenge: Challenge): void => {
        setChallengeInfo(challenge)
        setSelectedStatus(challenge.status || '')
        setWinnersByPlacement(createWinnersByPlacement(challenge))
    })

    const loadChallenge = useEventCallback(async () => {
        if (!challengeId) {
            return
        }

        setIsLoading(true)
        try {
            const challenge = await getChallengeById(challengeId)
            hydrateChallenge(challenge)
        } catch (error) {
            handleError(error)
        } finally {
            setIsLoading(false)
        }
    })

    useEffect(() => {
        loadChallenge()
    }, [challengeId, loadChallenge])

    const statusOptions = useMemo<InputSelectOption[]>(() => {
        const values = [...CHALLENGE_STATUS_OPTIONS]
        if (challengeInfo?.status && !values.includes(challengeInfo.status)) {
            values.push(challengeInfo.status)
        }

        return values.map(value => ({
            label: formatStatusLabel(value),
            value,
        }))
    }, [challengeInfo?.status])

    const placementNumbers = useMemo<number[]>(
        () => Array.from({ length: getPlacementCount(challengeInfo) }, (_, index) => index + 1),
        [challengeInfo],
    )

    const backToChallengeListRoute = useMemo(() => {
        const previousChallengeListFilter = routeState.previousChallengeListFilter
        const query = previousChallengeListFilter
            ? `?${createChallengeQueryString(previousChallengeListFilter)}`
            : ''
        return `${rootRoute}/challenge-management${query}`
    }, [routeState.previousChallengeListFilter])

    const pageTitle = challengeInfo?.name || 'Challenge Details'

    const handleStatusChange = useEventCallback(
        (event: ChangeEvent<HTMLInputElement>): void => {
            setSelectedStatus(event.target.value)
        },
    )

    const handleSaveStatus = useEventCallback(async () => {
        if (
            !challengeId
            || !challengeInfo
            || !selectedStatus
            || selectedStatus === challengeInfo.status
        ) {
            return
        }

        setIsSavingStatus(true)
        try {
            const updatedChallenge = await updateChallengeById(challengeId, {
                status: selectedStatus as Challenge['status'],
            })
            hydrateChallenge(updatedChallenge)
            toast.success('Challenge status updated successfully')
        } catch (error) {
            handleError(error)
        } finally {
            setIsSavingStatus(false)
        }
    })

    const createHandleWinnerChange = (placement: number) => (
        selectedWinner: SelectOption,
    ): void => {
        setWinnersByPlacement(previous => ({
            ...previous,
            [placement]: selectedWinner,
        }))
    }

    const createHandleWinnerClear = (placement: number) => (): void => {
        setWinnersByPlacement(previous => ({
            ...previous,
            [placement]: undefined,
        }))
    }

    const handleSaveWinners = useEventCallback(async () => {
        if (!challengeId || !challengeInfo) {
            return
        }

        const winnerPayload = createWinnerPayload(
            placementNumbers,
            winnersByPlacement,
        )
        const payload: {
            status?: Challenge['status']
            winners: WinnerUpdate[]
        } = {
            winners: winnerPayload,
        }

        if (selectedStatus && selectedStatus !== challengeInfo.status) {
            payload.status = selectedStatus as Challenge['status']
        }

        const statusAfterUpdate = payload.status || challengeInfo.status
        if (winnerPayload.length > 0 && statusAfterUpdate !== 'COMPLETED') {
            toast.error('Set challenge status to COMPLETED before saving winners.')
            return
        }

        setIsSavingWinners(true)
        try {
            const updatedChallenge = await updateChallengeById(challengeId, payload)
            hydrateChallenge(updatedChallenge)
            toast.success('Challenge winners updated successfully')
        } catch (error) {
            handleError(error)
        } finally {
            setIsSavingWinners(false)
        }
    })

    return (
        <PageWrapper
            pageTitle={pageTitle}
            className={styles.container}
            headerActions={(
                <div className={styles.headerButtons}>
                    <LinkButton
                        primary
                        to='./manage-user'
                        size='lg'
                        state={routeState}
                    >
                        Manage Users
                    </LinkButton>
                    <LinkButton
                        primary
                        to='./manage-submission'
                        size='lg'
                        state={routeState}
                    >
                        Manage Submissions
                    </LinkButton>
                    <LinkButton
                        primary
                        light
                        to={backToChallengeListRoute}
                        size='lg'
                    >
                        Back
                    </LinkButton>
                </div>
            )}
        >
            {isLoading && (
                <div className={styles.loadingSpinnerContainer}>
                    <LoadingSpinner className={styles.spinner} />
                </div>
            )}
            {!isLoading && !challengeInfo && (
                <p className={styles.noData}>Unable to load challenge details.</p>
            )}
            {!isLoading && challengeInfo && (
                <>
                    <section className={styles.section}>
                        <h4 className={styles.sectionTitle}>Status</h4>
                        <div className={styles.statusRow}>
                            <InputSelect
                                name='status'
                                label='Challenge Status'
                                options={statusOptions}
                                value={selectedStatus}
                                onChange={handleStatusChange}
                                placeholder='Select status'
                                disabled={isSavingStatus}
                                classNameWrapper={styles.selectWrapper}
                            />
                            <Button
                                primary
                                size='lg'
                                onClick={handleSaveStatus}
                                disabled={
                                    isSavingStatus
                                    || !selectedStatus
                                    || selectedStatus === challengeInfo.status
                                }
                            >
                                Save Status
                            </Button>
                        </div>
                    </section>

                    <section className={styles.section}>
                        <h4 className={styles.sectionTitle}>Winners</h4>
                        {placementNumbers.length === 0 && (
                            <p className={styles.noData}>
                                This challenge has no placement prizes configured.
                            </p>
                        )}
                        {placementNumbers.length > 0 && (
                            <>
                                <div className={styles.winnersList}>
                                    {placementNumbers.map(placement => (
                                        <div key={placement} className={styles.winnerRow}>
                                            <FieldHandleSelect
                                                label={`${getOrdinal(placement)} Place`}
                                                classNameWrapper={styles.selectWrapper}
                                                value={winnersByPlacement[placement]}
                                                onChange={createHandleWinnerChange(placement)}
                                                disabled={isSavingWinners}
                                            />
                                            <Button
                                                secondary
                                                size='lg'
                                                onClick={createHandleWinnerClear(placement)}
                                                disabled={
                                                    !winnersByPlacement[placement]
                                                    || isSavingWinners
                                                }
                                            >
                                                Clear
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                                <div className={styles.sectionActions}>
                                    <Button
                                        primary
                                        size='lg'
                                        onClick={handleSaveWinners}
                                        disabled={isSavingWinners}
                                    >
                                        Save Winners
                                    </Button>
                                </div>
                            </>
                        )}
                    </section>

                    <section className={styles.section}>
                        <h4 className={styles.sectionTitle}>Raw API Response</h4>
                        <pre className={styles.apiResponse}>
                            <code>{JSON.stringify(challengeInfo, undefined, 2)}</code>
                        </pre>
                    </section>
                </>
            )}
        </PageWrapper>
    )
}

export default ChallengeDetailsPage
