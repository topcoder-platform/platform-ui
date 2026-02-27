import { FC, MouseEvent, useCallback, useMemo } from 'react'
import classNames from 'classnames'
import moment from 'moment'

import {
    ChallengeInfo,
    isMarathonMatch,
    SubmissionInfo,
} from '../../../../lib'

import styles from './Submissions.module.scss'

type SortDirection = 'asc' | 'desc'

interface SortOption {
    field: string
    sort: SortDirection
}

interface SubmissionsProps {
    auth: {
        handle?: string
        userId?: number
    }
    challenge: ChallengeInfo
    isLegacyMM: boolean
    isLoggedIn: boolean
    onSortChange: (sort: SortOption) => void
    sort: SortOption
    submissionEnded: boolean
    submissions: SubmissionInfo[]
}

function formatDate(date: string | undefined): string {
    if (!date) {
        return '-'
    }

    return moment(date)
        .local()
        .format('MMM DD, YYYY HH:mm')
}

function toScore(value: unknown): number | undefined {
    const parsed = Number(value)

    if (!Number.isFinite(parsed)) {
        return undefined
    }

    return parsed
}

function getInitialScore(submission: SubmissionInfo): number | undefined {
    const review = submission.review as Record<string, unknown> | undefined
    const row = submission as SubmissionInfo & { initialScore?: number | string }

    return toScore(review?.initialScore ?? row.initialScore)
}

function getFinalScore(submission: SubmissionInfo): number | undefined {
    const review = submission.review as Record<string, unknown> | undefined
    const row = submission as SubmissionInfo & { finalScore?: number | string }

    return toScore(review?.finalScore ?? row.finalScore)
}

function compare(
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

function sortSubmissions(
    sort: SortOption,
    submissions: SubmissionInfo[],
): SubmissionInfo[] {
    return [...submissions].sort((a, b) => {
        if (sort.field === 'Username') {
            return compare(
                (a.memberHandle ?? '').toLowerCase(),
                (b.memberHandle ?? '').toLowerCase(),
                sort.sort,
            )
        }

        if (sort.field === 'Submission Date') {
            return compare(
                new Date(a.created)
                    .getTime(),
                new Date(b.created)
                    .getTime(),
                sort.sort,
            )
        }

        if (sort.field === 'Initial Score') {
            return compare(
                getInitialScore(a) ?? Number.NEGATIVE_INFINITY,
                getInitialScore(b) ?? Number.NEGATIVE_INFINITY,
                sort.sort,
            )
        }

        return compare(
            getFinalScore(a) ?? Number.NEGATIVE_INFINITY,
            getFinalScore(b) ?? Number.NEGATIVE_INFINITY,
            sort.sort,
        )
    })
}

/**
 * Renders the submissions tab table for standard and Marathon Match challenges.
 *
 * @param props Submission table context.
 * @returns Submissions tab content.
 */
const Submissions: FC<SubmissionsProps> = (props: SubmissionsProps) => {
    const hideDownloadForMMRDM = true
    const isMM = isMarathonMatch(props.challenge)
    const sortedSubmissions = useMemo(
        () => sortSubmissions(props.sort, props.submissions),
        [props.sort, props.submissions],
    )

    const canShowDownloadAll = !hideDownloadForMMRDM
        && isMM
        && props.isLoggedIn
        && Boolean(props.auth.userId)

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

    if (!sortedSubmissions.length) {
        return (
            <div className={styles.emptyState}>
                No submissions found.
            </div>
        )
    }

    return (
        <section className={styles.container}>
            {canShowDownloadAll && (
                <div className={styles.downloadWrap}>
                    <button className={styles.downloadButton} type='button'>
                        Download All
                    </button>
                </div>
            )}

            {props.submissionEnded && (
                <div className={styles.banner}>
                    Submission phase has ended.
                </div>
            )}

            {props.isLegacyMM && (
                <div className={styles.bannerMuted}>
                    Legacy Marathon Match details are shown in simplified mode.
                </div>
            )}

            <div className={styles.table} role='table'>
                <div className={styles.header} role='row'>
                    <button
                        className={classNames(styles.headCell, isMM && styles.columns3)}
                        data-field='Username'
                        onClick={handleSortClick}
                        type='button'
                    >
                        Username
                    </button>
                    <button
                        className={classNames(styles.headCell, isMM && styles.columns3)}
                        data-field='Submission Date'
                        onClick={handleSortClick}
                        type='button'
                    >
                        Submission Date
                    </button>
                    {!isMM && (
                        <button
                            className={styles.headCell}
                            data-field='Initial Score'
                            onClick={handleSortClick}
                            type='button'
                        >
                            Initial Score
                        </button>
                    )}
                    <button
                        className={classNames(styles.headCell, isMM && styles.columns3)}
                        data-field='Final Score'
                        onClick={handleSortClick}
                        type='button'
                    >
                        {isMM ? 'Score' : 'Final Score'}
                    </button>
                </div>

                <div className={styles.body} role='rowgroup'>
                    {sortedSubmissions.map(submission => {
                        const initialScore = getInitialScore(submission)
                        const finalScore = getFinalScore(submission)

                        return (
                            <div
                                className={classNames(styles.row, isMM && styles.rowColumns3)}
                                key={submission.id}
                                role='row'
                            >
                                <div className={classNames(styles.cell, isMM && styles.columns3)}>
                                    {submission.memberHandle ?? '-'}
                                </div>
                                <div className={classNames(styles.cell, isMM && styles.columns3)}>
                                    {formatDate(submission.created)}
                                </div>
                                {!isMM && (
                                    <div className={styles.cell}>
                                        {initialScore === undefined ? 'N/A' : initialScore.toFixed(2)}
                                    </div>
                                )}
                                <div className={classNames(styles.cell, isMM && styles.columns3)}>
                                    {finalScore === undefined ? 'N/A' : finalScore.toFixed(2)}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}

export default Submissions
