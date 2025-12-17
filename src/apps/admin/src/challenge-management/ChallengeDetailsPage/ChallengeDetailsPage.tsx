import {
    FC,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'

import {
    Button,
    InputText,
    LinkButton,
    LoadingSpinner,
    PageDivider,
} from '~/libs/ui'

import { rootRoute } from '../../config/routes.config'
import {
    Challenge,
    ChallengeFilterCriteria,
    ChallengeStatus,
    ChallengeWinner,
    SelectOption,
} from '../../lib/models'
import {
    Display,
    FieldHandleSelect,
    FieldSingleSelect,
    PageWrapper,
} from '../../lib/components'
import { ChallengeManagementContext } from '../../lib/contexts'
import { useEventCallback } from '../../lib/hooks'
import {
    getChallengeById,
    updateChallengeStatus,
    updateChallengeWinners,
} from '../../lib/services'
import {
    checkIsMM,
    createChallengeQueryString,
    handleError,
} from '../../lib/utils'

import styles from './ChallengeDetailsPage.module.scss'

type EditableWinner = {
    id: string
    placement: number
    handle?: string
    userId?: number
}

type NormalizedWinner = {
    placement: number
    handle: string
    userId: number | null
}

const formatStatusLabel = (status?: string): string => {
    if (!status) return ''
    return status
        .toLowerCase()
        .split('_')
        .map(word => (word ? `${word[0].toUpperCase()}${word.slice(1)}` : word))
        .join(' ')
}

const toNumberOrNull = (value?: number | string): number | null => {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
}

const normalizeWinners = (
    winners: Array<{ placement?: number; handle?: string; userId?: number | string }>,
): NormalizedWinner[] => winners
    .map(item => ({
        handle: item.handle ?? '',
        placement: Number(item.placement) || 0,
        userId: toNumberOrNull(item.userId),
    }))
    .sort((a, b) => a.placement - b.placement)

const createRowId = (seed?: { placement?: number; handle?: string; userId?: number | string }): string => {
    const safePlacement = seed?.placement ?? 'row'
    const safeHandle = seed?.handle ?? seed?.userId ?? 'new'
    return `${safePlacement}-${safeHandle}-${Math.random().toString(16).slice(2)}`
}

const toEditableWinners = (winners?: ChallengeWinner[]): EditableWinner[] => (
    winners
        ? winners
            .slice()
            .sort((a, b) => a.placement - b.placement)
            .map(winner => ({
                handle: winner.handle,
                id: createRowId({
                    handle: winner.handle,
                    placement: winner.placement,
                    userId: winner.userId,
                }),
                placement: winner.placement,
                userId: toNumberOrNull(winner.userId) ?? undefined,
            }))
        : []
)

const highlightJson = (value: unknown): Array<string | JSX.Element> => {
    const jsonString = JSON.stringify(value ?? {}, null, 2) ?? ''
    const parts: Array<string | JSX.Element> = []
    const regex
        = /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(?:\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g
    let lastIndex = 0

    for (const match of jsonString.matchAll(regex)) {
        const token = match[0]
        const index = match.index ?? 0
        if (index > lastIndex) {
            parts.push(jsonString.slice(lastIndex, index))
        }

        let className = styles.jsonNumber
        if (/^"/.test(token)) {
            className = /:$/.test(token) ? styles.jsonKey : styles.jsonString
        } else if (/true|false/.test(token)) {
            className = styles.jsonBoolean
        } else if (/null/.test(token)) {
            className = styles.jsonNull
        }

        parts.push(
            <span
                className={className}
                key={`json-${index}-${token.length}`}
            >
                {token}
            </span>,
        )

        lastIndex = index + token.length
    }

    if (lastIndex < jsonString.length) {
        parts.push(jsonString.slice(lastIndex))
    }

    return parts
}

export const ChallengeDetailsPage: FC = () => {
    const { challengeId = '' }: { challengeId?: string } = useParams()
    const location = useLocation()
    const routeState: { previousChallengeListFilter?: ChallengeFilterCriteria }
        = (location.state as { previousChallengeListFilter?: ChallengeFilterCriteria })
        || {}
    const { challengeStatuses } = useContext(ChallengeManagementContext)

    const [challenge, setChallenge] = useState<Challenge>()
    const [isLoading, setIsLoading] = useState(true)
    const [statusOption, setStatusOption] = useState<SelectOption | null>(null)
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
    const [isSavingWinners, setIsSavingWinners] = useState(false)
    const [winnerRows, setWinnerRows] = useState<EditableWinner[]>([])

    const isMM = useMemo(() => checkIsMM(challenge), [challenge])

    const challengeStatusOptions: SelectOption[] = useMemo(() => {
        const allStatuses = new Set<string>(challengeStatuses)
        if (challenge?.status) {
            allStatuses.add(challenge.status)
        }
        return Array.from(allStatuses.values())
            .map(status => ({
                label: formatStatusLabel(status),
                value: status,
            }))
    }, [challenge?.status, challengeStatuses])

    const normalizedInitialWinners = useMemo(
        () => normalizeWinners(challenge?.winners ?? []),
        [challenge?.winners],
    )
    const normalizedCurrentWinners = useMemo(
        () => normalizeWinners(winnerRows),
        [winnerRows],
    )
    const winnersDirty = useMemo(
        () => JSON.stringify(normalizedInitialWinners)
            !== JSON.stringify(normalizedCurrentWinners),
        [normalizedCurrentWinners, normalizedInitialWinners],
    )

    const backToListLink = useMemo(() => {
        const qs = routeState.previousChallengeListFilter
            ? `?${createChallengeQueryString(routeState.previousChallengeListFilter)}`
            : ''
        return `${rootRoute}/challenge-management${qs}`
    }, [routeState.previousChallengeListFilter])

    const manageBaseRoute = useMemo(
        () => `${rootRoute}/challenge-management/${challengeId}`,
        [challengeId],
    )

    const loadChallenge = useEventCallback(async () => {
        if (!challengeId) {
            setIsLoading(false)
            return
        }
        setIsLoading(true)
        try {
            const data = await getChallengeById(challengeId)
            setChallenge(data)
            setWinnerRows(toEditableWinners(data.winners))
        } catch (error) {
            handleError(error)
        } finally {
            setIsLoading(false)
        }
    })

    useEffect(() => {
        loadChallenge()
    }, [loadChallenge])

    useEffect(() => {
        if (challenge?.status) {
            setStatusOption({
                label: formatStatusLabel(challenge.status),
                value: challenge.status,
            })
        }
    }, [challenge?.status])

    const handleStatusChange = useEventCallback((option: SelectOption) => {
        setStatusOption(option)
    })

    const handleUpdateStatus = useEventCallback(async () => {
        if (!challengeId || !statusOption) return
        if (challenge?.status === statusOption.value) return

        setIsUpdatingStatus(true)
        try {
            const updated = await updateChallengeStatus(
                challengeId,
                statusOption.value as ChallengeStatus,
            )
            setChallenge(updated)
            setWinnerRows(toEditableWinners(updated.winners))
            toast.success('Challenge status updated.')
        } catch (error) {
            handleError(error)
        } finally {
            setIsUpdatingStatus(false)
        }
    })

    const handleAddWinner = useEventCallback(() => {
        setWinnerRows(rows => {
            const maxPlacement = rows.reduce(
                (max, row) => Math.max(max, row.placement || 0),
                0,
            )
            return [
                ...rows,
                {
                    id: createRowId(),
                    placement: maxPlacement + 1,
                },
            ]
        })
    })

    const handleRemoveWinner = useEventCallback((id: string) => {
        setWinnerRows(rows => rows.filter(row => row.id !== id))
    })

    const handlePlacementChange = useEventCallback((id: string, value: string) => {
        const parsedPlacement = Number(value)
        setWinnerRows(rows => rows.map(row => (
            row.id === id
                ? {
                    ...row,
                    placement: Number.isFinite(parsedPlacement)
                        ? parsedPlacement
                        : row.placement,
                }
                : row
        )))
    })

    const handleWinnerHandleChange = useEventCallback(
        (id: string, option: SelectOption) => {
            const parsedUserId = Number(option.value)
            setWinnerRows(rows => rows.map(row => (
                row.id === id
                    ? {
                        ...row,
                        handle: `${option.label}`,
                        userId: Number.isFinite(parsedUserId)
                            ? parsedUserId
                            : row.userId,
                    }
                    : row
            )))
        },
    )

    const buildWinnerPayload = useCallback((): ChallengeWinner[] | null => {
        if (!winnerRows.length) {
            return []
        }

        const payload = winnerRows.map(row => ({
            handle: row.handle?.trim(),
            placement: row.placement,
            userId: row.userId,
        }))

        const hasMissingFields = payload.some(
            winner => !winner.handle
                || winner.userId === undefined
                || winner.userId === null
                || !winner.placement
                || winner.placement <= 0,
        )
        if (hasMissingFields) {
            toast.error('Placement, handle, and user ID are required for each winner.')
            return null
        }

        const placements = payload.map(winner => winner.placement)
        if (new Set(placements).size !== placements.length) {
            toast.error('Each placement must be unique.')
            return null
        }

        const normalized = payload.map(winner => ({
            handle: winner.handle ?? '',
            placement: Number(winner.placement),
            userId: Number(winner.userId),
        }))

        if (normalized.some(winner => Number.isNaN(winner.userId))) {
            toast.error('Winner user IDs must be numeric.')
            return null
        }

        if (normalized.some(winner => Number.isNaN(winner.placement))) {
            toast.error('Placements must be numeric.')
            return null
        }

        return normalized.sort((a, b) => a.placement - b.placement)
    }, [winnerRows])

    const handleSaveWinners = useEventCallback(async () => {
        const payload = buildWinnerPayload()
        if (!payload) return
        if (!challengeId) return

        setIsSavingWinners(true)
        try {
            const updated = await updateChallengeWinners(challengeId, payload)
            setChallenge(updated)
            setWinnerRows(toEditableWinners(updated.winners))
            toast.success('Winners updated.')
        } catch (error) {
            handleError(error)
        } finally {
            setIsSavingWinners(false)
        }
    })

    const jsonContent = useMemo(
        () => highlightJson(challenge ?? {}),
        [challenge],
    )

    const disableStatusUpdate = (
        !statusOption
        || isUpdatingStatus
        || isLoading
        || !challenge
        || statusOption.value === challenge.status
    )

    const disableWinnersUpdate = (
        isSavingWinners
        || isLoading
        || !challenge
        || !winnersDirty
    )

    return (
        <PageWrapper
            pageTitle='Challenge Details'
            headerActions={(
                <LinkButton primary light to={backToListLink} size='lg'>
                    Back to list
                </LinkButton>
            )}
        >
            {isLoading ? (
                <div className={styles.loading}>
                    <LoadingSpinner className={styles.spinner} />
                </div>
            ) : (
                <>
                    <div className={styles.summary}>
                        <div className={styles.summaryText}>
                            <p className={styles.sectionLabel}>Challenge</p>
                            <h2 className={styles.challengeTitle}>
                                {challenge?.name ?? 'Challenge'}
                            </h2>
                            <div className={styles.metaRow}>
                                <span className={styles.statusPill}>
                                    {formatStatusLabel(challenge?.status)}
                                </span>
                                <span className={styles.meta}>
                                    ID:
                                    {' '}
                                    {challengeId}
                                </span>
                                {challenge?.legacyId && (
                                    <span className={styles.meta}>
                                        Legacy ID:
                                        {' '}
                                        {challenge.legacyId}
                                    </span>
                                )}
                                {challenge?.projectId !== undefined && (
                                    <span className={styles.meta}>
                                        Project:
                                        {' '}
                                        {challenge.projectId}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className={styles.actionButtons}>
                            <LinkButton
                                primary
                                to={`${manageBaseRoute}/manage-submission`}
                                size='md'
                                state={routeState}
                                disabled={!challenge}
                            >
                                Submissions
                            </LinkButton>
                            <LinkButton
                                primary
                                to={`${manageBaseRoute}/manage-user`}
                                size='md'
                                state={routeState}
                                disabled={!challenge}
                            >
                                Users
                            </LinkButton>
                            {isMM && (
                                <LinkButton
                                    primary
                                    to={`${manageBaseRoute}/manage-marathon-match`}
                                    size='md'
                                    state={routeState}
                                    disabled={!challenge}
                                >
                                    Scores
                                </LinkButton>
                            )}
                        </div>
                    </div>

                    <PageDivider />

                    <div className={styles.sectionCard}>
                        <div className={styles.cardHeader}>
                            <div>
                                <p className={styles.sectionLabel}>Status</p>
                                <h4 className={styles.cardTitle}>
                                    Change challenge status
                                </h4>
                                <p className={styles.helperText}>
                                    Sends a PATCH to the challenge API to update the status.
                                </p>
                            </div>
                            <Button
                                primary
                                onClick={handleUpdateStatus}
                                disabled={disableStatusUpdate}
                            >
                                {isUpdatingStatus ? 'Updating…' : 'Update Status'}
                            </Button>
                        </div>
                        <div className={styles.statusControls}>
                            <FieldSingleSelect
                                label='Challenge status'
                                options={challengeStatusOptions}
                                value={statusOption}
                                onChange={handleStatusChange}
                                disabled={!challenge || isUpdatingStatus}
                                placeholder='Select status'
                            />
                        </div>
                    </div>

                    <div className={styles.sectionCard}>
                        <div className={styles.cardHeader}>
                            <div>
                                <p className={styles.sectionLabel}>Winners</p>
                                <h4 className={styles.cardTitle}>
                                    Manage placements and handles
                                </h4>
                                <p className={styles.helperText}>
                                    Uses member autocomplete for handles and PATCH to update winners.
                                </p>
                            </div>
                            <div className={styles.cardActions}>
                                <Button
                                    secondary
                                    onClick={handleAddWinner}
                                    disabled={isSavingWinners || !challenge}
                                    size='md'
                                >
                                    Add Winner
                                </Button>
                                <Button
                                    primary
                                    onClick={handleSaveWinners}
                                    disabled={disableWinnersUpdate}
                                    size='md'
                                >
                                    {isSavingWinners ? 'Saving…' : 'Save Winners'}
                                </Button>
                            </div>
                        </div>

                        <Display visible={winnerRows.length > 0}>
                            <div className={styles.winnerRows}>
                                {winnerRows.map(winner => (
                                    <div className={styles.winnerRow} key={winner.id}>
                                        <InputText
                                            name={`placement-${winner.id}`}
                                            label='Placement'
                                            type='number'
                                            value={winner.placement}
                                            onChange={event => handlePlacementChange(
                                                winner.id,
                                                event.target.value,
                                            )}
                                            disabled={isSavingWinners || !challenge}
                                            forceUpdateValue
                                            classNameWrapper={styles.placementInput}
                                            tabIndex={0}
                                        />
                                        <FieldHandleSelect
                                            label='Handle'
                                            value={
                                                winner.handle
                                                    ? {
                                                        label: winner.handle,
                                                        value: winner.userId
                                                            ?? winner.handle,
                                                    }
                                                    : null
                                            }
                                            onChange={option => handleWinnerHandleChange(
                                                winner.id,
                                                option,
                                            )}
                                            disabled={isSavingWinners || !challenge}
                                            classNameWrapper={styles.handleSelectWrapper}
                                        />
                                        <Button
                                            secondary
                                            variant='danger'
                                            size='sm'
                                            onClick={() => handleRemoveWinner(winner.id)}
                                            disabled={isSavingWinners || !challenge}
                                            className={styles.removeButton}
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </Display>
                        <Display visible={winnerRows.length === 0}>
                            <p className={styles.emptyState}>
                                No winners are set for this challenge yet.
                            </p>
                        </Display>
                    </div>

                    <div className={styles.sectionCard}>
                        <div className={styles.cardHeader}>
                            <div>
                                <p className={styles.sectionLabel}>API</p>
                                <h4 className={styles.cardTitle}>
                                    Challenge payload
                                </h4>
                            </div>
                        </div>
                        <div className={styles.jsonContainer}>
                            <pre className={styles.jsonPreview}>
                                {jsonContent}
                            </pre>
                        </div>
                    </div>
                </>
            )}
        </PageWrapper>
    )
}

export default ChallengeDetailsPage
