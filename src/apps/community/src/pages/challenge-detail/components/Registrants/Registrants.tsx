import { FC, MouseEvent, useCallback, useMemo } from 'react'
import moment from 'moment'

import { EnvironmentConfig } from '~/config'

import {
    type BackendChallengeWinner,
    type BackendCheckpointResult,
    type BackendRegistrant,
    ChallengeInfo,
    getPlacementPrizes,
    isDesignChallenge,
} from '../../../../lib'

import styles from './Registrants.module.scss'

type SortDirection = 'asc' | 'desc'

interface SortOption {
    field: string
    sort: SortDirection
}

interface RegistrantsProps {
    challenge: ChallengeInfo
    checkpointResults: BackendCheckpointResult[]
    notFoundCountryFlagUrl: Record<string, boolean>
    onSortChange: (sort: SortOption) => void
    registrants: BackendRegistrant[]
    results: BackendChallengeWinner[]
    sort: SortOption
    statisticsData: Array<Record<string, unknown>>
}

function formatDate(date: string | undefined): string {
    if (!date) {
        return '-'
    }

    return moment(date)
        .local()
        .format('MMM DD, YYYY HH:mm')
}

function getCheckpointPhaseDate(challenge: ChallengeInfo): number {
    const checkpointPhase = challenge.phases.find(phase => phase.name === 'Checkpoint Submission')
    const date = checkpointPhase?.actualEndDate ?? checkpointPhase?.scheduledEndDate

    if (!date) {
        return 0
    }

    return new Date(date)
        .getTime()
}

function getCheckpointSubmissionDate(
    challenge: ChallengeInfo,
    registrant: BackendRegistrant,
): string | undefined {
    const checkpointEnd = getCheckpointPhaseDate(challenge)

    if (!checkpointEnd) {
        return undefined
    }

    if (!registrant.submissionDate) {
        return undefined
    }

    const submitted = new Date(registrant.submissionDate)
        .getTime()
    return submitted <= checkpointEnd
        ? registrant.submissionDate
        : undefined
}

function getStatisticsSubmissionDate(
    registrant: BackendRegistrant,
    statisticsData: Array<Record<string, unknown>>,
): string | undefined {
    const stat = statisticsData.find(entry => `${entry.handle ?? ''}` === registrant.memberHandle)

    if (!stat) {
        return undefined
    }

    const submissions = Array.isArray(stat.submissions)
        ? stat.submissions as Array<{ created?: string }>
        : []

    if (!submissions.length) {
        return undefined
    }

    const dates = submissions
        .map(submission => submission.created)
        .filter((date): date is string => Boolean(date))
        .sort((a, b) => new Date(a)
            .getTime() - new Date(b)
            .getTime())

    return dates[0]
}

function getFinalSubmissionDate(
    challenge: ChallengeInfo,
    registrant: BackendRegistrant,
    statisticsData: Array<Record<string, unknown>>,
): string | undefined {
    const checkpointEnd = getCheckpointPhaseDate(challenge)
    const submissionDate = registrant.submissionDate

    if (!submissionDate) {
        return getStatisticsSubmissionDate(registrant, statisticsData)
    }

    if (!checkpointEnd) {
        return submissionDate
    }

    const submitted = new Date(submissionDate)
        .getTime()

    if (submitted > checkpointEnd) {
        return submissionDate
    }

    return getStatisticsSubmissionDate(registrant, statisticsData)
}

function compareValues(
    valueA: number | string,
    valueB: number | string,
    sort: SortDirection,
): number {
    if (valueA === valueB) {
        return 0
    }

    const result = valueA > valueB
        ? 1
        : -1

    return sort === 'desc'
        ? result * -1
        : result
}

/**
 * Sorts registrants by the selected table column and direction.
 *
 * @param registrants Registrant list.
 * @param field Active sort field.
 * @param sort Sort direction.
 * @param challenge Challenge details for round-specific date handling.
 * @param statisticsData Optional statistics data fallback for submissions.
 * @returns Sorted registrants array.
 */
export function sortRegistrants(
    registrants: BackendRegistrant[],
    field: string,
    sort: SortDirection,
    challenge?: ChallengeInfo,
    statisticsData: Array<Record<string, unknown>> = [],
): BackendRegistrant[] {
    const challengeData = challenge as ChallengeInfo

    return [...registrants].sort((a, b) => {
        if (field === 'Rating') {
            return compareValues(a.rating ?? 0, b.rating ?? 0, sort)
        }

        if (field === 'Username') {
            return compareValues(
                a.memberHandle.toLowerCase(),
                b.memberHandle.toLowerCase(),
                sort,
            )
        }

        if (field === 'Registration Date') {
            return compareValues(
                new Date(a.created)
                    .getTime(),
                new Date(b.created)
                    .getTime(),
                sort,
            )
        }

        if (field === 'Round 1 Submitted Date') {
            const checkpointA = getCheckpointSubmissionDate(challengeData, a)
            const checkpointB = getCheckpointSubmissionDate(challengeData, b)

            return compareValues(
                checkpointA ? new Date(checkpointA)
                    .getTime() : 0,
                checkpointB ? new Date(checkpointB)
                    .getTime() : 0,
                sort,
            )
        }

        const submittedA = getFinalSubmissionDate(challengeData, a, statisticsData)
        const submittedB = getFinalSubmissionDate(challengeData, b, statisticsData)

        return compareValues(
            submittedA ? new Date(submittedA)
                .getTime() : 0,
            submittedB ? new Date(submittedB)
                .getTime() : 0,
            sort,
        )
    })
}

function getPlacement(
    places: number,
    results: BackendChallengeWinner[],
    handle: string,
): number {
    const winner = results.find(result => (
        result.handle === handle
        && (result.placement ?? 0) <= places
    ))

    return winner?.placement ?? -1
}

/**
 * Renders the challenge registrants table and sorting controls.
 *
 * @param props Registrants tab data.
 * @returns Registrants tab content.
 */
const Registrants: FC<RegistrantsProps> = (props: RegistrantsProps) => {
    const isDesign = isDesignChallenge(props.challenge)
    const places = getPlacementPrizes(props.challenge).length
    const twoRounds = Boolean(props.challenge.round1Introduction && props.challenge.round2Introduction)

    const sortedRegistrants = useMemo(() => sortRegistrants(
        props.registrants,
        props.sort.field,
        props.sort.sort,
        props.challenge,
        props.statisticsData,
    ), [
        props.challenge,
        props.registrants,
        props.sort.field,
        props.sort.sort,
        props.statisticsData,
    ])

    const toggleSort = useCallback((field: string): void => {
        const nextSort: SortDirection = props.sort.field === field && props.sort.sort === 'desc'
            ? 'asc'
            : 'desc'

        props.onSortChange({
            field,
            sort: nextSort,
        })
    }, [props])
    const handleSortClick = useCallback((event: MouseEvent<HTMLButtonElement>): void => {
        const field = event.currentTarget.dataset.field ?? ''
        toggleSort(field)
    }, [toggleSort])
    const hasCheckpointFeedback = props.checkpointResults.length > 0

    if (!sortedRegistrants.length) {
        return (
            <div className={styles.emptyState}>
                No registrants found.
            </div>
        )
    }

    return (
        <div className={styles.container} role='table'>
            <div className={styles.header} role='row'>
                {!isDesign && (
                    <button
                        className={styles.headCell}
                        data-field='Rating'
                        onClick={handleSortClick}
                        type='button'
                    >
                        Rating
                    </button>
                )}
                <button
                    className={styles.headCell}
                    data-field='Username'
                    onClick={handleSortClick}
                    type='button'
                >
                    Username
                </button>
                <button
                    className={styles.headCell}
                    data-field='Registration Date'
                    onClick={handleSortClick}
                    type='button'
                >
                    Registration Date
                </button>
                {twoRounds && (
                    <button
                        className={styles.headCell}
                        data-field='Round 1 Submitted Date'
                        onClick={handleSortClick}
                        type='button'
                    >
                        Round 1 Submitted Date
                    </button>
                )}
                <button
                    className={styles.headCell}
                    data-field='Submitted Date'
                    onClick={handleSortClick}
                    type='button'
                >
                    {twoRounds ? 'Round 2 Submitted Date' : 'Submitted Date'}
                </button>
            </div>

            <div className={styles.body} role='rowgroup'>
                {sortedRegistrants.map(registrant => {
                    const finalDate = getFinalSubmissionDate(
                        props.challenge,
                        registrant,
                        props.statisticsData,
                    )
                    const checkpointDate = getCheckpointSubmissionDate(props.challenge, registrant)
                    const placement = getPlacement(places, props.results, registrant.memberHandle)
                    const showCountryFlag = Boolean(
                        registrant.countryFlag
                        && registrant.countryCode
                        && !props.notFoundCountryFlagUrl[registrant.countryCode],
                    )

                    return (
                        <div className={styles.row} key={registrant.memberHandle} role='row'>
                            {!isDesign && <div className={styles.cell}>{registrant.rating ?? '-'}</div>}
                            <div className={styles.cell}>
                                <a
                                    className={styles.memberLink}
                                    href={`${EnvironmentConfig.TOPCODER_URL}/members/${registrant.memberHandle}`}
                                    rel='noreferrer'
                                    target='_blank'
                                >
                                    {registrant.memberHandle}
                                </a>
                                {showCountryFlag && (
                                    <img
                                        alt={registrant.countryCode}
                                        className={styles.flag}
                                        src={registrant.countryFlag}
                                    />
                                )}
                            </div>
                            <div className={styles.cell}>{formatDate(registrant.created)}</div>
                            {twoRounds && <div className={styles.cell}>{formatDate(checkpointDate)}</div>}
                            <div className={styles.cell}>
                                {formatDate(finalDate)}
                                {placement > 0 && (
                                    <span className={styles.placement}>
                                        #
                                        {placement}
                                    </span>
                                )}
                                {hasCheckpointFeedback && <span className={styles.note}>feedback available</span>}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default Registrants
